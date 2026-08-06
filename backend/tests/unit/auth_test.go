package unit

import (
	"context"
	"testing"
	"time"

	"gooffer/backend/internal/domain"
	"gooffer/backend/internal/usecase/auth"
	apperrors "gooffer/backend/pkg/errors"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type memAccounts struct {
	byLogin map[string]*domain.Account
	byID    map[uuid.UUID]*domain.Account
}

func newMemAccounts() *memAccounts {
	return &memAccounts{byLogin: map[string]*domain.Account{}, byID: map[uuid.UUID]*domain.Account{}}
}

func (m *memAccounts) Create(ctx context.Context, a *domain.Account) error {
	if _, ok := m.byLogin[a.Login]; ok {
		return apperrors.ErrAlreadyExists
	}
	cp := *a
	m.byLogin[a.Login] = &cp
	m.byID[a.ID] = &cp
	return nil
}

func (m *memAccounts) GetByLogin(ctx context.Context, login string) (*domain.Account, error) {
	a, ok := m.byLogin[login]
	if !ok {
		return nil, apperrors.ErrNotFound
	}
	cp := *a
	return &cp, nil
}

func (m *memAccounts) GetByID(ctx context.Context, id uuid.UUID) (*domain.Account, error) {
	a, ok := m.byID[id]
	if !ok {
		return nil, apperrors.ErrNotFound
	}
	cp := *a
	return &cp, nil
}

type memSessions struct {
	byHash map[string]*domain.Session
}

func newMemSessions() *memSessions {
	return &memSessions{byHash: map[string]*domain.Session{}}
}

func (m *memSessions) Create(ctx context.Context, s *domain.Session) error {
	cp := *s
	m.byHash[s.TokenHash] = &cp
	return nil
}

func (m *memSessions) GetByTokenHash(ctx context.Context, h string) (*domain.Session, error) {
	s, ok := m.byHash[h]
	if !ok || s.ExpiresAt.Before(time.Now()) {
		return nil, apperrors.ErrNotFound
	}
	cp := *s
	return &cp, nil
}

func (m *memSessions) DeleteByTokenHash(ctx context.Context, h string) error {
	delete(m.byHash, h)
	return nil
}

func (m *memSessions) DeleteExpired(ctx context.Context) error { return nil }

func TestAuthRegisterLoginMeLogout(t *testing.T) {
	svc := auth.New(newMemAccounts(), newMemSessions())
	ctx := context.Background()

	reg, err := svc.Register(ctx, auth.Credentials{Login: "Alice", Password: "secret1"})
	require.NoError(t, err)
	assert.Equal(t, "alice", reg.Account.Login)
	assert.NotEmpty(t, reg.Token)

	_, err = svc.Register(ctx, auth.Credentials{Login: "alice", Password: "secret1"})
	assert.ErrorIs(t, err, apperrors.ErrAlreadyExists)

	login, err := svc.Login(ctx, auth.Credentials{Login: "alice", Password: "secret1"})
	require.NoError(t, err)
	assert.NotEmpty(t, login.Token)

	_, err = svc.Login(ctx, auth.Credentials{Login: "alice", Password: "wrong"})
	assert.ErrorIs(t, err, apperrors.ErrUnauthorized)

	account, err := svc.Authenticate(ctx, login.Token)
	require.NoError(t, err)
	assert.Equal(t, "alice", account.Login)

	require.NoError(t, svc.Logout(ctx, login.Token))
	_, err = svc.Authenticate(ctx, login.Token)
	assert.ErrorIs(t, err, apperrors.ErrUnauthorized)
}
