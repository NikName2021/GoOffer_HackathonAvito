package unit

import (
	"context"
	"errors"
	"log/slog"
	"strconv"
	"testing"
	"time"

	"gooffer/backend/internal/domain"
	"gooffer/backend/internal/usecase/generator"

	"github.com/google/uuid"
)

func recapKey(userID uuid.UUID, year int) string {
	return userID.String() + ":" + strconv.Itoa(year)
}

type mockUserRepo struct {
	users map[uuid.UUID]domain.User
	err   error
}

func (m *mockUserRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	if m.err != nil {
		return nil, m.err
	}
	if user, ok := m.users[id]; ok {
		return &user, nil
	}
	return nil, errors.New("user not found")
}

func (m *mockUserRepo) ListProfiles(ctx context.Context) ([]domain.User, error) {
	var list []domain.User
	for _, u := range m.users {
		list = append(list, u)
	}
	return list, nil
}

type mockActionRepo struct {
	actions map[string][]domain.Action
	err     error
}

func (m *mockActionRepo) GetByUserAndYear(ctx context.Context, userID uuid.UUID, year int) ([]domain.Action, error) {
	if m.err != nil {
		return nil, m.err
	}
	key := recapKey(userID, year)
	if actions, ok := m.actions[key]; ok {
		return actions, nil
	}
	return []domain.Action{}, nil
}

type mockRecapRepo struct {
	recaps map[string]domain.Recap
	err    error
}

func (m *mockRecapRepo) Save(ctx context.Context, recap *domain.Recap) error {
	if m.err != nil {
		return m.err
	}
	key := recapKey(recap.UserID, recap.Year)
	m.recaps[key] = *recap
	return nil
}

func (m *mockRecapRepo) GetByUserAndYear(ctx context.Context, userID uuid.UUID, year int) (*domain.Recap, error) {
	if m.err != nil {
		return nil, m.err
	}
	key := recapKey(userID, year)
	if recap, ok := m.recaps[key]; ok {
		return &recap, nil
	}
	return nil, nil
}

type mockCache struct {
	data map[string]interface{}
	err  error
}

func (m *mockCache) Get(ctx context.Context, key string, dest any) (bool, error) {
	if m.err != nil {
		return false, m.err
	}
	if val, ok := m.data[key]; ok {
		switch d := dest.(type) {
		case *domain.Recap:
			if v, ok := val.(domain.Recap); ok {
				*d = v
			}
		case *[]domain.User:
			if v, ok := val.([]domain.User); ok {
				*d = v
			}
		}
		return true, nil
	}
	return false, nil
}

func (m *mockCache) Set(ctx context.Context, key string, value any, ttl time.Duration) error {
	if m.err != nil {
		return m.err
	}
	m.data[key] = value
	return nil
}

func (m *mockCache) Delete(ctx context.Context, key string) error {
	if m.err != nil {
		return m.err
	}
	delete(m.data, key)
	return nil
}

// ТЕСТЫ

func TestGenerator_Execute_Success(t *testing.T) {
	userID := uuid.New()
	year := 2025

	userRepo := &mockUserRepo{
		users: map[uuid.UUID]domain.User{
			userID: {ID: userID, Name: "Test User"},
		},
	}

	actionRepo := &mockActionRepo{
		actions: map[string][]domain.Action{
			recapKey(userID, year): {
				{ID: uuid.New(), UserID: userID, Type: domain.ActionView, Category: "Electronics", CreatedAt: time.Now()},
				{ID: uuid.New(), UserID: userID, Type: domain.ActionView, Category: "Electronics", CreatedAt: time.Now()},
				{ID: uuid.New(), UserID: userID, Type: domain.ActionMessage, Category: "Auto", CreatedAt: time.Now()},
			},
		},
	}

	recapRepo := &mockRecapRepo{recaps: make(map[string]domain.Recap)}
	cache := &mockCache{data: make(map[string]interface{})}
	logger := slog.Default()

	gen := generator.New(logger, userRepo, actionRepo, recapRepo, cache)

	recap, err := gen.Execute(context.Background(), userID, year)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if recap.UserID != userID {
		t.Errorf("expected userID %v, got %v", userID, recap.UserID)
	}
	if recap.TotalViews != 2 {
		t.Errorf("expected 2 views, got %d", recap.TotalViews)
	}
	if recap.TotalMessages != 1 {
		t.Errorf("expected 1 message, got %d", recap.TotalMessages)
	}
}

func TestGenerator_Execute_NoActions(t *testing.T) {
	userID := uuid.New()
	year := 2025

	userRepo := &mockUserRepo{
		users: map[uuid.UUID]domain.User{
			userID: {ID: userID, Name: "Test User"},
		},
	}

	actionRepo := &mockActionRepo{
		actions: map[string][]domain.Action{},
	}

	recapRepo := &mockRecapRepo{recaps: make(map[string]domain.Recap)}
	cache := &mockCache{data: make(map[string]interface{})}
	logger := slog.Default()

	gen := generator.New(logger, userRepo, actionRepo, recapRepo, cache)

	recap, err := gen.Execute(context.Background(), userID, year)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if recap.TotalViews != 0 {
		t.Errorf("expected 0 views, got %d", recap.TotalViews)
	}
	if len(recap.Achievements) != 0 {
		t.Errorf("expected 0 achievements, got %d", len(recap.Achievements))
	}
}

func TestGenerator_UserNotFound(t *testing.T) {
	userID := uuid.New()
	year := 2025

	userRepo := &mockUserRepo{
		users: map[uuid.UUID]domain.User{},
		err:   errors.New("user not found"),
	}

	actionRepo := &mockActionRepo{actions: make(map[string][]domain.Action)}
	recapRepo := &mockRecapRepo{recaps: make(map[string]domain.Recap)}
	cache := &mockCache{data: make(map[string]interface{})}
	logger := slog.Default()

	gen := generator.New(logger, userRepo, actionRepo, recapRepo, cache)

	_, err := gen.Execute(context.Background(), userID, year)

	if err == nil {
		t.Fatal("expected error, got nil")
	}
}

func TestCalculateMetrics(t *testing.T) {
	userID := uuid.New()
	actions := []domain.Action{
		{UserID: userID, Type: domain.ActionView, Category: "Electronics", CreatedAt: time.Now()},
		{UserID: userID, Type: domain.ActionView, Category: "Electronics", CreatedAt: time.Now()},
		{UserID: userID, Type: domain.ActionMessage, Category: "Auto", CreatedAt: time.Now()},
		{UserID: userID, Type: domain.ActionPurchase, Category: "Auto", CreatedAt: time.Now()},
		{UserID: userID, Type: domain.ActionFavorite, Category: "Books", CreatedAt: time.Now()},
	}

	userRepo := &mockUserRepo{
		users: map[uuid.UUID]domain.User{
			userID: {ID: userID, Name: "Test User"},
		},
	}

	actionRepo := &mockActionRepo{
		actions: map[string][]domain.Action{
			recapKey(userID, 2025): actions,
		},
	}

	recapRepo := &mockRecapRepo{recaps: make(map[string]domain.Recap)}
	cache := &mockCache{data: make(map[string]interface{})}
	logger := slog.Default()

	gen := generator.New(logger, userRepo, actionRepo, recapRepo, cache)

	recap, err := gen.Execute(context.Background(), userID, 2025)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if recap.TotalViews != 2 {
		t.Errorf("expected 2 views, got %d", recap.TotalViews)
	}
	if recap.TotalMessages != 1 {
		t.Errorf("expected 1 message, got %d", recap.TotalMessages)
	}
	if recap.TotalPurchases != 1 {
		t.Errorf("expected 1 purchase, got %d", recap.TotalPurchases)
	}
	if recap.TotalFavorites != 1 {
		t.Errorf("expected 1 favorite, got %d", recap.TotalFavorites)
	}
}

func TestAssignAchievements(t *testing.T) {
	userID := uuid.New()
	year := 2025

	var actions []domain.Action
	for i := 0; i < 1500; i++ {
		actions = append(actions, domain.Action{
			ID: uuid.New(), UserID: userID,
			Type: domain.ActionView, Category: "Electronics",
			CreatedAt: time.Now().AddDate(0, 0, -i),
		})
	}
	for i := 0; i < 100; i++ {
		actions = append(actions, domain.Action{
			ID: uuid.New(), UserID: userID,
			Type: domain.ActionMessage, Category: "Auto",
			CreatedAt: time.Now().AddDate(0, 0, -i),
		})
	}
	for i := 0; i < 15; i++ {
		actions = append(actions, domain.Action{
			ID: uuid.New(), UserID: userID,
			Type: domain.ActionPurchase, Category: "Books",
			CreatedAt: time.Now(),
		})
	}
	for i := 0; i < 10; i++ {
		actions = append(actions, domain.Action{
			ID: uuid.New(), UserID: userID,
			Type: domain.ActionSale, Category: "Electronics",
			CreatedAt: time.Now(),
		})
	}

	userRepo := &mockUserRepo{
		users: map[uuid.UUID]domain.User{
			userID: {ID: userID, Name: "Test User"},
		},
	}

	actionRepo := &mockActionRepo{
		actions: map[string][]domain.Action{
			recapKey(userID, year): actions,
		},
	}

	recapRepo := &mockRecapRepo{recaps: make(map[string]domain.Recap)}
	cache := &mockCache{data: make(map[string]interface{})}
	logger := slog.Default()

	gen := generator.New(logger, userRepo, actionRepo, recapRepo, cache)

	recap, err := gen.Execute(context.Background(), userID, year)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if len(recap.Achievements) == 0 {
		t.Error("expected achievements, got none")
	}
}

func (m *mockUserRepo) Create(ctx context.Context, user *domain.User) error {
	if m.users == nil {
		m.users = map[uuid.UUID]domain.User{}
	}
	m.users[user.ID] = *user
	return nil
}

func (m *mockUserRepo) Delete(ctx context.Context, id uuid.UUID) error {
	delete(m.users, id)
	return nil
}

func (m *mockActionRepo) SeedDemoActivity(ctx context.Context, userID uuid.UUID, profileType string, year int) error {
	return nil
}
