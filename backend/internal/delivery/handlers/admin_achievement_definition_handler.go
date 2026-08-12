package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"

	"gooffer/backend/internal/delivery/middleware"
	"gooffer/backend/internal/domain"
	apperrors "gooffer/backend/pkg/errors"
)

type AdminAchievementDefinitionService interface {
	List(ctx context.Context) ([]domain.AchievementDefinition, error)
	Update(ctx context.Context, slug string, definition *domain.AchievementDefinition) (*domain.AchievementDefinition, error)
}

type AdminAchievementDefinitionHandler struct {
	service AdminAchievementDefinitionService
	logger  *slog.Logger
}

type UpdateAchievementDefinitionRequest struct {
	Title             string                       `json:"title"`
	Description       string                       `json:"description"`
	Icon              string                       `json:"icon"`
	Metric            domain.CardMetric            `json:"metric"`
	ConditionOperator domain.CardConditionOperator `json:"condition_operator"`
	ConditionValue    *float64                     `json:"condition_value"`
	IsActive          *bool                        `json:"is_active"`
}

func NewAdminAchievementDefinitionHandler(
	service AdminAchievementDefinitionService,
	logger *slog.Logger,
) *AdminAchievementDefinitionHandler {
	return &AdminAchievementDefinitionHandler{service: service, logger: logger}
}

func (h *AdminAchievementDefinitionHandler) Register(mux *http.ServeMux) {
	adminOnly := func(handler http.HandlerFunc) http.Handler {
		return middleware.RequireAdmin(handler)
	}
	mux.Handle("GET /api/admin/achievement-definitions/options", adminOnly(h.Options))
	mux.Handle("GET /api/admin/achievement-definitions", adminOnly(h.List))
	mux.Handle("PUT /api/admin/achievement-definitions/{slug}", adminOnly(h.Update))
}

func (h *AdminAchievementDefinitionHandler) Options(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"metrics":    []string{"total_views", "favorites", "purchases", "sales", "listing_views", "contacts", "reviews", "activity_days", "categories", "deals"},
		"conditions": []string{"always", "gt", "gte", "lt", "lte", "eq"},
	})
}

func (h *AdminAchievementDefinitionHandler) List(w http.ResponseWriter, r *http.Request) {
	definitions, err := h.service.List(r.Context())
	if err != nil {
		writeServiceError(w, r, h.logger, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": definitions})
}

func (h *AdminAchievementDefinitionHandler) Update(w http.ResponseWriter, r *http.Request) {
	request, err := decodeUpdateAchievementDefinitionRequest(w, r)
	if err != nil {
		writeError(w, r, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}
	definition := request.achievementDefinition()
	updated, err := h.service.Update(r.Context(), r.PathValue("slug"), &definition)
	if err != nil {
		h.writeError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, updated)
}

func (h *AdminAchievementDefinitionHandler) writeError(w http.ResponseWriter, r *http.Request, err error) {
	switch {
	case errors.Is(err, apperrors.ErrInvalidAchievementDefinition):
		writeError(w, r, http.StatusBadRequest, "invalid_achievement_definition", err.Error())
	case errors.Is(err, apperrors.ErrNotFound):
		writeError(w, r, http.StatusNotFound, "not_found", "achievement definition not found")
	default:
		writeServiceError(w, r, h.logger, err)
	}
}

func decodeUpdateAchievementDefinitionRequest(
	w http.ResponseWriter,
	r *http.Request,
) (UpdateAchievementDefinitionRequest, error) {
	var request UpdateAchievementDefinitionRequest
	r.Body = http.MaxBytesReader(w, r.Body, maxRequestBodyBytes)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&request); err != nil {
		if errors.Is(err, io.EOF) {
			return request, errors.New("request body is required")
		}
		return request, errors.New("request body must be valid JSON")
	}
	if err := decoder.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		return request, errors.New("request body must contain a single JSON object")
	}
	if request.IsActive == nil {
		return request, errors.New("is_active is required")
	}
	return request, nil
}

func (request UpdateAchievementDefinitionRequest) achievementDefinition() domain.AchievementDefinition {
	return domain.AchievementDefinition{
		Title:             request.Title,
		Description:       request.Description,
		Icon:              request.Icon,
		Metric:            request.Metric,
		ConditionOperator: request.ConditionOperator,
		ConditionValue:    request.ConditionValue,
		IsActive:          *request.IsActive,
	}
}
