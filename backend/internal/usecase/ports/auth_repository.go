package ports

import (
	"context"
	"time"

	"github.com/google/uuid"
	"gooffer/backend/internal/domain"
)

type AuthRepository interface {
	CreateAccount(ctx context.Context, account *domain.Account, passwordHash string) error
	GetAccountByLogin(ctx context.Context, login string) (*domain.Account, string, error)
	CreateSession(ctx context.Context, accountID uuid.UUID, tokenHash []byte, expiresAt time.Time) error
	GetAccountBySessionHash(ctx context.Context, tokenHash []byte, now time.Time) (*domain.Account, error)
	DeleteSession(ctx context.Context, tokenHash []byte) error
}
