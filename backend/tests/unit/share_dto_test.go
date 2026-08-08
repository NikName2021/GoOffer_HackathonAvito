package unit

import (
	"encoding/json"
	"strings"
	"testing"
	"time"

	"gooffer/backend/internal/delivery/dto"
	"gooffer/backend/internal/domain"

	"github.com/google/uuid"
)

func TestToShareRecapResponse_NoPrivateIDs(t *testing.T) {
	recap := &domain.Recap{
		ID:             uuid.MustParse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
		UserID:         uuid.MustParse("11111111-1111-1111-1111-111111111111"),
		Year:           2025,
		TotalViews:     100,
		TotalMessages:  10,
		TotalFavorites: 5,
		TotalPurchases: 2,
		TotalSales:     3,
		ActivityDays:   40,
		TopCategories: []domain.CategoryStat{
			{Category: "Электроника", Count: 50},
		},
		Achievements: []domain.Achievement{
			{Slug: "curious", Title: "Любопытный", Description: "d", Icon: "👀", Category: "views"},
		},
		Recommendations: []domain.Recommendation{
			{Code: "post_listing", Title: "t", Description: "d", ActionLabel: "Подать"},
		},
		Story: domain.Story{
			Persona:  "seller",
			Headline: "Год продавца",
			Summary:  "summary",
			Insights: []string{"i1"},
		},
		GeneratedAt: time.Date(2026, 8, 8, 12, 0, 0, 0, time.UTC),
	}

	share := dto.ToShareRecapResponse(recap)
	raw, err := json.Marshal(share)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	body := string(raw)

	if strings.Contains(body, `"id"`) {
		t.Fatalf("share JSON must not contain id: %s", body)
	}
	if strings.Contains(body, `"user_id"`) {
		t.Fatalf("share JSON must not contain user_id: %s", body)
	}
	if share.Year != 2025 || share.TotalViews != 100 {
		t.Fatalf("unexpected share payload: %+v", share)
	}
	if share.Story.Headline != "Год продавца" {
		t.Fatalf("story lost: %+v", share.Story)
	}
}

func TestToRecapResponse_KeepsIDs(t *testing.T) {
	id := uuid.MustParse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee")
	uid := uuid.MustParse("11111111-1111-1111-1111-111111111111")
	recap := &domain.Recap{
		ID:          id,
		UserID:      uid,
		Year:        2025,
		GeneratedAt: time.Now().UTC(),
		Story:       domain.Story{Persona: "mixed", Headline: "h", Summary: "s"},
	}
	full := dto.ToRecapResponse(recap)
	if full.ID != id || full.UserID != uid {
		t.Fatalf("full response must keep ids: %+v", full)
	}
}
