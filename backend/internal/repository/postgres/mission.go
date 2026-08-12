package postgres

import (
	"context"
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

func (r *MissionRepository) ListByUserAndYear(
	ctx context.Context,
	userID uuid.UUID,
	recapYear int,
) ([]domain.RecapMission, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT `+missionColumns+` FROM recap_missions
		 WHERE user_id = $1 AND recap_year = $2
		 ORDER BY selected_at, code`,
		userID,
		recapYear,
	)
	if err != nil {
		return nil, fmt.Errorf("list recap missions by year: %w", err)
	}
	defer rows.Close()
	return scanMissions(rows)
}

func (r *MissionRepository) ListByUser(
	ctx context.Context,
	userID uuid.UUID,
) ([]domain.RecapMission, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT `+missionColumns+` FROM recap_missions
		 WHERE user_id = $1
		 ORDER BY recap_year DESC, selected_at, code`,
		userID,
	)
	if err != nil {
		return nil, fmt.Errorf("list profile missions: %w", err)
	}
	defer rows.Close()
	return scanMissions(rows)
}

func (r *MissionRepository) ReplaceSelection(
	ctx context.Context,
	userID uuid.UUID,
	recapYear int,
	missions []domain.RecapMission,
) error {
	for index := range missions {
		if missions[index].UserID != userID || missions[index].RecapYear != recapYear {
			return fmt.Errorf("selected mission %d does not belong to requested profile and year", index)
		}
	}
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin replace recap missions: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	if _, err := tx.Exec(ctx,
		`DELETE FROM recap_missions WHERE user_id = $1 AND recap_year = $2`,
		userID,
		recapYear,
	); err != nil {
		return fmt.Errorf("clear recap mission selection: %w", err)
	}
	const insert = `
		INSERT INTO recap_missions (
			id, user_id, recap_year, code, progress, target, status,
			selected_at, updated_at, completed_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`
	for index := range missions {
		mission := &missions[index]
		if _, err := tx.Exec(ctx, insert,
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
			return fmt.Errorf("insert selected recap mission: %w", err)
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit recap mission selection: %w", err)
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

func scanMissions(rows pgx.Rows) ([]domain.RecapMission, error) {
	missions := make([]domain.RecapMission, 0)
	for rows.Next() {
		mission, err := scanMission(rows)
		if err != nil {
			return nil, fmt.Errorf("scan recap mission: %w", err)
		}
		missions = append(missions, mission)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate recap missions: %w", err)
	}
	return missions, nil
}
