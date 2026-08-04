package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"time"

	"gooffer/backend/internal/domain"
	apperrors "gooffer/backend/pkg/errors"
)

type AuthService interface {
	Register(ctx context.Context, login, password string) (*domain.Account, string, error)
	Login(ctx context.Context, login, password string) (*domain.Account, string, error)
	Authenticate(ctx context.Context, token string) (*domain.Account, error)
	Logout(ctx context.Context, token string) error
}

type AuthHandlerOptions struct {
	CookieName   string
	CookieSecure bool
}

type AuthHandler struct {
	service      AuthService
	logger       *slog.Logger
	cookieName   string
	cookieSecure bool
}

type CredentialsRequest struct {
	Login    string `json:"login"`
	Password string `json:"password"`
}

type AccountResponse struct {
	ID        string    `json:"id"`
	Login     string    `json:"login"`
	CreatedAt time.Time `json:"createdAt"`
}

func NewAuthHandler(service AuthService, logger *slog.Logger, options AuthHandlerOptions) *AuthHandler {
	cookieName := options.CookieName
	if cookieName == "" {
		cookieName = "gooffer_session"
	}
	return &AuthHandler{
		service:      service,
		logger:       logger,
		cookieName:   cookieName,
		cookieSecure: options.CookieSecure,
	}
}

func (h *AuthHandler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("POST /api/auth/register", h.Register)
	mux.HandleFunc("POST /api/auth/login", h.Login)
	mux.HandleFunc("POST /api/auth/logout", h.Logout)
	mux.HandleFunc("GET /api/auth/me", h.Me)
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	credentials, err := decodeCredentials(w, r)
	if err != nil {
		writeError(w, r, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	account, token, err := h.service.Register(r.Context(), credentials.Login, credentials.Password)
	if err != nil {
		switch {
		case errors.Is(err, apperrors.ErrInvalidLogin):
			writeError(w, r, http.StatusBadRequest, "invalid_login", "login must contain 3-32 letters, digits, dots, hyphens or underscores")
		case errors.Is(err, apperrors.ErrWeakPassword):
			writeError(w, r, http.StatusBadRequest, "weak_password", "password must contain at least 8 characters and at most 128 bytes")
		case errors.Is(err, apperrors.ErrLoginTaken):
			writeError(w, r, http.StatusConflict, "login_taken", "login is already taken")
		default:
			writeServiceError(w, r, h.logger, err)
		}
		return
	}

	h.setSessionCookie(w, token)
	writeJSON(w, http.StatusCreated, toAccountResponse(account))
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	credentials, err := decodeCredentials(w, r)
	if err != nil {
		writeError(w, r, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	account, token, err := h.service.Login(r.Context(), credentials.Login, credentials.Password)
	if errors.Is(err, apperrors.ErrInvalidCredentials) {
		writeError(w, r, http.StatusUnauthorized, "invalid_credentials", "invalid login or password")
		return
	}
	if err != nil {
		writeServiceError(w, r, h.logger, err)
		return
	}

	h.setSessionCookie(w, token)
	writeJSON(w, http.StatusOK, toAccountResponse(account))
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	token := h.sessionToken(r)
	if err := h.service.Logout(r.Context(), token); err != nil {
		writeServiceError(w, r, h.logger, err)
		return
	}
	h.clearSessionCookie(w)
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(http.StatusNoContent)
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	account, err := h.service.Authenticate(r.Context(), h.sessionToken(r))
	if errors.Is(err, apperrors.ErrUnauthorized) || errors.Is(err, apperrors.ErrNotFound) {
		writeError(w, r, http.StatusUnauthorized, "unauthorized", "authentication required")
		return
	}
	if err != nil {
		writeServiceError(w, r, h.logger, err)
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	writeJSON(w, http.StatusOK, toAccountResponse(account))
}

func (h *AuthHandler) setSessionCookie(w http.ResponseWriter, token string) {
	w.Header().Set("Cache-Control", "no-store")
	http.SetCookie(w, &http.Cookie{
		Name:     h.cookieName,
		Value:    token,
		Path:     "/",
		Secure:   h.cookieSecure,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	})
}

func (h *AuthHandler) clearSessionCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     h.cookieName,
		Value:    "",
		Path:     "/",
		Secure:   h.cookieSecure,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
		Expires:  time.Unix(1, 0).UTC(),
	})
}

func (h *AuthHandler) sessionToken(r *http.Request) string {
	cookie, err := r.Cookie(h.cookieName)
	if err != nil {
		return ""
	}
	return cookie.Value
}

func decodeCredentials(w http.ResponseWriter, r *http.Request) (CredentialsRequest, error) {
	var request CredentialsRequest
	r.Body = http.MaxBytesReader(w, r.Body, maxRequestBodyBytes)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&request); err != nil {
		if errors.Is(err, io.EOF) {
			return request, errors.New("request body is required")
		}
		return request, errors.New("request body must be valid JSON with login and password")
	}
	if err := decoder.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		return request, errors.New("request body must contain a single JSON object")
	}
	return request, nil
}

func toAccountResponse(account *domain.Account) AccountResponse {
	return AccountResponse{
		ID:        account.ID.String(),
		Login:     account.Login,
		CreatedAt: account.CreatedAt,
	}
}
