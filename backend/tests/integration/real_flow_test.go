package integration

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	goredis "github.com/redis/go-redis/v9"
	"gooffer/backend/internal/config"
	"gooffer/backend/internal/delivery/dto"
	"gooffer/backend/internal/domain"
	"gooffer/backend/internal/repository/postgres"
	redisrepo "gooffer/backend/internal/repository/redis"
	"gooffer/backend/internal/server"
	"gooffer/backend/internal/usecase/achievementdefinition"
	"gooffer/backend/internal/usecase/auth"
	"gooffer/backend/internal/usecase/carddefinition"
	"gooffer/backend/internal/usecase/generator"
	missionusecase "gooffer/backend/internal/usecase/mission"
	"gooffer/backend/internal/usecase/profile"
	"gooffer/backend/internal/usecase/recapshare"
	"gooffer/backend/migrations"
)

// TestRealApplicationFlow is intentionally skipped in the fast local job and
// mandatory in CI's postgres-integration job, where DB_PORT and REDIS_URL are
// set. It exercises the real repositories, migrations, cache and HTTP stack.
func TestRealApplicationFlow(t *testing.T) {
	if os.Getenv("DB_PORT") == "" {
		t.Skip("set DB_PORT and REDIS_URL to run real integration tests")
	}

	ctx := context.Background()
	cfg, err := config.Load()
	if err != nil {
		t.Fatalf("load config: %v", err)
	}
	pool, err := postgres.NewPool(ctx, cfg.DatabaseURL())
	if err != nil {
		t.Fatalf("connect postgres: %v", err)
	}
	defer pool.Close()
	if err := migrations.Apply(ctx, pool); err != nil {
		t.Fatalf("apply migrations: %v", err)
	}

	redisOptions, err := goredis.ParseURL(cfg.RedisURL)
	if err != nil {
		t.Fatalf("parse redis URL: %v", err)
	}
	redisClient := goredis.NewClient(redisOptions)
	defer func() { _ = redisClient.Close() }()
	if err := redisClient.Ping(ctx).Err(); err != nil {
		t.Fatalf("ping redis: %v", err)
	}

	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	userRepository := postgres.NewUserRepository(pool)
	cardDefinitionRepository := postgres.NewCardDefinitionRepository(pool)
	achievementDefinitionRepository := postgres.NewAchievementDefinitionRepository(pool)
	recapRepository := redisrepo.NewCachedRecapRepository(
		postgres.NewRecapRepository(pool),
		redisrepo.NewRecapCache(redisClient),
		logger,
	)
	handler := server.NewRouter(server.Dependencies{
		Auth:           auth.New(postgres.NewAuthRepository(pool), time.Hour),
		Profiles:       profile.New(logger, userRepository),
		RecapGenerator: generator.New(userRepository, recapRepository, cardDefinitionRepository, achievementDefinitionRepository),
		Recaps:         recapRepository,
		RecapShares: recapshare.New(
			userRepository,
			recapRepository,
			postgres.NewRecapShareRepository(pool),
			cfg.PublicBaseURL,
			cfg.RecapShareTTL,
		),
		Missions: missionusecase.New(
			userRepository,
			recapRepository,
			postgres.NewMissionRepository(pool),
		),
		AdminCards:        carddefinition.New(cardDefinitionRepository),
		AdminAchievements: achievementdefinition.New(achievementDefinitionRepository),
	}, server.Options{Logger: logger})
	adminLogin := realRequest(
		handler,
		http.MethodPost,
		"/api/auth/login",
		[]byte(`{"login":"nikita","password":"avito2026"}`),
		"",
	)
	if adminLogin.Code != http.StatusOK {
		t.Fatalf("nikita login status = %d: %s", adminLogin.Code, adminLogin.Body.String())
	}
	adminCookies := adminLogin.Result().Cookies()
	if len(adminCookies) != 1 {
		t.Fatalf("nikita login cookies = %#v, want one session", adminCookies)
	}
	adminCookie := adminCookies[0].Name + "=" + adminCookies[0].Value
	adminOptions := realRequest(
		handler,
		http.MethodGet,
		"/api/admin/card-definitions/options",
		nil,
		adminCookie,
	)
	if adminOptions.Code != http.StatusOK {
		t.Fatalf("nikita admin options status = %d: %s", adminOptions.Code, adminOptions.Body.String())
	}

	login := "flow-" + uuid.NewString()[:8]
	defer func() {
		_, _ = pool.Exec(ctx, `DELETE FROM accounts WHERE login = $1`, login)
	}()
	registration := realRequest(
		handler,
		http.MethodPost,
		"/api/auth/register",
		[]byte(fmt.Sprintf(`{"login":%q,"password":"strong-pass"}`, login)),
		"",
	)
	if registration.Code != http.StatusCreated {
		t.Fatalf("register status = %d: %s", registration.Code, registration.Body.String())
	}
	cookies := registration.Result().Cookies()
	if len(cookies) != 1 {
		t.Fatalf("registration cookies = %#v, want one session", cookies)
	}
	cookie := cookies[0].Name + "=" + cookies[0].Value

	year := time.Now().UTC().Year()
	profileBody := realProfileJSON(year, false)
	createdResponse := realRequest(handler, http.MethodPost, "/api/profiles", profileBody, cookie)
	if createdResponse.Code != http.StatusCreated {
		t.Fatalf("create profile status = %d: %s", createdResponse.Code, createdResponse.Body.String())
	}
	var created dto.ProfileResponse
	if err := json.NewDecoder(createdResponse.Body).Decode(&created); err != nil {
		t.Fatalf("decode profile: %v", err)
	}
	userID, err := uuid.Parse(created.ID)
	if err != nil {
		t.Fatalf("parse created profile ID: %v", err)
	}
	defer func() {
		_ = redisClient.Del(ctx, fmt.Sprintf("recap:v2:%s:%d", userID, year)).Err()
	}()

	generatePath := "/api/recap/generate"
	generateBody := []byte(fmt.Sprintf(`{"user_id":%q,"year":%d}`, userID.String(), year))
	generated := realRequest(handler, http.MethodPost, generatePath, generateBody, cookie)
	if generated.Code != http.StatusCreated {
		t.Fatalf("generate recap status = %d: %s", generated.Code, generated.Body.String())
	}

	updated := realRequest(handler, http.MethodPut, "/api/profiles/"+userID.String(), realProfileJSON(year, true), cookie)
	if updated.Code != http.StatusOK {
		t.Fatalf("update profile status = %d: %s", updated.Code, updated.Body.String())
	}
	regenerated := realRequest(handler, http.MethodPost, generatePath, generateBody, cookie)
	if regenerated.Code != http.StatusCreated {
		t.Fatalf("regenerate recap status = %d: %s", regenerated.Code, regenerated.Body.String())
	}
	getPath := fmt.Sprintf("/api/recap/%s/%d", userID, year)
	loaded := realRequest(handler, http.MethodGet, getPath, nil, cookie)
	if loaded.Code != http.StatusOK {
		t.Fatalf("get regenerated recap status = %d: %s", loaded.Code, loaded.Body.String())
	}
	var recap dto.RecapResponse
	if err := json.NewDecoder(loaded.Body).Decode(&recap); err != nil {
		t.Fatalf("decode regenerated recap: %v", err)
	}
	if recap.TotalViews != 2 {
		t.Fatalf("regenerated recap total_views = %d, want 2 after cache replacement", recap.TotalViews)
	}

	share := realRequest(handler, http.MethodGet, getPath+"/share", nil, cookie)
	if share.Code != http.StatusOK {
		t.Fatalf("share status = %d: %s", share.Code, share.Body.String())
	}
	var sharePayload any
	if err := json.NewDecoder(share.Body).Decode(&sharePayload); err != nil {
		t.Fatalf("decode share: %v", err)
	}
	assertShareJSONIsSafe(t, sharePayload)

	publicCreatedResponse := realRequest(
		handler,
		http.MethodPost,
		getPath+"/shares",
		[]byte(`{"card_ids":["year_overview"],"format":"mobile_story"}`),
		cookie,
	)
	if publicCreatedResponse.Code != http.StatusCreated {
		t.Fatalf("create public share status = %d: %s", publicCreatedResponse.Code, publicCreatedResponse.Body.String())
	}
	var publicCreated domain.RecapShareCreated
	if err := json.NewDecoder(publicCreatedResponse.Body).Decode(&publicCreated); err != nil {
		t.Fatalf("decode public share creation: %v", err)
	}
	publicToken := strings.TrimPrefix(publicCreated.PublicURL, cfg.PublicBaseURL+"/share/")
	publicPath := "/api/public/recap-shares/" + publicToken
	publicResponse := realRequest(handler, http.MethodGet, publicPath, nil, "")
	if publicResponse.Code != http.StatusOK || publicResponse.Header().Get("Cache-Control") != "no-store" {
		t.Fatalf("public share status/headers = %d/%#v: %s", publicResponse.Code, publicResponse.Header(), publicResponse.Body.String())
	}
	var publicPayload any
	if err := json.NewDecoder(publicResponse.Body).Decode(&publicPayload); err != nil {
		t.Fatalf("decode public share: %v", err)
	}
	assertShareJSONIsSafe(t, publicPayload)
	revoked := realRequest(
		handler,
		http.MethodDelete,
		"/api/recap-shares/"+publicCreated.ID.String(),
		nil,
		cookie,
	)
	if revoked.Code != http.StatusNoContent {
		t.Fatalf("revoke public share status = %d: %s", revoked.Code, revoked.Body.String())
	}
	if afterRevoke := realRequest(handler, http.MethodGet, publicPath, nil, ""); afterRevoke.Code != http.StatusNotFound {
		t.Fatalf("revoked public share status = %d, want 404", afterRevoke.Code)
	}

	mission := realRequest(
		handler,
		http.MethodPut,
		getPath+"/mission",
		[]byte(`{"codes":["sell_three_items","try_avito_delivery"]}`),
		cookie,
	)
	if mission.Code != http.StatusOK {
		t.Fatalf("select mission status = %d: %s", mission.Code, mission.Body.String())
	}
	var overview domain.MissionOverview
	if err := json.NewDecoder(mission.Body).Decode(&overview); err != nil {
		t.Fatalf("decode mission: %v", err)
	}
	if len(overview.SelectedMissions) != 2 || overview.SelectedMissions[0].Code != domain.MissionSellThreeItems {
		t.Fatalf("selected missions = %#v", overview.SelectedMissions)
	}
	profileMissions := realRequest(
		handler,
		http.MethodGet,
		"/api/profiles/"+userID.String()+"/missions",
		nil,
		cookie,
	)
	if profileMissions.Code != http.StatusOK {
		t.Fatalf("profile missions status = %d: %s", profileMissions.Code, profileMissions.Body.String())
	}
	var profileOverview domain.ProfileMissionOverview
	if err := json.NewDecoder(profileMissions.Body).Decode(&profileOverview); err != nil {
		t.Fatalf("decode profile missions: %v", err)
	}
	if len(profileOverview.Missions) != 2 || profileOverview.Missions[0].RecapYear != year {
		t.Fatalf("profile missions = %#v", profileOverview.Missions)
	}
}

func realProfileJSON(year int, includeSecondWatch bool) []byte {
	secondWatch := ""
	if includeSecondWatch {
		secondWatch = fmt.Sprintf(`,{"type":"watch","time":"%d-03-02T12:00:00Z"}`, year)
	}
	return []byte(fmt.Sprintf(`{
		"name":"Интеграционный профиль",
		"joinedAt":"2020-01-01",
		"likes":50,
		"chatsCount":50,
		"views":[{
			"adId":"view-phone","title":"Телефон","category":"Электроника",
			"price":10000,"viewCount":2,
			"viewedAt":[{"type":"watch","time":"%d-03-01T12:00:00Z"}%s]
		}],
		"ownAds":[{
			"adId":"own-chair","title":"Кресло","category":"Дом","price":5000,
			"viewCount":12,"publishedAt":"%d-02-01","favoritesCount":3,
			"contactsCount":2,"isArchived":true,"isSold":true,"soldAt":"%d-02-10"
		}]
	}`, year, secondWatch, year, year))
}

func realRequest(handler http.Handler, method, path string, body []byte, cookie string) *httptest.ResponseRecorder {
	request := httptest.NewRequest(method, path, bytes.NewReader(body))
	if body != nil {
		request.Header.Set("Content-Type", "application/json")
	}
	if cookie != "" {
		request.Header.Set("Cookie", cookie)
	}
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, request)
	return response
}
