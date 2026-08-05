package ports

import (
	"context"

	"github.com/google/uuid"
	"gooffer/backend/internal/domain"
)

type UserRepository interface {
	GetByID(ctx context.Context, accountID, id uuid.UUID) (*domain.User, error)
	ListProfiles(ctx context.Context, accountID uuid.UUID) ([]domain.User, error)
	Create(ctx context.Context, accountID uuid.UUID, user *domain.User) error
	Update(ctx context.Context, accountID uuid.UUID, user *domain.User) error
	Delete(ctx context.Context, accountID, id uuid.UUID) error
}
