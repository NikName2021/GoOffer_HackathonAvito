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
		if len(overview.Options) != 3 || overview.Selected != nil {
			t.Fatalf("overview = %#v", overview)
		}
	})

	t.Run("select mission", func(t *testing.T) {
		body := bytes.NewBufferString(`{"code":"sell_three_items"}`)
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
		if overview.Selected == nil || overview.Selected.Code != domain.MissionSellThreeItems ||
			overview.Selected.Target != 3 || overview.Selected.Status != domain.MissionActive {
			t.Fatalf("selected = %#v", overview.Selected)
		}
	})

	t.Run("reject unknown mission", func(t *testing.T) {
		body := bytes.NewBufferString(`{"code":"unknown"}`)
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
