package recapshare

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	"gooffer/backend/internal/domain"
	apperrors "gooffer/backend/pkg/errors"
)

type fakeProfileReader struct {
	user *domain.User
	err  error
}

func (f *fakeProfileReader) GetByID(context.Context, uuid.UUID, uuid.UUID) (*domain.User, error) {
	return f.user, f.err
}

type fakeRecapReader struct {
	recap *domain.Recap
	err   error
}

func (f *fakeRecapReader) GetByUserAndYear(context.Context, uuid.UUID, int) (*domain.Recap, error) {
	return f.recap, f.err
}

type fakeShareRepository struct {
	share *domain.RecapShare
}

func (f *fakeShareRepository) Create(_ context.Context, share *domain.RecapShare) error {
	copy := *share
	copy.TokenHash = append([]byte(nil), share.TokenHash...)
	copy.Snapshot.Cards = append([]domain.PublicRecapCard(nil), share.Snapshot.Cards...)
	copy.Snapshot.Achievements = append(
		[]domain.PublicRecapAchievement{}, share.Snapshot.Achievements...,
	)
	f.share = &copy
	return nil
}

func (f *fakeShareRepository) GetActiveByTokenHash(
	_ context.Context,
	tokenHash []byte,
	now time.Time,
) (*domain.RecapShare, error) {
	if f.share == nil || string(f.share.TokenHash) != string(tokenHash) ||
		f.share.RevokedAt != nil || !f.share.ExpiresAt.After(now) {
		return nil, apperrors.ErrNotFound
	}
	copy := *f.share
	copy.Snapshot.Cards = append([]domain.PublicRecapCard(nil), f.share.Snapshot.Cards...)
	copy.Snapshot.Achievements = append(
		[]domain.PublicRecapAchievement{}, f.share.Snapshot.Achievements...,
	)
	return &copy, nil
}

func (f *fakeShareRepository) Revoke(
	_ context.Context,
	accountID, shareID uuid.UUID,
	revokedAt time.Time,
) error {
	if f.share == nil || f.share.ID != shareID || f.share.AccountID != accountID ||
		f.share.RevokedAt != nil || !f.share.ExpiresAt.After(revokedAt) {
		return apperrors.ErrNotFound
	}
	f.share.RevokedAt = &revokedAt
	return nil
}

func TestCreatePublishesOnlySelectedAllowlistedCards(t *testing.T) {
	now := time.Date(2026, time.August, 12, 10, 0, 0, 0, time.UTC)
	service, recap, shares := newShareTestService(now)
	recap.Cards = []domain.RecapCard{
		{
			ID: "year_overview", Kind: "overview", Title: "Безопасный итог", Shareable: true,
			ImageURL: "https://private.example/avatar.jpg", Reason: "internal",
			Presentation:  domain.RecapCardPresentation{Layout: "hero", Theme: "avito-blue", Icon: "star"},
			CTA:           &domain.RecapCardCTA{Action: "open_listing", Params: map[string]string{"ad_id": "secret"}},
			Visualization: &domain.RecapVisualization{Version: 1, Type: "bar"},
		},
		{
			ID: "star_listing", Kind: "seller", Title: "Гараж, телефон +7 000", Shareable: true,
			Presentation: domain.RecapCardPresentation{Layout: "product", Theme: "avito-purple", Icon: "star"},
		},
		{ID: "largest_purchase", Kind: "buyer", Title: "Личная покупка", Shareable: false},
	}
	recap.Achievements = []domain.Achievement{
		{
			Slug: "curious", Title: "Любопытный",
			Description: "Просмотрел не менее 500 объявлений за год", Icon: "👀",
			Category: "views",
		},
	}

	created, err := service.Create(
		context.Background(),
		uuid.New(),
		recap.UserID,
		recap.Year,
		[]string{"star_listing", "year_overview"},
		domain.RecapShareMobileStory,
	)
	if err != nil {
		t.Fatalf("create public share: %v", err)
	}
	if !strings.HasPrefix(created.PublicURL, "https://recap.example/share/") {
		t.Fatalf("public URL = %q", created.PublicURL)
	}
	if created.ExpiresAt.Sub(created.CreatedAt) != 72*time.Hour || len(shares.share.TokenHash) != 32 {
		t.Fatalf("created share = %#v", created)
	}
	if len(shares.share.Snapshot.Cards) != 2 ||
		shares.share.Snapshot.Cards[0].Title != "Ваше объявление стало звездой" {
		t.Fatalf("snapshot cards = %#v", shares.share.Snapshot.Cards)
	}
	if len(shares.share.Snapshot.Achievements) != 1 ||
		shares.share.Snapshot.Achievements[0].Slug != "curious" ||
		shares.share.Snapshot.Achievements[0].Title != "Любопытный" {
		t.Fatalf("snapshot achievements = %#v", shares.share.Snapshot.Achievements)
	}

	encoded, err := json.Marshal(shares.share.Snapshot)
	if err != nil {
		t.Fatalf("marshal snapshot: %v", err)
	}
	for _, forbidden := range []string{
		"id", "user_id", "profile_id", "recap_id", "account_id", "ad_id",
		"image_url", "shareable", "reason", "visualization", "cta", "params", "category",
	} {
		if strings.Contains(string(encoded), `"`+forbidden+`"`) {
			t.Errorf("snapshot contains forbidden field %q: %s", forbidden, encoded)
		}
	}

	token := strings.TrimPrefix(created.PublicURL, "https://recap.example/share/")
	recap.Cards[0].Title = "Changed after publication"
	recap.Achievements[0].Title = "Changed after publication"
	recap.Achievements[0].Category = "private"
	public, err := service.GetPublic(context.Background(), token)
	if err != nil {
		t.Fatalf("get public share: %v", err)
	}
	if public.Cards[1].Title != "Безопасный итог" || public.Format != domain.RecapShareMobileStory {
		t.Fatalf("public immutable snapshot = %#v", public)
	}
	if len(public.Achievements) != 1 || public.Achievements[0].Title != "Любопытный" {
		t.Fatalf("public immutable achievements = %#v", public.Achievements)
	}
}

func TestCreatePublishesEmptyAchievementsArrayWhenRecapHasNone(t *testing.T) {
	service, recap, shares := newShareTestService(time.Now().UTC())
	recap.Cards = []domain.RecapCard{{ID: "overview", Shareable: true}}

	created, err := service.Create(
		context.Background(), uuid.New(), recap.UserID, recap.Year,
		[]string{"overview"}, domain.RecapShareResponsive,
	)
	if err != nil {
		t.Fatalf("create public share: %v", err)
	}
	if shares.share.Snapshot.Achievements == nil || len(shares.share.Snapshot.Achievements) != 0 {
		t.Fatalf("snapshot achievements = %#v, want non-nil empty array", shares.share.Snapshot.Achievements)
	}

	token := strings.TrimPrefix(created.PublicURL, "https://recap.example/share/")
	public, err := service.GetPublic(context.Background(), token)
	if err != nil {
		t.Fatalf("get public share: %v", err)
	}
	encoded, err := json.Marshal(public)
	if err != nil {
		t.Fatalf("marshal public share: %v", err)
	}
	if !strings.Contains(string(encoded), `"achievements":[]`) {
		t.Fatalf("public share = %s, want achievements: []", encoded)
	}
}

func TestGetPublicNormalizesLegacySnapshotWithoutAchievements(t *testing.T) {
	now := time.Date(2026, time.August, 12, 10, 0, 0, 0, time.UTC)
	service, recap, shares := newShareTestService(now)
	recap.Cards = []domain.RecapCard{{ID: "overview", Shareable: true}}
	created, err := service.Create(
		context.Background(), uuid.New(), recap.UserID, recap.Year,
		[]string{"overview"}, domain.RecapShareResponsive,
	)
	if err != nil {
		t.Fatalf("create public share: %v", err)
	}

	var legacy domain.PublicRecapSnapshot
	if err := json.Unmarshal(
		[]byte(`{"format":"responsive","year":2026,"cards":[]}`),
		&legacy,
	); err != nil {
		t.Fatalf("decode legacy snapshot: %v", err)
	}
	shares.share.Snapshot = legacy
	token := strings.TrimPrefix(created.PublicURL, "https://recap.example/share/")
	public, err := service.GetPublic(context.Background(), token)
	if err != nil {
		t.Fatalf("get legacy public share: %v", err)
	}
	if public.Achievements == nil || len(public.Achievements) != 0 {
		t.Fatalf("legacy achievements = %#v, want non-nil empty array", public.Achievements)
	}
	encoded, err := json.Marshal(public)
	if err != nil {
		t.Fatalf("marshal legacy public share: %v", err)
	}
	if !strings.Contains(string(encoded), `"achievements":[]`) {
		t.Fatalf("legacy public share = %s, want achievements: []", encoded)
	}
}

func TestCreateRejectsInvalidSelectionAndFormat(t *testing.T) {
	service, recap, _ := newShareTestService(time.Now().UTC())
	recap.Cards = []domain.RecapCard{
		{ID: "public", Shareable: true},
		{ID: "private", Shareable: false},
	}
	tests := []struct {
		name   string
		ids    []string
		format domain.RecapShareFormat
	}{
		{name: "empty", ids: []string{}, format: domain.RecapShareResponsive},
		{name: "duplicate", ids: []string{"public", "public"}, format: domain.RecapShareResponsive},
		{name: "private", ids: []string{"private"}, format: domain.RecapShareResponsive},
		{name: "unknown", ids: []string{"missing"}, format: domain.RecapShareResponsive},
		{name: "format", ids: []string{"public"}, format: "desktop_only"},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			_, err := service.Create(
				context.Background(), uuid.New(), recap.UserID, recap.Year, test.ids, test.format,
			)
			if !errors.Is(err, apperrors.ErrInvalidRecapShare) {
				t.Fatalf("error = %v, want ErrInvalidRecapShare", err)
			}
		})
	}
}

func TestPublicShareExpiresAndCanBeRevokedOnlyByOwner(t *testing.T) {
	now := time.Date(2026, time.August, 12, 10, 0, 0, 0, time.UTC)
	service, recap, shares := newShareTestService(now)
	recap.Cards = []domain.RecapCard{{ID: "overview", Shareable: true}}
	ownerID := uuid.New()
	created, err := service.Create(
		context.Background(), ownerID, recap.UserID, recap.Year,
		[]string{"overview"}, domain.RecapShareResponsive,
	)
	if err != nil {
		t.Fatalf("create share: %v", err)
	}
	token := strings.TrimPrefix(created.PublicURL, "https://recap.example/share/")
	if err := service.Revoke(context.Background(), uuid.New(), created.ID); !errors.Is(err, apperrors.ErrNotFound) {
		t.Fatalf("foreign revoke error = %v", err)
	}
	if _, err := service.GetPublic(context.Background(), token); err != nil {
		t.Fatalf("share unavailable after foreign revoke: %v", err)
	}
	if err := service.Revoke(context.Background(), ownerID, created.ID); err != nil {
		t.Fatalf("owner revoke: %v", err)
	}
	if _, err := service.GetPublic(context.Background(), token); !errors.Is(err, apperrors.ErrNotFound) {
		t.Fatalf("revoked share error = %v", err)
	}

	shares.share.RevokedAt = nil
	service.now = func() time.Time { return created.ExpiresAt }
	if _, err := service.GetPublic(context.Background(), token); !errors.Is(err, apperrors.ErrNotFound) {
		t.Fatalf("expired share error = %v", err)
	}
	if _, err := service.GetPublic(context.Background(), "not-a-token"); !errors.Is(err, apperrors.ErrNotFound) {
		t.Fatalf("invalid token error = %v", err)
	}
}

func newShareTestService(
	now time.Time,
) (*Service, *domain.Recap, *fakeShareRepository) {
	recap := &domain.Recap{ID: uuid.New(), UserID: uuid.New(), Year: 2026}
	shares := &fakeShareRepository{}
	service := New(
		&fakeProfileReader{user: &domain.User{ID: recap.UserID}},
		&fakeRecapReader{recap: recap},
		shares,
		"https://recap.example/",
		72*time.Hour,
	)
	service.now = func() time.Time { return now }
	service.random = func(target []byte) (int, error) {
		for index := range target {
			target[index] = byte(index + 1)
		}
		return len(target), nil
	}
	return service, recap, shares
}
