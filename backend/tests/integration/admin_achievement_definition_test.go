package integration

import (
	"bytes"
	"encoding/json"
	"net/http"
	"testing"

	"gooffer/backend/internal/domain"
)

func TestAdminAchievementDefinitionAPI(t *testing.T) {
	t.Run("regular account is forbidden", func(t *testing.T) {
		application := newFakeApplication()
		credential := application.credentials["nikita"]
		credential.account.IsAdmin = false
		application.credentials["nikita"] = credential
		handler := newTestHandler(t, application)

		response := performRequest(t, handler, http.MethodGet, "/api/admin/achievement-definitions", nil, nil)
		if response.Code != http.StatusForbidden {
			t.Fatalf("status = %d, want %d", response.Code, http.StatusForbidden)
		}
	})

	t.Run("administrator can list and edit an existing achievement", func(t *testing.T) {
		application := newFakeApplication()
		handler := newTestHandler(t, application)

		options := performRequest(t, handler, http.MethodGet, "/api/admin/achievement-definitions/options", nil, nil)
		if options.Code != http.StatusOK {
			t.Fatalf("options status = %d: %s", options.Code, options.Body.String())
		}

		listed := performRequest(t, handler, http.MethodGet, "/api/admin/achievement-definitions", nil, nil)
		if listed.Code != http.StatusOK {
			t.Fatalf("list status = %d: %s", listed.Code, listed.Body.String())
		}

		body := bytes.NewBufferString(`{"title":"Очень любопытный","description":"Новая цель","icon":"🚀","metric":"purchases","condition_operator":"gte","condition_value":20,"is_active":false}`)
		updatedResponse := performRequest(
			t,
			handler,
			http.MethodPut,
			"/api/admin/achievement-definitions/curious",
			body,
			map[string]string{"Content-Type": "application/json"},
		)
		if updatedResponse.Code != http.StatusOK {
			t.Fatalf("update status = %d: %s", updatedResponse.Code, updatedResponse.Body.String())
		}
		var updated domain.AchievementDefinition
		if err := json.NewDecoder(updatedResponse.Body).Decode(&updated); err != nil {
			t.Fatalf("decode updated achievement: %v", err)
		}
		if updated.Slug != "curious" || updated.Category != "views" || updated.SortOrder != 10 {
			t.Fatalf("immutable fields changed: %#v", updated)
		}
		if updated.Title != "Очень любопытный" || updated.IsActive {
			t.Fatalf("editable fields were not updated: %#v", updated)
		}

		createResponse := performRequest(
			t,
			handler,
			http.MethodPost,
			"/api/admin/achievement-definitions",
			bytes.NewBufferString(`{}`),
			map[string]string{"Content-Type": "application/json"},
		)
		if createResponse.Code >= http.StatusOK && createResponse.Code < http.StatusMultipleChoices {
			t.Fatalf("create unexpectedly succeeded with status %d", createResponse.Code)
		}
		deleteResponse := performRequest(
			t,
			handler,
			http.MethodDelete,
			"/api/admin/achievement-definitions/curious",
			nil,
			nil,
		)
		if deleteResponse.Code >= http.StatusOK && deleteResponse.Code < http.StatusMultipleChoices {
			t.Fatalf("delete unexpectedly succeeded with status %d", deleteResponse.Code)
		}
	})

	t.Run("update rejects omitted active flag and immutable fields", func(t *testing.T) {
		application := newFakeApplication()
		handler := newTestHandler(t, application)

		missingActive := performRequest(
			t,
			handler,
			http.MethodPut,
			"/api/admin/achievement-definitions/curious",
			bytes.NewBufferString(`{"title":"Любопытный","description":"Цель","icon":"👀","metric":"total_views","condition_operator":"gte","condition_value":500}`),
			map[string]string{"Content-Type": "application/json"},
		)
		if missingActive.Code != http.StatusBadRequest {
			t.Fatalf("missing is_active status = %d, want %d", missingActive.Code, http.StatusBadRequest)
		}

		immutableField := performRequest(
			t,
			handler,
			http.MethodPut,
			"/api/admin/achievement-definitions/curious",
			bytes.NewBufferString(`{"slug":"changed","title":"Любопытный","description":"Цель","icon":"👀","metric":"total_views","condition_operator":"gte","condition_value":500,"is_active":true}`),
			map[string]string{"Content-Type": "application/json"},
		)
		if immutableField.Code != http.StatusBadRequest {
			t.Fatalf("immutable field status = %d, want %d", immutableField.Code, http.StatusBadRequest)
		}
	})
}
