package integration

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"

	"gooffer/backend/internal/delivery/handlers"
	"gooffer/backend/internal/delivery/middleware"
	"gooffer/backend/internal/domain"
	"gooffer/backend/internal/usecase/generator"
	"gooffer/backend/internal/usecase/profile"

	"github.com/google/uuid"
)

var (
	sellerID  = uuid.MustParse("11111111-1111-1111-1111-111111111111")
	buyerID   = uuid.MustParse("22222222-2222-2222-2222-222222222222")
	veteranID = uuid.MustParse("33333333-3333-3333-3333-333333333333")
	newbieID  = uuid.MustParse("44444444-4444-4444-4444-444444444444")
	unknownID = uuid.MustParse("99999999-9999-9999-9999-999999999999")
)

type memUserRepo struct {
	mu    sync.RWMutex
	users map[uuid.UUID]domain.User
}

func newMemUserRepo() *memUserRepo {
	now := time.Date(2020, 1, 1, 0, 0, 0, 0, time.UTC)
	users := map[uuid.UUID]domain.User{
		sellerID:  {ID: sellerID, Name: "Алексей Продавец", Avatar: "https://i.pravatar.cc/150?img=1", ProfileType: "seller", RegisteredAt: now},
		buyerID:   {ID: buyerID, Name: "Мария Покупатель", Avatar: "https://i.pravatar.cc/150?img=2", ProfileType: "buyer", RegisteredAt: now},
		veteranID: {ID: veteranID, Name: "Иван Ветеран", Avatar: "https://i.pravatar.cc/150?img=3", ProfileType: "veteran", RegisteredAt: now},
		newbieID:  {ID: newbieID, Name: "Елена Новичок", Avatar: "https://i.pravatar.cc/150?img=4", ProfileType: "newbie", RegisteredAt: now},
	}
	return &memUserRepo{users: users}
}

func (r *memUserRepo) GetByID(_ context.Context, id uuid.UUID) (*domain.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	u, ok := r.users[id]
	if !ok {
		return nil, fmt.Errorf("user not found")
	}
	cp := u
	return &cp, nil
}

func (r *memUserRepo) ListProfiles(_ context.Context) ([]domain.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	out := make([]domain.User, 0, len(r.users))
	for _, u := range r.users {
		out = append(out, u)
	}
	return out, nil
}

type memActionRepo struct {
	mu      sync.RWMutex
	actions map[uuid.UUID][]domain.Action
}

func newMemActionRepo() *memActionRepo {
	repo := &memActionRepo{actions: make(map[uuid.UUID][]domain.Action)}

	// Мария: достаточно для explorer + social + shopaholic
	repo.actions[buyerID] = buildActions(buyerID, map[domain.ActionType]int{
		domain.ActionView:     1100,
		domain.ActionMessage:  55,
		domain.ActionFavorite: 160,
		domain.ActionPurchase: 14,
		domain.ActionSale:     1,
	}, "Недвижимость", 180)

	// Алексей: seller_master
	repo.actions[sellerID] = buildActions(sellerID, map[domain.ActionType]int{
		domain.ActionView:     620,
		domain.ActionMessage:  40,
		domain.ActionFavorite: 30,
		domain.ActionPurchase: 3,
		domain.ActionSale:     12,
	}, "Электроника", 200)

	// Иван: veteran + explorer
	repo.actions[veteranID] = buildActions(veteranID, map[domain.ActionType]int{
		domain.ActionView:     1300,
		domain.ActionMessage:  70,
		domain.ActionFavorite: 90,
		domain.ActionPurchase: 11,
		domain.ActionSale:     6,
	}, "Работа", 320)

	// Елена: мало данных, без ачивок
	repo.actions[newbieID] = buildActions(newbieID, map[domain.ActionType]int{
		domain.ActionView:     45,
		domain.ActionMessage:  3,
		domain.ActionFavorite: 4,
	}, "Электроника", 20)

	return repo
}

func buildActions(userID uuid.UUID, counts map[domain.ActionType]int, category string, daySpan int) []domain.Action {
	base := time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC)
	out := make([]domain.Action, 0)
	seq := 0
	for typ, n := range counts {
		for i := 0; i < n; i++ {
			seq++
			out = append(out, domain.Action{
				ID:        uuid.New(),
				UserID:    userID,
				Type:      typ,
				Category:  category,
				CreatedAt: base.AddDate(0, 0, (seq-1)%daySpan).Add(time.Duration(seq) * time.Minute),
			})
		}
	}
	return out
}

func (r *memActionRepo) GetByUserAndYear(_ context.Context, userID uuid.UUID, year int) ([]domain.Action, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	all := r.actions[userID]
	out := make([]domain.Action, 0, len(all))
	for _, a := range all {
		if a.CreatedAt.Year() == year {
			out = append(out, a)
		}
	}
	return out, nil
}

type memRecapRepo struct {
	mu     sync.RWMutex
	recaps map[string]domain.Recap
}

func newMemRecapRepo() *memRecapRepo {
	return &memRecapRepo{recaps: make(map[string]domain.Recap)}
}

func recapKey(userID uuid.UUID, year int) string {
	return fmt.Sprintf("%s:%d", userID.String(), year)
}

func (r *memRecapRepo) Save(_ context.Context, recap *domain.Recap) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	cp := *recap
	r.recaps[recapKey(recap.UserID, recap.Year)] = cp
	return nil
}

func (r *memRecapRepo) GetByUserAndYear(_ context.Context, userID uuid.UUID, year int) (*domain.Recap, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	recap, ok := r.recaps[recapKey(userID, year)]
	if !ok {
		return nil, nil
	}
	cp := recap
	return &cp, nil
}

type memCache struct {
	mu   sync.RWMutex
	data map[string][]byte
}

func newMemCache() *memCache {
	return &memCache{data: make(map[string][]byte)}
}

func (c *memCache) Get(_ context.Context, key string, dest any) (bool, error) {
	c.mu.RLock()
	raw, ok := c.data[key]
	c.mu.RUnlock()
	if !ok {
		return false, nil
	}
	if err := json.Unmarshal(raw, dest); err != nil {
		return false, err
	}
	return true, nil
}

func (c *memCache) Set(_ context.Context, key string, value any, _ time.Duration) error {
	raw, err := json.Marshal(value)
	if err != nil {
		return err
	}
	c.mu.Lock()
	c.data[key] = raw
	c.mu.Unlock()
	return nil
}

func (c *memCache) Delete(_ context.Context, key string) error {
	c.mu.Lock()
	delete(c.data, key)
	c.mu.Unlock()
	return nil
}

func (r *memUserRepo) Create(_ context.Context, user *domain.User) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if user.ID == uuid.Nil {
		user.ID = uuid.New()
	}
	r.users[user.ID] = *user
	return nil
}

func (r *memUserRepo) Delete(_ context.Context, id uuid.UUID) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, ok := r.users[id]; !ok {
		return fmt.Errorf("user not found")
	}
	delete(r.users, id)
	return nil
}

func (r *memActionRepo) SeedDemoActivity(_ context.Context, userID uuid.UUID, profileType string, year int) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	counts := map[domain.ActionType]int{
		domain.ActionView:     100,
		domain.ActionMessage:  10,
		domain.ActionFavorite: 10,
	}
	r.actions[userID] = buildActions(userID, counts, "Электроника", 30)
	_, _ = profileType, year
	return nil
}

type testApp struct {
	handler http.Handler
}

func newTestApp(t *testing.T) *testApp {
	t.Helper()

	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	userRepo := newMemUserRepo()
	actionRepo := newMemActionRepo()
	recapRepo := newMemRecapRepo()
	cache := newMemCache()

	profileSvc := profile.New(logger, userRepo, actionRepo)
	gen := generator.New(logger, userRepo, actionRepo, recapRepo, cache)

	profileHandler := handlers.NewProfileHandler(logger, profileSvc)
	recapHandler := handlers.NewRecapHandler(logger, gen)

	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})
	mux.HandleFunc("GET /api/profiles", profileHandler.List)
	mux.HandleFunc("GET /api/profiles/{id}", profileHandler.GetByID)
	mux.HandleFunc("POST /api/recap/generate", recapHandler.Generate)
	mux.HandleFunc("GET /api/recap/{user_id}/{year}", recapHandler.Get)
	mux.HandleFunc("GET /api/recap/{user_id}/{year}/share", recapHandler.Share)

	var h http.Handler = mux
	h = middleware.Recovery(logger)(h)
	h = middleware.Logger(logger)(h)
	h = middleware.CORS(h)

	return &testApp{handler: h}
}

func (a *testApp) do(t *testing.T, method, path string, body io.Reader, headers map[string]string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(method, path, body)
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	rr := httptest.NewRecorder()
	a.handler.ServeHTTP(rr, req)
	return rr
}

func decodeJSON[T any](t *testing.T, rr *httptest.ResponseRecorder) T {
	t.Helper()
	var v T
	if err := json.NewDecoder(rr.Body).Decode(&v); err != nil {
		t.Fatalf("decode json: %v\nbody=%s", err, rr.Body.String())
	}
	return v
}

var _ = errors.New
var _ = strings.Contains
