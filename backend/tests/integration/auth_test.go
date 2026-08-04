package integration

import (
	"bytes"
	"encoding/json"
	"net/http"
	"strings"
	"testing"

	"gooffer/backend/internal/delivery/handlers"
)

func TestAuthAPI(t *testing.T) {
	application := newFakeApplication()
	handler := newTestHandler(t, application)

	t.Run("protected API rejects anonymous request", func(t *testing.T) {
		response := performRequest(t, handler, http.MethodGet, "/api/profiles", nil, map[string]string{"Cookie": ""})
		if response.Code != http.StatusUnauthorized {
			t.Fatalf("status = %d, want %d", response.Code, http.StatusUnauthorized)
		}
	})

	t.Run("register creates session and isolated account", func(t *testing.T) {
		body := bytes.NewBufferString(`{"login":"alice","password":"strong-pass"}`)
		response := performRequest(t, handler, http.MethodPost, "/api/auth/register", body, map[string]string{
			"Content-Type": "application/json",
			"Cookie":       "",
		})
		if response.Code != http.StatusCreated {
			t.Fatalf("status = %d, want %d: %s", response.Code, http.StatusCreated, response.Body.String())
		}
		cookies := response.Result().Cookies()
		if len(cookies) != 1 || !cookies[0].HttpOnly || cookies[0].SameSite != http.SameSiteLaxMode {
			t.Fatalf("session cookie = %#v, want HttpOnly SameSite=Lax", cookies)
		}
		cookieHeader := cookies[0].Name + "=" + cookies[0].Value

		me := performRequest(t, handler, http.MethodGet, "/api/auth/me", nil, map[string]string{"Cookie": cookieHeader})
		if me.Code != http.StatusOK {
			t.Fatalf("me status = %d, want %d", me.Code, http.StatusOK)
		}
		var account handlers.AccountResponse
		if err := json.NewDecoder(me.Body).Decode(&account); err != nil {
			t.Fatalf("decode account: %v", err)
		}
		if account.Login != "alice" {
			t.Fatalf("login = %q, want alice", account.Login)
		}

		profiles := performRequest(t, handler, http.MethodGet, "/api/profiles", nil, map[string]string{"Cookie": cookieHeader})
		if profiles.Code != http.StatusOK || strings.TrimSpace(profiles.Body.String()) != "[]" {
			t.Fatalf("new account profiles = status %d body %s, want empty list", profiles.Code, profiles.Body.String())
		}
		foreignProfile := performRequest(t, handler, http.MethodGet, "/api/profiles/"+testUserID.String(), nil, map[string]string{"Cookie": cookieHeader})
		if foreignProfile.Code != http.StatusNotFound {
			t.Fatalf("foreign profile status = %d, want %d", foreignProfile.Code, http.StatusNotFound)
		}

		logout := performRequest(t, handler, http.MethodPost, "/api/auth/logout", nil, map[string]string{"Cookie": cookieHeader})
		if logout.Code != http.StatusNoContent {
			t.Fatalf("logout status = %d, want %d", logout.Code, http.StatusNoContent)
		}
		meAfterLogout := performRequest(t, handler, http.MethodGet, "/api/auth/me", nil, map[string]string{"Cookie": cookieHeader})
		if meAfterLogout.Code != http.StatusUnauthorized {
			t.Fatalf("me after logout = %d, want %d", meAfterLogout.Code, http.StatusUnauthorized)
		}
	})

	t.Run("login uses one generic credentials error", func(t *testing.T) {
		wrong := performRequest(t, handler, http.MethodPost, "/api/auth/login", bytes.NewBufferString(
			`{"login":"nikita","password":"wrong-password"}`,
		), map[string]string{"Content-Type": "application/json", "Cookie": ""})
		if wrong.Code != http.StatusUnauthorized {
			t.Fatalf("wrong password status = %d, want %d", wrong.Code, http.StatusUnauthorized)
		}

		correct := performRequest(t, handler, http.MethodPost, "/api/auth/login", bytes.NewBufferString(
			`{"login":"nikita","password":"avito2026"}`,
		), map[string]string{"Content-Type": "application/json", "Cookie": ""})
		if correct.Code != http.StatusOK {
			t.Fatalf("correct login status = %d, want %d: %s", correct.Code, http.StatusOK, correct.Body.String())
		}
	})
}
