package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/google/uuid"
	"gooffer/backend/internal/delivery/middleware"
	"gooffer/backend/internal/domain"
	apperrors "gooffer/backend/pkg/errors"
)

type RecapShareService interface {
	Create(
		ctx context.Context,
		accountID, userID uuid.UUID,
		year int,
		cardIDs []string,
		format domain.RecapShareFormat,
	) (*domain.RecapShareCreated, error)
	GetPublic(ctx context.Context, token string) (*domain.PublicRecapShare, error)
	Revoke(ctx context.Context, accountID, shareID uuid.UUID) error
}

type RecapShareHandler struct {
	service        RecapShareService
	businessEvents BusinessEventRecorder
	logger         *slog.Logger
}

type CreateRecapShareRequest struct {
	CardIDs []string                `json:"card_ids"`
	Format  domain.RecapShareFormat `json:"format"`
}

func NewRecapShareHandler(
	service RecapShareService,
	businessEvents BusinessEventRecorder,
	logger *slog.Logger,
) *RecapShareHandler {
	return &RecapShareHandler{service: service, businessEvents: businessEvents, logger: logger}
}

func (h *RecapShareHandler) RegisterProtected(mux *http.ServeMux) {
	mux.HandleFunc("POST /api/recap/{user_id}/{year}/shares", h.Create)
	mux.HandleFunc("DELETE /api/recap-shares/{share_id}", h.Revoke)
}

func (h *RecapShareHandler) RegisterPublic(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/public/recap-shares/{token}", h.GetPublic)
}

func (h *RecapShareHandler) Create(w http.ResponseWriter, r *http.Request) {
	accountID, userID, year, ok := recapSharePath(w, r)
	if !ok {
		return
	}
	request, err := decodeCreateRecapShareRequest(w, r)
	if err != nil {
		writeError(w, r, http.StatusBadRequest, "invalid_share", err.Error())
		return
	}
	created, err := h.service.Create(
		r.Context(),
		accountID,
		userID,
		year,
		request.CardIDs,
		request.Format,
	)
	if err != nil {
		h.writeCreateError(w, r, err)
		return
	}
	if h.businessEvents != nil {
		h.businessEvents.RecordBusinessEvent("share_created", false)
	}
	w.Header().Set("Location", created.PublicURL)
	writeJSON(w, http.StatusCreated, created)
}

func (h *RecapShareHandler) GetPublic(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("X-Robots-Tag", "noindex, nofollow, noarchive")
	w.Header().Set("Referrer-Policy", "no-referrer")
	share, err := h.service.GetPublic(r.Context(), r.PathValue("token"))
	if err != nil {
		if errors.Is(err, apperrors.ErrNotFound) {
			writeError(w, r, http.StatusNotFound, "share_not_found", "public share not found")
			return
		}
		writeServiceError(w, r, h.logger, err)
		return
	}
	writeJSON(w, http.StatusOK, share)
}

func (h *RecapShareHandler) Revoke(w http.ResponseWriter, r *http.Request) {
	accountID, ok := middleware.AccountIDFromContext(r.Context())
	if !ok {
		writeError(w, r, http.StatusUnauthorized, "unauthorized", "authentication required")
		return
	}
	shareID, err := uuid.Parse(r.PathValue("share_id"))
	if err != nil || shareID == uuid.Nil {
		writeError(w, r, http.StatusBadRequest, "invalid_id", "share_id must be a valid non-zero UUID")
		return
	}
	if err := h.service.Revoke(r.Context(), accountID, shareID); err != nil {
		if errors.Is(err, apperrors.ErrNotFound) {
			writeError(w, r, http.StatusNotFound, "share_not_found", "public share not found")
			return
		}
		writeServiceError(w, r, h.logger, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *RecapShareHandler) writeCreateError(w http.ResponseWriter, r *http.Request, err error) {
	switch {
	case errors.Is(err, apperrors.ErrInvalidRecapShare):
		writeError(w, r, http.StatusBadRequest, "invalid_share", "select 1 to 9 unique shareable cards and a supported format")
	case errors.Is(err, apperrors.ErrNotFound):
		writeError(w, r, http.StatusNotFound, "recap_not_found", "recap not found")
	default:
		writeServiceError(w, r, h.logger, err)
	}
}

func recapSharePath(w http.ResponseWriter, r *http.Request) (uuid.UUID, uuid.UUID, int, bool) {
	accountID, ok := middleware.AccountIDFromContext(r.Context())
	if !ok {
		writeError(w, r, http.StatusUnauthorized, "unauthorized", "authentication required")
		return uuid.Nil, uuid.Nil, 0, false
	}
	userID, err := uuid.Parse(r.PathValue("user_id"))
	if err != nil || userID == uuid.Nil {
		writeError(w, r, http.StatusBadRequest, "invalid_id", "user_id must be a valid non-zero UUID")
		return uuid.Nil, uuid.Nil, 0, false
	}
	year, err := strconv.Atoi(r.PathValue("year"))
	if err != nil || !validYear(year) {
		writeError(w, r, http.StatusBadRequest, "invalid_year", yearValidationMessage())
		return uuid.Nil, uuid.Nil, 0, false
	}
	return accountID, userID, year, true
}

func decodeCreateRecapShareRequest(w http.ResponseWriter, r *http.Request) (CreateRecapShareRequest, error) {
	var request CreateRecapShareRequest
	r.Body = http.MaxBytesReader(w, r.Body, maxRequestBodyBytes)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&request); err != nil {
		if errors.Is(err, io.EOF) {
			return request, errors.New("request body is required")
		}
		return request, errors.New("request body must be valid JSON with card_ids and format")
	}
	if err := decoder.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		return request, errors.New("request body must contain a single JSON object")
	}
	return request, nil
}
