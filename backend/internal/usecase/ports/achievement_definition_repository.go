package ports

import (
	"context"

	"gooffer/backend/internal/domain"
)

type AchievementDefinitionRepository interface {
	List(ctx context.Context) ([]domain.AchievementDefinition, error)
	ListActive(ctx context.Context) ([]domain.AchievementDefinition, error)
	Update(ctx context.Context, definition *domain.AchievementDefinition) error
}
