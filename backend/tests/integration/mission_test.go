package integration

import (
	"bytes"
	"encoding/json"
	"net/http"
	"testing"

	"gooffer/backend/internal/domain"
)

func TestMissionAPI(t *testing.T) {
	application := newFakeApplication()
	handler := newTestHandler(t, application)
	path := "/api/recap/" + testUserID.String() + "/2025/mission"

	t.Run("list options before selection", func(t *testing.T) {
		response := performRequest(t, handler, http.MethodGet, path, nil, nil)
		if response.Code != http.StatusOK {
			t.Fatalf("status = %d, want %d", response.Code, http.StatusOK)
		}
		var overview domain.MissionOverview
		if err := json.NewDecoder(response.Body).Decode(&overview); err != nil {
			t.Fatalf("decode overview: %v", err)
		}
		if len(overview.Options) != 3 || overview.Selected != nil || len(overview.SelectedMissions) != 0 {
			t.Fatalf("overview = %#v", overview)
		}
	})

	t.Run("select multiple missions", func(t *testing.T) {
		body := bytes.NewBufferString(`{"codes":["sell_three_items","try_avito_delivery"]}`)
		response := performRequest(t, handler, http.MethodPut, path, body, map[string]string{
			"Content-Type": "application/json",
		})
		if response.Code != http.StatusOK {
			t.Fatalf("status = %d, want %d", response.Code, http.StatusOK)
		}
		var overview domain.MissionOverview
		if err := json.NewDecoder(response.Body).Decode(&overview); err != nil {
			t.Fatalf("decode overview: %v", err)
		}
		if len(overview.SelectedMissions) != 2 || overview.SelectedMissions[0].Code != domain.MissionSellThreeItems ||
			overview.SelectedMissions[1].Code != domain.MissionTryDelivery || overview.Selected == nil {
			t.Fatalf("selected = %#v/%#v", overview.Selected, overview.SelectedMissions)
		}
	})

	t.Run("show missions in profile", func(t *testing.T) {
		response := performRequest(t, handler, http.MethodGet, "/api/profiles/"+testUserID.String()+"/missions", nil, nil)
		if response.Code != http.StatusOK {
			t.Fatalf("status = %d, want %d", response.Code, http.StatusOK)
		}
		var overview domain.ProfileMissionOverview
		if err := json.NewDecoder(response.Body).Decode(&overview); err != nil {
			t.Fatalf("decode profile missions: %v", err)
		}
		if len(overview.Missions) != 2 || overview.Missions[0].RecapYear != 2025 {
			t.Fatalf("profile missions = %#v", overview.Missions)
		}
	})

	t.Run("clear selected missions", func(t *testing.T) {
		body := bytes.NewBufferString(`{"codes":[]}`)
		response := performRequest(t, handler, http.MethodPut, path, body, map[string]string{
			"Content-Type": "application/json",
		})
		if response.Code != http.StatusOK {
			t.Fatalf("status = %d, want %d", response.Code, http.StatusOK)
		}
		var overview domain.MissionOverview
		if err := json.NewDecoder(response.Body).Decode(&overview); err != nil {
			t.Fatalf("decode overview: %v", err)
		}
		if len(overview.SelectedMissions) != 0 || overview.Selected != nil {
			t.Fatalf("selected missions = %#v/%#v", overview.SelectedMissions, overview.Selected)
		}
	})

	t.Run("support deprecated single code", func(t *testing.T) {
		body := bytes.NewBufferString(`{"code":"buy_from_favorites"}`)
		response := performRequest(t, handler, http.MethodPut, path, body, nil)
		if response.Code != http.StatusOK {
			t.Fatalf("status = %d, want %d", response.Code, http.StatusOK)
		}
	})

	t.Run("reject code and codes together", func(t *testing.T) {
		body := bytes.NewBufferString(`{"code":"buy_from_favorites","codes":["try_avito_delivery"]}`)
		response := performRequest(t, handler, http.MethodPut, path, body, nil)
		if response.Code != http.StatusBadRequest {
			t.Fatalf("status = %d, want %d", response.Code, http.StatusBadRequest)
		}
	})

	t.Run("reject unknown mission", func(t *testing.T) {
		body := bytes.NewBufferString(`{"codes":["unknown"]}`)
		response := performRequest(t, handler, http.MethodPut, path, body, nil)
		if response.Code != http.StatusBadRequest {
			t.Fatalf("status = %d, want %d", response.Code, http.StatusBadRequest)
		}
	})

	t.Run("require generated recap", func(t *testing.T) {
		missingPath := "/api/recap/" + testUserID.String() + "/2024/mission"
		response := performRequest(t, handler, http.MethodGet, missingPath, nil, nil)
		if response.Code != http.StatusNotFound {
			t.Fatalf("status = %d, want %d", response.Code, http.StatusNotFound)
		}
	})
}
