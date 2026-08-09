package integration

import (
	"context"
	"errors"
	"os"
	"testing"
	"time"

	"github.com/google/uuid"
	"gooffer/backend/internal/config"
	"gooffer/backend/internal/domain"
	"gooffer/backend/internal/repository/postgres"
	"gooffer/backend/internal/usecase/generator"
	"gooffer/backend/migrations"
	apperrors "gooffer/backend/pkg/errors"
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
	if err := migrations.Apply(ctx, pool); err != nil {
		t.Fatalf("apply migrations: %v", err)
	}

	userRepo := postgres.NewUserRepository(pool)
	recapRepo := postgres.NewRecapRepository(pool)
	cardDefinitionRepo := postgres.NewCardDefinitionRepository(pool)

	gen := generator.New(userRepo, recapRepo, cardDefinitionRepo)

	accountID := uuid.MustParse("99999999-9999-4999-8999-999999999999")
	annaID := uuid.MustParse("11111111-1111-4111-8111-111111111111")
	account, _, err := postgres.NewAuthRepository(pool).GetAccountByLogin(ctx, "nikita")
	if err != nil {
		t.Fatalf("load nikita account: %v", err)
	}
	if !account.IsAdmin {
		t.Fatal("nikita must be an administrator after migrations")
	}

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

func TestAuthRegistrationTransactionRollsBack(t *testing.T) {
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

	if err := migrations.Apply(ctx, pool); err != nil {
		t.Fatalf("apply migrations: %v", err)
	}

	login := "rollback-" + uuid.NewString()[:8]
	account := &domain.Account{
		ID:        uuid.New(),
		Login:     login,
		CreatedAt: time.Now().UTC(),
	}
	defer func() {
		_, _ = pool.Exec(ctx, `DELETE FROM accounts WHERE id = $1`, account.ID)
	}()

	repository := postgres.NewAuthRepository(pool)
	err = repository.CreateAccountWithSession(
		ctx,
		account,
		"test-password-hash",
		[]byte("invalid-length"),
		time.Now().UTC().Add(time.Hour),
	)
	if err == nil {
		t.Fatal("registration unexpectedly succeeded with invalid session hash")
	}

	if _, _, err := repository.GetAccountByLogin(ctx, login); !errors.Is(err, apperrors.ErrNotFound) {
		t.Fatalf("account survived failed registration transaction: %v", err)
	}
}

func TestCardDefinitionRepositoryLifecycle(t *testing.T) {
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
	if err := migrations.Apply(ctx, pool); err != nil {
		t.Fatalf("apply migrations: %v", err)
	}

	repository := postgres.NewCardDefinitionRepository(pool)
	adminID := uuid.MustParse("99999999-9999-4999-8999-999999999999")
	targetUserID := uuid.MustParse("11111111-1111-4111-8111-111111111111")
	now := time.Now().UTC()
	definition := &domain.CardDefinition{
		ID:                uuid.New(),
		Name:              "Интеграционный шаблон",
		TargetUserID:      &targetUserID,
		Kind:              domain.CardKindStatistic,
		Metric:            domain.CardMetricTotalViews,
		Analysis:          domain.CardAnalysisTotal,
		ConditionOperator: domain.CardConditionAlways,
		Title:             "Просмотры профиля",
		Layout:            "statistic",
		Theme:             "avito-purple",
		Icon:              "eye",
		Shareable:         true,
		SortOrder:         10,
		IsActive:          true,
		CreatedBy:         adminID,
		CreatedAt:         now,
		UpdatedAt:         now,
	}
	if err := repository.Create(ctx, definition); err != nil {
		t.Fatalf("create card definition: %v", err)
	}
	defer func() { _ = repository.Delete(ctx, definition.ID) }()

	active, err := repository.ListActiveForUser(ctx, targetUserID)
	if err != nil {
		t.Fatalf("list active definitions: %v", err)
	}
	if !containsCardDefinition(active, definition.ID) {
		t.Fatal("targeted active definition was not returned for its profile")
	}
	otherProfile, err := repository.ListActiveForUser(ctx, uuid.New())
	if err != nil {
		t.Fatalf("list definitions for another profile: %v", err)
	}
	if containsCardDefinition(otherProfile, definition.ID) {
		t.Fatal("targeted definition leaked to another profile")
	}

	definition.Title = "Обновлённые просмотры"
	definition.IsActive = false
	definition.UpdatedAt = now.Add(time.Minute)
	if err := repository.Update(ctx, definition); err != nil {
		t.Fatalf("update card definition: %v", err)
	}
	active, err = repository.ListActiveForUser(ctx, targetUserID)
	if err != nil {
		t.Fatalf("list active definitions after update: %v", err)
	}
	if containsCardDefinition(active, definition.ID) {
		t.Fatal("inactive definition was returned by ListActiveForUser")
	}

	if err := repository.Delete(ctx, definition.ID); err != nil {
		t.Fatalf("delete card definition: %v", err)
	}
	if err := repository.Delete(ctx, definition.ID); !errors.Is(err, apperrors.ErrNotFound) {
		t.Fatalf("second delete error = %v, want not found", err)
	}
}

func containsCardDefinition(definitions []domain.CardDefinition, id uuid.UUID) bool {
	for _, definition := range definitions {
		if definition.ID == id {
			return true
		}
	}
	return false
}
