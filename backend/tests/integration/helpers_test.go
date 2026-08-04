package integration

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	"gooffer/backend/internal/domain"
	"gooffer/backend/internal/server"
	apperrors "gooffer/backend/pkg/errors"
)

var (
	testUserID    = uuid.MustParse("11111111-1111-4111-8111-111111111111")
	testAccountID = uuid.MustParse("99999999-9999-4999-8999-999999999999")
)

type fakeCredential struct {
	account  domain.Account
	password string
}

type fakeApplication struct {
	users         []domain.User
	recaps        map[string]domain.Recap
	profileErr    error
	generatorErr  error
	readerErr     error
	panicProfiles bool
	credentials   map[string]fakeCredential
	sessions      map[string]uuid.UUID
}

func newFakeApplication() *fakeApplication {
	user := domain.User{
		ID:               testUserID,
		Name:             "Анна Смирнова",
		Avatar:           "https://example.com/anna.jpg",
		AvatarFallback:   "АС",
		AccentColor:      "#00aaff",
		ProfileType:      "mixed",
		RegisteredAt:     time.Date(2018, time.April, 14, 0, 0, 0, 0, time.UTC),
		ChatsCount:       43,
		FavoriteCategory: "Электроника",
		Metrics: domain.ProfileMetrics{
			ActiveDays:       163,
			City:             "Москва",
			CreatedListings:  25,
			FavoriteListings: 32,
			Likes:            148,
			Rating:           4.9,
			Reviews:          17,
		},
		Purchases: []domain.PurchaseRecord{
			{Title: "Смартфон", Category: "Электроника", Price: 118000, Date: time.Date(2026, time.March, 12, 0, 0, 0, 0, time.UTC)},
			{Title: "Наушники", Category: "Аудио", Price: 12990, Date: time.Date(2026, time.May, 4, 0, 0, 0, 0, time.UTC)},
			{Title: "Чехол для телефона", Category: "Аксессуары", Price: 490, Date: time.Date(2026, time.January, 17, 0, 0, 0, 0, time.UTC)},
		},
		Sales: []domain.SaleRecord{
			{Title: "Планшет", Category: "Электроника", Price: 28500, Date: time.Date(2026, time.February, 20, 0, 0, 0, 0, time.UTC), InquiriesCount: 14},
			{Title: "Кресло", Category: "Для дома", Price: 7500, Date: time.Date(2026, time.June, 18, 0, 0, 0, 0, time.UTC), InquiriesCount: 9},
		},
		ListingViews: []domain.ListingViewRecord{
			{Title: "Ноутбук для работы", Category: "Ноутбуки", Likes: 12, ViewedAt: time.Date(2026, time.July, 10, 20, 15, 0, 0, time.UTC), ViewCount: 7},
			{Title: "Фотоаппарат", Category: "Фототехника", Likes: 8, ViewedAt: time.Date(2026, time.June, 29, 13, 40, 0, 0, time.UTC), ViewCount: 3},
		},
	}
	recap := domain.Recap{
		ID:             uuid.MustParse("aaaaaaaa-1111-4111-8111-111111111111"),
		UserID:         testUserID,
		Year:           2025,
		TotalViews:     1500,
		TotalMessages:  50,
		TotalFavorites: 100,
		TotalPurchases: 10,
		TotalSales:     5,
		TopCategories: []domain.CategoryStat{
			{Category: "Электроника", Count: 300},
		},
		Achievements: []domain.Achievement{
			{Slug: "curious", Title: "Любопытный", Description: "500 просмотров", Icon: "👀", Category: "views"},
		},
		ActivityDays: 300,
		GeneratedAt:  time.Date(2026, time.January, 1, 0, 0, 0, 0, time.UTC),
	}
	account := domain.Account{
		ID:        testAccountID,
		Login:     "nikita",
		CreatedAt: time.Date(2026, time.January, 1, 0, 0, 0, 0, time.UTC),
	}
	return &fakeApplication{
		users:  []domain.User{user},
		recaps: map[string]domain.Recap{recapKey(testUserID, 2025): recap},
		credentials: map[string]fakeCredential{
			"nikita": {account: account, password: "avito2026"},
		},
		sessions: map[string]uuid.UUID{"test-session": testAccountID},
	}
}

func (f *fakeApplication) GetByID(_ context.Context, accountID, id uuid.UUID) (*domain.User, error) {
	if f.profileErr != nil {
		return nil, f.profileErr
	}
	if accountID != testAccountID {
		return nil, apperrors.ErrNotFound
	}
	for i := range f.users {
		if f.users[i].ID == id {
			user := f.users[i]
			return &user, nil
		}
	}
	return nil, apperrors.ErrNotFound
}

func (f *fakeApplication) ListProfiles(_ context.Context, accountID uuid.UUID) ([]domain.User, error) {
	if f.panicProfiles {
		panic("test panic")
	}
	if f.profileErr != nil {
		return nil, f.profileErr
	}
	if accountID != testAccountID {
		return []domain.User{}, nil
	}
	return append([]domain.User(nil), f.users...), nil
}

func (f *fakeApplication) Execute(_ context.Context, accountID, userID uuid.UUID, year int) (*domain.Recap, error) {
	if f.generatorErr != nil {
		return nil, f.generatorErr
	}
	if _, err := f.GetByID(context.Background(), accountID, userID); err != nil {
		return nil, err
	}
	recap, ok := f.recaps[recapKey(userID, year)]
	if !ok {
		recap = domain.Recap{
			ID:          uuid.New(),
			UserID:      userID,
			Year:        year,
			GeneratedAt: time.Now().UTC(),
		}
		f.recaps[recapKey(userID, year)] = recap
	}
	return &recap, nil
}

func (f *fakeApplication) Register(
	_ context.Context,
	login string,
	password string,
) (*domain.Account, string, error) {
	login = strings.ToLower(strings.TrimSpace(login))
	if _, exists := f.credentials[login]; exists {
		return nil, "", apperrors.ErrLoginTaken
	}
	account := domain.Account{ID: uuid.New(), Login: login, CreatedAt: time.Now().UTC()}
	f.credentials[login] = fakeCredential{account: account, password: password}
	token := "session-" + uuid.NewString()
	f.sessions[token] = account.ID
	return &account, token, nil
}

func (f *fakeApplication) Login(
	_ context.Context,
	login string,
	password string,
) (*domain.Account, string, error) {
	credential, exists := f.credentials[strings.ToLower(strings.TrimSpace(login))]
	if !exists || credential.password != password {
		return nil, "", apperrors.ErrInvalidCredentials
	}
	token := "session-" + uuid.NewString()
	f.sessions[token] = credential.account.ID
	account := credential.account
	return &account, token, nil
}

func (f *fakeApplication) Authenticate(_ context.Context, token string) (*domain.Account, error) {
	accountID, exists := f.sessions[token]
	if !exists {
		return nil, apperrors.ErrUnauthorized
	}
	for _, credential := range f.credentials {
		if credential.account.ID == accountID {
			account := credential.account
			return &account, nil
		}
	}
	return nil, apperrors.ErrUnauthorized
}

func (f *fakeApplication) Logout(_ context.Context, token string) error {
	delete(f.sessions, token)
	return nil
}

func (f *fakeApplication) GetByUserAndYear(
	_ context.Context,
	userID uuid.UUID,
	year int,
) (*domain.Recap, error) {
	if f.readerErr != nil {
		return nil, f.readerErr
	}
	recap, ok := f.recaps[recapKey(userID, year)]
	if !ok {
		return nil, apperrors.ErrNotFound
	}
	return &recap, nil
}

func newTestHandler(t *testing.T, application *fakeApplication) http.Handler {
	t.Helper()
	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	return server.NewRouter(server.Dependencies{
		Auth:           application,
		Profiles:       application,
		RecapGenerator: application,
		Recaps:         application,
	}, server.Options{
		Logger:         logger,
		AllowedOrigins: []string{"http://localhost:5173"},
	})
}

func performRequest(
	t *testing.T,
	handler http.Handler,
	method string,
	path string,
	body io.Reader,
	headers map[string]string,
) *httptest.ResponseRecorder {
	t.Helper()
	request := httptest.NewRequest(method, path, body)
	if _, cookieSpecified := headers["Cookie"]; !cookieSpecified {
		request.Header.Set("Cookie", "gooffer_session=test-session")
	}
	for key, value := range headers {
		request.Header.Set(key, value)
	}
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, request)
	return response
}

func recapKey(userID uuid.UUID, year int) string {
	return fmt.Sprintf("%s:%d", userID, year)
}
