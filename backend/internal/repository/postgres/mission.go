package postgres

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"gooffer/backend/internal/domain"
	apperrors "gooffer/backend/pkg/errors"
)

const missionColumns = `
	id, user_id, recap_year, code, progress, target, status,
	selected_at, updated_at, completed_at`

type MissionRepository struct {
	pool *pgxpool.Pool
}

func NewMissionRepository(pool *pgxpool.Pool) *MissionRepository {
	return &MissionRepository{pool: pool}
}

func (r *MissionRepository) GetByUserAndYear(
	ctx context.Context,
	userID uuid.UUID,
	recapYear int,
) (*domain.RecapMission, error) {
	row := r.pool.QueryRow(ctx,
		`SELECT `+missionColumns+` FROM recap_missions WHERE user_id = $1 AND recap_year = $2`,
		userID,
		recapYear,
	)
	mission, err := scanMission(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, apperrors.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get recap mission: %w", err)
	}
	return &mission, nil
}

func (r *MissionRepository) Select(ctx context.Context, mission *domain.RecapMission) error {
	const query = `
		INSERT INTO recap_missions (
			id, user_id, recap_year, code, progress, target, status,
			selected_at, updated_at, completed_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		ON CONFLICT (user_id, recap_year) DO UPDATE SET
			id = EXCLUDED.id,
			code = EXCLUDED.code,
			progress = EXCLUDED.progress,
			target = EXCLUDED.target,
			status = EXCLUDED.status,
			selected_at = EXCLUDED.selected_at,
			updated_at = EXCLUDED.updated_at,
			completed_at = EXCLUDED.completed_at`
	if _, err := r.pool.Exec(ctx, query,
		mission.ID,
		mission.UserID,
		mission.RecapYear,
		mission.Code,
		mission.Progress,
		mission.Target,
		mission.Status,
		mission.SelectedAt,
		mission.UpdatedAt,
		mission.CompletedAt,
	); err != nil {
		return fmt.Errorf("select recap mission: %w", err)
	}
	return nil
}

func (r *MissionRepository) UpdateProgress(ctx context.Context, mission *domain.RecapMission) error {
	const query = `
		UPDATE recap_missions SET
			progress = $2,
			status = $3,
			updated_at = $4,
			completed_at = $5
		WHERE id = $1`
	result, err := r.pool.Exec(ctx, query,
		mission.ID,
		mission.Progress,
		mission.Status,
		mission.UpdatedAt,
		mission.CompletedAt,
	)
	if err != nil {
		return fmt.Errorf("update recap mission: %w", err)
	}
	if result.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}

func scanMission(scanner rowScanner) (domain.RecapMission, error) {
	var mission domain.RecapMission
	err := scanner.Scan(
		&mission.ID,
		&mission.UserID,
		&mission.RecapYear,
		&mission.Code,
		&mission.Progress,
		&mission.Target,
		&mission.Status,
		&mission.SelectedAt,
		&mission.UpdatedAt,
		&mission.CompletedAt,
	)
	return mission, err
}
