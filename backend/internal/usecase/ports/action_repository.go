package ports

import (
	"context"

	"gooffer/backend/internal/domain"

	"github.com/google/uuid"
)

type ActionRepository interface {
	GetByUserAndYear(ctx context.Context, userID uuid.UUID, year int) ([]domain.Action, error)
	SeedDemoActivity(ctx context.Context, userID uuid.UUID, profileType string, year int) error
}
