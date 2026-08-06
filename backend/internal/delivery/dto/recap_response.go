package dto

import (
	"time"

	"gooffer/backend/internal/domain"

	"github.com/google/uuid"
)

type CategoryStatDTO struct {
	Category string `json:"category"`
	Count    int    `json:"count"`
}

type AchievementDTO struct {
	Slug        string `json:"slug"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
	Category    string `json:"category"`
}

type RecommendationDTO struct {
	Code        string `json:"code"`
	Title       string `json:"title"`
	Description string `json:"description"`
	ActionLabel string `json:"action_label"`
	Category    string `json:"category,omitempty"`
}

type StoryDTO struct {
	Persona  string   `json:"persona"`
	Headline string   `json:"headline"`
	Summary  string   `json:"summary"`
	Insights []string `json:"insights"`
}

type RecapResponse struct {
	ID              uuid.UUID           `json:"id"`
	UserID          uuid.UUID           `json:"user_id"`
	Year            int                 `json:"year"`
	TotalViews      int                 `json:"total_views"`
	TotalMessages   int                 `json:"total_messages"`
	TotalFavorites  int                 `json:"total_favorites"`
	TotalPurchases  int                 `json:"total_purchases"`
	TotalSales      int                 `json:"total_sales"`
	TopCategories   []CategoryStatDTO   `json:"top_categories"`
	Achievements    []AchievementDTO    `json:"achievements"`
	Recommendations []RecommendationDTO `json:"recommendations"`
	Story           StoryDTO            `json:"story"`
	ActivityDays    int                 `json:"activity_days"`
	GeneratedAt     time.Time           `json:"generated_at"`
}

func toStoryDTO(s domain.Story) StoryDTO {
	insights := s.Insights
	if insights == nil {
		insights = []string{}
	}
	return StoryDTO{
		Persona:  s.Persona,
		Headline: s.Headline,
		Summary:  s.Summary,
		Insights: insights,
	}
}

func ToRecapResponse(recap *domain.Recap) RecapResponse {
	topCategories := make([]CategoryStatDTO, len(recap.TopCategories))
	for i, cat := range recap.TopCategories {
		topCategories[i] = CategoryStatDTO{Category: cat.Category, Count: cat.Count}
	}

	achievements := make([]AchievementDTO, len(recap.Achievements))
	for i, ach := range recap.Achievements {
		achievements[i] = AchievementDTO{
			Slug:        ach.Slug,
			Title:       ach.Title,
			Description: ach.Description,
			Icon:        ach.Icon,
			Category:    ach.Category,
		}
	}

	recommendations := make([]RecommendationDTO, len(recap.Recommendations))
	for i, rec := range recap.Recommendations {
		recommendations[i] = RecommendationDTO{
			Code:        rec.Code,
			Title:       rec.Title,
			Description: rec.Description,
			ActionLabel: rec.ActionLabel,
			Category:    rec.Category,
		}
	}

	return RecapResponse{
		ID:              recap.ID,
		UserID:          recap.UserID,
		Year:            recap.Year,
		TotalViews:      recap.TotalViews,
		TotalMessages:   recap.TotalMessages,
		TotalFavorites:  recap.TotalFavorites,
		TotalPurchases:  recap.TotalPurchases,
		TotalSales:      recap.TotalSales,
		TopCategories:   topCategories,
		Achievements:    achievements,
		Recommendations: recommendations,
		Story:           toStoryDTO(recap.Story),
		ActivityDays:    recap.ActivityDays,
		GeneratedAt:     recap.GeneratedAt,
	}
}

// ShareRecapResponse — публичная карточка без id / user_id.
type ShareRecapResponse struct {
	Year            int                 `json:"year"`
	TotalViews      int                 `json:"total_views"`
	TotalMessages   int                 `json:"total_messages"`
	TotalFavorites  int                 `json:"total_favorites"`
	TotalPurchases  int                 `json:"total_purchases"`
	TotalSales      int                 `json:"total_sales"`
	TopCategories   []CategoryStatDTO   `json:"top_categories"`
	Achievements    []AchievementDTO    `json:"achievements"`
	Recommendations []RecommendationDTO `json:"recommendations"`
	Story           StoryDTO            `json:"story"`
	ActivityDays    int                 `json:"activity_days"`
	GeneratedAt     time.Time           `json:"generated_at"`
}

func ToShareRecapResponse(recap *domain.Recap) ShareRecapResponse {
	full := ToRecapResponse(recap)
	return ShareRecapResponse{
		Year:            full.Year,
		TotalViews:      full.TotalViews,
		TotalMessages:   full.TotalMessages,
		TotalFavorites:  full.TotalFavorites,
		TotalPurchases:  full.TotalPurchases,
		TotalSales:      full.TotalSales,
		TopCategories:   full.TopCategories,
		Achievements:    full.Achievements,
		Recommendations: full.Recommendations,
		Story:           full.Story,
		ActivityDays:    full.ActivityDays,
		GeneratedAt:     full.GeneratedAt,
	}
}
