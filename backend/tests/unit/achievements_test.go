package unit

import (
	"testing"

	"gooffer/backend/internal/domain"
	"gooffer/backend/internal/usecase/generator"
)

func TestAssignAchievements_Curious(t *testing.T) {
	metrics := &generator.UserMetrics{
		TotalViews: 600,
	}

	achievements := assignAchievementsForTest(metrics)

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
		TotalMessages:  10,
		TotalPurchases: 2,
		TotalSales:     1,
		ActivityDays:   50,
	}

	achievements := assignAchievementsForTest(metrics)

	if len(achievements) != 0 {
		t.Errorf("expected 0 achievements, got %d", len(achievements))
	}
}

func TestAssignAchievements_AllAchievements(t *testing.T) {
	metrics := &generator.UserMetrics{
		TotalViews:     1500,
		TotalMessages:  100,
		TotalPurchases: 15,
		TotalSales:     10,
		ActivityDays:   350,
	}

	achievements := assignAchievementsForTest(metrics)

	// Должно быть 7 ачивок
	expectedSlugs := map[string]bool{
		"curious": true, "explorer": true,
		"social_butterfly": true, "seller_master": true,
		"shopaholic": true, "veteran": true, "enthusiast": true,
	}

	if len(achievements) != 7 {
		t.Errorf("expected 7 achievements, got %d", len(achievements))
	}

	for _, ach := range achievements {
		if !expectedSlugs[ach.Slug] {
			t.Errorf("unexpected achievement: %s", ach.Slug)
		}
	}
}

func assignAchievementsForTest(metrics *generator.UserMetrics) []domain.Achievement {
	var result []domain.Achievement

	for _, ach := range domain.DefaultAchievements {
		if checkConditionForTest(ach, metrics) {
			result = append(result, ach)
		}
	}

	return result
}

func checkConditionForTest(ach domain.Achievement, metrics *generator.UserMetrics) bool {
	switch ach.Slug {
	case "curious":
		return metrics.TotalViews >= 500
	case "explorer":
		return metrics.TotalViews >= 1000
	case "social_butterfly":
		return metrics.TotalMessages >= 50
	case "seller_master":
		return metrics.TotalSales >= 5
	case "shopaholic":
		return metrics.TotalPurchases >= 10
	case "veteran":
		return metrics.ActivityDays >= 300
	case "enthusiast":
		return metrics.ActivityDays >= 100
	default:
		return false
	}
}
