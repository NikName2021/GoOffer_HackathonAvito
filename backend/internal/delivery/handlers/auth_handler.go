package handlers

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"time"

	"gooffer/backend/internal/delivery/middleware"
	"gooffer/backend/internal/usecase/auth"
	apperrors "gooffer/backend/pkg/errors"
)

type AuthHandler struct {
	logger  *slog.Logger
	service *auth.Service
	secure  bool
}

func NewAuthHandler(logger *slog.Logger, service *auth.Service, secureCookie bool) *AuthHandler {
	return &AuthHandler{logger: logger, service: service, secure: secureCookie}
}

type authCredentialsRequest struct {
	Login    string `json:"login"`
	Password string `json:"password"`
}

type accountResponse struct {
	ID        string `json:"id"`
	Login     string `json:"login"`
	CreatedAt string `json:"created_at"`
}

type authResponse struct {
	Account   accountResponse `json:"account"`
	ExpiresAt string          `json:"expires_at"`
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	cred, ok := h.decodeCredentials(w, r)
	if !ok {
		return
	}
	result, err := h.service.Register(r.Context(), cred)
	if err != nil {
		h.mapError(w, err)
		return
	}
	h.setSessionCookie(w, result.Token, result.ExpiresAt)
	h.writeJSON(w, http.StatusCreated, toAuthResponse(result))
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	cred, ok := h.decodeCredentials(w, r)
	if !ok {
		return
	}
	result, err := h.service.Login(r.Context(), cred)
	if err != nil {
		h.mapError(w, err)
		return
	}
	h.setSessionCookie(w, result.Token, result.ExpiresAt)
	h.writeJSON(w, http.StatusOK, toAuthResponse(result))
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	token := ""
	if c, err := r.Cookie(middleware.SessionCookieName); err == nil {
		token = c.Value
	}
	_ = h.service.Logout(r.Context(), token)
	http.SetCookie(w, &http.Cookie{
		Name:     middleware.SessionCookieName,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   h.secure,
	})
	w.WriteHeader(http.StatusNoContent)
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	account, ok := middleware.AccountFromContext(r.Context())
	if !ok {
		token := ""
		if c, err := r.Cookie(middleware.SessionCookieName); err == nil {
			token = c.Value
		}
		if token == "" {
			h.writeError(w, apperrors.Unauthorized("authentication required"))
			return
		}
		var err error
		account, err = h.service.Authenticate(r.Context(), token)
		if err != nil {
			h.writeError(w, apperrors.Unauthorized("authentication required"))
			return
		}
	}
	h.writeJSON(w, http.StatusOK, accountResponse{
		ID:        account.ID.String(),
		Login:     account.Login,
		CreatedAt: account.CreatedAt.UTC().Format(time.RFC3339),
	})
}

func (h *AuthHandler) decodeCredentials(w http.ResponseWriter, r *http.Request) (auth.Credentials, bool) {
	var req authCredentialsRequest
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	if err := dec.Decode(&req); err != nil {
		h.writeError(w, apperrors.BadRequest("invalid request body"))
		return auth.Credentials{}, false
	}
	if req.Login == "" || req.Password == "" {
		h.writeError(w, apperrors.BadRequest("login and password are required"))
		return auth.Credentials{}, false
	}
	return auth.Credentials{Login: req.Login, Password: req.Password}, true
}

func (h *AuthHandler) setSessionCookie(w http.ResponseWriter, token string, expires time.Time) {
	http.SetCookie(w, &http.Cookie{
		Name:     middleware.SessionCookieName,
		Value:    token,
		Path:     "/",
		Expires:  expires,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   h.secure,
	})
}

func toAuthResponse(result *auth.SessionResult) authResponse {
	return authResponse{
		Account: accountResponse{
			ID:        result.Account.ID.String(),
			Login:     result.Account.Login,
			CreatedAt: result.Account.CreatedAt.UTC().Format(time.RFC3339),
		},
		ExpiresAt: result.ExpiresAt.UTC().Format(time.RFC3339),
	}
}

func (h *AuthHandler) mapError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, apperrors.ErrUnauthorized):
		h.writeError(w, apperrors.Unauthorized("invalid login or password"))
	case errors.Is(err, apperrors.ErrAlreadyExists):
		h.writeError(w, apperrors.BadRequest("login already taken"))
	case errors.Is(err, apperrors.ErrBadRequest):
		h.writeError(w, apperrors.BadRequest(err.Error()))
	default:
		h.logger.Error("auth error", slog.String("error", err.Error()))
		h.writeError(w, apperrors.Internal("auth failed", err))
	}
}

func (h *AuthHandler) writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func (h *AuthHandler) writeError(w http.ResponseWriter, err *apperrors.AppError) {
	h.writeJSON(w, err.Code, map[string]string{"message": err.Message})
}
