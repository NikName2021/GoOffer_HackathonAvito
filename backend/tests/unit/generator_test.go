package unit

import (
	"context"
	"errors"
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

type mockActionRepo struct {
	actions map[string][]domain.Action
	err     error
}

func (m *mockActionRepo) GetByUserAndYear(ctx context.Context, userID uuid.UUID, year int) ([]domain.Action, error) {
	if m.err != nil {
		return nil, m.err
	}
	key := userID.String() + ":" + string(rune(year))
	if actions, ok := m.actions[key]; ok {
		return actions, nil
	}
	return []domain.Action{}, nil
}

type mockRecapRepo struct {
	recaps map[string]domain.Recap
	err    error
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
	soldAt := time.Date(year, time.June, 18, 0, 0, 0, 0, time.UTC)

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
						Ad:           domain.Ad{Title: "Phone", Category: "Electronics", Price: 100000, ViewCount: 2},
						LastViewedAt: purchasedAt,
						IsFavorite:   true,
						FavoritedAt:  &favoritedAt,
						IsPurchased:  true,
						PurchasedAt:  &purchasedAt,
					},
				},
				OwnAds: []domain.OwnAd{
					{
						Ad:     domain.Ad{Title: "Chair", Category: "Home", Price: 7000, ViewCount: 86},
						IsSold: true,
						SoldAt: &soldAt,
					},
				},
			},
		},
	}

	actionRepo := &mockActionRepo{
		err: errors.New("actions must not be requested"),
	}

	recapRepo := &mockRecapRepo{recaps: make(map[string]domain.Recap)}

	gen := generator.New(userRepo, actionRepo, recapRepo)

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
	if recap.TotalMessages != 1 {
		t.Errorf("expected 1 message, got %d", recap.TotalMessages)
	}
	if recap.TotalPurchases != 1 || recap.TotalSales != 1 {
		t.Fatalf("purchases/sales = %d/%d, want 1/1", recap.TotalPurchases, recap.TotalSales)
	}
	if !recap.Summary.Combined.HasBuyerData || !recap.Summary.Combined.HasSellerData {
		t.Fatalf("combined summary = %#v, want both sides", recap.Summary.Combined)
	}
	if recap.Summary.Headline != "Вы были по обе стороны Авито" {
		t.Fatalf("headline = %q", recap.Summary.Headline)
	}
	buyerCards, sellerCards := 0, 0
	for _, card := range recap.Cards {
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
}

func TestGenerator_Execute_EmptyProfile(t *testing.T) {
	userID := uuid.New()
	year := 2025

	userRepo := &mockUserRepo{
		users: map[uuid.UUID]domain.User{
			userID: {ID: userID, Name: "Test User"},
		},
	}

	actionRepo := &mockActionRepo{
		actions: map[string][]domain.Action{},
	}

	recapRepo := &mockRecapRepo{recaps: make(map[string]domain.Recap)}

	gen := generator.New(userRepo, actionRepo, recapRepo)

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

	actionRepo := &mockActionRepo{actions: make(map[string][]domain.Action)}
	recapRepo := &mockRecapRepo{recaps: make(map[string]domain.Recap)}

	gen := generator.New(userRepo, actionRepo, recapRepo)

	_, err := gen.Execute(context.Background(), generatorAccountID, userID, year)

	if err == nil {
		t.Fatal("expected error, got nil")
	}
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

	actionRepo := &mockActionRepo{actions: map[string][]domain.Action{}}

	recapRepo := &mockRecapRepo{recaps: make(map[string]domain.Recap)}

	gen := generator.New(userRepo, actionRepo, recapRepo)

	recap, err := gen.Execute(context.Background(), generatorAccountID, userID, year)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if recap.TotalViews != 2 {
		t.Errorf("expected 2 views, got %d", recap.TotalViews)
	}
	if recap.TotalMessages != 1 {
		t.Errorf("expected 1 message, got %d", recap.TotalMessages)
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

	actionRepo := &mockActionRepo{actions: map[string][]domain.Action{}}

	recapRepo := &mockRecapRepo{recaps: make(map[string]domain.Recap)}

	gen := generator.New(userRepo, actionRepo, recapRepo)

	recap, err := gen.Execute(context.Background(), generatorAccountID, userID, year)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if len(recap.Achievements) == 0 {
		t.Error("expected achievements, got none")
	}
}
