package postgres

import (
	"context"
	"encoding/json"
	"fmt"

	"gooffer/backend/internal/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type RecapRepository struct {
	db *pgxpool.Pool
}

func NewRecapRepository(db *pgxpool.Pool) *RecapRepository {
	return &RecapRepository{db: db}
}

func (r *RecapRepository) Save(ctx context.Context, recap *domain.Recap) error {
	topCategoriesJSON, err := json.Marshal(recap.TopCategories)
	if err != nil {
		return fmt.Errorf("failed to marshal top categories: %w", err)
	}
	achievementsJSON, err := json.Marshal(recap.Achievements)
	if err != nil {
		return fmt.Errorf("failed to marshal achievements: %w", err)
	}
	recommendationsJSON, err := json.Marshal(recap.Recommendations)
	if err != nil {
		return fmt.Errorf("failed to marshal recommendations: %w", err)
	}
	storyJSON, err := json.Marshal(recap.Story)
	if err != nil {
		return fmt.Errorf("failed to marshal story: %w", err)
	}

	query := `
		INSERT INTO recaps (
			id, user_id, year,
			total_views, total_messages, total_favorites,
			total_purchases, total_sales, activity_days,
			top_categories, achievements, recommendations, story, generated_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
		ON CONFLICT (user_id, year) DO UPDATE SET
			total_views = EXCLUDED.total_views,
			total_messages = EXCLUDED.total_messages,
			total_favorites = EXCLUDED.total_favorites,
			total_purchases = EXCLUDED.total_purchases,
			total_sales = EXCLUDED.total_sales,
			activity_days = EXCLUDED.activity_days,
			top_categories = EXCLUDED.top_categories,
			achievements = EXCLUDED.achievements,
			recommendations = EXCLUDED.recommendations,
			story = EXCLUDED.story,
			generated_at = EXCLUDED.generated_at
	`
	_, err = r.db.Exec(ctx, query,
		recap.ID, recap.UserID, recap.Year,
		recap.TotalViews, recap.TotalMessages, recap.TotalFavorites,
		recap.TotalPurchases, recap.TotalSales, recap.ActivityDays,
		topCategoriesJSON, achievementsJSON, recommendationsJSON, storyJSON,
		recap.GeneratedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to save recap: %w", err)
	}
	return nil
}

func (r *RecapRepository) GetByUserAndYear(ctx context.Context, userID uuid.UUID, year int) (*domain.Recap, error) {
	query := `
		SELECT
			id, user_id, year,
			total_views, total_messages, total_favorites,
			total_purchases, total_sales, activity_days,
			top_categories, achievements,
			COALESCE(recommendations, '[]'::jsonb),
			COALESCE(story, '{}'::jsonb),
			generated_at
		FROM recaps
		WHERE user_id = $1 AND year = $2
	`
	row := r.db.QueryRow(ctx, query, userID, year)

	var recap domain.Recap
	var topCategoriesJSON, achievementsJSON, recommendationsJSON, storyJSON []byte

	err := row.Scan(
		&recap.ID, &recap.UserID, &recap.Year,
		&recap.TotalViews, &recap.TotalMessages, &recap.TotalFavorites,
		&recap.TotalPurchases, &recap.TotalSales, &recap.ActivityDays,
		&topCategoriesJSON, &achievementsJSON, &recommendationsJSON, &storyJSON,
		&recap.GeneratedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get recap: %w", err)
	}

	if err := json.Unmarshal(topCategoriesJSON, &recap.TopCategories); err != nil {
		return nil, fmt.Errorf("failed to unmarshal top categories: %w", err)
	}
	if err := json.Unmarshal(achievementsJSON, &recap.Achievements); err != nil {
		return nil, fmt.Errorf("failed to unmarshal achievements: %w", err)
	}
	if err := json.Unmarshal(recommendationsJSON, &recap.Recommendations); err != nil {
		return nil, fmt.Errorf("failed to unmarshal recommendations: %w", err)
	}
	if err := json.Unmarshal(storyJSON, &recap.Story); err != nil {
		return nil, fmt.Errorf("failed to unmarshal story: %w", err)
	}

	if recap.TopCategories == nil {
		recap.TopCategories = []domain.CategoryStat{}
	}
	if recap.Achievements == nil {
		recap.Achievements = []domain.Achievement{}
	}
	if recap.Recommendations == nil {
		recap.Recommendations = []domain.Recommendation{}
	}
	if recap.Story.Insights == nil {
		recap.Story.Insights = []string{}
	}

	return &recap, nil
}
