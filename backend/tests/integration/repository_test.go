package integration

import (
	"context"
	"errors"
	"os"
	"reflect"
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
	achievementDefinitionRepo := postgres.NewAchievementDefinitionRepository(pool)

	gen := generator.New(userRepo, recapRepo, cardDefinitionRepo, achievementDefinitionRepo)

	accountID := uuid.MustParse("99999999-9999-4999-8999-999999999999")
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
	if len(users) != 6 {
		t.Fatalf("expected 6 profiles, got %d", len(users))
	}
	for i := range users {
		assertSeedProfileConsistency(t, &users[i])
	}
	assertSharedSeedTransactions(t, users)
	expectedRecaps := map[uuid.UUID]struct {
		purchases    int
		sales        int
		mainCategory string
	}{
		uuid.MustParse("11111111-1111-4111-8111-111111111111"): {purchases: 5, sales: 2, mainCategory: "Электроника"},
		uuid.MustParse("22222222-2222-4222-8222-222222222222"): {purchases: 5, sales: 4, mainCategory: "Хобби и отдых"},
		uuid.MustParse("33333333-3333-4333-8333-333333333333"): {purchases: 6, sales: 2, mainCategory: "Для дома и дачи"},
		uuid.MustParse("44444444-4444-4444-8444-444444444444"): {purchases: 6, sales: 3, mainCategory: "Транспорт"},
		uuid.MustParse("55555555-5555-4555-8555-555555555555"): {purchases: 6, sales: 2, mainCategory: "Товары для детей"},
		uuid.MustParse("66666666-6666-4666-8666-666666666666"): {purchases: 5, sales: 5, mainCategory: "Хобби и отдых"},
	}
	for _, user := range users {
		recap, err := gen.Execute(ctx, accountID, user.ID, 2026)
		if err != nil {
			t.Fatalf("generate recap for %s: %v", user.Name, err)
		}
		expected := expectedRecaps[user.ID]
		if recap.TotalPurchases != expected.purchases || recap.TotalSales != expected.sales {
			t.Fatalf("%s purchases/sales = %d/%d, want %d/%d", user.Name, recap.TotalPurchases, recap.TotalSales, expected.purchases, expected.sales)
		}
		if recap.Summary.Combined.MainCategory != expected.mainCategory {
			t.Fatalf("%s main category = %q, want %q", user.Name, recap.Summary.Combined.MainCategory, expected.mainCategory)
		}
		if !recap.Summary.Combined.HasBuyerData || !recap.Summary.Combined.HasSellerData {
			t.Fatalf("%s recap lost one side: %#v", user.Name, recap.Summary.Combined)
		}
		if len(recap.Cards) < 7 || len(recap.Cards) > 9 {
			t.Fatalf("%s cards = %d, want 7-9", user.Name, len(recap.Cards))
		}
		loaded, err := recapRepo.GetByUserAndYear(ctx, user.ID, 2026)
		if err != nil {
			t.Fatalf("load persisted recap for %s: %v", user.Name, err)
		}
		if !reflect.DeepEqual(loaded.Comparison, recap.Comparison) || !reflect.DeepEqual(loaded.Forecast, recap.Forecast) {
			t.Fatalf("%s persisted comparison/forecast mismatch", user.Name)
		}
	}
}

func assertSeedProfileConsistency(t *testing.T, user *domain.User) {
	t.Helper()
	if len(user.Views) < 6 || len(user.OwnAds) < 3 {
		t.Fatalf("profile %q has only %d viewed and %d own ads", user.Name, len(user.Views), len(user.OwnAds))
	}
	totalEvents := 0
	adIDs := make(map[string]struct{}, len(user.Views)+len(user.OwnAds))
	for _, view := range user.Views {
		if view.AdID == "" {
			t.Fatalf("profile %q contains a viewed ad without adId", user.Name)
		}
		if _, exists := adIDs[view.AdID]; exists {
			t.Fatalf("profile %q contains duplicate adId %q", user.Name, view.AdID)
		}
		adIDs[view.AdID] = struct{}{}
		if view.ImageURL == "" {
			t.Fatalf("profile %q viewed ad %q has no image", user.Name, view.AdID)
		}
		totalEvents += len(view.ViewedAt)
		watchCount := 0
		var lastWatch time.Time
		var likeAt, buyAt *time.Time
		for index, event := range view.ViewedAt {
			if index > 0 && event.Time.Before(view.ViewedAt[index-1].Time) {
				t.Fatalf("profile %q ad %q has unsorted events", user.Name, view.AdID)
			}
			switch event.Type {
			case domain.ViewedAdEventWatch:
				watchCount++
				lastWatch = event.Time
			case domain.ViewedAdEventLike:
				if likeAt != nil {
					t.Fatalf("profile %q ad %q has multiple like events", user.Name, view.AdID)
				}
				selected := event.Time
				likeAt = &selected
			case domain.ViewedAdEventBuy:
				if buyAt != nil || event.UseAvitoDelivery == nil {
					t.Fatalf("profile %q ad %q has an invalid buy event", user.Name, view.AdID)
				}
				selected := event.Time
				buyAt = &selected
			default:
				t.Fatalf("profile %q ad %q has unsupported event %q", user.Name, view.AdID, event.Type)
			}
		}
		if watchCount != view.ViewCount || watchCount == 0 || !lastWatch.Equal(view.LastViewedAt) {
			t.Fatalf("profile %q ad %q watch aggregate is inconsistent", user.Name, view.AdID)
		}
		if (likeAt != nil) != view.IsFavorite || !sameOptionalTime(likeAt, view.FavoritedAt) {
			t.Fatalf("profile %q ad %q favorite aggregate is inconsistent", user.Name, view.AdID)
		}
		if (buyAt != nil) != view.IsPurchased || !sameOptionalTime(buyAt, view.PurchasedAt) {
			t.Fatalf("profile %q ad %q purchase aggregate is inconsistent", user.Name, view.AdID)
		}
	}
	for _, ad := range user.OwnAds {
		if ad.AdID == "" || ad.PublishedAt.IsZero() {
			t.Fatalf("profile %q contains an incomplete own ad", user.Name)
		}
		if _, exists := adIDs[ad.AdID]; exists {
			t.Fatalf("profile %q contains duplicate adId %q", user.Name, ad.AdID)
		}
		adIDs[ad.AdID] = struct{}{}
		if ad.ImageURL == "" {
			t.Fatalf("profile %q own ad %q has no image", user.Name, ad.AdID)
		}
		if ad.IsSold {
			if ad.SoldAt == nil || ad.SoldAt.Before(ad.PublishedAt) || !ad.IsArchived {
				t.Fatalf("profile %q ad %q has an invalid sale timeline", user.Name, ad.AdID)
			}
			if ad.Review != nil && ad.Review.CreatedAt.Before(*ad.SoldAt) {
				t.Fatalf("profile %q ad %q has a review before its sale", user.Name, ad.AdID)
			}
		} else if ad.SoldAt != nil || ad.Review != nil {
			t.Fatalf("profile %q unsold ad %q contains sale data", user.Name, ad.AdID)
		}
	}
	if totalEvents < 50 {
		t.Fatalf("profile %q has only %d item-level events", user.Name, totalEvents)
	}
}

func assertSharedSeedTransactions(t *testing.T, users []domain.User) {
	t.Helper()
	type transaction struct {
		title    string
		imageURL string
		price    int64
		date     string
	}
	sales := make(map[string]transaction)
	purchases := make(map[string]transaction)
	for _, user := range users {
		for _, ad := range user.OwnAds {
			if len(ad.AdID) < len("shared-") || ad.AdID[:len("shared-")] != "shared-" || !ad.IsSold || ad.SoldAt == nil {
				continue
			}
			sales[ad.AdID] = transaction{title: ad.Title, imageURL: ad.ImageURL, price: ad.Price, date: ad.SoldAt.UTC().Format("2006-01-02")}
		}
		for _, view := range user.Views {
			if len(view.AdID) < len("shared-") || view.AdID[:len("shared-")] != "shared-" || !view.IsPurchased || view.PurchasedAt == nil {
				continue
			}
			purchases[view.AdID] = transaction{title: view.Title, imageURL: view.ImageURL, price: view.Price, date: view.PurchasedAt.UTC().Format("2006-01-02")}
		}
	}
	if len(sales) != 8 || len(purchases) != 8 {
		t.Fatalf("shared transactions = %d sales/%d purchases, want 8/8", len(sales), len(purchases))
	}
	for adID, sale := range sales {
		purchase, exists := purchases[adID]
		if !exists || purchase != sale {
			t.Fatalf("shared transaction %q mismatch: sale=%#v purchase=%#v", adID, sale, purchase)
		}
	}
}

func sameOptionalTime(left, right *time.Time) bool {
	if left == nil || right == nil {
		return left == nil && right == nil
	}
	return left.Equal(*right)
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

func TestAchievementDefinitionRepositoryLifecycle(t *testing.T) {
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

	repository := postgres.NewAchievementDefinitionRepository(pool)
	definitions, err := repository.List(ctx)
	if err != nil {
		t.Fatalf("list achievement definitions: %v", err)
	}
	if len(definitions) != 6 {
		t.Fatalf("achievement definitions = %d, want 6 seeded rules", len(definitions))
	}

	original := definitions[0]
	restored := original
	defer func() {
		restored.UpdatedAt = time.Now().UTC()
		_ = repository.Update(ctx, &restored)
	}()

	updated := original
	updated.Title = "Интеграционное название"
	updated.IsActive = false
	updated.UpdatedAt = time.Now().UTC()
	if err := repository.Update(ctx, &updated); err != nil {
		t.Fatalf("update achievement definition: %v", err)
	}
	if updated.Category != original.Category || updated.SortOrder != original.SortOrder {
		t.Fatalf("immutable fields changed: %#v", updated)
	}

	active, err := repository.ListActive(ctx)
	if err != nil {
		t.Fatalf("list active achievement definitions: %v", err)
	}
	for _, definition := range active {
		if definition.Slug == updated.Slug {
			t.Fatal("inactive achievement definition was returned by ListActive")
		}
	}

	missing := updated
	missing.Slug = "does_not_exist"
	if err := repository.Update(ctx, &missing); !errors.Is(err, apperrors.ErrNotFound) {
		t.Fatalf("missing update error = %v, want not found", err)
	}
}

func TestMissionRepositoryStoresMultipleSelections(t *testing.T) {
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

	userID := uuid.MustParse("11111111-1111-4111-8111-111111111111")
	year := 2099
	recap := &domain.Recap{
		ID:          uuid.New(),
		UserID:      userID,
		Year:        year,
		GeneratedAt: time.Now().UTC(),
	}
	if err := postgres.NewRecapRepository(pool).Save(ctx, recap); err != nil {
		t.Fatalf("save test recap: %v", err)
	}
	defer func() { _, _ = pool.Exec(ctx, `DELETE FROM recaps WHERE user_id = $1 AND year = $2`, userID, year) }()

	now := time.Now().UTC()
	selected := []domain.RecapMission{
		{
			ID: uuid.New(), UserID: userID, RecapYear: year,
			Code: domain.MissionSellThreeItems, Target: 3, Status: domain.MissionActive,
			SelectedAt: now, UpdatedAt: now,
		},
		{
			ID: uuid.New(), UserID: userID, RecapYear: year,
			Code: domain.MissionTryDelivery, Target: 1, Status: domain.MissionActive,
			SelectedAt: now, UpdatedAt: now,
		},
	}
	repository := postgres.NewMissionRepository(pool)
	if err := repository.ReplaceSelection(ctx, userID, year, selected); err != nil {
		t.Fatalf("replace mission selection: %v", err)
	}
	loaded, err := repository.ListByUserAndYear(ctx, userID, year)
	if err != nil {
		t.Fatalf("list missions by year: %v", err)
	}
	if len(loaded) != 2 {
		t.Fatalf("missions = %d, want 2", len(loaded))
	}

	loaded[0].Progress = 1
	loaded[0].UpdatedAt = now.Add(time.Minute)
	if err := repository.UpdateProgress(ctx, &loaded[0]); err != nil {
		t.Fatalf("update mission progress: %v", err)
	}
	if err := repository.ReplaceSelection(ctx, userID, year, loaded[:1]); err != nil {
		t.Fatalf("reduce mission selection: %v", err)
	}
	loaded, err = repository.ListByUserAndYear(ctx, userID, year)
	if err != nil || len(loaded) != 1 || loaded[0].Progress != 1 {
		t.Fatalf("reduced missions = %#v, error = %v", loaded, err)
	}
	if err := repository.ReplaceSelection(ctx, userID, year, []domain.RecapMission{}); err != nil {
		t.Fatalf("clear mission selection: %v", err)
	}
	loaded, err = repository.ListByUserAndYear(ctx, userID, year)
	if err != nil || len(loaded) != 0 {
		t.Fatalf("cleared missions = %#v, error = %v", loaded, err)
	}
}
