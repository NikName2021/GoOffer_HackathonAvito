package postgres

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"gooffer/backend/internal/domain"
	apperrors "gooffer/backend/pkg/errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const profileColumns = `
	id, name, avatar, avatar_fallback, accent_color, registered_at, profile_type,
	chats_count, favorite_category, metrics, purchases, sales, listing_views`

type UserRepository struct {
	pool *pgxpool.Pool
}

type rowScanner interface {
	Scan(dest ...any) error
}

func NewUserRepository(pool *pgxpool.Pool) *UserRepository {
	return &UserRepository{pool: pool}
}

func (r *UserRepository) GetByID(ctx context.Context, accountID, id uuid.UUID) (*domain.User, error) {
	row := r.pool.QueryRow(ctx,
		`SELECT `+profileColumns+` FROM users WHERE account_id = $1 AND id = $2`,
		accountID,
		id,
	)
	user, err := scanUser(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, apperrors.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get user: %w", err)
	}
	return &user, nil
}

func (r *UserRepository) ListProfiles(ctx context.Context, accountID uuid.UUID) ([]domain.User, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT `+profileColumns+` FROM users WHERE account_id = $1 ORDER BY name, id`,
		accountID,
	)
	if err != nil {
		return nil, fmt.Errorf("list users: %w", err)
	}
	defer rows.Close()

	users := make([]domain.User, 0)
	for rows.Next() {
		user, err := scanUser(rows)
		if err != nil {
			return nil, fmt.Errorf("scan user: %w", err)
		}
		users = append(users, user)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate users: %w", err)
	}
	return users, nil
}

func scanUser(scanner rowScanner) (domain.User, error) {
	var user domain.User
	var metricsJSON []byte
	var purchasesJSON []byte
	var salesJSON []byte
	var listingViewsJSON []byte

	if err := scanner.Scan(
		&user.ID,
		&user.Name,
		&user.Avatar,
		&user.AvatarFallback,
		&user.AccentColor,
		&user.RegisteredAt,
		&user.ProfileType,
		&user.ChatsCount,
		&user.FavoriteCategory,
		&metricsJSON,
		&purchasesJSON,
		&salesJSON,
		&listingViewsJSON,
	); err != nil {
		return domain.User{}, err
	}

	if err := json.Unmarshal(metricsJSON, &user.Metrics); err != nil {
		return domain.User{}, fmt.Errorf("decode profile metrics: %w", err)
	}
	if err := json.Unmarshal(purchasesJSON, &user.Purchases); err != nil {
		return domain.User{}, fmt.Errorf("decode purchases: %w", err)
	}
	if err := json.Unmarshal(salesJSON, &user.Sales); err != nil {
		return domain.User{}, fmt.Errorf("decode sales: %w", err)
	}
	if err := json.Unmarshal(listingViewsJSON, &user.ListingViews); err != nil {
		return domain.User{}, fmt.Errorf("decode listing views: %w", err)
	}
	return user, nil
}
