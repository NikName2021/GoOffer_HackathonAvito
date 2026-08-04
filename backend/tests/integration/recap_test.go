package integration

import (
	"bytes"
	"encoding/json"
	"net/http"
	"testing"

	"gooffer/backend/internal/delivery/dto"
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
		if _, exists := payload["id"]; exists {
			t.Fatal("share response contains id")
		}
		if _, exists := payload["user_id"]; exists {
			t.Fatal("share response contains user_id")
		}
	})

	t.Run("missing recap", func(t *testing.T) {
		response := performRequest(t, handler, http.MethodGet, "/api/recap/"+testUserID.String()+"/2024", nil, nil)
		if response.Code != http.StatusNotFound {
			t.Fatalf("status = %d, want %d", response.Code, http.StatusNotFound)
		}
	})
}
