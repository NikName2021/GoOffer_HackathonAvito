package unit

import (
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
	if len(share.Cards) != 1 || share.Cards[0].ID != "activity_rhythm" {
		t.Fatalf("share cards = %#v, want only activity_rhythm", share.Cards)
	}
}

func TestRecapResponseUsesEmptyCardsArray(t *testing.T) {
	response := dto.ToRecapResponse(&domain.Recap{})
	if response.Cards == nil {
		t.Fatal("cards must be an empty array, not nil")
	}
}
