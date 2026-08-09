package ports

import (
	"context"

	"github.com/google/uuid"
	"gooffer/backend/internal/domain"
)

type MissionRepository interface {
	GetByUserAndYear(ctx context.Context, userID uuid.UUID, recapYear int) (*domain.RecapMission, error)
	Select(ctx context.Context, mission *domain.RecapMission) error
	UpdateProgress(ctx context.Context, mission *domain.RecapMission) error
}
