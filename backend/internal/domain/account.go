package domain

import (
	"time"

	"github.com/google/uuid"
)

type Account struct {
	ID           uuid.UUID
	Login        string
	PasswordHash string
	CreatedAt    time.Time
}

type Session struct {
	ID        uuid.UUID
	AccountID uuid.UUID
	TokenHash string
	ExpiresAt time.Time
	CreatedAt time.Time
}
