package domain

import (
	"time"

	"github.com/google/uuid"
)

// User is a profile owned by an authenticated account. OwnAds and Views are
// the source data; every aggregate returned by the API is calculated from them.
type User struct {
	ID           uuid.UUID
	Name         string
	Avatar       string
	RegisteredAt time.Time
	ProfileType  string
	Likes        int
	ChatsCount   int
	OwnAds       []OwnAd
	Views        []ViewedAd
}

type Ad struct {
	Title       string `json:"title"`
	Category    string `json:"category"`
	Subcategory string `json:"subcategory,omitempty"`
	ImageURL    string `json:"imageUrl,omitempty"`
	Price       int64  `json:"price"`
	ViewCount   int    `json:"viewCount"`
}

type Review struct {
	Comment   string    `json:"comment"`
	Rating    int       `json:"rating"`
	CreatedAt time.Time `json:"createdAt"`
}

type OwnAd struct {
	Ad
	IsArchived bool       `json:"isArchived"`
	IsSold     bool       `json:"isSold"`
	SoldAt     *time.Time `json:"soldAt,omitempty"`
	Review     *Review    `json:"review,omitempty"`
}

type ViewedAd struct {
	Ad
	LastViewedAt time.Time  `json:"lastViewedAt"`
	IsFavorite   bool       `json:"isFavorite"`
	FavoritedAt  *time.Time `json:"favoritedAt,omitempty"`
	IsPurchased  bool       `json:"isPurchased"`
	PurchasedAt  *time.Time `json:"purchasedAt,omitempty"`
}
