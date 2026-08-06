package unit

import (
	"testing"

	"gooffer/backend/internal/domain"
	"gooffer/backend/internal/usecase/generator"
)

func TestBuildStory_NilMetrics(t *testing.T) {
	story := generator.BuildStory(2025, nil, nil)
	if story.Persona != "newbie" {
		t.Fatalf("persona = %q, want newbie", story.Persona)
	}
	if story.Headline == "" || story.Summary == "" {
		t.Fatal("headline/summary must not be empty")
	}
	if len(story.Insights) == 0 {
		t.Fatal("insights must not be empty")
	}
}

func TestBuildStory_Seller(t *testing.T) {
	m := &generator.UserMetrics{
		TotalViews:     600,
		TotalMessages:  20,
		TotalFavorites: 10,
		TotalPurchases: 1,
		TotalSales:     8,
		ActivityDays:   120,
		TopCategories: []domain.CategoryStat{
			{Category: "Электроника", Count: 100},
		},
	}
	story := generator.BuildStory(2025, m, nil)
	if story.Persona != "seller" {
		t.Fatalf("persona = %q, want seller", story.Persona)
	}
	if story.Headline == "" || story.Summary == "" {
		t.Fatal("headline/summary must not be empty")
	}
	if len(story.Insights) == 0 {
		t.Fatal("insights must not be empty")
	}
}

func TestBuildStory_Buyer(t *testing.T) {
	m := &generator.UserMetrics{
		TotalViews:     800,
		TotalPurchases: 12,
		TotalSales:     1,
		ActivityDays:   90,
		TopCategories: []domain.CategoryStat{
			{Category: "Недвижимость", Count: 50},
		},
	}
	story := generator.BuildStory(2025, m, []domain.Achievement{
		{Slug: "shopaholic", Title: "Шопоголик"},
	})
	if story.Persona != "buyer" {
		t.Fatalf("persona = %q, want buyer", story.Persona)
	}
}
