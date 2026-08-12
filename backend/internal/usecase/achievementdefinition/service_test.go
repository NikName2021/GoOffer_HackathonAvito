package achievementdefinition

import (
	"context"
	"errors"
	"testing"

	"gooffer/backend/internal/domain"
	apperrors "gooffer/backend/pkg/errors"
)

type fakeRepository struct {
	definitions []domain.AchievementDefinition
	updated     *domain.AchievementDefinition
}

func (f *fakeRepository) List(context.Context) ([]domain.AchievementDefinition, error) {
	return append([]domain.AchievementDefinition(nil), f.definitions...), nil
}

func (f *fakeRepository) ListActive(context.Context) ([]domain.AchievementDefinition, error) {
	return nil, nil
}

func (f *fakeRepository) Update(_ context.Context, definition *domain.AchievementDefinition) error {
	definition.Category = "views"
	definition.SortOrder = 10
	copy := *definition
	f.updated = &copy
	return nil
}

func TestUpdateAchievementDefinition(t *testing.T) {
	repository := &fakeRepository{}
	service := New(repository)
	definition := validDefinition()
	definition.Title = "  Новый заголовок  "

	updated, err := service.Update(context.Background(), "curious", &definition)
	if err != nil {
		t.Fatalf("update achievement: %v", err)
	}
	if updated.Slug != "curious" || updated.Title != "Новый заголовок" || updated.Category != "views" {
		t.Fatalf("updated definition = %#v", updated)
	}
	if updated.UpdatedAt.IsZero() || repository.updated == nil {
		t.Fatal("updated definition was not persisted with metadata")
	}
}

func TestUpdateAchievementDefinitionRejectsInvalidRule(t *testing.T) {
	service := New(&fakeRepository{})
	definition := validDefinition()
	definition.ConditionValue = nil

	_, err := service.Update(context.Background(), "curious", &definition)
	if !errors.Is(err, apperrors.ErrInvalidAchievementDefinition) {
		t.Fatalf("error = %v, want invalid achievement definition", err)
	}
}

func TestUpdateAchievementDefinitionRejectsInvalidSlug(t *testing.T) {
	service := New(&fakeRepository{})
	definition := validDefinition()

	_, err := service.Update(context.Background(), "Curious/one", &definition)
	if !errors.Is(err, apperrors.ErrInvalidAchievementDefinition) {
		t.Fatalf("error = %v, want invalid achievement definition", err)
	}
}

func validDefinition() domain.AchievementDefinition {
	threshold := 500.0
	return domain.AchievementDefinition{
		Title:             "Любопытный",
		Description:       "Просмотрел 500 объявлений",
		Icon:              "👀",
		Metric:            domain.CardMetricTotalViews,
		ConditionOperator: domain.CardConditionGTE,
		ConditionValue:    &threshold,
		IsActive:          true,
	}
}
