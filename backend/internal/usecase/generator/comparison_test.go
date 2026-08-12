package generator

import (
	"math"
	"testing"

	"gooffer/backend/internal/domain"
)

func TestBuildRecapComparisonAndForecast(t *testing.T) {
	previous := ProfileMetrics{
		Year:           2025,
		ActivityDays:   5,
		Spending:       10_000,
		SalesRevenue:   5_000,
		InterestScores: map[string]int{"Электроника": 4, "Книги": 8},
	}
	current := ProfileMetrics{
		Year:           2026,
		ActivityDays:   8,
		Spending:       15_000,
		SalesRevenue:   3_000,
		InterestScores: map[string]int{"Электроника": 8, "Транспорт": 9},
	}

	comparison := buildRecapComparison(previous, current)
	if comparison.Status != domain.RecapComparisonAvailable {
		t.Fatalf("comparison status = %q", comparison.Status)
	}
	if comparison.PreviousYear != 2025 || comparison.CurrentYear != 2026 {
		t.Fatalf("comparison years = %d/%d", comparison.PreviousYear, comparison.CurrentYear)
	}
	if comparison.Spending.AbsoluteChange != 5_000 || comparison.Spending.PercentChange == nil ||
		*comparison.Spending.PercentChange != 50 {
		t.Fatalf("spending comparison = %#v", comparison.Spending)
	}
	if comparison.SalesRevenue.AbsoluteChange != -2_000 || comparison.SalesRevenue.PercentChange == nil ||
		*comparison.SalesRevenue.PercentChange != -40 {
		t.Fatalf("sales comparison = %#v", comparison.SalesRevenue)
	}
	if len(comparison.Categories) != 3 || comparison.Categories[0].Category != "Транспорт" ||
		!comparison.Categories[0].IsNew {
		t.Fatalf("category comparison = %#v", comparison.Categories)
	}
	if len(comparison.NewInterests) != 1 || comparison.NewInterests[0] != "Транспорт" {
		t.Fatalf("new interests = %#v", comparison.NewInterests)
	}

	forecast := buildRecapForecast(previous, current, comparison.Status)
	if forecast.Year != 2027 || forecast.Method != domain.RecapForecastLinearYearOverYear {
		t.Fatalf("forecast year/method = %d/%q", forecast.Year, forecast.Method)
	}
	if forecast.Spending != (domain.RecapAmountForecast{Expected: 20_000, Min: 15_000, Max: 25_000}) {
		t.Fatalf("spending forecast = %#v", forecast.Spending)
	}
	if forecast.SalesRevenue != (domain.RecapAmountForecast{Expected: 1_000, Min: 0, Max: 3_000}) {
		t.Fatalf("sales forecast = %#v", forecast.SalesRevenue)
	}
	if len(forecast.LikelyCategories) != 2 || forecast.LikelyCategories[0].Category != "Транспорт" ||
		forecast.LikelyCategories[0].ExpectedScore != 18 {
		t.Fatalf("category forecast = %#v", forecast.LikelyCategories)
	}
}

func TestBuildRecapComparisonFirstYear(t *testing.T) {
	previous := ProfileMetrics{Year: 2025, InterestScores: map[string]int{}}
	current := ProfileMetrics{
		Year:           2026,
		ActivityDays:   2,
		Spending:       900,
		SalesRevenue:   100,
		InterestScores: map[string]int{"Хобби": 4},
	}

	comparison := buildRecapComparison(previous, current)
	if comparison.Status != domain.RecapComparisonFirstYear || comparison.Message != "Это ваши первые итоги года" {
		t.Fatalf("first-year comparison = %#v", comparison)
	}
	if comparison.Spending.PercentChange != nil {
		t.Fatalf("first-year percent change = %v, want nil", *comparison.Spending.PercentChange)
	}
	if len(comparison.NewInterests) != 0 || comparison.Categories[0].IsNew {
		t.Fatalf("first-year interests = %#v/%#v", comparison.NewInterests, comparison.Categories)
	}

	forecast := buildRecapForecast(previous, current, comparison.Status)
	if forecast.Method != domain.RecapForecastCurrentBaseline {
		t.Fatalf("forecast method = %q", forecast.Method)
	}
	if forecast.Spending != (domain.RecapAmountForecast{Expected: 900, Min: 720, Max: 1080}) {
		t.Fatalf("first-year forecast = %#v", forecast.Spending)
	}
}

func TestAmountForecastSaturatesOverflow(t *testing.T) {
	forecast := amountForecast(0, math.MaxInt64, domain.RecapForecastLinearYearOverYear)
	if forecast.Expected != math.MaxInt64 || forecast.Max != math.MaxInt64 || forecast.Min != 0 {
		t.Fatalf("saturated forecast = %#v", forecast)
	}
}
