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
	ID             uuid.UUID              `json:"id"`
	UserID         uuid.UUID              `json:"user_id"`
	Year           int                    `json:"year"`
	TotalViews     int                    `json:"total_views"`
	TotalMessages  int                    `json:"total_messages"`
	TotalFavorites int                    `json:"total_favorites"`
	TotalPurchases int                    `json:"total_purchases"`
	TotalSales     int                    `json:"total_sales"`
	TopCategories  []CategoryStatDTO      `json:"top_categories"`
	Achievements   []AchievementDTO       `json:"achievements"`
	ActivityDays   int                    `json:"activity_days"`
	Summary        domain.RecapSummary    `json:"summary"`
	Cards          []domain.RecapCard     `json:"cards"`
	Comparison     domain.RecapComparison `json:"comparison"`
	Forecast       domain.RecapForecast   `json:"forecast"`
	GeneratedAt    time.Time              `json:"generated_at"`
}

type ShareRecapSummary struct {
	Headline    string                      `json:"headline"`
	Description string                      `json:"description"`
	Combined    domain.CombinedRecapSummary `json:"combined"`
}

// ShareRecapCardPresentationDTO is deliberately separate from the domain
// model so adding a field to RecapCardPresentation cannot expand the public
// share contract by accident.
type ShareRecapCardPresentationDTO struct {
	Layout string `json:"layout"`
	Theme  string `json:"theme"`
	Icon   string `json:"icon"`
}

// ShareRecapCardDTO is an allowlist for data that may be exported to an image
// or copied as text. Navigation, identifiers and diagnostic fields belong only
// to the authenticated full recap response.
type ShareRecapCardDTO struct {
	Kind         string                        `json:"kind"`
	Eyebrow      string                        `json:"eyebrow"`
	Title        string                        `json:"title"`
	Description  string                        `json:"description"`
	Value        string                        `json:"value"`
	Presentation ShareRecapCardPresentationDTO `json:"presentation"`
}

type ShareRecapResponse struct {
	Year           int                 `json:"year"`
	TotalViews     int                 `json:"total_views"`
	TotalMessages  int                 `json:"total_messages"`
	TotalFavorites int                 `json:"total_favorites"`
	TotalPurchases int                 `json:"total_purchases"`
	TotalSales     int                 `json:"total_sales"`
	TopCategories  []CategoryStatDTO   `json:"top_categories"`
	Achievements   []AchievementDTO    `json:"achievements"`
	ActivityDays   int                 `json:"activity_days"`
	Summary        ShareRecapSummary   `json:"summary"`
	Cards          []ShareRecapCardDTO `json:"cards"`
	GeneratedAt    time.Time           `json:"generated_at"`
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
		Comparison:     recap.Comparison,
		Forecast:       recap.Forecast,
		GeneratedAt:    recap.GeneratedAt,
	}
}

func ToShareRecapResponse(recap *domain.Recap) ShareRecapResponse {
	full := ToRecapResponse(recap)
	shareableCards := make([]ShareRecapCardDTO, 0, len(full.Cards))
	for _, card := range full.Cards {
		if card.Shareable {
			shareableCards = append(shareableCards, toShareRecapCard(card))
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

func toShareRecapCard(card domain.RecapCard) ShareRecapCardDTO {
	title := card.Title
	if card.ID == "star_listing" {
		// A listing title can contain personal information entered by its owner.
		// The private recap keeps the real title; exports use neutral copy.
		title = "Ваше объявление стало звездой"
	}
	return ShareRecapCardDTO{
		Kind:        card.Kind,
		Eyebrow:     card.Eyebrow,
		Title:       title,
		Description: card.Description,
		Value:       card.Value,
		Presentation: ShareRecapCardPresentationDTO{
			Layout: card.Presentation.Layout,
			Theme:  card.Presentation.Theme,
			Icon:   card.Presentation.Icon,
		},
	}
}
