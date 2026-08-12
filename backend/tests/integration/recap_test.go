package integration

import (
	"bytes"
	"encoding/json"
	"net/http"
	"strings"
	"testing"

	"gooffer/backend/internal/delivery/dto"
	"gooffer/backend/internal/domain"
)

func TestRecapAPI(t *testing.T) {
	application := newFakeApplication()
	handler := newTestHandler(t, application)

	t.Run("generate recap", func(t *testing.T) {
		body := []byte(`{"user_id":"` + testUserID.String() + `","year":2025}`)
		response := performRequest(t, handler, http.MethodPost, "/api/recap/generate", bytes.NewReader(body), map[string]string{
			"Content-Type": "application/json",
		})
		if response.Code != http.StatusCreated {
			t.Fatalf("status = %d, want %d", response.Code, http.StatusCreated)
		}

		var recap dto.RecapResponse
		if err := json.NewDecoder(response.Body).Decode(&recap); err != nil {
			t.Fatalf("decode recap: %v", err)
		}
		if recap.UserID != testUserID || recap.TotalViews != 1500 {
			t.Fatalf("recap = %#v, want test recap", recap)
		}
		if recap.Summary.Headline == "" || len(recap.Cards) != 2 {
			t.Fatalf("recap summary/cards = %#v/%#v", recap.Summary, recap.Cards)
		}
		if recap.Comparison.Status != "unavailable" || recap.Forecast.Year != 2026 {
			t.Fatalf("recap comparison/forecast = %#v/%#v", recap.Comparison, recap.Forecast)
		}
	})

	t.Run("reject unknown request fields", func(t *testing.T) {
		body := []byte(`{"user_id":"` + testUserID.String() + `","year":2025,"private":true}`)
		response := performRequest(t, handler, http.MethodPost, "/api/recap/generate", bytes.NewReader(body), map[string]string{
			"Content-Type": "application/json",
		})
		if response.Code != http.StatusBadRequest {
			t.Fatalf("status = %d, want %d", response.Code, http.StatusBadRequest)
		}
	})

	t.Run("get recap", func(t *testing.T) {
		response := performRequest(t, handler, http.MethodGet, "/api/recap/"+testUserID.String()+"/2025", nil, nil)
		if response.Code != http.StatusOK {
			t.Fatalf("status = %d, want %d", response.Code, http.StatusOK)
		}
	})

	t.Run("share response excludes identifiers", func(t *testing.T) {
		response := performRequest(t, handler, http.MethodGet, "/api/recap/"+testUserID.String()+"/2025/share", nil, nil)
		if response.Code != http.StatusOK {
			t.Fatalf("status = %d, want %d", response.Code, http.StatusOK)
		}

		var payload map[string]any
		if err := json.NewDecoder(response.Body).Decode(&payload); err != nil {
			t.Fatalf("decode share recap: %v", err)
		}
		assertShareJSONIsSafe(t, payload)
		cards, ok := payload["cards"].([]any)
		if !ok || len(cards) != 1 {
			t.Fatalf("share cards = %#v, want one public card", payload["cards"])
		}
		card, ok := cards[0].(map[string]any)
		if !ok || card["kind"] != "overview" || card["title"] != "Итоги" {
			t.Fatalf("share card = %#v, want safe overview", cards[0])
		}
	})

	var publicShare domain.RecapShareCreated
	var publicPath string
	t.Run("create temporary public share from selected cards", func(t *testing.T) {
		body := bytes.NewBufferString(`{"card_ids":["year_overview"],"format":"mobile_story"}`)
		response := performRequest(
			t,
			handler,
			http.MethodPost,
			"/api/recap/"+testUserID.String()+"/2025/shares",
			body,
			map[string]string{"Content-Type": "application/json"},
		)
		if response.Code != http.StatusCreated {
			t.Fatalf("status = %d, want %d: %s", response.Code, http.StatusCreated, response.Body.String())
		}
		if err := json.NewDecoder(response.Body).Decode(&publicShare); err != nil {
			t.Fatalf("decode created share: %v", err)
		}
		if publicShare.Format != domain.RecapShareMobileStory ||
			!strings.HasPrefix(publicShare.PublicURL, "https://recap.example/share/") {
			t.Fatalf("created share = %#v", publicShare)
		}
		token := strings.TrimPrefix(publicShare.PublicURL, "https://recap.example/share/")
		publicPath = "/api/public/recap-shares/" + token
	})

	t.Run("public share is anonymous and contains only snapshot", func(t *testing.T) {
		response := performRequest(t, handler, http.MethodGet, publicPath, nil, map[string]string{"Cookie": ""})
		if response.Code != http.StatusOK {
			t.Fatalf("status = %d, want %d: %s", response.Code, http.StatusOK, response.Body.String())
		}
		if response.Header().Get("Cache-Control") != "no-store" ||
			!strings.Contains(response.Header().Get("X-Robots-Tag"), "noindex") {
			t.Fatalf("public security headers = %#v", response.Header())
		}
		var payload map[string]any
		if err := json.NewDecoder(response.Body).Decode(&payload); err != nil {
			t.Fatalf("decode public share: %v", err)
		}
		assertShareJSONIsSafe(t, payload)
		if payload["format"] != "mobile_story" || payload["year"] != float64(2025) {
			t.Fatalf("public payload = %#v", payload)
		}
		cards, ok := payload["cards"].([]any)
		if !ok || len(cards) != 1 {
			t.Fatalf("public cards = %#v", payload["cards"])
		}
	})

	t.Run("reject non-shareable selected card", func(t *testing.T) {
		body := bytes.NewBufferString(`{"card_ids":["largest_purchase"],"format":"responsive"}`)
		response := performRequest(
			t,
			handler,
			http.MethodPost,
			"/api/recap/"+testUserID.String()+"/2025/shares",
			body,
			nil,
		)
		if response.Code != http.StatusBadRequest {
			t.Fatalf("status = %d, want %d", response.Code, http.StatusBadRequest)
		}
	})

	t.Run("revoke public share", func(t *testing.T) {
		response := performRequest(
			t,
			handler,
			http.MethodDelete,
			"/api/recap-shares/"+publicShare.ID.String(),
			nil,
			nil,
		)
		if response.Code != http.StatusNoContent {
			t.Fatalf("status = %d, want %d", response.Code, http.StatusNoContent)
		}
		publicResponse := performRequest(t, handler, http.MethodGet, publicPath, nil, map[string]string{"Cookie": ""})
		if publicResponse.Code != http.StatusNotFound {
			t.Fatalf("revoked public status = %d, want %d", publicResponse.Code, http.StatusNotFound)
		}
		if publicResponse.Header().Get("Cache-Control") != "no-store" ||
			publicResponse.Header().Get("Referrer-Policy") != "no-referrer" {
			t.Fatalf("revoked public security headers = %#v", publicResponse.Header())
		}
	})

	t.Run("track business event", func(t *testing.T) {
		body := []byte(`{"event":"slide_viewed","cta_visible":true}`)
		response := performRequest(
			t,
			handler,
			http.MethodPost,
			"/api/recap/events",
			bytes.NewReader(body),
			map[string]string{"Content-Type": "application/json"},
		)
		if response.Code != http.StatusNoContent {
			t.Fatalf("status = %d, want %d", response.Code, http.StatusNoContent)
		}
		if len(application.businessEvents) == 0 || application.businessEvents[len(application.businessEvents)-1] != "slide_viewed" {
			t.Fatalf("business events = %#v, want slide_viewed", application.businessEvents)
		}
		if application.ctaImpressions != 1 {
			t.Fatalf("CTA impressions = %d, want 1", application.ctaImpressions)
		}
	})

	t.Run("reject unknown business event", func(t *testing.T) {
		body := []byte(`{"event":"profile_deleted"}`)
		response := performRequest(
			t,
			handler,
			http.MethodPost,
			"/api/recap/events",
			bytes.NewReader(body),
			map[string]string{"Content-Type": "application/json"},
		)
		if response.Code != http.StatusBadRequest {
			t.Fatalf("status = %d, want %d", response.Code, http.StatusBadRequest)
		}
	})

	t.Run("missing recap", func(t *testing.T) {
		response := performRequest(t, handler, http.MethodGet, "/api/recap/"+testUserID.String()+"/2024", nil, nil)
		if response.Code != http.StatusNotFound {
			t.Fatalf("status = %d, want %d", response.Code, http.StatusNotFound)
		}
	})
}

func assertShareJSONIsSafe(t *testing.T, value any) {
	t.Helper()
	forbidden := map[string]struct{}{
		"id": {}, "user_id": {}, "ad_id": {}, "image_url": {},
		"shareable": {}, "reason": {}, "visualization": {}, "cta": {}, "params": {},
		"comparison": {}, "forecast": {},
	}
	var visit func(any)
	visit = func(current any) {
		switch typed := current.(type) {
		case map[string]any:
			for key, nested := range typed {
				if _, blocked := forbidden[key]; blocked {
					t.Errorf("share JSON contains forbidden field %q", key)
				}
				visit(nested)
			}
		case []any:
			for _, nested := range typed {
				visit(nested)
			}
		}
	}
	visit(value)
}
