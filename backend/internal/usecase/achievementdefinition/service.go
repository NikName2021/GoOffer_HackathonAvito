package achievementdefinition

import (
	"context"
	"fmt"
	"math"
	"strings"
	"time"
	"unicode/utf8"

	"gooffer/backend/internal/domain"
	"gooffer/backend/internal/usecase/ports"
	apperrors "gooffer/backend/pkg/errors"
)

type Service struct {
	repository ports.AchievementDefinitionRepository
}

func New(repository ports.AchievementDefinitionRepository) *Service {
	return &Service{repository: repository}
}

func (s *Service) List(ctx context.Context) ([]domain.AchievementDefinition, error) {
	definitions, err := s.repository.List(ctx)
	if err != nil {
		return nil, fmt.Errorf("list achievement definitions: %w", err)
	}
	return definitions, nil
}

func (s *Service) Update(
	ctx context.Context,
	slug string,
	definition *domain.AchievementDefinition,
) (*domain.AchievementDefinition, error) {
	if definition == nil {
		return nil, invalid("request body is required")
	}
	if !validSlug(slug) {
		return nil, invalid("achievement slug is invalid")
	}
	normalize(definition)
	if err := validate(definition); err != nil {
		return nil, err
	}
	definition.Slug = slug
	definition.UpdatedAt = time.Now().UTC()
	if err := s.repository.Update(ctx, definition); err != nil {
		return nil, fmt.Errorf("update achievement definition: %w", err)
	}
	return definition, nil
}

func normalize(definition *domain.AchievementDefinition) {
	definition.Title = strings.TrimSpace(definition.Title)
	definition.Description = strings.TrimSpace(definition.Description)
	definition.Icon = strings.TrimSpace(definition.Icon)
}

func validate(definition *domain.AchievementDefinition) error {
	if !validLength(definition.Title, 1, 160) {
		return invalid("title must contain from 1 to 160 characters")
	}
	if utf8.RuneCountInString(definition.Description) > 500 {
		return invalid("description must not exceed 500 characters")
	}
	if !validLength(definition.Icon, 1, 50) {
		return invalid("icon must contain from 1 to 50 characters")
	}
	if !validMetric(definition.Metric) {
		return invalid("unsupported metric")
	}
	if !validCondition(definition.ConditionOperator) {
		return invalid("unsupported condition_operator")
	}
	if definition.ConditionOperator == domain.CardConditionAlways {
		if definition.ConditionValue != nil {
			return invalid("condition_value must be omitted when condition_operator is always")
		}
		return nil
	}
	if definition.ConditionValue == nil {
		return invalid("condition_value is required for the selected condition_operator")
	}
	if math.IsNaN(*definition.ConditionValue) || math.IsInf(*definition.ConditionValue, 0) || *definition.ConditionValue < 0 {
		return invalid("condition_value must be a finite non-negative number")
	}
	return nil
}

func validSlug(slug string) bool {
	if len(slug) == 0 || len(slug) > 100 {
		return false
	}
	for _, character := range slug {
		if (character < 'a' || character > 'z') && (character < '0' || character > '9') && character != '_' {
			return false
		}
	}
	return true
}

func validMetric(metric domain.CardMetric) bool {
	switch metric {
	case domain.CardMetricTotalViews,
		domain.CardMetricFavorites,
		domain.CardMetricPurchases,
		domain.CardMetricSales,
		domain.CardMetricListingViews,
		domain.CardMetricContacts,
		domain.CardMetricReviews,
		domain.CardMetricActivityDays,
		domain.CardMetricCategories,
		domain.CardMetricDeals:
		return true
	default:
		return false
	}
}

func validCondition(operator domain.CardConditionOperator) bool {
	switch operator {
	case domain.CardConditionAlways,
		domain.CardConditionGT,
		domain.CardConditionGTE,
		domain.CardConditionLT,
		domain.CardConditionLTE,
		domain.CardConditionEQ:
		return true
	default:
		return false
	}
}

func validLength(value string, minimum, maximum int) bool {
	length := utf8.RuneCountInString(value)
	return length >= minimum && length <= maximum
}

func invalid(message string) error {
	return fmt.Errorf("%w: %s", apperrors.ErrInvalidAchievementDefinition, message)
}
