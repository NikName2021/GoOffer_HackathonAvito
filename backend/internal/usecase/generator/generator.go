package generator

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gooffer/backend/internal/domain"
	"gooffer/backend/internal/usecase/ports"
)

type Generator struct {
	userRepo  ports.UserRepository
	recapRepo ports.RecapRepository
}

func New(
	userRepo ports.UserRepository,
	recapRepo ports.RecapRepository,
) *Generator {
	return &Generator{
		userRepo:  userRepo,
		recapRepo: recapRepo,
	}
}

func (g *Generator) Execute(ctx context.Context, accountID, userID uuid.UUID, year int) (*domain.Recap, error) {
	user, err := g.userRepo.GetByID(ctx, accountID, userID)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	metrics := calculateProfileMetrics(user, year)
	summary := buildRecapSummary(metrics)
	cards := buildRecapCards(metrics, summary, user.RegisteredAt)
	achievementMetrics := metrics.achievementMetrics()
	achievements := AssignAchievements(achievementMetrics)

	recap := domain.Recap{
		ID:             uuid.New(),
		UserID:         userID,
		Year:           year,
		TotalViews:     metrics.Buyer.TotalViews,
		TotalMessages:  metrics.Buyer.ChatsCount,
		TotalFavorites: metrics.Buyer.FavoritesCount,
		TotalPurchases: metrics.Buyer.PurchasesCount,
		TotalSales:     metrics.Seller.SalesCount,
		TopCategories:  metrics.TopCategories,
		Achievements:   achievements,
		ActivityDays:   metrics.ActivityDays,
		Summary:        summary,
		Cards:          cards,
		GeneratedAt:    time.Now().UTC(),
	}

	if err := g.recapRepo.Save(ctx, &recap); err != nil {
		return nil, fmt.Errorf("failed to save recap: %w", err)
	}

	return &recap, nil
}
