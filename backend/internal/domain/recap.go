package domain

import (
	"time"

	"github.com/google/uuid"
)

type CategoryStat struct {
	Category string `json:"category"`
	Count    int    `json:"count"`
}

type Recommendation struct {
	Code        string `json:"code"`
	Title       string `json:"title"`
	Description string `json:"description"`
	ActionLabel string `json:"action_label"`
	Category    string `json:"category,omitempty"`
}

// Story — персональная «история года» без чувствительных данных.
type Story struct {
	Persona  string   `json:"persona"`  // seller | buyer | mixed | explorer | newbie
	Headline string   `json:"headline"` // яркий заголовок
	Summary  string   `json:"summary"`  // 2–4 предложения
	Insights []string `json:"insights"` // выводы «почему такой recap»
}

type Recap struct {
	ID              uuid.UUID
	UserID          uuid.UUID
	Year            int
	TotalViews      int
	TotalMessages   int
	TotalFavorites  int
	TotalPurchases  int
	TotalSales      int
	TopCategories   []CategoryStat
	Achievements    []Achievement
	Recommendations []Recommendation
	Story           Story
	ActivityDays    int
	GeneratedAt     time.Time
}
