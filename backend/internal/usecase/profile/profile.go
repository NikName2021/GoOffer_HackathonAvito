package profile

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/google/uuid"
	"gooffer/backend/internal/domain"
	"gooffer/backend/internal/usecase/ports"
)

type Service struct {
	logger   *slog.Logger
	userRepo ports.UserRepository
}

func New(logger *slog.Logger, userRepo ports.UserRepository) *Service {
	return &Service{
		logger:   logger,
		userRepo: userRepo,
	}
}

func (s *Service) GetByID(ctx context.Context, accountID, id uuid.UUID) (*domain.User, error) {
	user, err := s.userRepo.GetByID(ctx, accountID, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}
	return user, nil
}

func (s *Service) ListProfiles(ctx context.Context, accountID uuid.UUID) ([]domain.User, error) {
	users, err := s.userRepo.ListProfiles(ctx, accountID)
	if err != nil {
		return nil, fmt.Errorf("failed to list profiles: %w", err)
	}
	return users, nil
}
