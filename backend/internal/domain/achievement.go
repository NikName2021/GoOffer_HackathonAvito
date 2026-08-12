package domain

import "time"

type Achievement struct {
	Slug        string
	Title       string
	Description string
	Icon        string
	Category    string
}

// AchievementDefinition is the administrator-managed rule used to award an
// achievement during a future recap generation. Slug, Category and SortOrder
// identify the built-in achievement and are intentionally read-only in admin
// requests.
type AchievementDefinition struct {
	Slug              string                `json:"slug"`
	Title             string                `json:"title"`
	Description       string                `json:"description"`
	Icon              string                `json:"icon"`
	Category          string                `json:"category"`
	Metric            CardMetric            `json:"metric"`
	ConditionOperator CardConditionOperator `json:"condition_operator"`
	ConditionValue    *float64              `json:"condition_value"`
	SortOrder         int                   `json:"sort_order"`
	IsActive          bool                  `json:"is_active"`
	UpdatedAt         time.Time             `json:"updated_at"`
}
