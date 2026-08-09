package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strings"

	"gooffer/backend/internal/delivery/dto"
	"gooffer/backend/internal/delivery/middleware"
	"gooffer/backend/internal/usecase/profile"
	apperrors "gooffer/backend/pkg/errors"

	"github.com/google/uuid"
)

type ProfileHandler struct {
	logger  *slog.Logger
	service *profile.Service
}

func NewProfileHandler(logger *slog.Logger, service *profile.Service) *ProfileHandler {
	return &ProfileHandler{logger: logger, service: service}
}

func (h *ProfileHandler) List(w http.ResponseWriter, r *http.Request) {
	users, err := h.service.ListProfiles(r.Context())
	if err != nil {
		h.writeError(w, apperrors.Internal("failed to list profiles", err))
		return
	}
	h.writeJSON(w, http.StatusOK, dto.ToProfileResponseList(users))
}

func (h *ProfileHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		h.writeError(w, apperrors.BadRequest("invalid profile id"))
		return
	}

	user, err := h.service.GetByID(r.Context(), id)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			h.writeError(w, apperrors.NotFound("profile not found"))
			return
		}
		h.writeError(w, apperrors.Internal("failed to get profile", err))
		return
	}
	h.writeJSON(w, http.StatusOK, dto.ToProfileResponse(user))
}

type createProfileRequest struct {
	Name        string `json:"name"`
	ProfileType string `json:"profile_type"`
	Avatar      string `json:"avatar,omitempty"`
	Year        int    `json:"year,omitempty"`
}

func (h *ProfileHandler) Create(w http.ResponseWriter, r *http.Request) {
	if _, ok := middleware.AccountFromContext(r.Context()); !ok {
		h.writeError(w, apperrors.Unauthorized("authentication required"))
		return
	}

	var req createProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.writeError(w, apperrors.BadRequest("invalid json body"))
		return
	}

	user, err := h.service.Create(r.Context(), profile.CreateInput{
		Name:        req.Name,
		ProfileType: req.ProfileType,
		Avatar:      req.Avatar,
		Year:        req.Year,
	})
	if err != nil {
		msg := err.Error()
		if strings.Contains(msg, "required") || strings.Contains(msg, "invalid") || strings.Contains(msg, "too long") {
			h.writeError(w, apperrors.BadRequest(msg))
			return
		}
		h.writeError(w, apperrors.Internal("failed to create profile", err))
		return
	}
	h.writeJSON(w, http.StatusCreated, dto.ToProfileResponse(user))
}

func (h *ProfileHandler) Delete(w http.ResponseWriter, r *http.Request) {
	if _, ok := middleware.AccountFromContext(r.Context()); !ok {
		h.writeError(w, apperrors.Unauthorized("authentication required"))
		return
	}
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		h.writeError(w, apperrors.BadRequest("invalid profile id"))
		return
	}
	if err := h.service.Delete(r.Context(), id); err != nil {
		if strings.Contains(err.Error(), "not found") {
			h.writeError(w, apperrors.NotFound("profile not found"))
			return
		}
		h.writeError(w, apperrors.Internal("failed to delete profile", err))
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *ProfileHandler) writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		h.logger.Error("encode response", slog.String("error", err.Error()))
	}
}

func (h *ProfileHandler) writeError(w http.ResponseWriter, err *apperrors.AppError) {
	h.writeJSON(w, err.Code, map[string]string{"message": err.Message})
}
