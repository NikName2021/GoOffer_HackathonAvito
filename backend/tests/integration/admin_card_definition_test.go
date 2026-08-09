package integration

import (
	"bytes"
	"encoding/json"
	"net/http"
	"testing"

	"gooffer/backend/internal/domain"
)

func TestAdminCardDefinitionAPI(t *testing.T) {
	t.Run("regular account is forbidden", func(t *testing.T) {
		application := newFakeApplication()
		credential := application.credentials["nikita"]
		credential.account.IsAdmin = false
		application.credentials["nikita"] = credential
		handler := newTestHandler(t, application)

		response := performRequest(t, handler, http.MethodGet, "/api/admin/card-definitions", nil, nil)
		if response.Code != http.StatusForbidden {
			t.Fatalf("status = %d, want %d", response.Code, http.StatusForbidden)
		}
	})

	t.Run("nikita can manage definitions", func(t *testing.T) {
		application := newFakeApplication()
		handler := newTestHandler(t, application)

		options := performRequest(t, handler, http.MethodGet, "/api/admin/card-definitions/options", nil, nil)
		if options.Code != http.StatusOK {
			t.Fatalf("options status = %d: %s", options.Code, options.Body.String())
		}

		body := bytes.NewBufferString(`{"name":"Активность","metric":"total_views","title":"Вы активно искали"}`)
		createdResponse := performRequest(t, handler, http.MethodPost, "/api/admin/card-definitions", body, map[string]string{
			"Content-Type": "application/json",
		})
		if createdResponse.Code != http.StatusCreated {
			t.Fatalf("create status = %d: %s", createdResponse.Code, createdResponse.Body.String())
		}
		var created domain.CardDefinition
		if err := json.NewDecoder(createdResponse.Body).Decode(&created); err != nil {
			t.Fatalf("decode created definition: %v", err)
		}
		if created.ID.String() == "" || created.CreatedBy != testAccountID {
			t.Fatalf("created definition = %#v", created)
		}

		updateBody := bytes.NewBufferString(`{"name":"Пик активности","kind":"highlight","metric":"total_views","title":"Ваш лучший месяц","is_active":false}`)
		updated := performRequest(t, handler, http.MethodPut, "/api/admin/card-definitions/"+created.ID.String(), updateBody, map[string]string{
			"Content-Type": "application/json",
		})
		if updated.Code != http.StatusOK {
			t.Fatalf("update status = %d: %s", updated.Code, updated.Body.String())
		}

		listed := performRequest(t, handler, http.MethodGet, "/api/admin/card-definitions", nil, nil)
		if listed.Code != http.StatusOK {
			t.Fatalf("list status = %d: %s", listed.Code, listed.Body.String())
		}

		deleted := performRequest(t, handler, http.MethodDelete, "/api/admin/card-definitions/"+created.ID.String(), nil, nil)
		if deleted.Code != http.StatusNoContent {
			t.Fatalf("delete status = %d: %s", deleted.Code, deleted.Body.String())
		}
	})
}
