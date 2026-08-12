package ports

import (
	"context"

	"github.com/google/uuid"
	"gooffer/backend/internal/domain"
)

type MissionRepository interface {
	ListByUserAndYear(ctx context.Context, userID uuid.UUID, recapYear int) ([]domain.RecapMission, error)
	ListByUser(ctx context.Context, userID uuid.UUID) ([]domain.RecapMission, error)
	ReplaceSelection(ctx context.Context, userID uuid.UUID, recapYear int, missions []domain.RecapMission) error
	UpdateProgress(ctx context.Context, mission *domain.RecapMission) error
}
