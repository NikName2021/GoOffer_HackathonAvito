package mission

import (
	"context"
	"fmt"
	"sort"
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
	selected, err := s.missions.ListByUserAndYear(ctx, userID, recapYear)
	if err != nil {
		return nil, fmt.Errorf("list selected missions: %w", err)
	}
	for index := range selected {
		if err := s.refreshProgress(ctx, &selected[index], user); err != nil {
			return nil, err
		}
	}
	return overview(selected), nil
}

func (s *Service) Select(
	ctx context.Context,
	accountID, userID uuid.UUID,
	recapYear int,
	codes []domain.MissionCode,
) (*domain.MissionOverview, error) {
	definitions, ok := selectedDefinitions(codes)
	if !ok {
		return nil, apperrors.ErrInvalidMission
	}
	user, err := s.getMissionProfile(ctx, accountID, userID, recapYear)
	if err != nil {
		return nil, err
	}

	existing, err := s.missions.ListByUserAndYear(ctx, userID, recapYear)
	if err != nil {
		return nil, fmt.Errorf("list selected missions: %w", err)
	}
	existingByCode := make(map[domain.MissionCode]domain.RecapMission, len(existing))
	for _, mission := range existing {
		existingByCode[mission.Code] = mission
	}

	now := s.now().UTC()
	selected := make([]domain.RecapMission, 0, len(codes))
	for index, code := range codes {
		mission, exists := existingByCode[code]
		if !exists {
			mission = domain.RecapMission{
				ID:         uuid.New(),
				UserID:     userID,
				RecapYear:  recapYear,
				Code:       code,
				Target:     definitions[index].Target,
				Status:     domain.MissionActive,
				SelectedAt: now,
				UpdatedAt:  now,
			}
		} else {
			refreshProgressValue(&mission, user, now)
		}
		selected = append(selected, mission)
	}
	if err := s.missions.ReplaceSelection(ctx, userID, recapYear, selected); err != nil {
		return nil, fmt.Errorf("replace selected missions: %w", err)
	}
	return overview(selected), nil
}

func (s *Service) GetProfileMissions(
	ctx context.Context,
	accountID, userID uuid.UUID,
) (*domain.ProfileMissionOverview, error) {
	user, err := s.profiles.GetByID(ctx, accountID, userID)
	if err != nil {
		return nil, fmt.Errorf("get mission profile: %w", err)
	}
	selected, err := s.missions.ListByUser(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("list profile missions: %w", err)
	}
	for index := range selected {
		if err := s.refreshProgress(ctx, &selected[index], user); err != nil {
			return nil, err
		}
	}
	return &domain.ProfileMissionOverview{Missions: missionStates(selected)}, nil
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
	if !refreshProgressValue(selected, user, s.now().UTC()) {
		return nil
	}
	if err := s.missions.UpdateProgress(ctx, selected); err != nil {
		return fmt.Errorf("persist mission progress: %w", err)
	}
	return nil
}

func refreshProgressValue(selected *domain.RecapMission, user *domain.User, now time.Time) bool {
	if selected.Status == domain.MissionCompleted {
		return false
	}
	calculated := calculateProgress(selected, user)
	if calculated < selected.Progress {
		calculated = selected.Progress
	}
	if calculated > selected.Target {
		calculated = selected.Target
	}
	if calculated == selected.Progress {
		return false
	}

	selected.Progress = calculated
	selected.UpdatedAt = now
	if selected.Progress >= selected.Target {
		selected.Status = domain.MissionCompleted
		selected.CompletedAt = &now
	}
	return true
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

func overview(selected []domain.RecapMission) *domain.MissionOverview {
	states := missionStates(selected)
	var legacySelected *domain.MissionState
	for index := range states {
		if legacySelected == nil || states[index].SelectedAt.After(legacySelected.SelectedAt) {
			copy := states[index]
			legacySelected = &copy
		}
	}
	return &domain.MissionOverview{
		Options:          missionOptions(),
		SelectedMissions: states,
		Selected:         legacySelected,
	}
}

func missionStates(selected []domain.RecapMission) []domain.MissionState {
	states := make([]domain.MissionState, 0, len(selected))
	for index := range selected {
		states = append(states, missionState(&selected[index]))
	}
	sort.Slice(states, func(i, j int) bool {
		if states[i].RecapYear != states[j].RecapYear {
			return states[i].RecapYear > states[j].RecapYear
		}
		return missionOrder(states[i].Code) < missionOrder(states[j].Code)
	})
	return states
}

func missionState(selected *domain.RecapMission) domain.MissionState {
	definition, _ := missionDefinition(selected.Code)
	percent := selected.Progress * 100 / selected.Target
	if percent > 100 {
		percent = 100
	}
	return domain.MissionState{
		RecapYear:       selected.RecapYear,
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
	}
}

func selectedDefinitions(codes []domain.MissionCode) ([]domain.MissionOption, bool) {
	if len(codes) > len(missionOptions()) {
		return nil, false
	}
	seen := make(map[domain.MissionCode]struct{}, len(codes))
	definitions := make([]domain.MissionOption, len(codes))
	for index, code := range codes {
		if _, duplicate := seen[code]; duplicate {
			return nil, false
		}
		definition, exists := missionDefinition(code)
		if !exists {
			return nil, false
		}
		seen[code] = struct{}{}
		definitions[index] = definition
	}
	return definitions, true
}

func missionOrder(code domain.MissionCode) int {
	for index, option := range missionOptions() {
		if option.Code == code {
			return index
		}
	}
	return len(missionOptions())
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
