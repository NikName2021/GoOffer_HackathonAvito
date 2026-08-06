package integration

import (
	"context"
	"os"
	"testing"

	"github.com/google/uuid"
	"gooffer/backend/internal/config"
	"gooffer/backend/internal/repository/postgres"
	"gooffer/backend/internal/usecase/generator"
)

// Интеграционный тест: проверяем, что репозитории и генератор работают вместе.
// Запуск: DB_PORT=5446 REDIS_URL=redis://localhost:6379 go test ./tests/integration/... -v
func TestRepositoriesAndGenerator(t *testing.T) {
	if os.Getenv("DB_PORT") == "" {
		t.Skip("set DB_PORT to run integration test against local postgres")
	}

	ctx := context.Background()
	cfg, err := config.Load()
	if err != nil {
		t.Fatalf("load config: %v", err)
	}

	pool, err := postgres.NewPool(ctx, cfg.DatabaseURL())
	if err != nil {
		t.Fatalf("connect postgres: %v", err)
	}
	defer pool.Close()

	userRepo := postgres.NewUserRepository(pool)
	actionRepo := postgres.NewActionRepository(pool)
	recapRepo := postgres.NewRecapRepository(pool)

	gen := generator.New(userRepo, actionRepo, recapRepo)

	accountID := uuid.MustParse("99999999-9999-4999-8999-999999999999")
	annaID := uuid.MustParse("11111111-1111-4111-8111-111111111111")

	users, err := userRepo.ListProfiles(ctx, accountID)
	if err != nil {
		t.Fatalf("list profiles: %v", err)
	}
	if len(users) != 4 {
		t.Fatalf("expected 4 profiles, got %d", len(users))
	}

	recap, err := gen.Execute(ctx, accountID, annaID, 2026)
	if err != nil {
		t.Fatalf("generate recap: %v", err)
	}

	if recap.TotalPurchases != 3 || recap.TotalSales != 2 {
		t.Fatalf("expected Anna profile purchases/sales 3/2, got %d/%d", recap.TotalPurchases, recap.TotalSales)
	}
	if !recap.Summary.Combined.HasBuyerData || !recap.Summary.Combined.HasSellerData {
		t.Fatalf("expected recap to preserve both sides, got %#v", recap.Summary.Combined)
	}
	if len(recap.Cards) < 7 || len(recap.Cards) > 9 {
		t.Fatalf("expected 7-9 cards, got %d", len(recap.Cards))
	}
}
