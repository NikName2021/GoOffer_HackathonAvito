package generator

import (
	"fmt"
	"testing"

	"github.com/google/uuid"
	"gooffer/backend/internal/domain"
)

func TestBuildConfiguredCardsFiltersAndKeepsFrontendContract(t *testing.T) {
	threshold := 2.0
	metrics := ProfileMetrics{
		Buyer: domain.BuyerRecapSummary{TotalViews: 3},
	}
	definitions := []domain.CardDefinition{
		{
			ID:                uuid.New(),
			Name:              "Активность",
			Kind:              domain.CardKindHighlight,
			Metric:            domain.CardMetricTotalViews,
			Analysis:          domain.CardAnalysisTotal,
			ConditionOperator: domain.CardConditionGTE,
			ConditionValue:    &threshold,
			Title:             "Вы активно искали",
			ValueSuffix:       "просмотра",
			Layout:            "hero",
			Theme:             "avito-purple",
			Icon:              "eye",
			Shareable:         true,
		},
	}

	cards := buildConfiguredCards(metrics, definitions)
	if len(cards) != 1 {
		t.Fatalf("cards = %d, want 1", len(cards))
	}
	if cards[0].card.Value != "3 просмотра" {
		t.Fatalf("value = %q, want %q", cards[0].card.Value, "3 просмотра")
	}
	if cards[0].card.Kind != "interest" {
		t.Fatalf("kind = %q, want frontend-compatible interest", cards[0].card.Kind)
	}
	if cards[0].sortOrder != 0 {
		t.Fatalf("sort order = %d, want 0", cards[0].sortOrder)
	}
}

func TestInsertConfiguredCardsPreservesOverviewFinaleAndLimit(t *testing.T) {
	existing := []domain.RecapCard{{ID: "year_overview"}}
	for i := 0; i < 7; i++ {
		existing = append(existing, domain.RecapCard{ID: fmt.Sprintf("built_in_%d", i)})
	}
	existing = append(existing, domain.RecapCard{ID: "next_step"})
	configured := make([]configuredCard, 8)
	for i := range configured {
		configured[i] = configuredCard{
			card:      domain.RecapCard{ID: fmt.Sprintf("custom_%d", i)},
			sortOrder: i + 1,
		}
	}

	result := insertConfiguredCards(existing, configured)
	if len(result) != 9 {
		t.Fatalf("cards = %d, want 9", len(result))
	}
	if result[0].ID != "year_overview" || result[len(result)-1].ID != "next_step" {
		t.Fatalf("mandatory cards were not preserved: first=%q last=%q", result[0].ID, result[len(result)-1].ID)
	}
}

func TestInsertConfiguredCardsUsesSortOrderInWholeDeck(t *testing.T) {
	existing := []domain.RecapCard{
		{ID: "year_overview"},
		{ID: "built_in_1"},
		{ID: "built_in_2"},
		{ID: "built_in_3"},
		{ID: "built_in_4"},
		{ID: "next_step"},
	}
	configured := []configuredCard{
		{card: domain.RecapCard{ID: "custom_last"}, sortOrder: 100},
		{card: domain.RecapCard{ID: "custom_second"}, sortOrder: 2},
	}

	result := insertConfiguredCards(existing, configured)
	want := []string{
		"year_overview",
		"built_in_1",
		"custom_second",
		"built_in_2",
		"built_in_3",
		"built_in_4",
		"custom_last",
		"next_step",
	}
	assertCardOrder(t, result, want)
}

func TestInsertConfiguredCardsKeepsEqualAndReservedPositionsStable(t *testing.T) {
	existing := []domain.RecapCard{
		{ID: "year_overview"},
		{ID: "built_in_1"},
		{ID: "built_in_2"},
		{ID: "next_step"},
	}
	configured := []configuredCard{
		{card: domain.RecapCard{ID: "custom_default"}, sortOrder: 100},
		{card: domain.RecapCard{ID: "custom_zero"}, sortOrder: 0},
		{card: domain.RecapCard{ID: "custom_one"}, sortOrder: 1},
	}

	result := insertConfiguredCards(existing, configured)
	want := []string{
		"year_overview",
		"custom_zero",
		"custom_one",
		"built_in_1",
		"built_in_2",
		"custom_default",
		"next_step",
	}
	assertCardOrder(t, result, want)
}

func assertCardOrder(t *testing.T, cards []domain.RecapCard, want []string) {
	t.Helper()
	if len(cards) != len(want) {
		t.Fatalf("cards = %d, want %d: %#v", len(cards), len(want), cards)
	}
	for i := range cards {
		if cards[i].ID != want[i] {
			t.Fatalf("card %d = %q, want %q", i, cards[i].ID, want[i])
		}
	}
}
