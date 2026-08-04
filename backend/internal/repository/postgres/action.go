package postgres

import (
	"context"
	"fmt"

	"github.com/NikName2021/GoOffer_HackathonAvito/backend/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ActionRepository читает действия пользователя (просмотры, сообщения и т.д.).
type ActionRepository struct {
	pool *pgxpool.Pool
}

func NewActionRepository(pool *pgxpool.Pool) *ActionRepository {
	return &ActionRepository{pool: pool}
}

func (r *ActionRepository) GetByUserAndYear(ctx context.Context, userID uuid.UUID, year int) ([]domain.Action, error) {
	const query = `
		SELECT a.id, a.user_id, a.type, a.category_id, c.name, a.created_at
		FROM actions a
		JOIN categories c ON c.id = a.category_id
		WHERE a.user_id = $1
		  AND EXTRACT(YEAR FROM a.created_at) = $2
		ORDER BY a.created_at
	`

	rows, err := r.pool.Query(ctx, query, userID, year)
	if err != nil {
		return nil, fmt.Errorf("query actions: %w", err)
	}
	defer rows.Close()

	var actions []domain.Action
	for rows.Next() {
		var action domain.Action
		var actionType string
		if err := rows.Scan(
			&action.ID,
			&action.UserID,
			&actionType,
			&action.CategoryID,
			&action.Category,
			&action.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan action row: %w", err)
		}
		action.Type = domain.ActionType(actionType)
		actions = append(actions, action)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate actions: %w", err)
	}

	if actions == nil {
		return []domain.Action{}, nil
	}

	return actions, nil
}
