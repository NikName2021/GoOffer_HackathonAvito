package ports

import (
	"context"

	"github.com/google/uuid"
	"gooffer/backend/internal/domain"
)

type CardDefinitionRepository interface {
	Create(ctx context.Context, definition *domain.CardDefinition) error
	List(ctx context.Context) ([]domain.CardDefinition, error)
	Update(ctx context.Context, definition *domain.CardDefinition) error
	Delete(ctx context.Context, id uuid.UUID) error
	ListActiveForUser(ctx context.Context, userID uuid.UUID) ([]domain.CardDefinition, error)
}
