package unit

import (
	"testing"

	"gooffer/backend/internal/usecase/generator"
)

func TestAssignAchievements_Curious(t *testing.T) {
	metrics := &generator.UserMetrics{
		TotalViews: 600,
	}

	achievements := generator.AssignAchievements(metrics)

	if len(achievements) == 0 {
		t.Error("expected curious achievement, got none")
	}

	found := false
	for _, ach := range achievements {
		if ach.Slug == "curious" {
			found = true
			break
		}
	}
	if !found {
		t.Error("curious achievement not found")
	}
}

func TestAssignAchievements_NoAchievements(t *testing.T) {
	metrics := &generator.UserMetrics{
		TotalViews:     100,
		TotalPurchases: 2,
		TotalSales:     1,
		ActivityDays:   50,
	}

	achievements := generator.AssignAchievements(metrics)

	if len(achievements) != 0 {
		t.Errorf("expected 0 achievements, got %d", len(achievements))
	}
}

func TestAssignAchievements_AllAchievements(t *testing.T) {
	metrics := &generator.UserMetrics{
		TotalViews:     1500,
		TotalPurchases: 15,
		TotalSales:     10,
		ActivityDays:   350,
	}

	achievements := generator.AssignAchievements(metrics)

	expectedSlugs := map[string]struct{}{
		"curious":       {},
		"explorer":      {},
		"seller_master": {},
		"shopaholic":    {},
		"veteran":       {},
		"enthusiast":    {},
	}

	if len(achievements) != 6 {
		t.Errorf("expected 6 achievements, got %d", len(achievements))
	}

	for _, ach := range achievements {
		if _, ok := expectedSlugs[ach.Slug]; !ok {
			t.Errorf("unexpected achievement: %s", ach.Slug)
		}
	}
}
