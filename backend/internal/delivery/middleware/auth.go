package middleware

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"os"
	"strings"

	"gooffer/backend/internal/domain"

	"github.com/google/uuid"
)

const SessionCookieName = "gooffer_session"

type accountContextKey struct{}

type Authenticator interface {
	Authenticate(ctx context.Context, token string) (*domain.Account, error)
}

func OptionalAuth(auth Authenticator, logger *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			token := sessionTokenFromRequest(r)
			if token != "" && auth != nil {
				account, err := auth.Authenticate(r.Context(), token)
				if err == nil && account != nil {
					ctx := context.WithValue(r.Context(), accountContextKey{}, account)
					r = r.WithContext(ctx)
				}
			}
			next.ServeHTTP(w, r)
		})
	}
}

func RequireAuth(auth Authenticator, logger *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			token := sessionTokenFromRequest(r)
			if token == "" || auth == nil {
				writeUnauthorized(w)
				return
			}
			account, err := auth.Authenticate(r.Context(), token)
			if err != nil || account == nil {
				writeUnauthorized(w)
				return
			}
			ctx := context.WithValue(r.Context(), accountContextKey{}, account)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func AuthRequiredFromEnv() bool {
	v := strings.ToLower(strings.TrimSpace(os.Getenv("AUTH_REQUIRED")))
	return v == "true" || v == "1" || v == "yes"
}

func AccountFromContext(ctx context.Context) (*domain.Account, bool) {
	account, ok := ctx.Value(accountContextKey{}).(*domain.Account)
	return account, ok && account != nil
}

func AccountIDFromContext(ctx context.Context) (uuid.UUID, bool) {
	account, ok := AccountFromContext(ctx)
	if !ok {
		return uuid.Nil, false
	}
	return account.ID, true
}

func sessionTokenFromRequest(r *http.Request) string {
	if c, err := r.Cookie(SessionCookieName); err == nil && c.Value != "" {
		return c.Value
	}
	h := r.Header.Get("Authorization")
	if strings.HasPrefix(strings.ToLower(h), "bearer ") {
		return strings.TrimSpace(h[7:])
	}
	return ""
}

func writeUnauthorized(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnauthorized)
	_ = json.NewEncoder(w).Encode(map[string]string{
		"message": "authentication required",
	})
}
