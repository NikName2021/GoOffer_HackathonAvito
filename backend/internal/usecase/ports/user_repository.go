package ports

import (
	"context"

	"github.com/google/uuid"
	"gooffer/backend/internal/domain"
)

type UserRepository interface {
	GetByID(ctx context.Context, accountID, id uuid.UUID) (*domain.User, error)
	ListProfiles(ctx context.Context, accountID uuid.UUID) ([]domain.User, error)
}
