package integration

import (
	"encoding/json"
	"net/http"
	"strings"
	"testing"

	"gooffer/backend/internal/delivery/dto"
)

func TestProfilesAPI(t *testing.T) {
	application := newFakeApplication()
	handler := newTestHandler(t, application)

	t.Run("list profiles", func(t *testing.T) {
		response := performRequest(t, handler, http.MethodGet, "/api/profiles", nil, nil)

		if response.Code != http.StatusOK {
			t.Fatalf("status = %d, want %d", response.Code, http.StatusOK)
		}
		if !strings.HasPrefix(response.Header().Get("Content-Type"), "application/json") {
			t.Fatalf("Content-Type = %q, want application/json", response.Header().Get("Content-Type"))
		}
		if response.Header().Get("X-Request-ID") == "" {
			t.Fatal("X-Request-ID is empty")
		}

		var profiles []dto.ProfileResponse
		if err := json.NewDecoder(response.Body).Decode(&profiles); err != nil {
			t.Fatalf("decode profiles: %v", err)
		}
		if len(profiles) != 1 || profiles[0].ID != testUserID {
			t.Fatalf("profiles = %#v, want test profile", profiles)
		}
	})

	t.Run("get profile", func(t *testing.T) {
		response := performRequest(t, handler, http.MethodGet, "/api/profiles/"+testUserID.String(), nil, nil)
		if response.Code != http.StatusOK {
			t.Fatalf("status = %d, want %d", response.Code, http.StatusOK)
		}

		var profile dto.ProfileResponse
		if err := json.NewDecoder(response.Body).Decode(&profile); err != nil {
			t.Fatalf("decode profile: %v", err)
		}
		if profile.Name != "Анна Смирнова" {
			t.Fatalf("name = %q, want Анна Смирнова", profile.Name)
		}
		if profile.JoinedAt != "2018-04-14" || profile.ChatsCount != 43 {
			t.Fatalf("profile summary = %#v, want frontend card values", profile)
		}
		if profile.Metrics.City != "Москва" || profile.Metrics.ActiveDays != 163 {
			t.Fatalf("metrics = %#v, want Moscow/163", profile.Metrics)
		}
		if len(profile.Purchases) != 3 || profile.Purchases[0].Price != 118000 {
			t.Fatalf("purchases = %#v, want three detailed purchases", profile.Purchases)
		}
		var annualSpending int64
		for _, purchase := range profile.Purchases {
			annualSpending += purchase.Price
		}
		if annualSpending != 131480 {
			t.Fatalf("annual spending = %d, want 131480", annualSpending)
		}
		if len(profile.Sales) != 2 || len(profile.ListingViews) != 2 {
			t.Fatalf("sales/views are incomplete: sales=%d views=%d", len(profile.Sales), len(profile.ListingViews))
		}
	})

	t.Run("reject invalid id", func(t *testing.T) {
		response := performRequest(t, handler, http.MethodGet, "/api/profiles/not-a-uuid", nil, nil)
		if response.Code != http.StatusBadRequest {
			t.Fatalf("status = %d, want %d", response.Code, http.StatusBadRequest)
		}
	})
}

func TestSystemMiddlewareAndDocs(t *testing.T) {
	application := newFakeApplication()
	handler := newTestHandler(t, application)

	t.Run("cors preflight", func(t *testing.T) {
		response := performRequest(t, handler, http.MethodOptions, "/api/profiles", nil, map[string]string{
			"Origin": "http://localhost:5173",
		})
		if response.Code != http.StatusNoContent {
			t.Fatalf("status = %d, want %d", response.Code, http.StatusNoContent)
		}
		if got := response.Header().Get("Access-Control-Allow-Origin"); got != "http://localhost:5173" {
			t.Fatalf("Access-Control-Allow-Origin = %q", got)
		}
	})

	t.Run("swagger specification", func(t *testing.T) {
		response := performRequest(t, handler, http.MethodGet, "/docs/swagger.yaml", nil, nil)
		if response.Code != http.StatusOK {
			t.Fatalf("status = %d, want %d", response.Code, http.StatusOK)
		}
	})

	t.Run("recovery", func(t *testing.T) {
		application.panicProfiles = true
		response := performRequest(t, handler, http.MethodGet, "/api/profiles", nil, nil)
		if response.Code != http.StatusInternalServerError {
			t.Fatalf("status = %d, want %d", response.Code, http.StatusInternalServerError)
		}
	})
}
