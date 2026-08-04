package integration

import (
	"context"
	"log/slog"
	"os"
	"testing"

	"github.com/NikName2021/GoOffer_HackathonAvito/backend/internal/config"
	"github.com/NikName2021/GoOffer_HackathonAvito/backend/internal/repository/postgres"
	redisrepo "github.com/NikName2021/GoOffer_HackathonAvito/backend/internal/repository/redis"
	"github.com/NikName2021/GoOffer_HackathonAvito/backend/internal/usecase/generator"
	"github.com/google/uuid"
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

	pool, err := postgres.NewPool(ctx, cfg.Database.DSN())
	if err != nil {
		t.Fatalf("connect postgres: %v", err)
	}
	defer pool.Close()

	cache, err := redisrepo.NewCache(cfg.Redis.URL)
	if err != nil {
		t.Fatalf("connect redis: %v", err)
	}
	defer cache.Close()

	userRepo := postgres.NewUserRepository(pool)
	actionRepo := postgres.NewActionRepository(pool)
	recapRepo := postgres.NewRecapRepository(pool)

	gen := generator.New(slog.Default(), userRepo, actionRepo, recapRepo, cache)

	annaID := uuid.MustParse("a0000001-0000-4000-8000-000000000001")

	users, err := userRepo.ListProfiles(ctx)
	if err != nil {
		t.Fatalf("list profiles: %v", err)
	}
	if len(users) != 4 {
		t.Fatalf("expected 4 profiles, got %d", len(users))
	}

	recap, err := gen.Execute(ctx, annaID, 2025)
	if err != nil {
		t.Fatalf("generate recap: %v", err)
	}

	if recap.TotalPurchases < 12 {
		t.Fatalf("expected at least 12 purchases for Anna, got %d", recap.TotalPurchases)
	}
}
