package unit

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"gooffer/backend/internal/domain"
)

func TestSummarizeProfileCalculatesFrontendAnalytics(t *testing.T) {
	purchasedAt := time.Date(2026, time.March, 12, 14, 10, 0, 0, time.UTC)
	secondPurchaseAt := time.Date(2026, time.May, 4, 16, 45, 0, 0, time.UTC)
	soldAt := time.Date(2026, time.February, 20, 0, 0, 0, 0, time.UTC)
	profile := domain.User{
		ID:           uuid.New(),
		Name:         "Анна",
		RegisteredAt: time.Date(2024, time.January, 1, 0, 0, 0, 0, time.UTC),
		Likes:        148,
		ChatsCount:   43,
		Views: []domain.ViewedAd{
			{Ad: domain.Ad{Title: "Смартфон", Category: "Электроника", Price: 118000, ViewCount: 7}, IsPurchased: true, PurchasedAt: &purchasedAt},
			{Ad: domain.Ad{Title: "Наушники", Category: "Электроника", Price: 12990, ViewCount: 3}, IsPurchased: true, PurchasedAt: &secondPurchaseAt},
			{Ad: domain.Ad{Title: "Книга", Category: "Книги", Price: 500, ViewCount: 2}},
		},
		OwnAds: []domain.OwnAd{
			{
				Ad:     domain.Ad{Title: "Планшет", Category: "Электроника", Price: 28500, ViewCount: 214},
				IsSold: true,
				SoldAt: &soldAt,
				Review: &domain.Review{Rating: 5},
			},
			{Ad: domain.Ad{Title: "Активное объявление", Price: 1000}, IsSold: false},
		},
	}

	summary := domain.SummarizeProfile(&profile)
	if summary.Stats.PurchasesCount != 2 || summary.Stats.SalesCount != 1 {
		t.Fatalf("deal counts = %#v", summary.Stats)
	}
	if summary.Stats.TotalViewCount != 12 || summary.Stats.TotalSpent != 130990 || summary.Stats.TotalEarned != 28500 {
		t.Fatalf("aggregate stats = %#v", summary.Stats)
	}
	if summary.Stats.ReviewsCount != 1 || summary.Stats.AverageRating == nil || *summary.Stats.AverageRating != 5 {
		t.Fatalf("review stats = %#v", summary.Stats)
	}
	if summary.Highlights.FavoriteCategory == nil || *summary.Highlights.FavoriteCategory != "Электроника" {
		t.Fatalf("favorite category = %#v", summary.Highlights.FavoriteCategory)
	}
	if summary.Highlights.MostExpensivePurchase == nil || summary.Highlights.MostExpensivePurchase.Title != "Смартфон" {
		t.Fatalf("most expensive purchase = %#v", summary.Highlights.MostExpensivePurchase)
	}
	if summary.Highlights.LeastExpensivePurchase == nil || summary.Highlights.LeastExpensivePurchase.Title != "Наушники" {
		t.Fatalf("least expensive purchase = %#v", summary.Highlights.LeastExpensivePurchase)
	}
}

func TestSummarizeProfileReturnsNullHighlightsWithoutDeals(t *testing.T) {
	profile := domain.User{ID: uuid.New(), OwnAds: []domain.OwnAd{}, Views: []domain.ViewedAd{}}
	summary := domain.SummarizeProfile(&profile)
	if summary.Stats.AverageRating != nil || summary.Highlights.FavoriteCategory != nil || summary.Highlights.MostExpensivePurchase != nil || summary.Highlights.MostExpensiveSale != nil {
		t.Fatalf("empty summary contains calculated values: %#v", summary)
	}
	if summary.Purchases == nil || summary.Sales == nil {
		t.Fatal("empty deal lists must be JSON arrays, not null")
	}
}
