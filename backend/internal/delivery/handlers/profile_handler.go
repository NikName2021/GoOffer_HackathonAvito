package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"io"
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
	Create(ctx context.Context, accountID uuid.UUID, user *domain.User) (*domain.User, error)
	Update(ctx context.Context, accountID, id uuid.UUID, user *domain.User) (*domain.User, error)
	Delete(ctx context.Context, accountID, id uuid.UUID) error
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
	mux.HandleFunc("POST /api/profiles", h.Create)
	mux.HandleFunc("GET /api/profiles/{id}", h.GetByID)
	mux.HandleFunc("PUT /api/profiles/{id}", h.Update)
	mux.HandleFunc("DELETE /api/profiles/{id}", h.Delete)
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

func (h *ProfileHandler) Create(w http.ResponseWriter, r *http.Request) {
	accountID, ok := middleware.AccountIDFromContext(r.Context())
	if !ok {
		writeError(w, r, http.StatusUnauthorized, "unauthorized", "authentication required")
		return
	}
	request, err := decodeProfileRequest(w, r)
	if err != nil {
		writeError(w, r, http.StatusBadRequest, "invalid_profile", err.Error())
		return
	}
	profile, err := request.ToDomain()
	if err != nil {
		writeError(w, r, http.StatusBadRequest, "invalid_profile", err.Error())
		return
	}
	created, err := h.service.Create(r.Context(), accountID, profile)
	if err != nil {
		writeServiceError(w, r, h.logger, err)
		return
	}
	w.Header().Set("Location", "/api/profiles/"+created.ID.String())
	writeJSON(w, http.StatusCreated, dto.ToProfileResponse(created))
}

func (h *ProfileHandler) Update(w http.ResponseWriter, r *http.Request) {
	accountID, ok := middleware.AccountIDFromContext(r.Context())
	if !ok {
		writeError(w, r, http.StatusUnauthorized, "unauthorized", "authentication required")
		return
	}
	id, ok := profileIDFromPath(w, r)
	if !ok {
		return
	}
	request, err := decodeProfileRequest(w, r)
	if err != nil {
		writeError(w, r, http.StatusBadRequest, "invalid_profile", err.Error())
		return
	}
	profile, err := request.ToDomain()
	if err != nil {
		writeError(w, r, http.StatusBadRequest, "invalid_profile", err.Error())
		return
	}
	updated, err := h.service.Update(r.Context(), accountID, id, profile)
	if errors.Is(err, apperrors.ErrNotFound) {
		writeError(w, r, http.StatusNotFound, "profile_not_found", "profile not found")
		return
	}
	if err != nil {
		writeServiceError(w, r, h.logger, err)
		return
	}
	writeJSON(w, http.StatusOK, dto.ToProfileResponse(updated))
}

func (h *ProfileHandler) Delete(w http.ResponseWriter, r *http.Request) {
	accountID, ok := middleware.AccountIDFromContext(r.Context())
	if !ok {
		writeError(w, r, http.StatusUnauthorized, "unauthorized", "authentication required")
		return
	}
	id, ok := profileIDFromPath(w, r)
	if !ok {
		return
	}
	err := h.service.Delete(r.Context(), accountID, id)
	if errors.Is(err, apperrors.ErrNotFound) {
		writeError(w, r, http.StatusNotFound, "profile_not_found", "profile not found")
		return
	}
	if err != nil {
		writeServiceError(w, r, h.logger, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

const maxProfileRequestBodyBytes = 32 << 20

func decodeProfileRequest(w http.ResponseWriter, r *http.Request) (dto.ProfileRequest, error) {
	var request dto.ProfileRequest
	r.Body = http.MaxBytesReader(w, r.Body, maxProfileRequestBodyBytes)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&request); err != nil {
		if errors.Is(err, io.EOF) {
			return request, errors.New("request body is required")
		}
		var maxBytesError *http.MaxBytesError
		if errors.As(err, &maxBytesError) {
			return request, errors.New("request body must not exceed 32 MiB")
		}
		return request, errors.New("request body must be valid profile JSON")
	}
	if err := decoder.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		return request, errors.New("request body must contain a single JSON object")
	}
	return request, nil
}

func profileIDFromPath(w http.ResponseWriter, r *http.Request) (uuid.UUID, bool) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil || id == uuid.Nil {
		writeError(w, r, http.StatusBadRequest, "invalid_id", "profile id must be a valid non-zero UUID")
		return uuid.Nil, false
	}
	return id, true
}
