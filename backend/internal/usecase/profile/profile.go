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

func (s *Service) Create(ctx context.Context, accountID uuid.UUID, user *domain.User) (*domain.User, error) {
	user.ID = uuid.New()
	user.ProfileType = calculateProfileType(user)
	if user.OwnAds == nil {
		user.OwnAds = []domain.OwnAd{}
	}
	if user.Views == nil {
		user.Views = []domain.ViewedAd{}
	}
	if err := s.userRepo.Create(ctx, accountID, user); err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}
	return user, nil
}

func (s *Service) Update(
	ctx context.Context,
	accountID, id uuid.UUID,
	user *domain.User,
) (*domain.User, error) {
	user.ID = id
	user.ProfileType = calculateProfileType(user)
	if user.OwnAds == nil {
		user.OwnAds = []domain.OwnAd{}
	}
	if user.Views == nil {
		user.Views = []domain.ViewedAd{}
	}
	if err := s.userRepo.Update(ctx, accountID, user); err != nil {
		return nil, fmt.Errorf("failed to update user: %w", err)
	}
	return user, nil
}

func (s *Service) Delete(ctx context.Context, accountID, id uuid.UUID) error {
	if err := s.userRepo.Delete(ctx, accountID, id); err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}
	return nil
}

func calculateProfileType(user *domain.User) string {
	hasPurchases := false
	hasSales := false
	for _, view := range user.Views {
		if view.IsPurchased {
			hasPurchases = true
			break
		}
	}
	for _, ad := range user.OwnAds {
		if ad.IsSold {
			hasSales = true
			break
		}
	}
	switch {
	case hasPurchases && hasSales:
		return "mixed"
	case hasSales:
		return "seller"
	default:
		return "buyer"
	}
}
