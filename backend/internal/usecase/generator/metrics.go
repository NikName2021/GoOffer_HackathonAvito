package generator

import (
	"sort"

	"gooffer/backend/internal/domain"
)

type UserMetrics struct {
	TotalViews     int
	TotalMessages  int
	TotalFavorites int
	TotalPurchases int
	TotalSales     int
	TopCategories  []domain.CategoryStat
	ActivityDays   int
}

func calculateMetrics(actions []domain.Action) *UserMetrics {
	metrics := &UserMetrics{
		TopCategories: []domain.CategoryStat{},
	}

	categoryMap := make(map[string]int)
	activeDays := make(map[string]struct{})

	for _, action := range actions {
		switch action.Type {
		case domain.ActionView:
			metrics.TotalViews++
		case domain.ActionMessage:
			metrics.TotalMessages++
		case domain.ActionFavorite:
			metrics.TotalFavorites++
		case domain.ActionPurchase:
			metrics.TotalPurchases++
		case domain.ActionSale:
			metrics.TotalSales++
		}

		if action.Category != "" {
			categoryMap[action.Category]++
		}

		day := action.CreatedAt.UTC().Format("2006-01-02")
		activeDays[day] = struct{}{}
	}

	// Топ-3 категории
	type catCount struct {
		name  string
		count int
	}
	var cats []catCount
	for name, count := range categoryMap {
		cats = append(cats, catCount{name, count})
	}
	sort.Slice(cats, func(i, j int) bool {
		if cats[i].count == cats[j].count {
			return cats[i].name < cats[j].name
		}
		return cats[i].count > cats[j].count
	})

	limit := 3
	if len(cats) < limit {
		limit = len(cats)
	}
	for i := 0; i < limit; i++ {
		metrics.TopCategories = append(metrics.TopCategories, domain.CategoryStat{
			Category: cats[i].name,
			Count:    cats[i].count,
		})
	}

	metrics.ActivityDays = len(activeDays)
	return metrics
}
