package postgres

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"gooffer/backend/internal/domain"
	apperrors "gooffer/backend/pkg/errors"
)

type RecapShareRepository struct {
	pool *pgxpool.Pool
}

func NewRecapShareRepository(pool *pgxpool.Pool) *RecapShareRepository {
	return &RecapShareRepository{pool: pool}
}

func (r *RecapShareRepository) Create(ctx context.Context, share *domain.RecapShare) error {
	snapshot, err := json.Marshal(share.Snapshot)
	if err != nil {
		return fmt.Errorf("marshal public recap snapshot: %w", err)
	}
	const query = `
		INSERT INTO public_recap_shares (
			id, account_id, user_id, recap_year, token_hash, format,
			snapshot, created_at, expires_at, revoked_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`
	if _, err := r.pool.Exec(ctx, query,
		share.ID,
		share.AccountID,
		share.UserID,
		share.RecapYear,
		share.TokenHash,
		share.Format,
		snapshot,
		share.CreatedAt,
		share.ExpiresAt,
		share.RevokedAt,
	); err != nil {
		return fmt.Errorf("create public recap share: %w", err)
	}
	return nil
}

func (r *RecapShareRepository) GetActiveByTokenHash(
	ctx context.Context,
	tokenHash []byte,
	now time.Time,
) (*domain.RecapShare, error) {
	const query = `
		SELECT id, account_id, user_id, recap_year, token_hash, format,
		       snapshot, created_at, expires_at, revoked_at
		FROM public_recap_shares
		WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > $2`
	share, err := scanRecapShare(r.pool.QueryRow(ctx, query, tokenHash, now))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, apperrors.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get active public recap share: %w", err)
	}
	return &share, nil
}

func (r *RecapShareRepository) Revoke(
	ctx context.Context,
	accountID, shareID uuid.UUID,
	revokedAt time.Time,
) error {
	const query = `
		UPDATE public_recap_shares
		SET revoked_at = $3
		WHERE id = $1 AND account_id = $2
		  AND revoked_at IS NULL AND expires_at > $3`
	result, err := r.pool.Exec(ctx, query, shareID, accountID, revokedAt)
	if err != nil {
		return fmt.Errorf("revoke public recap share: %w", err)
	}
	if result.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}

func scanRecapShare(scanner rowScanner) (domain.RecapShare, error) {
	var share domain.RecapShare
	var snapshot []byte
	err := scanner.Scan(
		&share.ID,
		&share.AccountID,
		&share.UserID,
		&share.RecapYear,
		&share.TokenHash,
		&share.Format,
		&snapshot,
		&share.CreatedAt,
		&share.ExpiresAt,
		&share.RevokedAt,
	)
	if err != nil {
		return domain.RecapShare{}, err
	}
	decoded, err := decodePublicRecapSnapshot(snapshot)
	if err != nil {
		return domain.RecapShare{}, err
	}
	share.Snapshot = decoded
	return share, nil
}

func decodePublicRecapSnapshot(raw []byte) (domain.PublicRecapSnapshot, error) {
	var snapshot domain.PublicRecapSnapshot
	if err := json.Unmarshal(raw, &snapshot); err != nil {
		return domain.PublicRecapSnapshot{}, fmt.Errorf("unmarshal public recap snapshot: %w", err)
	}
	if snapshot.Cards == nil {
		snapshot.Cards = []domain.PublicRecapCard{}
	}
	if snapshot.Achievements == nil {
		snapshot.Achievements = []domain.PublicRecapAchievement{}
	}
	return snapshot, nil
}
