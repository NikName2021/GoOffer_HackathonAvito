package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"strconv"
	"time"

	"github.com/google/uuid"
	"gooffer/backend/internal/delivery/dto"
	"gooffer/backend/internal/delivery/middleware"
	"gooffer/backend/internal/domain"
	apperrors "gooffer/backend/pkg/errors"
)

const maxRequestBodyBytes = 1 << 20

type RecapGenerator interface {
	Execute(ctx context.Context, accountID, userID uuid.UUID, year int) (*domain.Recap, error)
}

type RecapReader interface {
	GetByUserAndYear(ctx context.Context, userID uuid.UUID, year int) (*domain.Recap, error)
}

type BusinessEventRecorder interface {
	RecordBusinessEvent(event string, ctaVisible bool)
}

var allowedBusinessEvents = map[string]struct{}{
	"recap_opened":        {},
	"gift_opened":         {},
	"slide_viewed":        {},
	"recap_completed":     {},
	"share_created":       {},
	"cta_clicked":         {},
	"mission_viewed":      {},
	"mission_selected":    {},
	"mission_completed":   {},
	"mission_cta_clicked": {},
}

type RecapHandler struct {
	generator      RecapGenerator
	reader         RecapReader
	profiles       ProfileService
	businessEvents BusinessEventRecorder
	logger         *slog.Logger
}

type GenerateRecapRequest struct {
	UserID uuid.UUID `json:"user_id"`
	Year   int       `json:"year"`
}

type TrackRecapEventRequest struct {
	Event      string `json:"event"`
	CTAVisible bool   `json:"cta_visible,omitempty"`
}

func NewRecapHandler(
	generator RecapGenerator,
	reader RecapReader,
	profiles ProfileService,
	businessEvents BusinessEventRecorder,
	logger *slog.Logger,
) *RecapHandler {
	return &RecapHandler{
		generator:      generator,
		reader:         reader,
		profiles:       profiles,
		businessEvents: businessEvents,
		logger:         logger,
	}
}

func (h *RecapHandler) Register(mux *http.ServeMux) {
	mux.HandleFunc("POST /api/recap/generate", h.Generate)
	mux.HandleFunc("POST /api/recap/events", h.TrackEvent)
	mux.HandleFunc("GET /api/recap/{user_id}/{year}", h.Get)
	mux.HandleFunc("GET /api/recap/{user_id}/{year}/share", h.Share)
}

func (h *RecapHandler) Generate(w http.ResponseWriter, r *http.Request) {
	accountID, ok := middleware.AccountIDFromContext(r.Context())
	if !ok {
		writeError(w, r, http.StatusUnauthorized, "unauthorized", "authentication required")
		return
	}
	request, err := decodeGenerateRequest(w, r)
	if err != nil {
		writeError(w, r, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}
	if request.UserID == uuid.Nil {
		writeError(w, r, http.StatusBadRequest, "invalid_id", "user_id must be a valid non-zero UUID")
		return
	}
	if !validYear(request.Year) {
		writeError(w, r, http.StatusBadRequest, "invalid_year", yearValidationMessage())
		return
	}

	recap, err := h.generator.Execute(r.Context(), accountID, request.UserID, request.Year)
	if err != nil {
		if errors.Is(err, apperrors.ErrNotFound) {
			writeError(w, r, http.StatusNotFound, "profile_not_found", "profile not found")
			return
		}
		writeServiceError(w, r, h.logger, err)
		return
	}

	writeJSON(w, http.StatusCreated, dto.ToRecapResponse(recap))
}

func (h *RecapHandler) Get(w http.ResponseWriter, r *http.Request) {
	recap, ok := h.recapFromPath(w, r)
	if !ok {
		return
	}
	writeJSON(w, http.StatusOK, dto.ToRecapResponse(recap))
}

func (h *RecapHandler) Share(w http.ResponseWriter, r *http.Request) {
	recap, ok := h.recapFromPath(w, r)
	if !ok {
		return
	}
	writeJSON(w, http.StatusOK, dto.ToShareRecapResponse(recap))
}

func (h *RecapHandler) TrackEvent(w http.ResponseWriter, r *http.Request) {
	_, ok := middleware.AccountIDFromContext(r.Context())
	if !ok {
		writeError(w, r, http.StatusUnauthorized, "unauthorized", "authentication required")
		return
	}

	request, err := decodeTrackEventRequest(w, r)
	if err != nil {
		writeError(w, r, http.StatusBadRequest, "invalid_event", err.Error())
		return
	}
	if _, ok := allowedBusinessEvents[request.Event]; !ok {
		writeError(w, r, http.StatusBadRequest, "invalid_event", "event is not supported")
		return
	}
	if request.CTAVisible && request.Event != "slide_viewed" {
		writeError(w, r, http.StatusBadRequest, "invalid_event", "cta_visible is only supported for slide_viewed")
		return
	}

	if h.businessEvents != nil {
		h.businessEvents.RecordBusinessEvent(request.Event, request.CTAVisible)
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *RecapHandler) recapFromPath(w http.ResponseWriter, r *http.Request) (*domain.Recap, bool) {
	accountID, ok := middleware.AccountIDFromContext(r.Context())
	if !ok {
		writeError(w, r, http.StatusUnauthorized, "unauthorized", "authentication required")
		return nil, false
	}
	userID, err := uuid.Parse(r.PathValue("user_id"))
	if err != nil || userID == uuid.Nil {
		writeError(w, r, http.StatusBadRequest, "invalid_id", "user_id must be a valid non-zero UUID")
		return nil, false
	}

	year, err := strconv.Atoi(r.PathValue("year"))
	if err != nil || !validYear(year) {
		writeError(w, r, http.StatusBadRequest, "invalid_year", yearValidationMessage())
		return nil, false
	}
	if _, err := h.profiles.GetByID(r.Context(), accountID, userID); err != nil {
		if errors.Is(err, apperrors.ErrNotFound) {
			writeError(w, r, http.StatusNotFound, "recap_not_found", "recap not found")
			return nil, false
		}
		writeServiceError(w, r, h.logger, err)
		return nil, false
	}

	recap, err := h.reader.GetByUserAndYear(r.Context(), userID, year)
	if err != nil {
		if errors.Is(err, apperrors.ErrNotFound) {
			writeError(w, r, http.StatusNotFound, "recap_not_found", "recap not found")
			return nil, false
		}
		writeServiceError(w, r, h.logger, err)
		return nil, false
	}
	if recap == nil {
		writeError(w, r, http.StatusNotFound, "recap_not_found", "recap not found")
		return nil, false
	}

	return recap, true
}

func decodeGenerateRequest(w http.ResponseWriter, r *http.Request) (GenerateRecapRequest, error) {
	var request GenerateRecapRequest
	r.Body = http.MaxBytesReader(w, r.Body, maxRequestBodyBytes)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(&request); err != nil {
		if errors.Is(err, io.EOF) {
			return request, errors.New("request body is required")
		}
		return request, errors.New("request body must be valid JSON with user_id and year")
	}
	if err := decoder.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		return request, errors.New("request body must contain a single JSON object")
	}
	return request, nil
}

func decodeTrackEventRequest(w http.ResponseWriter, r *http.Request) (TrackRecapEventRequest, error) {
	var request TrackRecapEventRequest
	r.Body = http.MaxBytesReader(w, r.Body, maxRequestBodyBytes)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(&request); err != nil {
		if errors.Is(err, io.EOF) {
			return request, errors.New("request body is required")
		}
		return request, errors.New("request body must be valid JSON with event")
	}
	if err := decoder.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		return request, errors.New("request body must contain a single JSON object")
	}
	return request, nil
}

func validYear(year int) bool {
	return year >= 2000 && year <= time.Now().UTC().Year()
}

func yearValidationMessage() string {
	return "year must be between 2000 and " + strconv.Itoa(time.Now().UTC().Year())
}
