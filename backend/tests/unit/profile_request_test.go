package unit

import (
	"strings"
	"testing"

	"gooffer/backend/internal/delivery/dto"
)

func TestProfileRequestAllowsMoreThanOneHundredActivities(t *testing.T) {
	views := make([]dto.ViewedAdRequest, 101)
	for i := range views {
		views[i] = dto.ViewedAdRequest{
			AdRequest: dto.AdRequest{
				Title:     "Объявление",
				Category:  "Категория",
				Price:     1000,
				ViewCount: 1,
			},
			LastViewedAt: "2026-08-01T12:00",
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
