package handlers

import (
	"context"
	"errors"
	"log/slog"
	"net/http"

	"github.com/google/uuid"
	"gooffer/backend/internal/delivery/dto"
	"gooffer/backend/internal/delivery/middleware"
	"gooffer/backend/internal/domain"
	apperrors "gooffer/backend/pkg/errors"
)

type ProfileService interface {
	GetByID(ctx context.Context, accountID, id uuid.UUID) (*domain.User, error)
	ListProfiles(ctx context.Context, accountID uuid.UUID) ([]domain.User, error)
}

type ProfileHandler struct {
	service ProfileService
	logger  *slog.Logger
}

func NewProfileHandler(service ProfileService, logger *slog.Logger) *ProfileHandler {
	return &ProfileHandler{service: service, logger: logger}
}

func (h *ProfileHandler) Register(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/profiles", h.List)
	mux.HandleFunc("GET /api/profiles/{id}", h.GetByID)
}

func (h *ProfileHandler) List(w http.ResponseWriter, r *http.Request) {
	accountID, ok := middleware.AccountIDFromContext(r.Context())
	if !ok {
		writeError(w, r, http.StatusUnauthorized, "unauthorized", "authentication required")
		return
	}
	profiles, err := h.service.ListProfiles(r.Context(), accountID)
	if err != nil {
		writeServiceError(w, r, h.logger, err)
		return
	}

	writeJSON(w, http.StatusOK, dto.ToProfileResponseList(profiles))
}

func (h *ProfileHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	accountID, ok := middleware.AccountIDFromContext(r.Context())
	if !ok {
		writeError(w, r, http.StatusUnauthorized, "unauthorized", "authentication required")
		return
	}
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		writeError(w, r, http.StatusBadRequest, "invalid_id", "profile id must be a valid UUID")
		return
	}

	profile, err := h.service.GetByID(r.Context(), accountID, id)
	if err != nil {
		if errors.Is(err, apperrors.ErrNotFound) {
			writeError(w, r, http.StatusNotFound, "profile_not_found", "profile not found")
			return
		}
		writeServiceError(w, r, h.logger, err)
		return
	}

	writeJSON(w, http.StatusOK, dto.ToProfileResponse(profile))
}
