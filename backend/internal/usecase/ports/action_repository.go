package ports

import (
	"context"

	"github.com/google/uuid"
	"gooffer/backend/internal/domain"
)

type ActionRepository interface {
	GetByUserAndYear(ctx context.Context, userID uuid.UUID, year int) ([]domain.Action, error)
}
