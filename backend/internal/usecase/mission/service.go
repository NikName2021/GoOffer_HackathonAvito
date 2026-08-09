package mission

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gooffer/backend/internal/domain"
	"gooffer/backend/internal/usecase/ports"
	apperrors "gooffer/backend/pkg/errors"
)

type ProfileReader interface {
	GetByID(ctx context.Context, accountID, id uuid.UUID) (*domain.User, error)
}

type RecapReader interface {
	GetByUserAndYear(ctx context.Context, userID uuid.UUID, year int) (*domain.Recap, error)
}

type Service struct {
	profiles ProfileReader
	recaps   RecapReader
	missions ports.MissionRepository
	now      func() time.Time
}

func New(profiles ProfileReader, recaps RecapReader, missions ports.MissionRepository) *Service {
	return &Service{
		profiles: profiles,
		recaps:   recaps,
		missions: missions,
		now:      time.Now,
	}
}

func (s *Service) GetOverview(
	ctx context.Context,
	accountID, userID uuid.UUID,
	recapYear int,
) (*domain.MissionOverview, error) {
	user, err := s.getMissionProfile(ctx, accountID, userID, recapYear)
	if err != nil {
		return nil, err
	}
	selected, err := s.missions.GetByUserAndYear(ctx, userID, recapYear)
	if errors.Is(err, apperrors.ErrNotFound) {
		return &domain.MissionOverview{Options: missionOptions(), Selected: nil}, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get selected mission: %w", err)
	}
	if err := s.refreshProgress(ctx, selected, user); err != nil {
		return nil, err
	}
	return overview(selected), nil
}

func (s *Service) Select(
	ctx context.Context,
	accountID, userID uuid.UUID,
	recapYear int,
	code domain.MissionCode,
) (*domain.MissionOverview, error) {
	definition, ok := missionDefinition(code)
	if !ok {
		return nil, apperrors.ErrInvalidMission
	}
	user, err := s.getMissionProfile(ctx, accountID, userID, recapYear)
	if err != nil {
		return nil, err
	}

	existing, err := s.missions.GetByUserAndYear(ctx, userID, recapYear)
	if err == nil && existing != nil && existing.Code == code {
		if err := s.refreshProgress(ctx, existing, user); err != nil {
			return nil, err
		}
		return overview(existing), nil
	}
	if err != nil && !errors.Is(err, apperrors.ErrNotFound) {
		return nil, fmt.Errorf("get selected mission: %w", err)
	}

	now := s.now().UTC()
	selected := &domain.RecapMission{
		ID:         uuid.New(),
		UserID:     userID,
		RecapYear:  recapYear,
		Code:       code,
		Progress:   0,
		Target:     definition.Target,
		Status:     domain.MissionActive,
		SelectedAt: now,
		UpdatedAt:  now,
	}
	if err := s.missions.Select(ctx, selected); err != nil {
		return nil, fmt.Errorf("save selected mission: %w", err)
	}
	return overview(selected), nil
}

func (s *Service) getMissionProfile(
	ctx context.Context,
	accountID, userID uuid.UUID,
	recapYear int,
) (*domain.User, error) {
	user, err := s.profiles.GetByID(ctx, accountID, userID)
	if err != nil {
		return nil, fmt.Errorf("get mission profile: %w", err)
	}
	recap, err := s.recaps.GetByUserAndYear(ctx, userID, recapYear)
	if err != nil {
		return nil, fmt.Errorf("get mission recap: %w", err)
	}
	if recap == nil {
		return nil, apperrors.ErrNotFound
	}
	return user, nil
}

func (s *Service) refreshProgress(
	ctx context.Context,
	selected *domain.RecapMission,
	user *domain.User,
) error {
	if selected.Status == domain.MissionCompleted {
		return nil
	}
	calculated := calculateProgress(selected, user)
	if calculated < selected.Progress {
		calculated = selected.Progress
	}
	if calculated > selected.Target {
		calculated = selected.Target
	}
	if calculated == selected.Progress {
		return nil
	}

	now := s.now().UTC()
	selected.Progress = calculated
	selected.UpdatedAt = now
	if selected.Progress >= selected.Target {
		selected.Status = domain.MissionCompleted
		selected.CompletedAt = &now
	}
	if err := s.missions.UpdateProgress(ctx, selected); err != nil {
		return fmt.Errorf("persist mission progress: %w", err)
	}
	return nil
}

func calculateProgress(selected *domain.RecapMission, user *domain.User) int {
	switch selected.Code {
	case domain.MissionSellThreeItems:
		return salesAfter(user.OwnAds, selected.SelectedAt)
	case domain.MissionBuyFromFavorites:
		if purchasedFavoriteAfter(user.Views, selected.SelectedAt) {
			return 1
		}
	case domain.MissionTryDelivery:
		if deliveryPurchaseAfter(user.Views, selected.SelectedAt) {
			return 1
		}
	}
	return 0
}

func salesAfter(ads []domain.OwnAd, selectedAt time.Time) int {
	count := 0
	for _, ad := range ads {
		if ad.IsSold && ad.SoldAt != nil && !ad.SoldAt.Before(selectedAt) {
			count++
		}
	}
	return count
}

func purchasedFavoriteAfter(views []domain.ViewedAd, selectedAt time.Time) bool {
	for _, view := range views {
		if view.IsFavorite && view.FavoritedAt != nil && view.IsPurchased && view.PurchasedAt != nil &&
			!view.PurchasedAt.Before(selectedAt) && !view.FavoritedAt.After(*view.PurchasedAt) {
			return true
		}
		for _, purchase := range view.ViewedAt {
			if purchase.Type != domain.ViewedAdEventBuy || purchase.Time.Before(selectedAt) {
				continue
			}
			for _, favorite := range view.ViewedAt {
				if favorite.Type == domain.ViewedAdEventLike && !favorite.Time.After(purchase.Time) {
					return true
				}
			}
		}
	}
	return false
}

func deliveryPurchaseAfter(views []domain.ViewedAd, selectedAt time.Time) bool {
	for _, view := range views {
		for _, event := range view.ViewedAt {
			if event.Type == domain.ViewedAdEventBuy && !event.Time.Before(selectedAt) &&
				event.UseAvitoDelivery != nil && *event.UseAvitoDelivery {
				return true
			}
		}
	}
	return false
}

func overview(selected *domain.RecapMission) *domain.MissionOverview {
	definition, _ := missionDefinition(selected.Code)
	percent := selected.Progress * 100 / selected.Target
	if percent > 100 {
		percent = 100
	}
	return &domain.MissionOverview{
		Options: missionOptions(),
		Selected: &domain.MissionState{
			Code:            selected.Code,
			Title:           definition.Title,
			Description:     definition.Description,
			Progress:        selected.Progress,
			Target:          selected.Target,
			ProgressPercent: percent,
			Status:          selected.Status,
			Icon:            definition.Icon,
			Theme:           definition.Theme,
			CTA:             cloneCTA(definition.CTA),
			SelectedAt:      selected.SelectedAt,
			UpdatedAt:       selected.UpdatedAt,
			CompletedAt:     selected.CompletedAt,
		},
	}
}

func missionOptions() []domain.MissionOption {
	options := []domain.MissionOption{
		{
			Code:        domain.MissionSellThreeItems,
			Title:       "Продать три ненужные вещи",
			Description: "Разберите то, чем больше не пользуетесь, и помогите трём вещам найти новых владельцев.",
			Target:      3,
			Icon:        "recycle",
			Theme:       "avito-green",
			CTA:         domain.RecapCardCTA{Label: "Разместить объявление", Action: "create_listing"},
		},
		{
			Code:        domain.MissionBuyFromFavorites,
			Title:       "Завершить покупку из избранного",
			Description: "Вернитесь к сохранённым объявлениям и превратите одну находку в покупку.",
			Target:      1,
			Icon:        "heart",
			Theme:       "avito-red",
			CTA:         domain.RecapCardCTA{Label: "Открыть избранное", Action: "open_favorites"},
		},
		{
			Code:        domain.MissionTryDelivery,
			Title:       "Попробовать Авито Доставку",
			Description: "Совершите одну покупку с Авито Доставкой и получите заказ удобным способом.",
			Target:      1,
			Icon:        "delivery",
			Theme:       "avito-blue",
			CTA:         domain.RecapCardCTA{Label: "Найти товары с Доставкой", Action: "open_delivery_items"},
		},
	}
	for index := range options {
		options[index].CTA = cloneCTA(options[index].CTA)
	}
	return options
}

func missionDefinition(code domain.MissionCode) (domain.MissionOption, bool) {
	for _, option := range missionOptions() {
		if option.Code == code {
			return option, true
		}
	}
	return domain.MissionOption{}, false
}

func cloneCTA(value domain.RecapCardCTA) domain.RecapCardCTA {
	result := value
	if value.Params != nil {
		result.Params = make(map[string]string, len(value.Params))
		for key, parameter := range value.Params {
			result.Params[key] = parameter
		}
	}
	return result
}
