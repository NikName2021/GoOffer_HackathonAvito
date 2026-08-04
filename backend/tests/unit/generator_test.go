package unit

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"
	"gooffer/backend/internal/domain"
	"gooffer/backend/internal/usecase/generator"
)

type mockUserRepo struct {
	users map[uuid.UUID]domain.User
	err   error // добавляем поддержку ошибок
}

func (m *mockUserRepo) GetByID(ctx context.Context, _ uuid.UUID, id uuid.UUID) (*domain.User, error) {
	if m.err != nil {
		return nil, m.err
	}
	if user, ok := m.users[id]; ok {
		return &user, nil
	}
	return nil, errors.New("user not found")
}

func (m *mockUserRepo) ListProfiles(ctx context.Context, _ uuid.UUID) ([]domain.User, error) {
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
	key := userID.String() + ":" + string(rune(year))
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
	key := recap.UserID.String() + ":" + string(rune(recap.Year))
	m.recaps[key] = *recap
	return nil
}

func (m *mockRecapRepo) GetByUserAndYear(ctx context.Context, userID uuid.UUID, year int) (*domain.Recap, error) {
	if m.err != nil {
		return nil, m.err
	}
	key := userID.String() + ":" + string(rune(year))
	if recap, ok := m.recaps[key]; ok {
		return &recap, nil
	}
	return nil, nil
}

// ТЕСТЫ

var generatorAccountID = uuid.MustParse("99999999-9999-4999-8999-999999999999")

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
			userID.String() + ":" + string(rune(year)): {
				{ID: uuid.New(), UserID: userID, Type: domain.ActionView, Category: "Electronics", CreatedAt: time.Now()},
				{ID: uuid.New(), UserID: userID, Type: domain.ActionView, Category: "Electronics", CreatedAt: time.Now()},
				{ID: uuid.New(), UserID: userID, Type: domain.ActionMessage, Category: "Auto", CreatedAt: time.Now()},
			},
		},
	}

	recapRepo := &mockRecapRepo{recaps: make(map[string]domain.Recap)}

	gen := generator.New(userRepo, actionRepo, recapRepo)

	recap, err := gen.Execute(context.Background(), generatorAccountID, userID, year)

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

	gen := generator.New(userRepo, actionRepo, recapRepo)

	recap, err := gen.Execute(context.Background(), generatorAccountID, userID, year)

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

	gen := generator.New(userRepo, actionRepo, recapRepo)

	_, err := gen.Execute(context.Background(), generatorAccountID, userID, year)

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
			userID.String() + ":" + string(rune(2025)): actions,
		},
	}

	recapRepo := &mockRecapRepo{recaps: make(map[string]domain.Recap)}

	gen := generator.New(userRepo, actionRepo, recapRepo)

	recap, err := gen.Execute(context.Background(), generatorAccountID, userID, 2025)

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
			userID.String() + ":" + string(rune(year)): actions,
		},
	}

	recapRepo := &mockRecapRepo{recaps: make(map[string]domain.Recap)}

	gen := generator.New(userRepo, actionRepo, recapRepo)

	recap, err := gen.Execute(context.Background(), generatorAccountID, userID, year)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if len(recap.Achievements) == 0 {
		t.Error("expected achievements, got none")
	}
}
