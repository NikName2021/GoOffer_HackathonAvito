package mission

import (
	"context"
	"errors"
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

func (f *fakeProfileReader) GetByID(
	_ context.Context,
	_, _ uuid.UUID,
) (*domain.User, error) {
	if f.err != nil {
		return nil, f.err
	}
	return f.user, nil
}

type fakeRecapReader struct {
	recap *domain.Recap
	err   error
}

func (f *fakeRecapReader) GetByUserAndYear(
	_ context.Context,
	_ uuid.UUID,
	_ int,
) (*domain.Recap, error) {
	if f.err != nil {
		return nil, f.err
	}
	return f.recap, nil
}

type fakeMissionRepository struct {
	selected *domain.RecapMission
	updates  int
}

func (f *fakeMissionRepository) GetByUserAndYear(
	_ context.Context,
	_ uuid.UUID,
	_ int,
) (*domain.RecapMission, error) {
	if f.selected == nil {
		return nil, apperrors.ErrNotFound
	}
	copy := *f.selected
	return &copy, nil
}

func (f *fakeMissionRepository) Select(_ context.Context, selected *domain.RecapMission) error {
	copy := *selected
	f.selected = &copy
	return nil
}

func (f *fakeMissionRepository) UpdateProgress(_ context.Context, selected *domain.RecapMission) error {
	copy := *selected
	f.selected = &copy
	f.updates++
	return nil
}

func TestGetOverviewBeforeMissionSelection(t *testing.T) {
	service, _, _ := newMissionTestService(time.Date(2026, time.January, 1, 12, 0, 0, 0, time.UTC))
	overview, err := service.GetOverview(context.Background(), uuid.New(), uuid.New(), 2025)
	if err != nil {
		t.Fatalf("get overview: %v", err)
	}
	if len(overview.Options) != 3 {
		t.Fatalf("options = %d, want 3", len(overview.Options))
	}
	if overview.Selected != nil {
		t.Fatalf("selected = %#v, want nil", overview.Selected)
	}
}

func TestMissionProgressIsCalculatedFromProfileEvents(t *testing.T) {
	selectedAt := time.Date(2026, time.January, 1, 12, 0, 0, 0, time.UTC)
	tests := []struct {
		name   string
		code   domain.MissionCode
		target int
		apply  func(*domain.User)
	}{
		{
			name:   "sell three items",
			code:   domain.MissionSellThreeItems,
			target: 3,
			apply: func(user *domain.User) {
				for day := 2; day <= 4; day++ {
					soldAt := time.Date(2026, time.January, day, 12, 0, 0, 0, time.UTC)
					user.OwnAds = append(user.OwnAds, domain.OwnAd{IsSold: true, SoldAt: &soldAt})
				}
				oldSale := selectedAt.Add(-time.Hour)
				user.OwnAds = append(user.OwnAds, domain.OwnAd{IsSold: true, SoldAt: &oldSale})
			},
		},
		{
			name:   "buy from favorites",
			code:   domain.MissionBuyFromFavorites,
			target: 1,
			apply: func(user *domain.User) {
				favoriteAt := selectedAt.Add(time.Hour)
				purchaseAt := selectedAt.Add(2 * time.Hour)
				user.Views = append(user.Views, domain.ViewedAd{
					IsFavorite:  true,
					FavoritedAt: &favoriteAt,
					IsPurchased: true,
					PurchasedAt: &purchaseAt,
				})
			},
		},
		{
			name:   "try delivery",
			code:   domain.MissionTryDelivery,
			target: 1,
			apply: func(user *domain.User) {
				usedDelivery := true
				user.Views = append(user.Views, domain.ViewedAd{ViewedAt: []domain.ViewedAdEvent{
					{
						Type:             domain.ViewedAdEventBuy,
						Time:             selectedAt.Add(time.Hour),
						UseAvitoDelivery: &usedDelivery,
					},
				}})
			},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			service, profiles, missions := newMissionTestService(selectedAt)
			accountID, userID := uuid.New(), uuid.New()
			selected, err := service.Select(context.Background(), accountID, userID, 2025, test.code)
			if err != nil {
				t.Fatalf("select mission: %v", err)
			}
			if selected.Selected == nil || selected.Selected.Progress != 0 {
				t.Fatalf("selected = %#v, want zero progress", selected.Selected)
			}

			test.apply(profiles.user)
			completedAt := selectedAt.Add(24 * time.Hour)
			service.now = func() time.Time { return completedAt }
			overview, err := service.GetOverview(context.Background(), accountID, userID, 2025)
			if err != nil {
				t.Fatalf("refresh mission: %v", err)
			}
			if overview.Selected.Progress != test.target || overview.Selected.ProgressPercent != 100 {
				t.Fatalf("progress = %d/%d (%d%%)", overview.Selected.Progress, overview.Selected.Target, overview.Selected.ProgressPercent)
			}
			if overview.Selected.Status != domain.MissionCompleted || overview.Selected.CompletedAt == nil {
				t.Fatalf("selected = %#v, want completed", overview.Selected)
			}
			if missions.updates != 1 {
				t.Fatalf("updates = %d, want 1", missions.updates)
			}
		})
	}
}

func TestSelectRejectsUnknownMission(t *testing.T) {
	service, _, missions := newMissionTestService(time.Now().UTC())
	_, err := service.Select(context.Background(), uuid.New(), uuid.New(), 2025, "unknown")
	if !errors.Is(err, apperrors.ErrInvalidMission) {
		t.Fatalf("error = %v, want ErrInvalidMission", err)
	}
	if missions.selected != nil {
		t.Fatal("invalid mission was persisted")
	}
}

func TestSelectingSameMissionIsIdempotent(t *testing.T) {
	selectedAt := time.Date(2026, time.January, 1, 12, 0, 0, 0, time.UTC)
	service, _, missions := newMissionTestService(selectedAt)
	accountID, userID := uuid.New(), uuid.New()
	if _, err := service.Select(context.Background(), accountID, userID, 2025, domain.MissionSellThreeItems); err != nil {
		t.Fatalf("first select: %v", err)
	}
	firstID := missions.selected.ID
	service.now = func() time.Time { return selectedAt.Add(48 * time.Hour) }
	if _, err := service.Select(context.Background(), accountID, userID, 2025, domain.MissionSellThreeItems); err != nil {
		t.Fatalf("second select: %v", err)
	}
	if missions.selected.ID != firstID || !missions.selected.SelectedAt.Equal(selectedAt) {
		t.Fatalf("mission was reset: %#v", missions.selected)
	}
}

func newMissionTestService(
	now time.Time,
) (*Service, *fakeProfileReader, *fakeMissionRepository) {
	profiles := &fakeProfileReader{user: &domain.User{ID: uuid.New()}}
	recaps := &fakeRecapReader{recap: &domain.Recap{ID: uuid.New(), Year: 2025}}
	missions := &fakeMissionRepository{}
	service := New(profiles, recaps, missions)
	service.now = func() time.Time { return now }
	return service, profiles, missions
}
