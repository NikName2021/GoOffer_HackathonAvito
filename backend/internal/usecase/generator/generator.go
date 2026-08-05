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
	userRepo   ports.UserRepository
	actionRepo ports.ActionRepository
	recapRepo  ports.RecapRepository
}

func New(
	userRepo ports.UserRepository,
	actionRepo ports.ActionRepository,
	recapRepo ports.RecapRepository,
) *Generator {
	return &Generator{
		userRepo:   userRepo,
		actionRepo: actionRepo,
		recapRepo:  recapRepo,
	}
}

func (g *Generator) Execute(ctx context.Context, accountID, userID uuid.UUID, year int) (*domain.Recap, error) {
	// 1. Проверяем существование пользователя
	if _, err := g.userRepo.GetByID(ctx, accountID, userID); err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	// 2. Получаем действия пользователя за год
	actions, err := g.actionRepo.GetByUserAndYear(ctx, userID, year)
	if err != nil {
		return nil, fmt.Errorf("failed to get actions: %w", err)
	}

	// 3. Если действий нет — создаём пустой Recap и сохраняем
	if len(actions) == 0 {
		emptyRecap := &domain.Recap{
			ID:          uuid.New(),
			UserID:      userID,
			Year:        year,
			GeneratedAt: time.Now().UTC(),
		}

		if err := g.recapRepo.Save(ctx, emptyRecap); err != nil {
			return nil, fmt.Errorf("failed to save empty recap: %w", err)
		}

		return emptyRecap, nil
	}

	// 4. Подсчёт метрик
	metrics := calculateMetrics(actions)

	// 5. Назначение ачивок
	achievements := AssignAchievements(metrics)

	// 6. Формируем Recap
	recap := domain.Recap{
		ID:             uuid.New(),
		UserID:         userID,
		Year:           year,
		TotalViews:     metrics.TotalViews,
		TotalMessages:  metrics.TotalMessages,
		TotalFavorites: metrics.TotalFavorites,
		TotalPurchases: metrics.TotalPurchases,
		TotalSales:     metrics.TotalSales,
		TopCategories:  metrics.TopCategories,
		Achievements:   achievements,
		ActivityDays:   metrics.ActivityDays,
		GeneratedAt:    time.Now().UTC(),
	}

	// 7. Сохраняем в БД
	if err := g.recapRepo.Save(ctx, &recap); err != nil {
		return nil, fmt.Errorf("failed to save recap: %w", err)
	}

	return &recap, nil
}
