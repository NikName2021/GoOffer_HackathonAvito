package dto

import (
	"time"

	"github.com/google/uuid"
	"gooffer/backend/internal/domain"
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

type RecapResponse struct {
	ID             uuid.UUID           `json:"id"`
	UserID         uuid.UUID           `json:"user_id"`
	Year           int                 `json:"year"`
	TotalViews     int                 `json:"total_views"`
	TotalMessages  int                 `json:"total_messages"`
	TotalFavorites int                 `json:"total_favorites"`
	TotalPurchases int                 `json:"total_purchases"`
	TotalSales     int                 `json:"total_sales"`
	TopCategories  []CategoryStatDTO   `json:"top_categories"`
	Achievements   []AchievementDTO    `json:"achievements"`
	ActivityDays   int                 `json:"activity_days"`
	Summary        domain.RecapSummary `json:"summary"`
	Cards          []domain.RecapCard  `json:"cards"`
	GeneratedAt    time.Time           `json:"generated_at"`
}

type ShareRecapSummary struct {
	Headline    string                      `json:"headline"`
	Description string                      `json:"description"`
	Combined    domain.CombinedRecapSummary `json:"combined"`
}

type ShareRecapResponse struct {
	Year           int                `json:"year"`
	TotalViews     int                `json:"total_views"`
	TotalMessages  int                `json:"total_messages"`
	TotalFavorites int                `json:"total_favorites"`
	TotalPurchases int                `json:"total_purchases"`
	TotalSales     int                `json:"total_sales"`
	TopCategories  []CategoryStatDTO  `json:"top_categories"`
	Achievements   []AchievementDTO   `json:"achievements"`
	ActivityDays   int                `json:"activity_days"`
	Summary        ShareRecapSummary  `json:"summary"`
	Cards          []domain.RecapCard `json:"cards"`
	GeneratedAt    time.Time          `json:"generated_at"`
}

func ToRecapResponse(recap *domain.Recap) RecapResponse {
	topCategories := make([]CategoryStatDTO, len(recap.TopCategories))
	for i, cat := range recap.TopCategories {
		topCategories[i] = CategoryStatDTO{
			Category: cat.Category,
			Count:    cat.Count,
		}
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
	cards := recap.Cards
	if cards == nil {
		cards = []domain.RecapCard{}
	}

	return RecapResponse{
		ID:             recap.ID,
		UserID:         recap.UserID,
		Year:           recap.Year,
		TotalViews:     recap.TotalViews,
		TotalMessages:  recap.TotalMessages,
		TotalFavorites: recap.TotalFavorites,
		TotalPurchases: recap.TotalPurchases,
		TotalSales:     recap.TotalSales,
		TopCategories:  topCategories,
		Achievements:   achievements,
		ActivityDays:   recap.ActivityDays,
		Summary:        recap.Summary,
		Cards:          cards,
		GeneratedAt:    recap.GeneratedAt,
	}
}

func ToShareRecapResponse(recap *domain.Recap) ShareRecapResponse {
	full := ToRecapResponse(recap)
	shareableCards := make([]domain.RecapCard, 0, len(full.Cards))
	for _, card := range full.Cards {
		if card.Shareable {
			shareableCards = append(shareableCards, card)
		}
	}
	return ShareRecapResponse{
		Year:           full.Year,
		TotalViews:     full.TotalViews,
		TotalMessages:  full.TotalMessages,
		TotalFavorites: full.TotalFavorites,
		TotalPurchases: full.TotalPurchases,
		TotalSales:     full.TotalSales,
		TopCategories:  full.TopCategories,
		Achievements:   full.Achievements,
		ActivityDays:   full.ActivityDays,
		Summary: ShareRecapSummary{
			Headline:    full.Summary.Headline,
			Description: full.Summary.Description,
			Combined:    full.Summary.Combined,
		},
		Cards:       shareableCards,
		GeneratedAt: full.GeneratedAt,
	}
}
