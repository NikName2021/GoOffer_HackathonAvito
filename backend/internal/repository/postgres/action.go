package postgres

import (
	"context"
	"fmt"
	"time"

	"gooffer/backend/internal/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ActionRepository struct {
	db *pgxpool.Pool
}

func NewActionRepository(db *pgxpool.Pool) *ActionRepository {
	return &ActionRepository{db: db}
}

func (r *ActionRepository) GetByUserAndYear(ctx context.Context, userID uuid.UUID, year int) ([]domain.Action, error) {
	start := fmt.Sprintf("%d-01-01", year)
	end := fmt.Sprintf("%d-12-31", year)

	query := `
		SELECT
			a.id,
			a.user_id,
			a.type,
			a.category_id,
			COALESCE(c.name, '') AS category,
			a.created_at
		FROM actions a
		LEFT JOIN categories c ON c.id = a.category_id
		WHERE a.user_id = $1 AND a.created_at BETWEEN $2 AND $3
		ORDER BY a.created_at
	`
	rows, err := r.db.Query(ctx, query, userID, start, end)
	if err != nil {
		return nil, fmt.Errorf("failed to get actions: %w", err)
	}
	defer rows.Close()

	var actions []domain.Action
	for rows.Next() {
		var action domain.Action
		if err := rows.Scan(
			&action.ID,
			&action.UserID,
			&action.Type,
			&action.CategoryID,
			&action.Category,
			&action.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan action: %w", err)
		}
		actions = append(actions, action)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows iteration error: %w", err)
	}
	return actions, nil
}

type seedTemplate struct {
	views, messages, favorites, purchases, sales, daySpan int
	categoryID                                            uuid.UUID
}

func templateFor(profileType string) seedTemplate {
	electronics := uuid.MustParse("cccccccc-cccc-cccc-cccc-cccccccccccc")
	realty := uuid.MustParse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
	hobby := uuid.MustParse("22222222-2222-2222-2222-bbbbbbbbbbbb")
	auto := uuid.MustParse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")

	switch profileType {
	case "seller":
		return seedTemplate{620, 40, 30, 3, 12, 200, electronics}
	case "buyer":
		return seedTemplate{900, 50, 120, 14, 1, 180, realty}
	case "veteran":
		return seedTemplate{1100, 60, 80, 10, 6, 300, hobby}
	case "newbie":
		return seedTemplate{40, 3, 4, 0, 0, 20, electronics}
	case "universal":
		return seedTemplate{700, 45, 70, 8, 7, 150, auto}
	default:
		return seedTemplate{200, 15, 20, 2, 2, 60, electronics}
	}
}

func (r *ActionRepository) SeedDemoActivity(ctx context.Context, userID uuid.UUID, profileType string, year int) error {
	t := templateFor(profileType)
	base := time.Date(year, 1, 15, 12, 0, 0, 0, time.UTC)

	type batch struct {
		typ   string
		count int
	}
	batches := []batch{
		{"view", t.views},
		{"message", t.messages},
		{"favorite", t.favorites},
		{"purchase", t.purchases},
		{"sale", t.sales},
	}

	const q = `INSERT INTO actions (id, user_id, type, category_id, created_at) VALUES ($1, $2, $3, $4, $5)`

	for _, b := range batches {
		if b.count <= 0 {
			continue
		}
		n := b.count
		step := 1
		if n > 40 {
			step = n / 40
			if step < 1 {
				step = 1
			}
		}
		inserted := 0
		for i := 0; i < n && inserted < 40; i += step {
			dayOffset := 0
			if t.daySpan > 0 {
				dayOffset = (inserted * t.daySpan) / 40
			}
			ts := base.AddDate(0, 0, dayOffset)
			if _, err := r.db.Exec(ctx, q, uuid.New(), userID, b.typ, t.categoryID, ts); err != nil {
				return fmt.Errorf("seed action %s: %w", b.typ, err)
			}
			inserted++
		}
	}
	return nil
}
