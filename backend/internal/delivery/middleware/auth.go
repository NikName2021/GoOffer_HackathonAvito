package middleware

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"

	"github.com/google/uuid"
	"gooffer/backend/internal/domain"
	apperrors "gooffer/backend/pkg/errors"
)

type SessionAuthenticator interface {
	Authenticate(ctx context.Context, token string) (*domain.Account, error)
}

type accountContextKey struct{}

func Authenticate(
	authenticator SessionAuthenticator,
	cookieName string,
	logger *slog.Logger,
) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			cookie, err := r.Cookie(cookieName)
			if err != nil || cookie.Value == "" {
				writeAuthError(w, r, http.StatusUnauthorized, "unauthorized", "authentication required")
				return
			}

			account, err := authenticator.Authenticate(r.Context(), cookie.Value)
			if errors.Is(err, apperrors.ErrUnauthorized) || errors.Is(err, apperrors.ErrNotFound) {
				writeAuthError(w, r, http.StatusUnauthorized, "unauthorized", "authentication required")
				return
			}
			if err != nil {
				logger.ErrorContext(r.Context(), "session authentication failed",
					slog.String("error", err.Error()),
					slog.String("request_id", RequestIDFromContext(r.Context())),
				)
				writeAuthError(w, r, http.StatusInternalServerError, "internal_error", "internal server error")
				return
			}

			ctx := context.WithValue(r.Context(), accountContextKey{}, account.ID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func AccountIDFromContext(ctx context.Context) (uuid.UUID, bool) {
	accountID, ok := ctx.Value(accountContextKey{}).(uuid.UUID)
	return accountID, ok && accountID != uuid.Nil
}

func writeAuthError(w http.ResponseWriter, r *http.Request, status int, code, message string) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"error": map[string]string{
			"code":       code,
			"message":    message,
			"request_id": RequestIDFromContext(r.Context()),
		},
	})
}
