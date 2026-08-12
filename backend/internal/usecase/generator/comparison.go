package generator

import (
	"math"
	"sort"

	"gooffer/backend/internal/domain"
)

const (
	firstYearMessage      = "Это ваши первые итоги года"
	newInterestLimit      = 3
	forecastCategoryLimit = 3
)

func buildRecapComparison(previous, current ProfileMetrics) domain.RecapComparison {
	status := domain.RecapComparisonAvailable
	message := "Сравнение итогов за два года"
	firstYear := previous.ActivityDays == 0
	if firstYear {
		status = domain.RecapComparisonFirstYear
		message = firstYearMessage
	}

	categories := buildCategoryComparison(previous.InterestScores, current.InterestScores, !firstYear)
	newInterests := make([]string, 0, newInterestLimit)
	if !firstYear {
		for _, category := range categories {
			if category.IsNew && len(newInterests) < newInterestLimit {
				newInterests = append(newInterests, category.Category)
			}
		}
	}

	return domain.RecapComparison{
		Status:       status,
		Message:      message,
		PreviousYear: previous.Year,
		CurrentYear:  current.Year,
		Spending:     amountComparison(previous.Spending, current.Spending),
		SalesRevenue: amountComparison(previous.SalesRevenue, current.SalesRevenue),
		Categories:   categories,
		NewInterests: newInterests,
	}
}

func amountComparison(previous, current int64) domain.RecapAmountComparison {
	return domain.RecapAmountComparison{
		Previous:       previous,
		Current:        current,
		AbsoluteChange: current - previous,
		PercentChange:  percentChange(previous, current),
	}
}

func buildCategoryComparison(previous, current map[string]int, markNew bool) []domain.RecapCategoryComparison {
	names := make(map[string]struct{}, len(previous)+len(current))
	for name := range previous {
		names[name] = struct{}{}
	}
	for name := range current {
		names[name] = struct{}{}
	}

	result := make([]domain.RecapCategoryComparison, 0, len(names))
	for name := range names {
		previousScore := previous[name]
		currentScore := current[name]
		result = append(result, domain.RecapCategoryComparison{
			Category:       name,
			PreviousScore:  previousScore,
			CurrentScore:   currentScore,
			AbsoluteChange: currentScore - previousScore,
			PercentChange:  percentChange(int64(previousScore), int64(currentScore)),
			IsNew:          markNew && previousScore == 0 && currentScore > 0,
		})
	}

	sort.Slice(result, func(i, j int) bool {
		if result[i].CurrentScore != result[j].CurrentScore {
			return result[i].CurrentScore > result[j].CurrentScore
		}
		if result[i].PreviousScore != result[j].PreviousScore {
			return result[i].PreviousScore > result[j].PreviousScore
		}
		return result[i].Category < result[j].Category
	})
	return result
}

func percentChange(previous, current int64) *float64 {
	if previous == 0 {
		if current == 0 {
			zero := 0.0
			return &zero
		}
		return nil
	}
	change := math.Round((float64(current-previous)/float64(previous))*1000) / 10
	return &change
}

func buildRecapForecast(
	previous ProfileMetrics,
	current ProfileMetrics,
	status domain.RecapComparisonStatus,
) domain.RecapForecast {
	method := domain.RecapForecastLinearYearOverYear
	if status == domain.RecapComparisonFirstYear {
		method = domain.RecapForecastCurrentBaseline
	}

	return domain.RecapForecast{
		Year:             current.Year + 1,
		Method:           method,
		Spending:         amountForecast(previous.Spending, current.Spending, method),
		SalesRevenue:     amountForecast(previous.SalesRevenue, current.SalesRevenue, method),
		LikelyCategories: categoryForecast(previous.InterestScores, current.InterestScores, method),
	}
}

func amountForecast(previous, current int64, method domain.RecapForecastMethod) domain.RecapAmountForecast {
	if method == domain.RecapForecastCurrentBaseline {
		uncertainty := amountPercent(current, 20)
		return forecastRange(current, uncertainty)
	}

	delta := current - previous
	expected := addSignedAmount(current, delta)
	uncertainty := absoluteAmount(delta)
	if minimum := amountPercent(current, 10); uncertainty < minimum {
		uncertainty = minimum
	}
	return forecastRange(expected, uncertainty)
}

func forecastRange(expected, uncertainty int64) domain.RecapAmountForecast {
	minimum := expected - uncertainty
	if minimum < 0 {
		minimum = 0
	}
	return domain.RecapAmountForecast{
		Expected: expected,
		Min:      minimum,
		Max:      saturatingAmountAdd(expected, uncertainty),
	}
}

func addSignedAmount(value, delta int64) int64 {
	if delta >= 0 {
		return saturatingAmountAdd(value, delta)
	}
	if delta < -value {
		return 0
	}
	return value + delta
}

func absoluteAmount(value int64) int64 {
	if value < 0 {
		return -value
	}
	return value
}

func amountPercent(value int64, percent int64) int64 {
	return (value/100)*percent + ((value%100)*percent)/100
}

func categoryForecast(
	previous map[string]int,
	current map[string]int,
	method domain.RecapForecastMethod,
) []domain.RecapForecastCategory {
	names := make(map[string]struct{}, len(previous)+len(current))
	for name := range previous {
		names[name] = struct{}{}
	}
	for name := range current {
		names[name] = struct{}{}
	}

	result := make([]domain.RecapForecastCategory, 0, len(names))
	for name := range names {
		expected := current[name]
		if method == domain.RecapForecastLinearYearOverYear {
			expected = max(0, current[name]+current[name]-previous[name])
		}
		if expected > 0 {
			result = append(result, domain.RecapForecastCategory{
				Category:      name,
				ExpectedScore: expected,
			})
		}
	}

	sort.Slice(result, func(i, j int) bool {
		if result[i].ExpectedScore != result[j].ExpectedScore {
			return result[i].ExpectedScore > result[j].ExpectedScore
		}
		return result[i].Category < result[j].Category
	})
	if len(result) > forecastCategoryLimit {
		result = result[:forecastCategoryLimit]
	}
	return result
}
