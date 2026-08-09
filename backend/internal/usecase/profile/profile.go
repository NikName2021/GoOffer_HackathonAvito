package profile

import (
	"context"
	"fmt"
	"log/slog"
	"net/url"
	"strings"
	"time"

	"gooffer/backend/internal/domain"
	"gooffer/backend/internal/usecase/ports"

	"github.com/google/uuid"
)

var allowedProfileTypes = map[string]struct{}{
	"seller":    {},
	"buyer":     {},
	"veteran":   {},
	"newbie":    {},
	"universal": {},
}

type CreateInput struct {
	Name        string
	ProfileType string
	Avatar      string
	Year        int
}

type Service struct {
	logger     *slog.Logger
	userRepo   ports.UserRepository
	actionRepo ports.ActionRepository
}

func New(logger *slog.Logger, userRepo ports.UserRepository, actionRepo ports.ActionRepository) *Service {
	return &Service{
		logger:     logger,
		userRepo:   userRepo,
		actionRepo: actionRepo,
	}
}

func (s *Service) GetByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	user, err := s.userRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}
	return user, nil
}

func (s *Service) ListProfiles(ctx context.Context) ([]domain.User, error) {
	users, err := s.userRepo.ListProfiles(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list profiles: %w", err)
	}
	return users, nil
}

func (s *Service) Create(ctx context.Context, in CreateInput) (*domain.User, error) {
	name := strings.TrimSpace(in.Name)
	if name == "" {
		return nil, fmt.Errorf("name is required")
	}
	if len(name) > 80 {
		return nil, fmt.Errorf("name is too long")
	}
	pt := strings.ToLower(strings.TrimSpace(in.ProfileType))
	if _, ok := allowedProfileTypes[pt]; !ok {
		return nil, fmt.Errorf("invalid profile_type")
	}
	avatar := strings.TrimSpace(in.Avatar)
	if avatar == "" {
		avatar = defaultAvatar(name, pt)
	}
	year := in.Year
	if year < 2020 || year > 2100 {
		year = 2025
	}

	user := &domain.User{
		ID:           uuid.New(),
		Name:         name,
		Avatar:       avatar,
		RegisteredAt: time.Now().UTC(),
		ProfileType:  pt,
	}
	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, fmt.Errorf("create user: %w", err)
	}
	if s.actionRepo != nil {
		if err := s.actionRepo.SeedDemoActivity(ctx, user.ID, pt, year); err != nil {
			s.logger.Warn("seed demo activity failed", slog.String("error", err.Error()))
		}
	}
	s.logger.Info("profile created", slog.String("id", user.ID.String()), slog.String("type", pt))
	return user, nil
}

func (s *Service) Delete(ctx context.Context, id uuid.UUID) error {
	if err := s.userRepo.Delete(ctx, id); err != nil {
		return fmt.Errorf("delete user: %w", err)
	}
	s.logger.Info("profile deleted", slog.String("id", id.String()))
	return nil
}

func defaultAvatar(name, profileType string) string {
	// abstract / shapes / initials — не фото людей
	// seed стабильный от имени
	seed := strings.ReplaceAll(strings.ToLower(strings.TrimSpace(name)), " ", "-")
	if seed == "" {
		seed = profileType
	}
	// варианты стилей DiceBear (без human):
	// shapes, identicon, rings, initials, bottts-neutral, notionists-neutral
	style := "shapes"
	return fmt.Sprintf(
		"https://api.dicebear.com/9.x/%s/svg?seed=%s&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf",
		style,
		url.QueryEscape(seed),
	)
}
