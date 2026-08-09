package unit

import (
	"encoding/json"
	"testing"

	"gooffer/backend/internal/delivery/dto"
	"gooffer/backend/internal/domain"
)

func TestShareRecapContainsOnlyShareableCards(t *testing.T) {
	recap := &domain.Recap{
		Cards: []domain.RecapCard{
			{ID: "activity_rhythm", Kind: "chart", Shareable: true},
			{ID: "private_purchase", Kind: "purchase", Shareable: false},
		},
	}

	full := dto.ToRecapResponse(recap)
	if len(full.Cards) != 2 {
		t.Fatalf("full cards = %d, want 2", len(full.Cards))
	}

	share := dto.ToShareRecapResponse(recap)
	if len(share.Cards) != 1 || share.Cards[0].Kind != "chart" {
		t.Fatalf("share cards = %#v, want only activity_rhythm", share.Cards)
	}
}

func TestShareRecapCardUsesStrictAllowlist(t *testing.T) {
	recap := &domain.Recap{Cards: []domain.RecapCard{
		{
			ID:          "star_listing",
			Kind:        "seller",
			Eyebrow:     "Объявление-звезда",
			Title:       "Продам гараж, звонить +7 000 000-00-00",
			Description: "Самое просматриваемое объявление.",
			Value:       "42 просмотра",
			ImageURL:    "https://private.example/listing.jpg",
			Shareable:   true,
			Reason:      "internal diagnostic reason",
			Presentation: domain.RecapCardPresentation{
				Layout: "product",
				Theme:  "avito-purple",
				Icon:   "star",
			},
			Visualization: &domain.RecapVisualization{Version: 1, Type: "bar"},
			CTA: &domain.RecapCardCTA{
				Label:  "Открыть",
				Action: "open_own_listing",
				Params: map[string]string{"ad_id": "internal-ad-id"},
			},
		},
	}}

	encoded, err := json.Marshal(dto.ToShareRecapResponse(recap))
	if err != nil {
		t.Fatalf("marshal share response: %v", err)
	}
	var payload any
	if err := json.Unmarshal(encoded, &payload); err != nil {
		t.Fatalf("decode share response: %v", err)
	}
	assertNoForbiddenJSONFields(t, payload)

	share := dto.ToShareRecapResponse(recap)
	if got := share.Cards[0].Title; got != "Ваше объявление стало звездой" {
		t.Fatalf("share title = %q, want neutral listing title", got)
	}
}

func assertNoForbiddenJSONFields(t *testing.T, value any) {
	t.Helper()
	forbidden := map[string]struct{}{
		"id": {}, "user_id": {}, "ad_id": {}, "image_url": {},
		"shareable": {}, "reason": {}, "visualization": {}, "cta": {}, "params": {},
	}
	var visit func(any)
	visit = func(current any) {
		switch typed := current.(type) {
		case map[string]any:
			for key, nested := range typed {
				if _, blocked := forbidden[key]; blocked {
					t.Errorf("share JSON contains forbidden field %q", key)
				}
				visit(nested)
			}
		case []any:
			for _, nested := range typed {
				visit(nested)
			}
		}
	}
	visit(value)
}

func TestRecapResponseUsesEmptyCardsArray(t *testing.T) {
	response := dto.ToRecapResponse(&domain.Recap{})
	if response.Cards == nil {
		t.Fatal("cards must be an empty array, not nil")
	}
}
