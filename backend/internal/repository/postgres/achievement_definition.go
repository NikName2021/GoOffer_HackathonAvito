package postgres

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"gooffer/backend/internal/domain"
	apperrors "gooffer/backend/pkg/errors"
)

const achievementDefinitionColumns = `
	slug, title, description, icon, category, metric, condition_operator,
	condition_value, sort_order, is_active, updated_at`

type AchievementDefinitionRepository struct {
	pool *pgxpool.Pool
}

func NewAchievementDefinitionRepository(pool *pgxpool.Pool) *AchievementDefinitionRepository {
	return &AchievementDefinitionRepository{pool: pool}
}

func (r *AchievementDefinitionRepository) List(ctx context.Context) ([]domain.AchievementDefinition, error) {
	return r.list(ctx, `SELECT `+achievementDefinitionColumns+`
		FROM achievement_definitions ORDER BY sort_order, slug`)
}

func (r *AchievementDefinitionRepository) ListActive(ctx context.Context) ([]domain.AchievementDefinition, error) {
	return r.list(ctx, `SELECT `+achievementDefinitionColumns+`
		FROM achievement_definitions WHERE is_active = TRUE ORDER BY sort_order, slug`)
}

func (r *AchievementDefinitionRepository) Update(
	ctx context.Context,
	definition *domain.AchievementDefinition,
) error {
	const query = `
		UPDATE achievement_definitions SET
			title = $2,
			description = $3,
			icon = $4,
			metric = $5,
			condition_operator = $6,
			condition_value = $7,
			is_active = $8,
			updated_at = $9
		WHERE slug = $1
		RETURNING category, sort_order`
	err := r.pool.QueryRow(ctx, query,
		definition.Slug,
		definition.Title,
		definition.Description,
		definition.Icon,
		definition.Metric,
		definition.ConditionOperator,
		definition.ConditionValue,
		definition.IsActive,
		definition.UpdatedAt,
	).Scan(&definition.Category, &definition.SortOrder)
	if errors.Is(err, pgx.ErrNoRows) {
		return apperrors.ErrNotFound
	}
	if err != nil {
		return fmt.Errorf("update achievement definition: %w", err)
	}
	return nil
}

func (r *AchievementDefinitionRepository) list(
	ctx context.Context,
	query string,
) ([]domain.AchievementDefinition, error) {
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("list achievement definitions: %w", err)
	}
	defer rows.Close()

	definitions := make([]domain.AchievementDefinition, 0)
	for rows.Next() {
		var definition domain.AchievementDefinition
		if err := rows.Scan(
			&definition.Slug,
			&definition.Title,
			&definition.Description,
			&definition.Icon,
			&definition.Category,
			&definition.Metric,
			&definition.ConditionOperator,
			&definition.ConditionValue,
			&definition.SortOrder,
			&definition.IsActive,
			&definition.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan achievement definition: %w", err)
		}
		definitions = append(definitions, definition)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate achievement definitions: %w", err)
	}
	return definitions, nil
}
