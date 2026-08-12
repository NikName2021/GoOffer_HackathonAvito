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

type MissionService interface {
	GetOverview(
		ctx context.Context,
		accountID, userID uuid.UUID,
		recapYear int,
	) (*domain.MissionOverview, error)
	Select(
		ctx context.Context,
		accountID, userID uuid.UUID,
		recapYear int,
		codes []domain.MissionCode,
	) (*domain.MissionOverview, error)
	GetProfileMissions(
		ctx context.Context,
		accountID, userID uuid.UUID,
	) (*domain.ProfileMissionOverview, error)
}

type MissionHandler struct {
	service MissionService
	logger  *slog.Logger
}

type SelectMissionRequest struct {
	Code  *domain.MissionCode   `json:"code,omitempty"`
	Codes *[]domain.MissionCode `json:"codes,omitempty"`
}

func NewMissionHandler(service MissionService, logger *slog.Logger) *MissionHandler {
	return &MissionHandler{service: service, logger: logger}
}

func (h *MissionHandler) Register(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/recap/{user_id}/{year}/mission", h.Get)
	mux.HandleFunc("PUT /api/recap/{user_id}/{year}/mission", h.Select)
	mux.HandleFunc("GET /api/profiles/{id}/missions", h.GetProfileMissions)
}

func (h *MissionHandler) Get(w http.ResponseWriter, r *http.Request) {
	accountID, userID, year, ok := missionPath(w, r)
	if !ok {
		return
	}
	overview, err := h.service.GetOverview(r.Context(), accountID, userID, year)
	if err != nil {
		h.writeMissionError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, overview)
}

func (h *MissionHandler) Select(w http.ResponseWriter, r *http.Request) {
	accountID, userID, year, ok := missionPath(w, r)
	if !ok {
		return
	}
	request, err := decodeSelectMissionRequest(w, r)
	if err != nil {
		writeError(w, r, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}
	codes, err := request.selectedCodes()
	if err != nil {
		writeError(w, r, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}
	overview, err := h.service.Select(r.Context(), accountID, userID, year, codes)
	if err != nil {
		h.writeMissionError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, overview)
}

func (h *MissionHandler) GetProfileMissions(w http.ResponseWriter, r *http.Request) {
	accountID, ok := middleware.AccountIDFromContext(r.Context())
	if !ok {
		writeError(w, r, http.StatusUnauthorized, "unauthorized", "authentication required")
		return
	}
	userID, ok := profileIDFromPath(w, r)
	if !ok {
		return
	}
	overview, err := h.service.GetProfileMissions(r.Context(), accountID, userID)
	if err != nil {
		if errors.Is(err, apperrors.ErrNotFound) {
			writeError(w, r, http.StatusNotFound, "profile_not_found", "profile not found")
			return
		}
		writeServiceError(w, r, h.logger, err)
		return
	}
	writeJSON(w, http.StatusOK, overview)
}

func (h *MissionHandler) writeMissionError(w http.ResponseWriter, r *http.Request, err error) {
	switch {
	case errors.Is(err, apperrors.ErrInvalidMission):
		writeError(w, r, http.StatusBadRequest, "invalid_mission", "codes must contain up to three unique known mission codes")
	case errors.Is(err, apperrors.ErrNotFound):
		writeError(w, r, http.StatusNotFound, "recap_not_found", "recap not found")
	default:
		writeServiceError(w, r, h.logger, err)
	}
}

func missionPath(w http.ResponseWriter, r *http.Request) (uuid.UUID, uuid.UUID, int, bool) {
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

func decodeSelectMissionRequest(w http.ResponseWriter, r *http.Request) (SelectMissionRequest, error) {
	var request SelectMissionRequest
	r.Body = http.MaxBytesReader(w, r.Body, maxRequestBodyBytes)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&request); err != nil {
		if errors.Is(err, io.EOF) {
			return request, errors.New("request body is required")
		}
		return request, errors.New("request body must be valid JSON with codes")
	}
	if err := decoder.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		return request, errors.New("request body must contain a single JSON object")
	}
	return request, nil
}

func (request SelectMissionRequest) selectedCodes() ([]domain.MissionCode, error) {
	if request.Code != nil && request.Codes != nil {
		return nil, errors.New("use either codes or deprecated code, not both")
	}
	if request.Codes != nil {
		return append([]domain.MissionCode(nil), (*request.Codes)...), nil
	}
	if request.Code != nil {
		return []domain.MissionCode{*request.Code}, nil
	}
	return nil, errors.New("codes field is required")
}
