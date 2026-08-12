package unit

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	"gooffer/backend/internal/domain"
	"gooffer/backend/internal/usecase/generator"
)

type mockUserRepo struct {
	users map[uuid.UUID]domain.User
	err   error // добавляем поддержку ошибок
}

func (m *mockUserRepo) GetByID(ctx context.Context, _ uuid.UUID, id uuid.UUID) (*domain.User, error) {
	if m.err != nil {
		return nil, m.err
	}
	if user, ok := m.users[id]; ok {
		return &user, nil
	}
	return nil, errors.New("user not found")
}

func (m *mockUserRepo) ListProfiles(ctx context.Context, _ uuid.UUID) ([]domain.User, error) {
	var list []domain.User
	for _, u := range m.users {
		list = append(list, u)
	}
	return list, nil
}

func (m *mockUserRepo) Create(_ context.Context, _ uuid.UUID, user *domain.User) error {
	m.users[user.ID] = *user
	return m.err
}

func (m *mockUserRepo) Update(_ context.Context, _ uuid.UUID, user *domain.User) error {
	m.users[user.ID] = *user
	return m.err
}

func (m *mockUserRepo) Delete(_ context.Context, _, id uuid.UUID) error {
	delete(m.users, id)
	return m.err
}

type mockRecapRepo struct {
	recaps map[string]domain.Recap
	err    error
}

type mockCardDefinitionRepo struct {
	definitions []domain.CardDefinition
	err         error
}

type mockAchievementDefinitionRepo struct {
	definitions []domain.AchievementDefinition
	err         error
}

func (m *mockAchievementDefinitionRepo) List(context.Context) ([]domain.AchievementDefinition, error) {
	return m.definitions, m.err
}

func (m *mockAchievementDefinitionRepo) ListActive(context.Context) ([]domain.AchievementDefinition, error) {
	return m.definitions, m.err
}

func (m *mockAchievementDefinitionRepo) Update(context.Context, *domain.AchievementDefinition) error {
	return m.err
}

func (m *mockCardDefinitionRepo) Create(context.Context, *domain.CardDefinition) error {
	return nil
}

func (m *mockCardDefinitionRepo) List(context.Context) ([]domain.CardDefinition, error) {
	return m.definitions, m.err
}

func (m *mockCardDefinitionRepo) Update(context.Context, *domain.CardDefinition) error {
	return nil
}

func (m *mockCardDefinitionRepo) Delete(context.Context, uuid.UUID) error {
	return nil
}

func (m *mockCardDefinitionRepo) ListActiveForUser(context.Context, uuid.UUID) ([]domain.CardDefinition, error) {
	return m.definitions, m.err
}

func (m *mockRecapRepo) Save(ctx context.Context, recap *domain.Recap) error {
	if m.err != nil {
		return m.err
	}
	key := recap.UserID.String() + ":" + string(rune(recap.Year))
	m.recaps[key] = *recap
	return nil
}

func (m *mockRecapRepo) GetByUserAndYear(ctx context.Context, userID uuid.UUID, year int) (*domain.Recap, error) {
	if m.err != nil {
		return nil, m.err
	}
	key := userID.String() + ":" + string(rune(year))
	if recap, ok := m.recaps[key]; ok {
		return &recap, nil
	}
	return nil, nil
}

// ТЕСТЫ

var generatorAccountID = uuid.MustParse("99999999-9999-4999-8999-999999999999")

func TestGenerator_Execute_Success(t *testing.T) {
	userID := uuid.New()
	year := 2026
	purchasedAt := time.Date(year, time.March, 12, 14, 10, 0, 0, time.UTC)
	favoritedAt := time.Date(year, time.March, 10, 18, 20, 0, 0, time.UTC)
	firstViewedAt := time.Date(year, time.March, 9, 12, 0, 0, 0, time.UTC)
	soldAt := time.Date(year, time.June, 18, 0, 0, 0, 0, time.UTC)
	reviewedAt := soldAt.Add(24 * time.Hour)
	publishedAt := time.Date(year, time.May, 1, 0, 0, 0, 0, time.UTC)
	usedDelivery := true

	userRepo := &mockUserRepo{
		users: map[uuid.UUID]domain.User{
			userID: {
				ID:           userID,
				Name:         "Test User",
				RegisteredAt: time.Date(2020, time.January, 1, 0, 0, 0, 0, time.UTC),
				Likes:        12,
				ChatsCount:   1,
				Views: []domain.ViewedAd{
					{
						Ad: domain.Ad{AdID: "phone", Title: "Phone", Category: "Electronics", Price: 100000, ViewCount: 99},
						ViewedAt: []domain.ViewedAdEvent{
							{Type: domain.ViewedAdEventWatch, Time: firstViewedAt},
							{Type: domain.ViewedAdEventLike, Time: favoritedAt},
							{Type: domain.ViewedAdEventWatch, Time: purchasedAt},
							{Type: domain.ViewedAdEventBuy, Time: purchasedAt, UseAvitoDelivery: &usedDelivery},
						},
						LastViewedAt: purchasedAt,
						IsFavorite:   true,
						FavoritedAt:  &favoritedAt,
						IsPurchased:  true,
						PurchasedAt:  &purchasedAt,
					},
				},
				OwnAds: []domain.OwnAd{
					{
						Ad:             domain.Ad{AdID: "chair", Title: "Chair", Category: "Home", Price: 7000, ViewCount: 86},
						PublishedAt:    publishedAt,
						FavoritesCount: 8,
						ContactsCount:  4,
						IsSold:         true,
						SoldAt:         &soldAt,
						Review:         &domain.Review{Comment: "Всё отлично", Rating: 5, CreatedAt: reviewedAt},
					},
				},
			},
		},
	}

	recapRepo := &mockRecapRepo{recaps: make(map[string]domain.Recap)}

	gen := generator.New(userRepo, recapRepo, nil, nil)

	recap, err := gen.Execute(context.Background(), generatorAccountID, userID, year)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if recap.UserID != userID {
		t.Errorf("expected userID %v, got %v", userID, recap.UserID)
	}
	if recap.TotalViews != 2 {
		t.Errorf("expected 2 views, got %d", recap.TotalViews)
	}
	if recap.TotalMessages != 0 {
		t.Errorf("expected undated messages to be excluded, got %d", recap.TotalMessages)
	}
	if recap.TotalPurchases != 1 || recap.TotalSales != 1 {
		t.Fatalf("purchases/sales = %d/%d, want 1/1", recap.TotalPurchases, recap.TotalSales)
	}
	if recap.Comparison.Status != domain.RecapComparisonFirstYear || recap.Comparison.Message != "Это ваши первые итоги года" {
		t.Fatalf("comparison = %#v, want first-year response", recap.Comparison)
	}
	if recap.Comparison.Spending.Current != 100000 || recap.Comparison.SalesRevenue.Current != 7000 {
		t.Fatalf("spending/revenue = %d/%d, want 100000/7000", recap.Comparison.Spending.Current, recap.Comparison.SalesRevenue.Current)
	}
	if recap.Forecast.Year != 2027 || recap.Forecast.Method != domain.RecapForecastCurrentBaseline {
		t.Fatalf("forecast = %#v", recap.Forecast)
	}
	if recap.Summary.Buyer.AvitoDeliveryPurchases != 1 {
		t.Fatalf("delivery purchases = %d, want 1", recap.Summary.Buyer.AvitoDeliveryPurchases)
	}
	if recap.Summary.Seller.FavoritesReceived != 8 || recap.Summary.Seller.ContactsReceived != 4 {
		t.Fatalf("seller engagement = %#v", recap.Summary.Seller)
	}
	if recap.Summary.Seller.ReviewsCount != 1 || recap.Summary.Seller.AverageRating == nil ||
		*recap.Summary.Seller.AverageRating != 5 {
		t.Fatalf("review after sale = %#v, want one five-star review", recap.Summary.Seller)
	}
	if !recap.Summary.Combined.HasBuyerData || !recap.Summary.Combined.HasSellerData {
		t.Fatalf("combined summary = %#v, want both sides", recap.Summary.Combined)
	}
	if recap.Summary.Headline != "Вы были по обе стороны Авито" {
		t.Fatalf("headline = %q", recap.Summary.Headline)
	}
	buyerCards, sellerCards := 0, 0
	cardsByID := make(map[string]domain.RecapCard, len(recap.Cards))
	for _, card := range recap.Cards {
		cardsByID[card.ID] = card
		switch card.Kind {
		case "buyer":
			buyerCards++
		case "seller":
			sellerCards++
		}
	}
	if buyerCards < 2 || sellerCards < 2 {
		t.Fatalf("buyer/seller cards = %d/%d, want at least 2/2", buyerCards, sellerCards)
	}
	if len(recap.Cards) > 9 {
		t.Fatalf("cards = %d, want no more than 9", len(recap.Cards))
	}
	categoryChart, exists := cardsByID["category_mix"]
	if !exists || categoryChart.Visualization == nil || categoryChart.Visualization.Type != "donut" {
		t.Fatalf("category chart = %#v, want donut visualization", categoryChart)
	}
	if categoryChart.CTA == nil || categoryChart.CTA.Action != "open_category" ||
		categoryChart.CTA.Params["category"] != "Electronics" {
		t.Fatalf("category chart CTA = %#v", categoryChart.CTA)
	}
	activityChart, exists := cardsByID["activity_rhythm"]
	if !exists || activityChart.Visualization == nil || activityChart.Visualization.Type != "bar" {
		t.Fatalf("activity chart = %#v, want bar visualization", activityChart)
	}
	if activityChart.Visualization.Highlight == nil || activityChart.Visualization.Highlight.Label != "Март" {
		t.Fatalf("activity highlight = %#v, want March", activityChart.Visualization.Highlight)
	}
}

func TestGenerator_Execute_EmptyProfile(t *testing.T) {
	userID := uuid.New()
	year := 2025

	userRepo := &mockUserRepo{
		users: map[uuid.UUID]domain.User{
			userID: {ID: userID, Name: "Test User"},
		},
	}

	recapRepo := &mockRecapRepo{recaps: make(map[string]domain.Recap)}

	gen := generator.New(userRepo, recapRepo, nil, nil)

	recap, err := gen.Execute(context.Background(), generatorAccountID, userID, year)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if recap.TotalViews != 0 {
		t.Errorf("expected 0 views, got %d", recap.TotalViews)
	}
	if len(recap.Achievements) != 0 {
		t.Errorf("expected 0 achievements, got %d", len(recap.Achievements))
	}
	if len(recap.Cards) != 2 || recap.Cards[0].ID != "year_overview" || recap.Cards[1].ID != "next_step" {
		t.Fatalf("cards = %#v, want overview and next step", recap.Cards)
	}
}

func TestGenerator_UserNotFound(t *testing.T) {
	userID := uuid.New()
	year := 2025

	userRepo := &mockUserRepo{
		users: map[uuid.UUID]domain.User{},
		err:   errors.New("user not found"),
	}

	recapRepo := &mockRecapRepo{recaps: make(map[string]domain.Recap)}

	gen := generator.New(userRepo, recapRepo, nil, nil)

	_, err := gen.Execute(context.Background(), generatorAccountID, userID, year)

	if err == nil {
		t.Fatal("expected error, got nil")
	}
}

func TestGenerator_StopsWhenAchievementDefinitionsCannotBeLoaded(t *testing.T) {
	userID := uuid.New()
	userRepo := &mockUserRepo{users: map[uuid.UUID]domain.User{
		userID: {ID: userID, Name: "Test User"},
	}}
	recapRepo := &mockRecapRepo{recaps: make(map[string]domain.Recap)}
	achievementRepo := &mockAchievementDefinitionRepo{err: errors.New("database unavailable")}

	_, err := generator.New(userRepo, recapRepo, nil, achievementRepo).Execute(
		context.Background(),
		generatorAccountID,
		userID,
		2026,
	)
	if err == nil || !strings.Contains(err.Error(), "load achievement definitions") {
		t.Fatalf("error = %v, want achievement definition load error", err)
	}
}

func TestGenerator_Execute_AddsMatchingAdminCard(t *testing.T) {
	userID := uuid.New()
	year := 2026
	viewedAt := time.Date(year, time.March, 9, 12, 0, 0, 0, time.UTC)
	threshold := 2.0
	userRepo := &mockUserRepo{users: map[uuid.UUID]domain.User{
		userID: {
			ID: userID,
			Views: []domain.ViewedAd{{
				Ad: domain.Ad{AdID: "phone", Title: "Phone", Category: "Electronics"},
				ViewedAt: []domain.ViewedAdEvent{
					{Type: domain.ViewedAdEventWatch, Time: viewedAt},
					{Type: domain.ViewedAdEventWatch, Time: viewedAt},
				},
			}},
		},
	}}
	recapRepo := &mockRecapRepo{recaps: make(map[string]domain.Recap)}
	definitionID := uuid.New()
	cardRepo := &mockCardDefinitionRepo{definitions: []domain.CardDefinition{{
		ID:                definitionID,
		Name:              "Активность",
		Kind:              domain.CardKindStatistic,
		Metric:            domain.CardMetricTotalViews,
		Analysis:          domain.CardAnalysisTotal,
		ConditionOperator: domain.CardConditionGTE,
		ConditionValue:    &threshold,
		Title:             "Вы активно искали",
		ValueSuffix:       "просмотра",
		Layout:            "statistic",
		Theme:             "avito-purple",
		Icon:              "eye",
		Shareable:         true,
		IsActive:          true,
	}}}
	gen := generator.New(userRepo, recapRepo, cardRepo, nil)

	recap, err := gen.Execute(context.Background(), generatorAccountID, userID, year)
	if err != nil {
		t.Fatalf("generate recap: %v", err)
	}

	customID := "custom_" + definitionID.String()
	for _, card := range recap.Cards {
		if card.ID == customID {
			if card.Value != "2 просмотра" {
				t.Fatalf("custom card value = %q, want %q", card.Value, "2 просмотра")
			}
			return
		}
	}
	t.Fatalf("custom card %q was not generated", customID)
}

func TestCalculateMetrics(t *testing.T) {
	userID := uuid.New()
	year := 2025
	firstDay := time.Date(year, time.February, 1, 10, 0, 0, 0, time.UTC)
	secondDay := time.Date(year, time.February, 2, 10, 0, 0, 0, time.UTC)
	previousYear := time.Date(year-1, time.December, 1, 10, 0, 0, 0, time.UTC)

	userRepo := &mockUserRepo{
		users: map[uuid.UUID]domain.User{
			userID: {
				ID:         userID,
				Name:       "Test User",
				ChatsCount: 1,
				Views: []domain.ViewedAd{
					{
						Ad:           domain.Ad{Title: "Camera", Category: "Electronics", ViewCount: 1},
						LastViewedAt: firstDay,
						IsFavorite:   true,
						FavoritedAt:  &firstDay,
					},
					{
						Ad:           domain.Ad{Title: "Book", Category: "Books", ViewCount: 1},
						LastViewedAt: secondDay,
						IsPurchased:  true,
						PurchasedAt:  &secondDay,
					},
					{
						Ad:           domain.Ad{Title: "Old car", Category: "Transport", ViewCount: 500},
						LastViewedAt: previousYear,
						IsFavorite:   true,
						FavoritedAt:  &previousYear,
						IsPurchased:  true,
						PurchasedAt:  &previousYear,
					},
				},
			},
		},
	}

	recapRepo := &mockRecapRepo{recaps: make(map[string]domain.Recap)}

	gen := generator.New(userRepo, recapRepo, nil, nil)

	recap, err := gen.Execute(context.Background(), generatorAccountID, userID, year)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if recap.TotalViews != 2 {
		t.Errorf("expected 2 views, got %d", recap.TotalViews)
	}
	if recap.TotalMessages != 0 {
		t.Errorf("expected undated messages to be excluded, got %d", recap.TotalMessages)
	}
	if recap.TotalPurchases != 1 {
		t.Errorf("expected 1 purchase, got %d", recap.TotalPurchases)
	}
	if recap.TotalFavorites != 1 {
		t.Errorf("expected 1 favorite, got %d", recap.TotalFavorites)
	}
	if recap.ActivityDays != 2 {
		t.Errorf("expected 2 activity days, got %d", recap.ActivityDays)
	}
	if recap.Summary.Buyer.MainCategory != "Books" {
		t.Errorf("main buyer category = %q, want Books because purchases take priority", recap.Summary.Buyer.MainCategory)
	}
}

func TestAssignAchievements(t *testing.T) {
	userID := uuid.New()
	year := 2025
	views := make([]domain.ViewedAd, 0, 15)
	for i := 0; i < 15; i++ {
		date := time.Date(year, time.January, i+1, 10, 0, 0, 0, time.UTC)
		views = append(views, domain.ViewedAd{
			Ad:           domain.Ad{Title: "Item", Category: "Books", ViewCount: 100},
			LastViewedAt: date,
			IsPurchased:  true,
			PurchasedAt:  &date,
		})
	}
	ownAds := make([]domain.OwnAd, 0, 10)
	for i := 0; i < 10; i++ {
		date := time.Date(year, time.February, i+1, 10, 0, 0, 0, time.UTC)
		ownAds = append(ownAds, domain.OwnAd{
			Ad:     domain.Ad{Title: "Listing", Category: "Electronics", ViewCount: 10},
			IsSold: true,
			SoldAt: &date,
		})
	}

	userRepo := &mockUserRepo{
		users: map[uuid.UUID]domain.User{
			userID: {ID: userID, Name: "Test User", ChatsCount: 100, Views: views, OwnAds: ownAds},
		},
	}

	recapRepo := &mockRecapRepo{recaps: make(map[string]domain.Recap)}

	achievementRepo := &mockAchievementDefinitionRepo{definitions: defaultAchievementDefinitions()}
	gen := generator.New(userRepo, recapRepo, nil, achievementRepo)

	recap, err := gen.Execute(context.Background(), generatorAccountID, userID, year)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if len(recap.Achievements) == 0 {
		t.Error("expected achievements, got none")
	}
}

func TestGeneratorUsesUTCYearBoundaries(t *testing.T) {
	userID := uuid.New()
	withinAtStart := time.Date(2025, time.December, 31, 23, 30, 0, 0, time.FixedZone("UTC-2", -2*60*60))
	withinAtEnd := time.Date(2027, time.January, 1, 1, 30, 0, 0, time.FixedZone("UTC+2", 2*60*60))
	outside := time.Date(2026, time.January, 1, 1, 30, 0, 0, time.FixedZone("UTC+2", 2*60*60))
	userRepo := &mockUserRepo{users: map[uuid.UUID]domain.User{
		userID: {
			ID: userID,
			Views: []domain.ViewedAd{{
				Ad: domain.Ad{AdID: "timezone", Title: "Часы", Category: "Хобби"},
				ViewedAt: []domain.ViewedAdEvent{
					{Type: domain.ViewedAdEventWatch, Time: withinAtStart},
					{Type: domain.ViewedAdEventWatch, Time: withinAtEnd},
					{Type: domain.ViewedAdEventWatch, Time: outside},
				},
			}},
		},
	}}
	recapRepo := &mockRecapRepo{recaps: make(map[string]domain.Recap)}

	recap, err := generator.New(userRepo, recapRepo, nil, nil).Execute(
		context.Background(), generatorAccountID, userID, 2026,
	)
	if err != nil {
		t.Fatalf("Execute() error = %v", err)
	}
	if recap.TotalViews != 2 || recap.ActivityDays != 2 {
		t.Fatalf("views/activity days = %d/%d, want 2/2 by UTC boundaries", recap.TotalViews, recap.ActivityDays)
	}
}

func TestGeneratorExcludesUndatedSnapshotsFromAnnualRecap(t *testing.T) {
	userID := uuid.New()
	userRepo := &mockUserRepo{users: map[uuid.UUID]domain.User{
		userID: {
			ID: userID, ChatsCount: 80, Likes: 120,
			OwnAds: []domain.OwnAd{{Ad: domain.Ad{Title: "Без даты", Category: "Дом", ViewCount: 500}}},
		},
	}}
	recapRepo := &mockRecapRepo{recaps: make(map[string]domain.Recap)}

	recap, err := generator.New(userRepo, recapRepo, nil, nil).Execute(
		context.Background(), generatorAccountID, userID, 2026,
	)
	if err != nil {
		t.Fatalf("Execute() error = %v", err)
	}
	if recap.TotalMessages != 0 || recap.Summary.Buyer.HasData || recap.Summary.Seller.HasData {
		t.Fatalf("undated snapshots affected annual recap: %#v", recap.Summary)
	}
	for _, achievement := range recap.Achievements {
		if achievement.Slug == "social_butterfly" {
			t.Fatal("undated chats unlocked annual achievement")
		}
	}
}
