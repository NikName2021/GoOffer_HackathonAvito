package integration

import (
	"bytes"
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
		if len(profiles) != 1 || profiles[0].ID != testUserID.String() {
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
		if profile.JoinedAt != "2018-04-14" || profile.Stats.ChatsCount != 43 {
			t.Fatalf("profile summary = %#v, want frontend card values", profile)
		}
		if profile.Stats.PurchasesCount != 3 || profile.Stats.SalesCount != 2 {
			t.Fatalf("deal counts = %#v, want 3 purchases and 2 sales", profile.Stats)
		}
		if profile.Stats.TotalSpent != 131480 || profile.Stats.TotalEarned != 36000 {
			t.Fatalf("money stats = %#v, want spent=131480 earned=36000", profile.Stats)
		}
		if profile.Stats.TotalViewCount != 12 || profile.Stats.ReviewsCount != 1 {
			t.Fatalf("activity stats = %#v, want views=12 reviews=1", profile.Stats)
		}
		if profile.Stats.AverageRating == nil || *profile.Stats.AverageRating != 5 {
			t.Fatalf("average rating = %#v, want 5", profile.Stats.AverageRating)
		}
		if profile.Highlights.FavoriteCategory == nil || *profile.Highlights.FavoriteCategory != "Электроника" {
			t.Fatalf("favorite category = %#v, want Электроника", profile.Highlights.FavoriteCategory)
		}
		if profile.Highlights.MostExpensivePurchase == nil || profile.Highlights.MostExpensivePurchase.Title != "Смартфон" {
			t.Fatalf("most expensive purchase = %#v", profile.Highlights.MostExpensivePurchase)
		}
		if len(profile.Views) != 3 || len(profile.OwnAds) != 2 {
			t.Fatalf("raw activity = %d views and %d own ads, want 3 and 2", len(profile.Views), len(profile.OwnAds))
		}
		if profile.Views[0].AdID == "" || len(profile.Views[0].ViewedAt) == 0 || profile.OwnAds[0].PublishedAt == "" {
			t.Fatalf("new activity contract is missing: views=%#v ownAds=%#v", profile.Views, profile.OwnAds)
		}
		if profile.Views[0].PurchasedAt != "2026-03-12T14:10" || profile.OwnAds[0].SoldAt != "2026-02-20" {
			t.Fatalf("raw activity dates = %#v / %#v", profile.Views[0], profile.OwnAds[0])
		}
	})

	t.Run("reject invalid id", func(t *testing.T) {
		response := performRequest(t, handler, http.MethodGet, "/api/profiles/not-a-uuid", nil, nil)
		if response.Code != http.StatusBadRequest {
			t.Fatalf("status = %d, want %d", response.Code, http.StatusBadRequest)
		}
	})
}

func TestProfileCRUDAndCalculatedAnalytics(t *testing.T) {
	application := newFakeApplication()
	handler := newTestHandler(t, application)

	createBody := `{
		"name":"Тестовый профиль",
		"joinedAt":"2024-08-01",
		"likes":12,
		"chatsCount":8,
		"views":[
			{"adId":"view-phone","title":"Телефон","category":"Электроника","price":118000,"viewCount":7,"viewedAt":[{"type":"watch","time":"2026-03-09T12:00"},{"type":"like","time":"2026-03-10T18:20"},{"type":"watch","time":"2026-03-12T14:10"},{"type":"buy","time":"2026-03-12T14:10","useAvitoDelivery":true}]},
			{"adId":"view-headphones","title":"Наушники","category":"Электроника","price":12990,"viewCount":3,"viewedAt":[{"type":"watch","time":"2026-05-04T16:45"},{"type":"buy","time":"2026-05-04T16:45","useAvitoDelivery":false}]},
			{"adId":"view-laptop","title":"Ноутбук","category":"Электроника","price":90000,"viewCount":2,"viewedAt":[{"type":"watch","time":"2026-06-01T10:00"}]}
		],
		"ownAds":[
			{"adId":"own-tablet","title":"Планшет","category":"Электроника","price":28500,"viewCount":214,"publishedAt":"2026-01-15","favoritesCount":31,"contactsCount":12,"city":"Москва","isArchived":true,"isSold":true,"soldAt":"2026-02-20","review":{"comment":"Всё отлично","rating":5,"createdAt":"2026-02-21"}},
			{"adId":"own-chair","title":"Кресло","category":"Для дома","price":7500,"viewCount":86,"publishedAt":"2026-05-01","favoritesCount":8,"contactsCount":4,"isArchived":true,"isSold":true,"soldAt":"2026-06-18"}
		]
	}`
	createdResponse := performRequest(t, handler, http.MethodPost, "/api/profiles", bytes.NewBufferString(createBody), map[string]string{
		"Content-Type": "application/json",
	})
	if createdResponse.Code != http.StatusCreated {
		t.Fatalf("create status = %d, want %d: %s", createdResponse.Code, http.StatusCreated, createdResponse.Body.String())
	}
	var created dto.ProfileResponse
	if err := json.NewDecoder(createdResponse.Body).Decode(&created); err != nil {
		t.Fatalf("decode created profile: %v", err)
	}
	if created.ID == "" || createdResponse.Header().Get("Location") != "/api/profiles/"+created.ID {
		t.Fatalf("created id/location = %q/%q", created.ID, createdResponse.Header().Get("Location"))
	}
	if created.Stats.PurchasesCount != 2 || created.Stats.SalesCount != 2 || created.Stats.TotalViewCount != 12 {
		t.Fatalf("calculated counts = %#v", created.Stats)
	}
	if created.Stats.TotalSpent != 130990 || created.Stats.TotalEarned != 36000 {
		t.Fatalf("calculated amounts = %#v", created.Stats)
	}
	if created.Stats.AverageRating == nil || *created.Stats.AverageRating != 5 {
		t.Fatalf("calculated rating = %#v", created.Stats.AverageRating)
	}
	if created.Highlights.MostExpensivePurchase == nil || created.Highlights.MostExpensivePurchase.Title != "Телефон" {
		t.Fatalf("purchase highlight = %#v", created.Highlights.MostExpensivePurchase)
	}
	if len(created.Views) != 3 || len(created.OwnAds) != 2 {
		t.Fatalf("created raw activity = %d views and %d own ads, want 3 and 2", len(created.Views), len(created.OwnAds))
	}
	if created.Views[0].FavoritedAt != "2026-03-10T18:20" || created.OwnAds[0].Review == nil {
		t.Fatalf("created raw activity lost editable fields: views=%#v ownAds=%#v", created.Views, created.OwnAds)
	}
	if created.Views[0].AdID != "view-phone" || len(created.Views[0].ViewedAt) != 4 || created.OwnAds[0].ContactsCount != 12 {
		t.Fatalf("created raw activity lost new fields: views=%#v ownAds=%#v", created.Views, created.OwnAds)
	}
	if delivery := created.Views[1].ViewedAt[1].UseAvitoDelivery; delivery == nil || *delivery {
		t.Fatalf("false useAvitoDelivery was not preserved: %#v", created.Views[1].ViewedAt)
	}

	roundTripBody, err := json.Marshal(dto.ProfileRequest{
		Name:       created.Name,
		JoinedAt:   created.JoinedAt,
		AvatarURL:  created.AvatarURL,
		Likes:      created.Stats.Likes,
		ChatsCount: created.Stats.ChatsCount,
		Views:      created.Views,
		OwnAds:     created.OwnAds,
	})
	if err != nil {
		t.Fatalf("encode GET-to-PUT payload: %v", err)
	}
	roundTripResponse := performRequest(t, handler, http.MethodPut, "/api/profiles/"+created.ID, bytes.NewReader(roundTripBody), map[string]string{
		"Content-Type": "application/json",
	})
	if roundTripResponse.Code != http.StatusOK {
		t.Fatalf("GET-to-PUT status = %d, want %d: %s", roundTripResponse.Code, http.StatusOK, roundTripResponse.Body.String())
	}
	var roundTripped dto.ProfileResponse
	if err := json.NewDecoder(roundTripResponse.Body).Decode(&roundTripped); err != nil {
		t.Fatalf("decode GET-to-PUT profile: %v", err)
	}
	if len(roundTripped.Views) != 3 || len(roundTripped.OwnAds) != 2 || roundTripped.Stats.TotalSpent != 130990 {
		t.Fatalf("GET-to-PUT lost profile data: %#v", roundTripped)
	}

	updateBody := `{
		"name":"Обновлённый профиль",
		"joinedAt":"2024-08-01",
		"likes":20,
		"chatsCount":9,
		"views":[{"adId":"view-book","title":"Книга","category":"Книги","price":900,"viewCount":4,"viewedAt":[{"type":"watch","time":"2026-07-01T12:00"},{"type":"buy","time":"2026-07-01T12:00","useAvitoDelivery":false}]}],
		"ownAds":[]
	}`
	updatedResponse := performRequest(t, handler, http.MethodPut, "/api/profiles/"+created.ID, bytes.NewBufferString(updateBody), map[string]string{
		"Content-Type": "application/json",
	})
	if updatedResponse.Code != http.StatusOK {
		t.Fatalf("update status = %d, want %d: %s", updatedResponse.Code, http.StatusOK, updatedResponse.Body.String())
	}
	var updated dto.ProfileResponse
	if err := json.NewDecoder(updatedResponse.Body).Decode(&updated); err != nil {
		t.Fatalf("decode updated profile: %v", err)
	}
	if updated.ID != created.ID || updated.Name != "Обновлённый профиль" || updated.Stats.TotalSpent != 900 || updated.Stats.SalesCount != 0 {
		t.Fatalf("updated profile = %#v", updated)
	}

	invalidResponse := performRequest(t, handler, http.MethodPost, "/api/profiles", bytes.NewBufferString(
		`{"name":"Ошибка","joinedAt":"2024-01-01","likes":0,"chatsCount":0,"views":[{"adId":"broken-buy","title":"Товар","category":"Категория","price":1,"viewCount":1,"viewedAt":[{"type":"watch","time":"2026-01-01T10:00"},{"type":"buy","time":"2026-01-01T10:00"}]}],"ownAds":[]}`,
	), map[string]string{"Content-Type": "application/json"})
	if invalidResponse.Code != http.StatusBadRequest {
		t.Fatalf("invalid profile status = %d, want %d", invalidResponse.Code, http.StatusBadRequest)
	}

	deletedResponse := performRequest(t, handler, http.MethodDelete, "/api/profiles/"+created.ID, nil, nil)
	if deletedResponse.Code != http.StatusNoContent {
		t.Fatalf("delete status = %d, want %d", deletedResponse.Code, http.StatusNoContent)
	}
	missingResponse := performRequest(t, handler, http.MethodGet, "/api/profiles/"+created.ID, nil, nil)
	if missingResponse.Code != http.StatusNotFound {
		t.Fatalf("deleted profile get status = %d, want %d", missingResponse.Code, http.StatusNotFound)
	}
}

func TestSystemMiddlewareAndDocs(t *testing.T) {
	application := newFakeApplication()
	handler := newTestHandler(t, application)

	t.Run("prometheus metrics", func(t *testing.T) {
		health := performRequest(t, handler, http.MethodGet, "/health", nil, nil)
		if health.Code != http.StatusOK {
			t.Fatalf("health status = %d, want %d", health.Code, http.StatusOK)
		}
		response := performRequest(t, handler, http.MethodGet, "/metrics", nil, nil)
		if response.Code != http.StatusOK {
			t.Fatalf("metrics status = %d, want %d", response.Code, http.StatusOK)
		}
		if contentType := response.Header().Get("Content-Type"); !strings.HasPrefix(contentType, "text/plain") {
			t.Fatalf("metrics Content-Type = %q, want Prometheus text format", contentType)
		}
		body := response.Body.String()
		for _, metric := range []string{
			"go_goroutines",
			"process_cpu_seconds_total",
			"gooffer_http_requests_total",
			"gooffer_http_request_duration_seconds",
		} {
			if !strings.Contains(body, metric) {
				t.Fatalf("metrics response does not contain %q", metric)
			}
		}
	})

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
		if methods := response.Header().Get("Access-Control-Allow-Methods"); !strings.Contains(methods, "PUT") || !strings.Contains(methods, "DELETE") {
			t.Fatalf("Access-Control-Allow-Methods = %q, want PUT and DELETE", methods)
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
