package recapshare

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"gooffer/backend/internal/domain"
	"gooffer/backend/internal/usecase/ports"
	apperrors "gooffer/backend/pkg/errors"
)

const (
	tokenBytes       = 32
	maxSelectedCards = 9
)

type ProfileReader interface {
	GetByID(ctx context.Context, accountID, id uuid.UUID) (*domain.User, error)
}

type RecapReader interface {
	GetByUserAndYear(ctx context.Context, userID uuid.UUID, year int) (*domain.Recap, error)
}

type Service struct {
	profiles   ProfileReader
	recaps     RecapReader
	shares     ports.RecapShareRepository
	publicBase string
	ttl        time.Duration
	now        func() time.Time
	random     func([]byte) (int, error)
}

func New(
	profiles ProfileReader,
	recaps RecapReader,
	shares ports.RecapShareRepository,
	publicBase string,
	ttl time.Duration,
) *Service {
	return &Service{
		profiles:   profiles,
		recaps:     recaps,
		shares:     shares,
		publicBase: strings.TrimRight(publicBase, "/"),
		ttl:        ttl,
		now:        time.Now,
		random:     rand.Read,
	}
}

func (s *Service) Create(
	ctx context.Context,
	accountID, userID uuid.UUID,
	year int,
	cardIDs []string,
	format domain.RecapShareFormat,
) (*domain.RecapShareCreated, error) {
	if !validFormat(format) {
		return nil, apperrors.ErrInvalidRecapShare
	}
	if _, err := s.profiles.GetByID(ctx, accountID, userID); err != nil {
		return nil, fmt.Errorf("get public share profile: %w", err)
	}
	recap, err := s.recaps.GetByUserAndYear(ctx, userID, year)
	if err != nil {
		return nil, fmt.Errorf("get public share recap: %w", err)
	}
	if recap == nil {
		return nil, apperrors.ErrNotFound
	}
	cards, err := selectPublicCards(recap.Cards, cardIDs)
	if err != nil {
		return nil, err
	}
	achievements := toPublicAchievements(recap.Achievements)

	token, tokenHash, err := s.generateToken()
	if err != nil {
		return nil, fmt.Errorf("generate public share token: %w", err)
	}
	now := s.now().UTC()
	share := &domain.RecapShare{
		ID:        uuid.New(),
		AccountID: accountID,
		UserID:    userID,
		RecapYear: year,
		TokenHash: tokenHash,
		Format:    format,
		Snapshot: domain.PublicRecapSnapshot{
			Format:       format,
			Year:         year,
			Cards:        cards,
			Achievements: achievements,
		},
		CreatedAt: now,
		ExpiresAt: now.Add(s.ttl),
	}
	if err := s.shares.Create(ctx, share); err != nil {
		return nil, fmt.Errorf("save public recap share: %w", err)
	}
	return &domain.RecapShareCreated{
		ID:        share.ID,
		PublicURL: s.publicBase + "/share/" + token,
		Format:    share.Format,
		CreatedAt: share.CreatedAt,
		ExpiresAt: share.ExpiresAt,
	}, nil
}

func (s *Service) GetPublic(ctx context.Context, token string) (*domain.PublicRecapShare, error) {
	tokenHash, err := hashToken(token)
	if err != nil {
		return nil, apperrors.ErrNotFound
	}
	share, err := s.shares.GetActiveByTokenHash(ctx, tokenHash, s.now().UTC())
	if err != nil {
		return nil, fmt.Errorf("get public recap share: %w", err)
	}
	cards := append([]domain.PublicRecapCard(nil), share.Snapshot.Cards...)
	if cards == nil {
		cards = []domain.PublicRecapCard{}
	}
	achievements := append([]domain.PublicRecapAchievement(nil), share.Snapshot.Achievements...)
	if achievements == nil {
		achievements = []domain.PublicRecapAchievement{}
	}
	return &domain.PublicRecapShare{
		Format:       share.Snapshot.Format,
		Year:         share.Snapshot.Year,
		Cards:        cards,
		Achievements: achievements,
		CreatedAt:    share.CreatedAt,
		ExpiresAt:    share.ExpiresAt,
	}, nil
}

func (s *Service) Revoke(
	ctx context.Context,
	accountID, shareID uuid.UUID,
) error {
	if err := s.shares.Revoke(ctx, accountID, shareID, s.now().UTC()); err != nil {
		return fmt.Errorf("revoke public recap share: %w", err)
	}
	return nil
}

func (s *Service) generateToken() (string, []byte, error) {
	raw := make([]byte, tokenBytes)
	n, err := s.random(raw)
	if err != nil {
		return "", nil, err
	}
	if n != len(raw) {
		return "", nil, fmt.Errorf("read %d random bytes, want %d", n, len(raw))
	}
	digest := sha256.Sum256(raw)
	return base64.RawURLEncoding.EncodeToString(raw), digest[:], nil
}

func hashToken(token string) ([]byte, error) {
	raw, err := base64.RawURLEncoding.DecodeString(token)
	if err != nil || len(raw) != tokenBytes || base64.RawURLEncoding.EncodeToString(raw) != token {
		return nil, apperrors.ErrNotFound
	}
	digest := sha256.Sum256(raw)
	return digest[:], nil
}

func validFormat(format domain.RecapShareFormat) bool {
	return format == domain.RecapShareResponsive || format == domain.RecapShareMobileStory
}

func selectPublicCards(source []domain.RecapCard, cardIDs []string) ([]domain.PublicRecapCard, error) {
	if len(cardIDs) == 0 || len(cardIDs) > maxSelectedCards {
		return nil, apperrors.ErrInvalidRecapShare
	}
	byID := make(map[string]domain.RecapCard, len(source))
	for _, card := range source {
		byID[card.ID] = card
	}
	selected := make([]domain.PublicRecapCard, 0, len(cardIDs))
	seen := make(map[string]struct{}, len(cardIDs))
	for _, id := range cardIDs {
		if id == "" {
			return nil, apperrors.ErrInvalidRecapShare
		}
		if _, duplicate := seen[id]; duplicate {
			return nil, apperrors.ErrInvalidRecapShare
		}
		card, exists := byID[id]
		if !exists || !card.Shareable {
			return nil, apperrors.ErrInvalidRecapShare
		}
		seen[id] = struct{}{}
		selected = append(selected, toPublicCard(card))
	}
	return selected, nil
}

func toPublicCard(card domain.RecapCard) domain.PublicRecapCard {
	title := card.Title
	if card.ID == "star_listing" {
		title = "Ваше объявление стало звездой"
	}
	return domain.PublicRecapCard{
		Kind:        card.Kind,
		Eyebrow:     card.Eyebrow,
		Title:       title,
		Description: card.Description,
		Value:       card.Value,
		Presentation: domain.PublicRecapCardPresentation{
			Layout: card.Presentation.Layout,
			Theme:  card.Presentation.Theme,
			Icon:   card.Presentation.Icon,
		},
	}
}

func toPublicAchievements(source []domain.Achievement) []domain.PublicRecapAchievement {
	achievements := make([]domain.PublicRecapAchievement, 0, len(source))
	for _, achievement := range source {
		achievements = append(achievements, domain.PublicRecapAchievement{
			Slug:        achievement.Slug,
			Title:       achievement.Title,
			Description: achievement.Description,
			Icon:        achievement.Icon,
		})
	}
	return achievements
}
