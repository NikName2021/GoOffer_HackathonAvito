package ports

import (
	"context"

	"gooffer/backend/internal/domain"

	"github.com/google/uuid"
)

type UserRepository interface {
	GetByID(ctx context.Context, id uuid.UUID) (*domain.User, error)
	ListProfiles(ctx context.Context) ([]domain.User, error)
	Create(ctx context.Context, user *domain.User) error
	Delete(ctx context.Context, id uuid.UUID) error
}
