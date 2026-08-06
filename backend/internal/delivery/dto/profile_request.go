package dto

import (
	"errors"
	"fmt"
	"net/url"
	"sort"
	"strings"
	"time"
	"unicode/utf8"

	"gooffer/backend/internal/domain"
)

const (
	maxProfileNameRunes = 100
	maxAdIDRunes        = 100
	maxTitleRunes       = 200
	maxCategoryRunes    = 100
	maxCityRunes        = 100
	maxCommentRunes     = 2000
	maxActivities       = 10_000
	maxViewedEvents     = 10_000
	maxImageURLBytes    = 7 * 1024 * 1024
	maxPrice            = int64(1_000_000_000_000_000)
)

type ProfileRequest struct {
	Name       string            `json:"name"`
	JoinedAt   string            `json:"joinedAt"`
	AvatarURL  string            `json:"avatarUrl,omitempty"`
	Likes      int               `json:"likes"`
	ChatsCount int               `json:"chatsCount"`
	Views      []ViewedAdRequest `json:"views"`
	OwnAds     []OwnAdRequest    `json:"ownAds"`
}

type AdRequest struct {
	AdID        string `json:"adId"`
	Title       string `json:"title"`
	Category    string `json:"category"`
	Subcategory string `json:"subcategory,omitempty"`
	ImageURL    string `json:"imageUrl,omitempty"`
	Price       int64  `json:"price"`
	ViewCount   int    `json:"viewCount"`
}

type ViewedAdEventRequest struct {
	Type             string `json:"type"`
	Time             string `json:"time"`
	UseAvitoDelivery *bool  `json:"useAvitoDelivery,omitempty"`
}

type ReviewRequest struct {
	Comment   string `json:"comment"`
	Rating    int    `json:"rating"`
	CreatedAt string `json:"createdAt"`
}

type OwnAdRequest struct {
	AdRequest
	PublishedAt    string         `json:"publishedAt"`
	FavoritesCount int            `json:"favoritesCount"`
	ContactsCount  int            `json:"contactsCount"`
	City           string         `json:"city,omitempty"`
	IsArchived     bool           `json:"isArchived"`
	IsSold         bool           `json:"isSold"`
	SoldAt         string         `json:"soldAt,omitempty"`
	Review         *ReviewRequest `json:"review,omitempty"`
}

type ViewedAdRequest struct {
	AdRequest
	ViewedAt     []ViewedAdEventRequest `json:"viewedAt"`
	LastViewedAt string                 `json:"lastViewedAt,omitempty"`
	IsFavorite   bool                   `json:"isFavorite"`
	FavoritedAt  string                 `json:"favoritedAt,omitempty"`
	IsPurchased  bool                   `json:"isPurchased"`
	PurchasedAt  string                 `json:"purchasedAt,omitempty"`
}

func (request ProfileRequest) ToDomain() (*domain.User, error) {
	name := strings.TrimSpace(request.Name)
	if name == "" || utf8.RuneCountInString(name) > maxProfileNameRunes {
		return nil, errors.New("name must contain between 1 and 100 characters")
	}
	joinedAt, err := parseDate(request.JoinedAt)
	if err != nil {
		return nil, errors.New("joinedAt must be a valid date in YYYY-MM-DD format")
	}
	if request.Likes < 0 || request.ChatsCount < 0 {
		return nil, errors.New("likes and chatsCount must be non-negative")
	}
	if request.Views == nil || request.OwnAds == nil {
		return nil, errors.New("views and ownAds arrays are required")
	}
	if len(request.Views) > maxActivities || len(request.OwnAds) > maxActivities {
		return nil, fmt.Errorf("views and ownAds must contain no more than %d items each", maxActivities)
	}
	if err := validateImageURL(request.AvatarURL); err != nil {
		return nil, fmt.Errorf("avatarUrl: %w", err)
	}

	user := &domain.User{
		Name:         name,
		Avatar:       request.AvatarURL,
		RegisteredAt: joinedAt,
		Likes:        request.Likes,
		ChatsCount:   request.ChatsCount,
		OwnAds:       make([]domain.OwnAd, len(request.OwnAds)),
		Views:        make([]domain.ViewedAd, len(request.Views)),
	}
	adIDs := make(map[string]string, len(request.OwnAds)+len(request.Views))
	for i, ad := range request.OwnAds {
		parsed, err := ad.toDomain()
		if err != nil {
			return nil, fmt.Errorf("ownAds[%d]: %w", i, err)
		}
		if previous, exists := adIDs[parsed.AdID]; exists {
			return nil, fmt.Errorf("ownAds[%d]: adId duplicates %s", i, previous)
		}
		adIDs[parsed.AdID] = fmt.Sprintf("ownAds[%d]", i)
		user.OwnAds[i] = parsed
	}
	for i, view := range request.Views {
		parsed, err := view.toDomain()
		if err != nil {
			return nil, fmt.Errorf("views[%d]: %w", i, err)
		}
		if previous, exists := adIDs[parsed.AdID]; exists {
			return nil, fmt.Errorf("views[%d]: adId duplicates %s", i, previous)
		}
		adIDs[parsed.AdID] = fmt.Sprintf("views[%d]", i)
		user.Views[i] = parsed
	}
	return user, nil
}

func (request OwnAdRequest) toDomain() (domain.OwnAd, error) {
	base, err := request.AdRequest.toDomain()
	if err != nil {
		return domain.OwnAd{}, err
	}
	publishedAt, err := parseDate(request.PublishedAt)
	if err != nil {
		return domain.OwnAd{}, errors.New("publishedAt is required and must use YYYY-MM-DD")
	}
	city := strings.TrimSpace(request.City)
	if utf8.RuneCountInString(city) > maxCityRunes {
		return domain.OwnAd{}, fmt.Errorf("city must contain no more than %d characters", maxCityRunes)
	}
	if request.FavoritesCount < 0 || request.ContactsCount < 0 {
		return domain.OwnAd{}, errors.New("favoritesCount and contactsCount must be non-negative")
	}
	result := domain.OwnAd{
		Ad:             base,
		PublishedAt:    publishedAt,
		FavoritesCount: request.FavoritesCount,
		ContactsCount:  request.ContactsCount,
		City:           city,
		IsArchived:     request.IsArchived,
		IsSold:         request.IsSold,
	}
	if !request.IsSold {
		if request.SoldAt != "" || request.Review != nil {
			return domain.OwnAd{}, errors.New("soldAt and review are allowed only for a sold ad")
		}
		return result, nil
	}
	soldAt, err := parseDate(request.SoldAt)
	if err != nil {
		return domain.OwnAd{}, errors.New("soldAt is required for a sold ad and must use YYYY-MM-DD")
	}
	if soldAt.Before(publishedAt) {
		return domain.OwnAd{}, errors.New("soldAt must not be earlier than publishedAt")
	}
	result.SoldAt = &soldAt
	if request.Review != nil {
		comment := strings.TrimSpace(request.Review.Comment)
		if comment == "" || utf8.RuneCountInString(comment) > maxCommentRunes {
			return domain.OwnAd{}, errors.New("review comment must contain between 1 and 2000 characters")
		}
		if request.Review.Rating < 1 || request.Review.Rating > 5 {
			return domain.OwnAd{}, errors.New("review rating must be between 1 and 5")
		}
		createdAt, err := parseDate(request.Review.CreatedAt)
		if err != nil {
			return domain.OwnAd{}, errors.New("review createdAt must use YYYY-MM-DD")
		}
		result.Review = &domain.Review{
			Comment:   comment,
			Rating:    request.Review.Rating,
			CreatedAt: createdAt,
		}
	}
	return result, nil
}

func (request ViewedAdRequest) toDomain() (domain.ViewedAd, error) {
	base, err := request.AdRequest.toDomain()
	if err != nil {
		return domain.ViewedAd{}, err
	}
	if request.ViewedAt == nil || len(request.ViewedAt) == 0 {
		return domain.ViewedAd{}, errors.New("viewedAt must contain at least one event")
	}
	if len(request.ViewedAt) > maxViewedEvents {
		return domain.ViewedAd{}, fmt.Errorf("viewedAt must contain no more than %d events", maxViewedEvents)
	}

	result := domain.ViewedAd{
		Ad:       base,
		ViewedAt: make([]domain.ViewedAdEvent, len(request.ViewedAt)),
	}
	watchFound := false
	likeFound := false
	buyFound := false
	for i, eventRequest := range request.ViewedAt {
		eventType := domain.ViewedAdEventType(strings.TrimSpace(eventRequest.Type))
		eventTime, err := parseDateTime(eventRequest.Time)
		if err != nil {
			return domain.ViewedAd{}, fmt.Errorf("viewedAt[%d].time must be a valid date-time", i)
		}
		event := domain.ViewedAdEvent{Type: eventType, Time: eventTime}
		switch eventType {
		case domain.ViewedAdEventWatch:
			if eventRequest.UseAvitoDelivery != nil {
				return domain.ViewedAd{}, fmt.Errorf("viewedAt[%d].useAvitoDelivery is allowed only for buy", i)
			}
			watchFound = true
			if result.LastViewedAt.IsZero() || eventTime.After(result.LastViewedAt) {
				result.LastViewedAt = eventTime
			}
		case domain.ViewedAdEventLike:
			if eventRequest.UseAvitoDelivery != nil {
				return domain.ViewedAd{}, fmt.Errorf("viewedAt[%d].useAvitoDelivery is allowed only for buy", i)
			}
			if likeFound {
				return domain.ViewedAd{}, errors.New("viewedAt must contain no more than one like event")
			}
			likeFound = true
			result.IsFavorite = true
			selected := eventTime
			result.FavoritedAt = &selected
		case domain.ViewedAdEventBuy:
			if eventRequest.UseAvitoDelivery == nil {
				return domain.ViewedAd{}, fmt.Errorf("viewedAt[%d].useAvitoDelivery is required for buy", i)
			}
			if buyFound {
				return domain.ViewedAd{}, errors.New("viewedAt must contain no more than one buy event")
			}
			buyFound = true
			result.IsPurchased = true
			selected := eventTime
			result.PurchasedAt = &selected
			delivery := *eventRequest.UseAvitoDelivery
			event.UseAvitoDelivery = &delivery
		default:
			return domain.ViewedAd{}, fmt.Errorf("viewedAt[%d].type must be one of watch, like or buy", i)
		}
		result.ViewedAt[i] = event
	}
	if !watchFound {
		return domain.ViewedAd{}, errors.New("viewedAt must contain at least one watch event")
	}
	sort.SliceStable(result.ViewedAt, func(i, j int) bool {
		return result.ViewedAt[i].Time.Before(result.ViewedAt[j].Time)
	})
	return result, nil
}

func (request AdRequest) toDomain() (domain.Ad, error) {
	adID := strings.TrimSpace(request.AdID)
	title := strings.TrimSpace(request.Title)
	category := strings.TrimSpace(request.Category)
	if adID == "" || utf8.RuneCountInString(adID) > maxAdIDRunes {
		return domain.Ad{}, fmt.Errorf("adId must contain between 1 and %d characters", maxAdIDRunes)
	}
	if title == "" || utf8.RuneCountInString(title) > maxTitleRunes {
		return domain.Ad{}, errors.New("title must contain between 1 and 200 characters")
	}
	if category == "" || utf8.RuneCountInString(category) > maxCategoryRunes {
		return domain.Ad{}, errors.New("category must contain between 1 and 100 characters")
	}
	if request.Price < 0 || request.Price > maxPrice || request.ViewCount < 0 {
		return domain.Ad{}, errors.New("price and viewCount must be non-negative and within allowed limits")
	}
	if err := validateImageURL(request.ImageURL); err != nil {
		return domain.Ad{}, fmt.Errorf("imageUrl: %w", err)
	}
	return domain.Ad{
		AdID:        adID,
		Title:       title,
		Category:    category,
		Subcategory: strings.TrimSpace(request.Subcategory),
		ImageURL:    request.ImageURL,
		Price:       request.Price,
		ViewCount:   request.ViewCount,
	}, nil
}

func parseDate(value string) (time.Time, error) {
	return time.ParseInLocation(dateLayout, value, time.UTC)
}

func parseDateTime(value string) (time.Time, error) {
	for _, layout := range []string{dateTimeLayout, "2006-01-02T15:04:05", time.RFC3339} {
		if parsed, err := time.ParseInLocation(layout, value, time.UTC); err == nil {
			return parsed.UTC(), nil
		}
	}
	return time.Time{}, errors.New("invalid date-time")
}

func validateImageURL(value string) error {
	if value == "" {
		return nil
	}
	if len(value) > maxImageURLBytes {
		return errors.New("image is too large")
	}
	if strings.HasPrefix(value, "data:image/png;base64,") ||
		strings.HasPrefix(value, "data:image/jpeg;base64,") ||
		strings.HasPrefix(value, "data:image/jpg;base64,") ||
		strings.HasPrefix(value, "data:image/webp;base64,") {
		return nil
	}
	parsed, err := url.ParseRequestURI(value)
	if err != nil || (parsed.Scheme != "http" && parsed.Scheme != "https") || parsed.Host == "" {
		return errors.New("must be an http(s) URL or a PNG, JPG or WEBP data URL")
	}
	return nil
}
