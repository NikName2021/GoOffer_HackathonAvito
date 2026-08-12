package ports

import (
	"context"
	"time"

	"github.com/google/uuid"
	"gooffer/backend/internal/domain"
)

type RecapShareRepository interface {
	Create(ctx context.Context, share *domain.RecapShare) error
	GetActiveByTokenHash(ctx context.Context, tokenHash []byte, now time.Time) (*domain.RecapShare, error)
	Revoke(ctx context.Context, accountID, shareID uuid.UUID, revokedAt time.Time) error
}
