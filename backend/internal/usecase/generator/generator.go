package generator

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"gooffer/backend/internal/domain"
	"gooffer/backend/internal/usecase/ports"

	"github.com/google/uuid"
)

type Generator struct {
	logger     *slog.Logger
	userRepo   ports.UserRepository
	actionRepo ports.ActionRepository
	recapRepo  ports.RecapRepository
	cache      ports.Cache
}

func New(
	logger *slog.Logger,
	userRepo ports.UserRepository,
	actionRepo ports.ActionRepository,
	recapRepo ports.RecapRepository,
	cache ports.Cache,
) *Generator {
	return &Generator{
		logger:     logger,
		userRepo:   userRepo,
		actionRepo: actionRepo,
		recapRepo:  recapRepo,
		cache:      cache,
	}
}

func (g *Generator) Execute(ctx context.Context, userID uuid.UUID, year int) (*domain.Recap, error) {
	if _, err := g.userRepo.GetByID(ctx, userID); err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	cacheKey := fmt.Sprintf("recap:%s:%d", userID.String(), year)
	var cached domain.Recap
	found, err := g.cache.Get(ctx, cacheKey, &cached)
	if err == nil && found {
		return &cached, nil
	}

	actions, err := g.actionRepo.GetByUserAndYear(ctx, userID, year)
	if err != nil {
		return nil, fmt.Errorf("failed to get actions: %w", err)
	}

	if len(actions) == 0 {
		empty := &domain.Recap{
			ID:              uuid.New(),
			UserID:          userID,
			Year:            year,
			TopCategories:   []domain.CategoryStat{},
			Achievements:    []domain.Achievement{},
			Recommendations: BuildRecommendations(nil),
			Story:           BuildStory(year, nil, nil),
			GeneratedAt:     time.Now().UTC(),
		}
		if err := g.recapRepo.Save(ctx, empty); err != nil {
			return nil, fmt.Errorf("failed to save empty recap: %w", err)
		}
		_ = g.cache.Set(ctx, cacheKey, empty, 24*time.Hour)
		return empty, nil
	}

	metrics := calculateMetrics(actions)
	achievements := AssignAchievements(metrics)
	story := BuildStory(year, metrics, achievements)
	recommendations := BuildRecommendations(metrics)

	recap := domain.Recap{
		ID:              uuid.New(),
		UserID:          userID,
		Year:            year,
		TotalViews:      metrics.TotalViews,
		TotalMessages:   metrics.TotalMessages,
		TotalFavorites:  metrics.TotalFavorites,
		TotalPurchases:  metrics.TotalPurchases,
		TotalSales:      metrics.TotalSales,
		TopCategories:   metrics.TopCategories,
		Achievements:    achievements,
		Recommendations: recommendations,
		Story:           story,
		ActivityDays:    metrics.ActivityDays,
		GeneratedAt:     time.Now().UTC(),
	}

	if err := g.recapRepo.Save(ctx, &recap); err != nil {
		return nil, fmt.Errorf("failed to save recap: %w", err)
	}
	if err := g.cache.Set(ctx, cacheKey, &recap, 24*time.Hour); err != nil {
		g.logger.Warn("failed to cache recap",
			slog.String("user_id", userID.String()),
			slog.String("error", err.Error()),
		)
	}

	return &recap, nil
}

func (g *Generator) Get(ctx context.Context, userID uuid.UUID, year int) (*domain.Recap, error) {
	cacheKey := fmt.Sprintf("recap:%s:%d", userID.String(), year)
	var cached domain.Recap
	found, err := g.cache.Get(ctx, cacheKey, &cached)
	if err == nil && found {
		return &cached, nil
	}

	stored, err := g.recapRepo.GetByUserAndYear(ctx, userID, year)
	if err != nil {
		return nil, fmt.Errorf("failed to get recap: %w", err)
	}
	if stored == nil {
		return nil, nil
	}

	if err := g.cache.Set(ctx, cacheKey, stored, 24*time.Hour); err != nil {
		g.logger.Warn("failed to cache recap on get",
			slog.String("user_id", userID.String()),
			slog.String("error", err.Error()),
		)
	}
	return stored, nil
}
