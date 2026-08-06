package unit

import (
	"fmt"
	"strings"
	"testing"

	"gooffer/backend/internal/delivery/dto"
)

func TestProfileRequestAllowsMoreThanOneHundredActivities(t *testing.T) {
	views := make([]dto.ViewedAdRequest, 101)
	for i := range views {
		views[i] = dto.ViewedAdRequest{
			AdRequest: dto.AdRequest{
				AdID:      fmt.Sprintf("view-%d", i),
				Title:     "Объявление",
				Category:  "Категория",
				Price:     1000,
				ViewCount: 1,
			},
			ViewedAt: []dto.ViewedAdEventRequest{{Type: "watch", Time: "2026-08-01T12:00"}},
		}
	}

	request := dto.ProfileRequest{
		Name:     "Профиль с большой историей",
		JoinedAt: "2020-01-01",
		Views:    views,
		OwnAds:   []dto.OwnAdRequest{},
	}
	profile, err := request.ToDomain()
	if err != nil {
		t.Fatalf("ToDomain() error = %v, want nil", err)
	}
	if len(profile.Views) != len(views) {
		t.Fatalf("profile has %d views, want %d", len(profile.Views), len(views))
	}
}

func TestProfileRequestParsesAdEventsAndListingFields(t *testing.T) {
	usedDelivery := true
	request := dto.ProfileRequest{
		Name:     "Новый контракт",
		JoinedAt: "2020-01-01",
		Views: []dto.ViewedAdRequest{
			{
				AdRequest: dto.AdRequest{AdID: "view-1", Title: "Телефон", Category: "Электроника", Price: 1000},
				ViewedAt: []dto.ViewedAdEventRequest{
					{Type: "buy", Time: "2026-03-03T12:00", UseAvitoDelivery: &usedDelivery},
					{Type: "watch", Time: "2026-03-01T12:00"},
					{Type: "like", Time: "2026-03-02T12:00"},
				},
			},
		},
		OwnAds: []dto.OwnAdRequest{
			{
				AdRequest:      dto.AdRequest{AdID: "own-1", Title: "Кресло", Category: "Дом", Price: 5000},
				PublishedAt:    "2026-02-01",
				FavoritesCount: 12,
				ContactsCount:  4,
				City:           "Москва",
			},
		},
	}

	profile, err := request.ToDomain()
	if err != nil {
		t.Fatalf("ToDomain() error = %v", err)
	}
	view := profile.Views[0]
	if view.AdID != "view-1" || len(view.ViewedAt) != 3 || !view.IsFavorite || !view.IsPurchased {
		t.Fatalf("view = %#v, want parsed event history", view)
	}
	if view.ViewedAt[0].Type != "watch" || view.LastViewedAt.Format("2006-01-02") != "2026-03-01" {
		t.Fatalf("events were not sorted/derived: %#v", view.ViewedAt)
	}
	if view.ViewedAt[2].UseAvitoDelivery == nil || !*view.ViewedAt[2].UseAvitoDelivery {
		t.Fatalf("buy delivery flag = %#v, want true", view.ViewedAt[2].UseAvitoDelivery)
	}
	listing := profile.OwnAds[0]
	if listing.AdID != "own-1" || listing.FavoritesCount != 12 || listing.ContactsCount != 4 || listing.City != "Москва" {
		t.Fatalf("listing = %#v, want new fields", listing)
	}
}

func TestProfileRequestRequiresDeliveryFlagForBuy(t *testing.T) {
	request := dto.ProfileRequest{
		Name:     "Некорректная покупка",
		JoinedAt: "2020-01-01",
		Views: []dto.ViewedAdRequest{
			{
				AdRequest: dto.AdRequest{AdID: "view-1", Title: "Телефон", Category: "Электроника"},
				ViewedAt: []dto.ViewedAdEventRequest{
					{Type: "watch", Time: "2026-03-01T12:00"},
					{Type: "buy", Time: "2026-03-03T12:00"},
				},
			},
		},
		OwnAds: []dto.OwnAdRequest{},
	}

	_, err := request.ToDomain()
	if err == nil || !strings.Contains(err.Error(), "useAvitoDelivery is required for buy") {
		t.Fatalf("ToDomain() error = %v, want delivery validation error", err)
	}
}

func TestProfileRequestRejectsExcessiveActivityHistory(t *testing.T) {
	request := dto.ProfileRequest{
		Name:     "Слишком большой профиль",
		JoinedAt: "2020-01-01",
		Views:    make([]dto.ViewedAdRequest, 10_001),
		OwnAds:   []dto.OwnAdRequest{},
	}

	_, err := request.ToDomain()
	if err == nil || !strings.Contains(err.Error(), "no more than 10000 items") {
		t.Fatalf("ToDomain() error = %v, want activity limit error", err)
	}
}
