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
	"gooffer/backend/internal/usecase/recapshare"
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
	users             []domain.User
	recaps            map[string]domain.Recap
	missions          map[string]domain.MissionOverview
	businessEvents    []string
	ctaImpressions    int
	profileErr        error
	generatorErr      error
	readerErr         error
	panicProfiles     bool
	credentials       map[string]fakeCredential
	sessions          map[string]uuid.UUID
	adminCards        *fakeAdminCardService
	adminAchievements *fakeAdminAchievementService
	recapShares       *fakeRecapShareRepository
}

type fakeRecapShareRepository struct {
	byToken map[string]domain.RecapShare
	byID    map[uuid.UUID]string
}

func newFakeRecapShareRepository() *fakeRecapShareRepository {
	return &fakeRecapShareRepository{
		byToken: make(map[string]domain.RecapShare),
		byID:    make(map[uuid.UUID]string),
	}
}

func (f *fakeRecapShareRepository) Create(_ context.Context, share *domain.RecapShare) error {
	copy := *share
	copy.TokenHash = append([]byte(nil), share.TokenHash...)
	copy.Snapshot.Cards = append([]domain.PublicRecapCard(nil), share.Snapshot.Cards...)
	copy.Snapshot.Achievements = append(
		[]domain.PublicRecapAchievement{}, share.Snapshot.Achievements...,
	)
	key := string(share.TokenHash)
	f.byToken[key] = copy
	f.byID[share.ID] = key
	return nil
}

func (f *fakeRecapShareRepository) GetActiveByTokenHash(
	_ context.Context,
	tokenHash []byte,
	now time.Time,
) (*domain.RecapShare, error) {
	share, exists := f.byToken[string(tokenHash)]
	if !exists || share.RevokedAt != nil || !share.ExpiresAt.After(now) {
		return nil, apperrors.ErrNotFound
	}
	copy := share
	copy.TokenHash = append([]byte(nil), share.TokenHash...)
	copy.Snapshot.Cards = append([]domain.PublicRecapCard(nil), share.Snapshot.Cards...)
	copy.Snapshot.Achievements = append(
		[]domain.PublicRecapAchievement{}, share.Snapshot.Achievements...,
	)
	return &copy, nil
}

func (f *fakeRecapShareRepository) Revoke(
	_ context.Context,
	accountID, shareID uuid.UUID,
	revokedAt time.Time,
) error {
	key, exists := f.byID[shareID]
	share := f.byToken[key]
	if !exists || share.AccountID != accountID || share.RevokedAt != nil || !share.ExpiresAt.After(revokedAt) {
		return apperrors.ErrNotFound
	}
	share.RevokedAt = &revokedAt
	f.byToken[key] = share
	return nil
}

type fakeAdminCardService struct {
	definitions []domain.CardDefinition
}

type fakeAdminAchievementService struct {
	definitions []domain.AchievementDefinition
}

func (f *fakeAdminAchievementService) List(context.Context) ([]domain.AchievementDefinition, error) {
	return append([]domain.AchievementDefinition(nil), f.definitions...), nil
}

func (f *fakeAdminAchievementService) Update(
	_ context.Context,
	slug string,
	definition *domain.AchievementDefinition,
) (*domain.AchievementDefinition, error) {
	for index := range f.definitions {
		if f.definitions[index].Slug != slug {
			continue
		}
		updated := *definition
		updated.Slug = slug
		updated.Category = f.definitions[index].Category
		updated.SortOrder = f.definitions[index].SortOrder
		updated.UpdatedAt = time.Now().UTC()
		f.definitions[index] = updated
		return &updated, nil
	}
	return nil, apperrors.ErrNotFound
}

func (f *fakeAdminCardService) Create(
	_ context.Context,
	adminID uuid.UUID,
	definition *domain.CardDefinition,
) (*domain.CardDefinition, error) {
	created := *definition
	created.ID = uuid.New()
	created.CreatedBy = adminID
	created.CreatedAt = time.Now().UTC()
	created.UpdatedAt = created.CreatedAt
	f.definitions = append(f.definitions, created)
	return &created, nil
}

func (f *fakeAdminCardService) List(context.Context) ([]domain.CardDefinition, error) {
	return append([]domain.CardDefinition(nil), f.definitions...), nil
}

func (f *fakeAdminCardService) Update(
	_ context.Context,
	id uuid.UUID,
	definition *domain.CardDefinition,
) (*domain.CardDefinition, error) {
	for index := range f.definitions {
		if f.definitions[index].ID != id {
			continue
		}
		updated := *definition
		updated.ID = id
		updated.CreatedBy = f.definitions[index].CreatedBy
		updated.CreatedAt = f.definitions[index].CreatedAt
		updated.UpdatedAt = time.Now().UTC()
		f.definitions[index] = updated
		return &updated, nil
	}
	return nil, apperrors.ErrNotFound
}

func (f *fakeAdminCardService) Delete(_ context.Context, id uuid.UUID) error {
	for index := range f.definitions {
		if f.definitions[index].ID == id {
			f.definitions = append(f.definitions[:index], f.definitions[index+1:]...)
			return nil
		}
	}
	return apperrors.ErrNotFound
}

func (f *fakeApplication) RecordBusinessEvent(event string, ctaVisible bool) {
	f.businessEvents = append(f.businessEvents, event)
	if event == "slide_viewed" && ctaVisible {
		f.ctaImpressions++
	}
}

func newFakeApplication() *fakeApplication {
	user := domain.User{
		ID:           testUserID,
		Name:         "Анна Смирнова",
		Avatar:       "https://example.com/anna.jpg",
		ProfileType:  "mixed",
		RegisteredAt: time.Date(2018, time.April, 14, 0, 0, 0, 0, time.UTC),
		Likes:        148,
		ChatsCount:   43,
		Views: []domain.ViewedAd{
			{
				Ad:           domain.Ad{AdID: "seed-view-phone", Title: "Смартфон", Category: "Электроника", Price: 118000, ViewCount: 7},
				LastViewedAt: time.Date(2026, time.March, 12, 14, 10, 0, 0, time.UTC),
				IsPurchased:  true,
				PurchasedAt:  timePointer(time.Date(2026, time.March, 12, 14, 10, 0, 0, time.UTC)),
			},
			{
				Ad:           domain.Ad{AdID: "seed-view-headphones", Title: "Наушники", Category: "Электроника", Price: 12990, ViewCount: 3},
				LastViewedAt: time.Date(2026, time.May, 4, 16, 45, 0, 0, time.UTC),
				IsPurchased:  true,
				PurchasedAt:  timePointer(time.Date(2026, time.May, 4, 16, 45, 0, 0, time.UTC)),
			},
			{
				Ad:           domain.Ad{AdID: "seed-view-case", Title: "Чехол", Category: "Аксессуары", Price: 490, ViewCount: 2},
				LastViewedAt: time.Date(2026, time.January, 17, 13, 30, 0, 0, time.UTC),
				IsPurchased:  true,
				PurchasedAt:  timePointer(time.Date(2026, time.January, 17, 13, 30, 0, 0, time.UTC)),
			},
		},
		OwnAds: []domain.OwnAd{
			{
				Ad:             domain.Ad{AdID: "seed-own-tablet", Title: "Планшет", Category: "Электроника", Price: 28500, ViewCount: 214},
				PublishedAt:    time.Date(2026, time.January, 15, 0, 0, 0, 0, time.UTC),
				FavoritesCount: 31,
				ContactsCount:  12,
				City:           "Москва",
				IsSold:         true,
				SoldAt:         timePointer(time.Date(2026, time.February, 20, 0, 0, 0, 0, time.UTC)),
				Review:         &domain.Review{Comment: "Всё отлично", Rating: 5, CreatedAt: time.Date(2026, time.February, 21, 0, 0, 0, 0, time.UTC)},
			},
			{
				Ad:             domain.Ad{AdID: "seed-own-chair", Title: "Кресло", Category: "Для дома", Price: 7500, ViewCount: 86},
				PublishedAt:    time.Date(2026, time.May, 1, 0, 0, 0, 0, time.UTC),
				FavoritesCount: 8,
				ContactsCount:  4,
				IsSold:         true,
				SoldAt:         timePointer(time.Date(2026, time.June, 18, 0, 0, 0, 0, time.UTC)),
			},
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
			{
				Slug: "curious", Title: "Любопытный",
				Description: "Просмотрел не менее 500 объявлений за год", Icon: "👀",
				Category: "views",
			},
		},
		ActivityDays: 300,
		Summary: domain.RecapSummary{
			Headline:    "Вы были по обе стороны Авито",
			Description: "Покупки и продажи в одном году.",
			Buyer:       domain.BuyerRecapSummary{HasData: true, PurchasesCount: 10},
			Seller:      domain.SellerRecapSummary{HasData: true, SalesCount: 5},
			Combined:    domain.CombinedRecapSummary{HasBuyerData: true, HasSellerData: true, Deals: 15},
		},
		Cards: []domain.RecapCard{
			{
				ID: "year_overview", Kind: "overview", Title: "Итоги", ImageURL: "https://private.example/image.jpg",
				Shareable: true, Reason: "internal reason", Visualization: &domain.RecapVisualization{Version: 1, Type: "bar"},
				CTA: &domain.RecapCardCTA{Label: "Открыть", Action: "open_listing", Params: map[string]string{"ad_id": "private-ad"}},
			},
			{ID: "largest_purchase", Kind: "buyer", Title: "Крупная покупка", Shareable: false},
		},
		Comparison: domain.RecapComparison{
			Status:       domain.RecapComparisonUnavailable,
			Message:      "Сравнение появится после повторной генерации итогов.",
			PreviousYear: 2024,
			CurrentYear:  2025,
			Categories:   []domain.RecapCategoryComparison{},
			NewInterests: []string{},
		},
		Forecast: domain.RecapForecast{
			Year:             2026,
			Method:           domain.RecapForecastUnavailable,
			LikelyCategories: []domain.RecapForecastCategory{},
		},
		GeneratedAt: time.Date(2026, time.January, 1, 0, 0, 0, 0, time.UTC),
	}
	account := domain.Account{
		ID:        testAccountID,
		Login:     "nikita",
		IsAdmin:   true,
		CreatedAt: time.Date(2026, time.January, 1, 0, 0, 0, 0, time.UTC),
	}
	return &fakeApplication{
		users:    []domain.User{user},
		recaps:   map[string]domain.Recap{recapKey(testUserID, 2025): recap},
		missions: make(map[string]domain.MissionOverview),
		credentials: map[string]fakeCredential{
			"nikita": {account: account, password: "avito2026"},
		},
		sessions:          map[string]uuid.UUID{"test-session": testAccountID},
		adminCards:        &fakeAdminCardService{},
		adminAchievements: &fakeAdminAchievementService{definitions: fakeAchievementDefinitions()},
		recapShares:       newFakeRecapShareRepository(),
	}
}

func fakeAchievementDefinitions() []domain.AchievementDefinition {
	threshold := 500.0
	return []domain.AchievementDefinition{
		{
			Slug:              "curious",
			Title:             "Любопытный",
			Description:       "Просмотрел не менее 500 объявлений за год",
			Icon:              "👀",
			Category:          "views",
			Metric:            domain.CardMetricTotalViews,
			ConditionOperator: domain.CardConditionGTE,
			ConditionValue:    &threshold,
			SortOrder:         10,
			IsActive:          true,
			UpdatedAt:         time.Now().UTC(),
		},
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

func (f *fakeApplication) Create(_ context.Context, accountID uuid.UUID, user *domain.User) (*domain.User, error) {
	if f.profileErr != nil {
		return nil, f.profileErr
	}
	if accountID != testAccountID {
		return nil, apperrors.ErrNotFound
	}
	created := *user
	if created.ID == uuid.Nil {
		created.ID = uuid.New()
	}
	f.users = append(f.users, created)
	return &created, nil
}

func (f *fakeApplication) Update(
	_ context.Context,
	accountID, id uuid.UUID,
	user *domain.User,
) (*domain.User, error) {
	if f.profileErr != nil {
		return nil, f.profileErr
	}
	if accountID != testAccountID {
		return nil, apperrors.ErrNotFound
	}
	for i := range f.users {
		if f.users[i].ID == id {
			updated := *user
			updated.ID = id
			f.users[i] = updated
			return &updated, nil
		}
	}
	return nil, apperrors.ErrNotFound
}

func (f *fakeApplication) Delete(_ context.Context, accountID, id uuid.UUID) error {
	if f.profileErr != nil {
		return f.profileErr
	}
	if accountID != testAccountID {
		return apperrors.ErrNotFound
	}
	for i := range f.users {
		if f.users[i].ID == id {
			f.users = append(f.users[:i], f.users[i+1:]...)
			return nil
		}
	}
	return apperrors.ErrNotFound
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
			ID:     uuid.New(),
			UserID: userID,
			Year:   year,
			Comparison: domain.RecapComparison{
				Status:       domain.RecapComparisonUnavailable,
				Message:      "Сравнение недоступно в тестовом генераторе.",
				PreviousYear: year - 1,
				CurrentYear:  year,
				Categories:   []domain.RecapCategoryComparison{},
				NewInterests: []string{},
			},
			Forecast: domain.RecapForecast{
				Year:             year + 1,
				Method:           domain.RecapForecastUnavailable,
				LikelyCategories: []domain.RecapForecastCategory{},
			},
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

func (f *fakeApplication) GetOverview(
	ctx context.Context,
	accountID, userID uuid.UUID,
	year int,
) (*domain.MissionOverview, error) {
	if _, err := f.GetByID(ctx, accountID, userID); err != nil {
		return nil, err
	}
	if _, exists := f.recaps[recapKey(userID, year)]; !exists {
		return nil, apperrors.ErrNotFound
	}
	if overview, exists := f.missions[recapKey(userID, year)]; exists {
		copy := overview
		return &copy, nil
	}
	return &domain.MissionOverview{Options: fakeMissionOptions(), SelectedMissions: []domain.MissionState{}}, nil
}

func (f *fakeApplication) Select(
	ctx context.Context,
	accountID, userID uuid.UUID,
	year int,
	codes []domain.MissionCode,
) (*domain.MissionOverview, error) {
	if _, err := f.GetOverview(ctx, accountID, userID, year); err != nil {
		return nil, err
	}
	options := fakeMissionOptions()
	seen := make(map[domain.MissionCode]struct{}, len(codes))
	selectedOptions := make([]domain.MissionOption, len(codes))
	for index, code := range codes {
		if _, duplicate := seen[code]; duplicate {
			return nil, apperrors.ErrInvalidMission
		}
		found := false
		for _, option := range options {
			if option.Code == code {
				selectedOptions[index] = option
				found = true
				break
			}
		}
		if !found {
			return nil, apperrors.ErrInvalidMission
		}
		seen[code] = struct{}{}
	}
	now := time.Now().UTC()
	selectedMissions := make([]domain.MissionState, len(selectedOptions))
	for index, selectedOption := range selectedOptions {
		selectedMissions[index] = domain.MissionState{
			RecapYear:   year,
			Code:        selectedOption.Code,
			Title:       selectedOption.Title,
			Description: selectedOption.Description,
			Target:      selectedOption.Target,
			Status:      domain.MissionActive,
			Icon:        selectedOption.Icon,
			Theme:       selectedOption.Theme,
			CTA:         selectedOption.CTA,
			SelectedAt:  now,
			UpdatedAt:   now,
		}
	}
	var legacySelected *domain.MissionState
	if len(selectedMissions) > 0 {
		copy := selectedMissions[0]
		legacySelected = &copy
	}
	overview := domain.MissionOverview{
		Options:          options,
		SelectedMissions: selectedMissions,
		Selected:         legacySelected,
	}
	f.missions[recapKey(userID, year)] = overview
	return &overview, nil
}

func (f *fakeApplication) GetProfileMissions(
	ctx context.Context,
	accountID, userID uuid.UUID,
) (*domain.ProfileMissionOverview, error) {
	if _, err := f.GetByID(ctx, accountID, userID); err != nil {
		return nil, err
	}
	missions := make([]domain.MissionState, 0)
	for key, overview := range f.missions {
		if strings.HasPrefix(key, userID.String()+":") {
			missions = append(missions, overview.SelectedMissions...)
		}
	}
	return &domain.ProfileMissionOverview{Missions: missions}, nil
}

func fakeMissionOptions() []domain.MissionOption {
	return []domain.MissionOption{
		{Code: domain.MissionSellThreeItems, Title: "Продать три ненужные вещи", Target: 3},
		{Code: domain.MissionBuyFromFavorites, Title: "Завершить покупку из избранного", Target: 1},
		{Code: domain.MissionTryDelivery, Title: "Попробовать Авито Доставку", Target: 1},
	}
}

func newTestHandler(t *testing.T, application *fakeApplication) http.Handler {
	t.Helper()
	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	recapShareService := recapshare.New(
		application,
		application,
		application.recapShares,
		"https://recap.example",
		72*time.Hour,
	)
	return server.NewRouter(server.Dependencies{
		Auth:              application,
		Profiles:          application,
		RecapGenerator:    application,
		Recaps:            application,
		RecapShares:       recapShareService,
		Missions:          application,
		BusinessEvents:    application,
		AdminCards:        application.adminCards,
		AdminAchievements: application.adminAchievements,
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

func timePointer(value time.Time) *time.Time {
	return &value
}
