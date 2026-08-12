package generator

import (
	"math"

	"gooffer/backend/internal/domain"
)

// AssignAchievements awards active definitions whose configured rule matches
// the metrics calculated for the requested recap year.
func AssignAchievements(
	metrics *UserMetrics,
	definitions []domain.AchievementDefinition,
) []domain.Achievement {
	result := make([]domain.Achievement, 0)
	if metrics == nil {
		return result
	}

	for _, definition := range definitions {
		value, ok := achievementMetricValue(definition.Metric, metrics)
		if !definition.IsActive || !ok || !matchesAchievementCondition(
			value,
			definition.ConditionOperator,
			definition.ConditionValue,
		) {
			continue
		}
		result = append(result, domain.Achievement{
			Slug:        definition.Slug,
			Title:       definition.Title,
			Description: definition.Description,
			Icon:        definition.Icon,
			Category:    definition.Category,
		})
	}

	return result
}

func achievementMetricValue(metric domain.CardMetric, metrics *UserMetrics) (float64, bool) {
	switch metric {
	case domain.CardMetricTotalViews:
		return float64(metrics.TotalViews), true
	case domain.CardMetricFavorites:
		return float64(metrics.Favorites), true
	case domain.CardMetricPurchases:
		return float64(metrics.TotalPurchases), true
	case domain.CardMetricSales:
		return float64(metrics.TotalSales), true
	case domain.CardMetricListingViews:
		return float64(metrics.ListingViews), true
	case domain.CardMetricContacts:
		return float64(metrics.Contacts), true
	case domain.CardMetricReviews:
		return float64(metrics.Reviews), true
	case domain.CardMetricActivityDays:
		return float64(metrics.ActivityDays), true
	case domain.CardMetricCategories:
		return float64(metrics.Categories), true
	case domain.CardMetricDeals:
		return float64(metrics.Deals), true
	default:
		return 0, false
	}
}

func matchesAchievementCondition(
	value float64,
	operator domain.CardConditionOperator,
	threshold *float64,
) bool {
	if operator == domain.CardConditionAlways {
		return true
	}
	if threshold == nil {
		return false
	}
	switch operator {
	case domain.CardConditionGT:
		return value > *threshold
	case domain.CardConditionGTE:
		return value >= *threshold
	case domain.CardConditionLT:
		return value < *threshold
	case domain.CardConditionLTE:
		return value <= *threshold
	case domain.CardConditionEQ:
		return math.Abs(value-*threshold) < 1e-9
	default:
		return false
	}
}
