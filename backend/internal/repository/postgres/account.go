package postgres

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"gooffer/backend/internal/domain"
	apperrors "gooffer/backend/pkg/errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AccountRepository struct {
	db *pgxpool.Pool
}

func NewAccountRepository(db *pgxpool.Pool) *AccountRepository {
	return &AccountRepository{db: db}
}

func (r *AccountRepository) Create(ctx context.Context, account *domain.Account) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO accounts (id, login, password_hash, created_at)
		VALUES ($1, $2, $3, $4)
	`, account.ID, account.Login, account.PasswordHash, account.CreatedAt)
	if err != nil {
		if isUniqueViolation(err) {
			return apperrors.ErrAlreadyExists
		}
		return fmt.Errorf("create account: %w", err)
	}
	return nil
}

func (r *AccountRepository) GetByLogin(ctx context.Context, login string) (*domain.Account, error) {
	row := r.db.QueryRow(ctx, `
		SELECT id, login, password_hash, created_at
		FROM accounts WHERE login = $1
	`, login)
	var a domain.Account
	if err := row.Scan(&a.ID, &a.Login, &a.PasswordHash, &a.CreatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperrors.ErrNotFound
		}
		return nil, fmt.Errorf("get account by login: %w", err)
	}
	return &a, nil
}

func (r *AccountRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.Account, error) {
	row := r.db.QueryRow(ctx, `
		SELECT id, login, password_hash, created_at
		FROM accounts WHERE id = $1
	`, id)
	var a domain.Account
	if err := row.Scan(&a.ID, &a.Login, &a.PasswordHash, &a.CreatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperrors.ErrNotFound
		}
		return nil, fmt.Errorf("get account by id: %w", err)
	}
	return &a, nil
}

func isUniqueViolation(err error) bool {
	return err != nil && (strings.Contains(err.Error(), "duplicate key") ||
		strings.Contains(err.Error(), "unique constraint"))
}
