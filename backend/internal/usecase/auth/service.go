package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"time"

	"gooffer/backend/internal/domain"
	"gooffer/backend/internal/usecase/ports"
	apperrors "gooffer/backend/pkg/errors"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

const (
	SessionTTL     = 7 * 24 * time.Hour
	MinPasswordLen = 6
	MinLoginLen    = 3
	bcryptCost     = 10
)

type Service struct {
	accounts ports.AccountRepository
	sessions ports.SessionRepository
}

func New(accounts ports.AccountRepository, sessions ports.SessionRepository) *Service {
	return &Service{accounts: accounts, sessions: sessions}
}

type Credentials struct {
	Login    string
	Password string
}

type SessionResult struct {
	Account   *domain.Account
	Token     string
	ExpiresAt time.Time
}

func (s *Service) Register(ctx context.Context, cred Credentials) (*SessionResult, error) {
	login := strings.TrimSpace(strings.ToLower(cred.Login))
	if len(login) < MinLoginLen {
		return nil, fmt.Errorf("%w: login must be at least %d characters", apperrors.ErrBadRequest, MinLoginLen)
	}
	if len(cred.Password) < MinPasswordLen {
		return nil, fmt.Errorf("%w: password must be at least %d characters", apperrors.ErrBadRequest, MinPasswordLen)
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(cred.Password), bcryptCost)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	account := &domain.Account{
		ID:           uuid.New(),
		Login:        login,
		PasswordHash: string(hash),
		CreatedAt:    time.Now().UTC(),
	}
	if err := s.accounts.Create(ctx, account); err != nil {
		if errors.Is(err, apperrors.ErrAlreadyExists) {
			return nil, fmt.Errorf("%w: login already taken", apperrors.ErrAlreadyExists)
		}
		return nil, err
	}
	return s.createSession(ctx, account)
}

func (s *Service) Login(ctx context.Context, cred Credentials) (*SessionResult, error) {
	login := strings.TrimSpace(strings.ToLower(cred.Login))
	account, err := s.accounts.GetByLogin(ctx, login)
	if err != nil {
		if errors.Is(err, apperrors.ErrNotFound) {
			return nil, apperrors.ErrUnauthorized
		}
		return nil, err
	}
	if err := bcrypt.CompareHashAndPassword([]byte(account.PasswordHash), []byte(cred.Password)); err != nil {
		return nil, apperrors.ErrUnauthorized
	}
	return s.createSession(ctx, account)
}

func (s *Service) Logout(ctx context.Context, rawToken string) error {
	if rawToken == "" {
		return nil
	}
	return s.sessions.DeleteByTokenHash(ctx, hashToken(rawToken))
}

func (s *Service) Authenticate(ctx context.Context, rawToken string) (*domain.Account, error) {
	if rawToken == "" {
		return nil, apperrors.ErrUnauthorized
	}
	session, err := s.sessions.GetByTokenHash(ctx, hashToken(rawToken))
	if err != nil {
		if errors.Is(err, apperrors.ErrNotFound) {
			return nil, apperrors.ErrUnauthorized
		}
		return nil, err
	}
	account, err := s.accounts.GetByID(ctx, session.AccountID)
	if err != nil {
		if errors.Is(err, apperrors.ErrNotFound) {
			return nil, apperrors.ErrUnauthorized
		}
		return nil, err
	}
	return account, nil
}

func (s *Service) createSession(ctx context.Context, account *domain.Account) (*SessionResult, error) {
	raw, err := randomToken(32)
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	session := &domain.Session{
		ID:        uuid.New(),
		AccountID: account.ID,
		TokenHash: hashToken(raw),
		ExpiresAt: now.Add(SessionTTL),
		CreatedAt: now,
	}
	if err := s.sessions.Create(ctx, session); err != nil {
		return nil, err
	}
	return &SessionResult{
		Account:   account,
		Token:     raw,
		ExpiresAt: session.ExpiresAt,
	}, nil
}

func hashToken(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}

func randomToken(n int) (string, error) {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("generate token: %w", err)
	}
	return hex.EncodeToString(b), nil
}
