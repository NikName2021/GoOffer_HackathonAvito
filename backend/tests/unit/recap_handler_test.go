package unit

import (
	"bytes"
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"gooffer/backend/internal/delivery/handlers"
	"gooffer/backend/internal/domain"
	"gooffer/backend/internal/usecase/generator"

	"github.com/google/uuid"
)

// --- stubs (совместимы с ports) ---

type handlerUserRepo struct{}

func (handlerUserRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	return &domain.User{ID: id, Name: "Test"}, nil
}

func (handlerUserRepo) ListProfiles(ctx context.Context) ([]domain.User, error) {
	return nil, nil
}

type handlerActionRepo struct{}

func (handlerActionRepo) GetByUserAndYear(ctx context.Context, userID uuid.UUID, year int) ([]domain.Action, error) {
	return []domain.Action{}, nil
}

type handlerRecapRepo struct{}

func (handlerRecapRepo) Save(ctx context.Context, recap *domain.Recap) error {
	return nil
}

func (handlerRecapRepo) GetByUserAndYear(ctx context.Context, userID uuid.UUID, year int) (*domain.Recap, error) {
	return nil, nil
}

type handlerCache struct{}

func (handlerCache) Get(ctx context.Context, key string, dest any) (bool, error) {
	return false, nil
}

func (handlerCache) Set(ctx context.Context, key string, value any, ttl time.Duration) error {
	return nil
}

func (handlerCache) Delete(ctx context.Context, key string) error {
	return nil
}

func newTestRecapHandler(t *testing.T) *handlers.RecapHandler {
	t.Helper()
	logger := slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelError}))
	gen := generator.New(
		logger,
		handlerUserRepo{},
		handlerActionRepo{},
		handlerRecapRepo{},
		handlerCache{},
	)
	return handlers.NewRecapHandler(logger, gen)
}

func TestGenerate_BadBody(t *testing.T) {
	h := newTestRecapHandler(t)
	req := httptest.NewRequest(http.MethodPost, "/api/recap/generate", bytes.NewBufferString(`{`))
	rec := httptest.NewRecorder()

	h.Generate(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status: got %d want 400, body=%s", rec.Code, rec.Body.String())
	}
}

func TestGenerate_MissingUserID(t *testing.T) {
	h := newTestRecapHandler(t)
	req := httptest.NewRequest(http.MethodPost, "/api/recap/generate", bytes.NewBufferString(`{"year":2025}`))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	h.Generate(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status: got %d want 400, body=%s", rec.Code, rec.Body.String())
	}
}

func TestGenerate_InvalidUUID(t *testing.T) {
	h := newTestRecapHandler(t)
	req := httptest.NewRequest(http.MethodPost, "/api/recap/generate", bytes.NewBufferString(
		`{"user_id":"not-a-uuid","year":2025}`,
	))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	h.Generate(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status: got %d want 400, body=%s", rec.Code, rec.Body.String())
	}
}

func TestGenerate_InvalidYear(t *testing.T) {
	h := newTestRecapHandler(t)
	req := httptest.NewRequest(http.MethodPost, "/api/recap/generate", bytes.NewBufferString(
		`{"user_id":"11111111-1111-1111-1111-111111111111","year":1999}`,
	))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	h.Generate(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status: got %d want 400, body=%s", rec.Code, rec.Body.String())
	}
}

func TestGenerate_UnknownFieldRejected(t *testing.T) {
	h := newTestRecapHandler(t)
	req := httptest.NewRequest(http.MethodPost, "/api/recap/generate", bytes.NewBufferString(
		`{"user_id":"11111111-1111-1111-1111-111111111111","year":2025,"extra":true}`,
	))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	h.Generate(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("DisallowUnknownFields: got %d want 400, body=%s", rec.Code, rec.Body.String())
	}
}

func TestGenerate_ValidRequest_CreatesRecap(t *testing.T) {
	h := newTestRecapHandler(t)
	req := httptest.NewRequest(http.MethodPost, "/api/recap/generate", bytes.NewBufferString(
		`{"user_id":"11111111-1111-1111-1111-111111111111","year":2025}`,
	))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	h.Generate(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("status: got %d want 201, body=%s", rec.Code, rec.Body.String())
	}
	var body map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("json: %v", err)
	}
	if body["year"] != float64(2025) {
		t.Fatalf("year: %+v", body["year"])
	}
}
