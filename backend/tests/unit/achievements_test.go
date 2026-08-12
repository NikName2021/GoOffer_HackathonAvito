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

	achievements := generator.AssignAchievements(metrics, defaultAchievementDefinitions())

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

	achievements := generator.AssignAchievements(metrics, defaultAchievementDefinitions())

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

	achievements := generator.AssignAchievements(metrics, defaultAchievementDefinitions())

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

func TestAssignAchievements_UsesEditedRuleAndSkipsInactive(t *testing.T) {
	definitions := defaultAchievementDefinitions()
	definitions[0].Metric = domain.CardMetricPurchases
	definitions[0].ConditionValue = achievementThreshold(2)
	definitions[0].Title = "Новый заголовок"
	definitions[1].IsActive = false

	achievements := generator.AssignAchievements(&generator.UserMetrics{
		TotalViews:     2000,
		TotalPurchases: 2,
	}, definitions)

	if len(achievements) != 1 {
		t.Fatalf("achievements = %#v, want only edited curious rule", achievements)
	}
	if achievements[0].Slug != "curious" || achievements[0].Title != "Новый заголовок" {
		t.Fatalf("achievement = %#v, want edited definition", achievements[0])
	}
}

func TestAssignAchievements_SupportsEveryCondition(t *testing.T) {
	tests := []struct {
		name      string
		operator  domain.CardConditionOperator
		threshold *float64
		views     int
		want      bool
	}{
		{name: "always", operator: domain.CardConditionAlways, views: 0, want: true},
		{name: "greater", operator: domain.CardConditionGT, threshold: achievementThreshold(10), views: 11, want: true},
		{name: "greater rejects equality", operator: domain.CardConditionGT, threshold: achievementThreshold(10), views: 10},
		{name: "greater or equal", operator: domain.CardConditionGTE, threshold: achievementThreshold(10), views: 10, want: true},
		{name: "less", operator: domain.CardConditionLT, threshold: achievementThreshold(10), views: 9, want: true},
		{name: "less or equal", operator: domain.CardConditionLTE, threshold: achievementThreshold(10), views: 10, want: true},
		{name: "equal", operator: domain.CardConditionEQ, threshold: achievementThreshold(10), views: 10, want: true},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			definitions := []domain.AchievementDefinition{{
				Slug:              "test",
				Title:             "Test",
				Metric:            domain.CardMetricTotalViews,
				ConditionOperator: test.operator,
				ConditionValue:    test.threshold,
				IsActive:          true,
			}}
			achievements := generator.AssignAchievements(
				&generator.UserMetrics{TotalViews: test.views},
				definitions,
			)
			if (len(achievements) == 1) != test.want {
				t.Fatalf("achievements = %#v, want match %t", achievements, test.want)
			}
		})
	}
}

func TestAssignAchievements_SupportsEveryConfiguredMetric(t *testing.T) {
	metrics := &generator.UserMetrics{
		TotalViews:     1,
		Favorites:      1,
		TotalPurchases: 1,
		TotalSales:     1,
		ListingViews:   1,
		Contacts:       1,
		Reviews:        1,
		ActivityDays:   1,
		Categories:     1,
		Deals:          1,
	}
	configuredMetrics := []domain.CardMetric{
		domain.CardMetricTotalViews,
		domain.CardMetricFavorites,
		domain.CardMetricPurchases,
		domain.CardMetricSales,
		domain.CardMetricListingViews,
		domain.CardMetricContacts,
		domain.CardMetricReviews,
		domain.CardMetricActivityDays,
		domain.CardMetricCategories,
		domain.CardMetricDeals,
	}
	definitions := make([]domain.AchievementDefinition, 0, len(configuredMetrics))
	for _, metric := range configuredMetrics {
		definitions = append(definitions, domain.AchievementDefinition{
			Slug:              string(metric),
			Title:             string(metric),
			Metric:            metric,
			ConditionOperator: domain.CardConditionGTE,
			ConditionValue:    achievementThreshold(1),
			IsActive:          true,
		})
	}

	achievements := generator.AssignAchievements(metrics, definitions)
	if len(achievements) != len(configuredMetrics) {
		t.Fatalf("achievements = %d, want %d configured metrics", len(achievements), len(configuredMetrics))
	}
}

func defaultAchievementDefinitions() []domain.AchievementDefinition {
	return []domain.AchievementDefinition{
		{Slug: "curious", Title: "Любопытный", Description: "500 просмотров", Icon: "👀", Category: "views", Metric: domain.CardMetricTotalViews, ConditionOperator: domain.CardConditionGTE, ConditionValue: achievementThreshold(500), IsActive: true},
		{Slug: "explorer", Title: "Исследователь", Description: "1000 просмотров", Icon: "🔍", Category: "views", Metric: domain.CardMetricTotalViews, ConditionOperator: domain.CardConditionGTE, ConditionValue: achievementThreshold(1000), IsActive: true},
		{Slug: "seller_master", Title: "Мастер продаж", Description: "5 продаж", Icon: "🏆", Category: "sales", Metric: domain.CardMetricSales, ConditionOperator: domain.CardConditionGTE, ConditionValue: achievementThreshold(5), IsActive: true},
		{Slug: "shopaholic", Title: "Шопоголик", Description: "10 покупок", Icon: "🛍️", Category: "sales", Metric: domain.CardMetricPurchases, ConditionOperator: domain.CardConditionGTE, ConditionValue: achievementThreshold(10), IsActive: true},
		{Slug: "veteran", Title: "Ветеран", Description: "300 дней", Icon: "⭐", Category: "activity", Metric: domain.CardMetricActivityDays, ConditionOperator: domain.CardConditionGTE, ConditionValue: achievementThreshold(300), IsActive: true},
		{Slug: "enthusiast", Title: "Энтузиаст", Description: "100 дней", Icon: "🔥", Category: "activity", Metric: domain.CardMetricActivityDays, ConditionOperator: domain.CardConditionGTE, ConditionValue: achievementThreshold(100), IsActive: true},
	}
}

func achievementThreshold(value float64) *float64 {
	return &value
}
