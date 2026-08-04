package postgres

import (
	"context"
	"errors"
	"fmt"

	"github.com/NikName2021/GoOffer_HackathonAvito/backend/internal/domain"
	apperrors "github.com/NikName2021/GoOffer_HackathonAvito/backend/pkg/errors"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// UserRepository читает пользователей из таблицы users.
type UserRepository struct {
	pool *pgxpool.Pool
}

func NewUserRepository(pool *pgxpool.Pool) *UserRepository {
	return &UserRepository{pool: pool}
}

func (r *UserRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	const query = `
		SELECT id, name, avatar, registered_at, profile_type
		FROM users
		WHERE id = $1
	`

	row := r.pool.QueryRow(ctx, query, id)

	var user domain.User
	if err := row.Scan(
		&user.ID,
		&user.Name,
		&user.Avatar,
		&user.RegisteredAt,
		&user.ProfileType,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperrors.ErrNotFound
		}
		return nil, fmt.Errorf("scan user: %w", err)
	}

	return &user, nil
}

func (r *UserRepository) ListProfiles(ctx context.Context) ([]domain.User, error) {
	const query = `
		SELECT id, name, avatar, registered_at, profile_type
		FROM users
		ORDER BY name
	`

	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("query users: %w", err)
	}
	defer rows.Close()

	var users []domain.User
	for rows.Next() {
		var user domain.User
		if err := rows.Scan(
			&user.ID,
			&user.Name,
			&user.Avatar,
			&user.RegisteredAt,
			&user.ProfileType,
		); err != nil {
			return nil, fmt.Errorf("scan user row: %w", err)
		}
		users = append(users, user)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate users: %w", err)
	}

	return users, nil
}
