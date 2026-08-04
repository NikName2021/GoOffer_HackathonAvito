package ports

import (
	"context"

	"github.com/google/uuid"
	"gooffer/backend/internal/domain"
)

type RecapRepository interface {
	Save(ctx context.Context, recap *domain.Recap) error
	GetByUserAndYear(ctx context.Context, userID uuid.UUID, year int) (*domain.Recap, error)
}
