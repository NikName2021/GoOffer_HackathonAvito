package domain

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID               uuid.UUID
	Name             string
	Avatar           string
	AvatarFallback   string
	AccentColor      string
	RegisteredAt     time.Time
	ProfileType      string
	ChatsCount       int
	FavoriteCategory string
	Metrics          ProfileMetrics
	Purchases        []PurchaseRecord
	Sales            []SaleRecord
	ListingViews     []ListingViewRecord
}

type PurchaseRecord struct {
	Title    string    `json:"title"`
	Category string    `json:"category"`
	Price    int64     `json:"price"`
	Date     time.Time `json:"date"`
}

type SaleRecord struct {
	Title          string    `json:"title"`
	Category       string    `json:"category"`
	Price          int64     `json:"price"`
	Date           time.Time `json:"date"`
	InquiriesCount int       `json:"inquiriesCount"`
}

type ListingViewRecord struct {
	Title     string    `json:"title"`
	Category  string    `json:"category"`
	Likes     int       `json:"likes"`
	ViewedAt  time.Time `json:"viewedAt"`
	ViewCount int       `json:"viewCount"`
}

type ProfileMetrics struct {
	ActiveDays       int     `json:"activeDays"`
	City             string  `json:"city"`
	CreatedListings  int     `json:"createdListings"`
	FavoriteListings int     `json:"favoriteListings"`
	Likes            int     `json:"likes"`
	Rating           float64 `json:"rating"`
	Reviews          int     `json:"reviews"`
}
