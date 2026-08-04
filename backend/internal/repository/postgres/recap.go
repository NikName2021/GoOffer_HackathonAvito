package postgres

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/NikName2021/GoOffer_HackathonAvito/backend/internal/domain"
	apperrors "github.com/NikName2021/GoOffer_HackathonAvito/backend/pkg/errors"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// RecapRepository сохраняет и читает готовые итоги года.
type RecapRepository struct {
	pool *pgxpool.Pool
}

func NewRecapRepository(pool *pgxpool.Pool) *RecapRepository {
	return &RecapRepository{pool: pool}
}

func (r *RecapRepository) Save(ctx context.Context, recap *domain.Recap) error {
	topCategories, err := json.Marshal(recap.TopCategories)
	if err != nil {
		return fmt.Errorf("marshal top categories: %w", err)
	}

	achievements, err := json.Marshal(recap.Achievements)
	if err != nil {
		return fmt.Errorf("marshal achievements: %w", err)
	}

	const query = `
		INSERT INTO recaps (
			id, user_id, year,
			total_views, total_messages, total_favorites, total_purchases, total_sales,
			top_categories, achievements, activity_days, generated_at
		) VALUES (
			$1, $2, $3,
			$4, $5, $6, $7, $8,
			$9, $10, $11, $12
		)
		ON CONFLICT (user_id, year) DO UPDATE SET
			total_views = EXCLUDED.total_views,
			total_messages = EXCLUDED.total_messages,
			total_favorites = EXCLUDED.total_favorites,
			total_purchases = EXCLUDED.total_purchases,
			total_sales = EXCLUDED.total_sales,
			top_categories = EXCLUDED.top_categories,
			achievements = EXCLUDED.achievements,
			activity_days = EXCLUDED.activity_days,
			generated_at = EXCLUDED.generated_at
	`

	_, err = r.pool.Exec(ctx, query,
		recap.ID,
		recap.UserID,
		recap.Year,
		recap.TotalViews,
		recap.TotalMessages,
		recap.TotalFavorites,
		recap.TotalPurchases,
		recap.TotalSales,
		topCategories,
		achievements,
		recap.ActivityDays,
		recap.GeneratedAt,
	)
	if err != nil {
		return fmt.Errorf("upsert recap: %w", err)
	}

	return nil
}

func (r *RecapRepository) GetByUserAndYear(ctx context.Context, userID uuid.UUID, year int) (*domain.Recap, error) {
	const query = `
		SELECT
			id, user_id, year,
			total_views, total_messages, total_favorites, total_purchases, total_sales,
			top_categories, achievements, activity_days, generated_at
		FROM recaps
		WHERE user_id = $1 AND year = $2
	`

	row := r.pool.QueryRow(ctx, query, userID, year)

	var recap domain.Recap
	var topCategoriesJSON []byte
	var achievementsJSON []byte

	if err := row.Scan(
		&recap.ID,
		&recap.UserID,
		&recap.Year,
		&recap.TotalViews,
		&recap.TotalMessages,
		&recap.TotalFavorites,
		&recap.TotalPurchases,
		&recap.TotalSales,
		&topCategoriesJSON,
		&achievementsJSON,
		&recap.ActivityDays,
		&recap.GeneratedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperrors.ErrNotFound
		}
		return nil, fmt.Errorf("scan recap: %w", err)
	}

	if err := json.Unmarshal(topCategoriesJSON, &recap.TopCategories); err != nil {
		return nil, fmt.Errorf("unmarshal top categories: %w", err)
	}
	if err := json.Unmarshal(achievementsJSON, &recap.Achievements); err != nil {
		return nil, fmt.Errorf("unmarshal achievements: %w", err)
	}

	return &recap, nil
}
