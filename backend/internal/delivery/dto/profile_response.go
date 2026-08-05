package dto

import (
	"gooffer/backend/internal/domain"
)

const (
	dateLayout     = "2006-01-02"
	dateTimeLayout = "2006-01-02T15:04"
)

type ProfileResponse struct {
	ID         string                    `json:"id"`
	Name       string                    `json:"name"`
	JoinedAt   string                    `json:"joinedAt"`
	AvatarURL  string                    `json:"avatarUrl,omitempty"`
	Views      []ViewedAdRequest         `json:"views"`
	OwnAds     []OwnAdRequest            `json:"ownAds"`
	Stats      ProfileStatsResponse      `json:"stats"`
	Highlights ProfileHighlightsResponse `json:"highlights"`
	Purchases  []ProfilePurchaseResponse `json:"purchases"`
	Sales      []ProfileSaleResponse     `json:"sales"`
}

type ProfileStatsResponse struct {
	Likes          int      `json:"likes"`
	ChatsCount     int      `json:"chatsCount"`
	PurchasesCount int      `json:"purchasesCount"`
	SalesCount     int      `json:"salesCount"`
	TotalViewCount int      `json:"totalViewCount"`
	TotalSpent     int64    `json:"totalSpent"`
	TotalEarned    int64    `json:"totalEarned"`
	ReviewsCount   int      `json:"reviewsCount"`
	AverageRating  *float64 `json:"averageRating"`
}

type ProfileHighlightsResponse struct {
	FavoriteCategory       *string                  `json:"favoriteCategory"`
	MostExpensivePurchase  *ProfilePurchaseResponse `json:"mostExpensivePurchase"`
	LeastExpensivePurchase *ProfilePurchaseResponse `json:"leastExpensivePurchase"`
	MostExpensiveSale      *ProfileSaleResponse     `json:"mostExpensiveSale"`
	LeastExpensiveSale     *ProfileSaleResponse     `json:"leastExpensiveSale"`
}

type ProfilePurchaseResponse struct {
	Title       string `json:"title"`
	Category    string `json:"category"`
	Subcategory string `json:"subcategory,omitempty"`
	ImageURL    string `json:"imageUrl,omitempty"`
	Price       int64  `json:"price"`
	PurchasedAt string `json:"purchasedAt"`
}

type ProfileSaleResponse struct {
	Title       string                 `json:"title"`
	Category    string                 `json:"category"`
	Subcategory string                 `json:"subcategory,omitempty"`
	ImageURL    string                 `json:"imageUrl,omitempty"`
	Price       int64                  `json:"price"`
	SoldAt      string                 `json:"soldAt"`
	ViewCount   int                    `json:"viewCount"`
	Review      *ProfileReviewResponse `json:"review"`
}

type ProfileReviewResponse struct {
	Comment   string `json:"comment"`
	Rating    int    `json:"rating"`
	CreatedAt string `json:"createdAt"`
}

func ToProfileResponse(user *domain.User) ProfileResponse {
	summary := domain.SummarizeProfile(user)
	purchases := make([]ProfilePurchaseResponse, len(summary.Purchases))
	for i := range summary.Purchases {
		purchases[i] = toPurchaseResponse(&summary.Purchases[i])
	}
	sales := make([]ProfileSaleResponse, len(summary.Sales))
	for i := range summary.Sales {
		sales[i] = toSaleResponse(&summary.Sales[i])
	}
	views := make([]ViewedAdRequest, len(user.Views))
	for i := range user.Views {
		views[i] = toViewedAdWriteModel(&user.Views[i])
	}
	ownAds := make([]OwnAdRequest, len(user.OwnAds))
	for i := range user.OwnAds {
		ownAds[i] = toOwnAdWriteModel(&user.OwnAds[i])
	}

	return ProfileResponse{
		ID:        summary.ID,
		Name:      summary.Name,
		JoinedAt:  summary.JoinedAt.Format(dateLayout),
		AvatarURL: summary.AvatarURL,
		Views:     views,
		OwnAds:    ownAds,
		Stats: ProfileStatsResponse{
			Likes:          summary.Stats.Likes,
			ChatsCount:     summary.Stats.ChatsCount,
			PurchasesCount: summary.Stats.PurchasesCount,
			SalesCount:     summary.Stats.SalesCount,
			TotalViewCount: summary.Stats.TotalViewCount,
			TotalSpent:     summary.Stats.TotalSpent,
			TotalEarned:    summary.Stats.TotalEarned,
			ReviewsCount:   summary.Stats.ReviewsCount,
			AverageRating:  summary.Stats.AverageRating,
		},
		Highlights: ProfileHighlightsResponse{
			FavoriteCategory:       summary.Highlights.FavoriteCategory,
			MostExpensivePurchase:  optionalPurchaseResponse(summary.Highlights.MostExpensivePurchase),
			LeastExpensivePurchase: optionalPurchaseResponse(summary.Highlights.LeastExpensivePurchase),
			MostExpensiveSale:      optionalSaleResponse(summary.Highlights.MostExpensiveSale),
			LeastExpensiveSale:     optionalSaleResponse(summary.Highlights.LeastExpensiveSale),
		},
		Purchases: purchases,
		Sales:     sales,
	}
}

func toViewedAdWriteModel(view *domain.ViewedAd) ViewedAdRequest {
	response := ViewedAdRequest{
		AdRequest:    toAdWriteModel(&view.Ad),
		LastViewedAt: view.LastViewedAt.Format(dateTimeLayout),
		IsFavorite:   view.IsFavorite,
		IsPurchased:  view.IsPurchased,
	}
	if view.FavoritedAt != nil {
		response.FavoritedAt = view.FavoritedAt.Format(dateTimeLayout)
	}
	if view.PurchasedAt != nil {
		response.PurchasedAt = view.PurchasedAt.Format(dateTimeLayout)
	}
	return response
}

func toOwnAdWriteModel(ad *domain.OwnAd) OwnAdRequest {
	response := OwnAdRequest{
		AdRequest:  toAdWriteModel(&ad.Ad),
		IsArchived: ad.IsArchived,
		IsSold:     ad.IsSold,
	}
	if ad.SoldAt != nil {
		response.SoldAt = ad.SoldAt.Format(dateLayout)
	}
	if ad.Review != nil {
		response.Review = &ReviewRequest{
			Comment:   ad.Review.Comment,
			Rating:    ad.Review.Rating,
			CreatedAt: ad.Review.CreatedAt.Format(dateLayout),
		}
	}
	return response
}

func toAdWriteModel(ad *domain.Ad) AdRequest {
	return AdRequest{
		Title:       ad.Title,
		Category:    ad.Category,
		Subcategory: ad.Subcategory,
		ImageURL:    ad.ImageURL,
		Price:       ad.Price,
		ViewCount:   ad.ViewCount,
	}
}

func ToProfileResponseList(users []domain.User) []ProfileResponse {
	result := make([]ProfileResponse, len(users))
	for i := range users {
		result[i] = ToProfileResponse(&users[i])
	}
	return result
}

func toPurchaseResponse(purchase *domain.ProfilePurchase) ProfilePurchaseResponse {
	return ProfilePurchaseResponse{
		Title:       purchase.Title,
		Category:    purchase.Category,
		Subcategory: purchase.Subcategory,
		ImageURL:    purchase.ImageURL,
		Price:       purchase.Price,
		PurchasedAt: purchase.PurchasedAt.Format(dateTimeLayout),
	}
}

func toSaleResponse(sale *domain.ProfileSale) ProfileSaleResponse {
	response := ProfileSaleResponse{
		Title:       sale.Title,
		Category:    sale.Category,
		Subcategory: sale.Subcategory,
		ImageURL:    sale.ImageURL,
		Price:       sale.Price,
		SoldAt:      sale.SoldAt.Format(dateLayout),
		ViewCount:   sale.ViewCount,
	}
	if sale.Review != nil {
		response.Review = &ProfileReviewResponse{
			Comment:   sale.Review.Comment,
			Rating:    sale.Review.Rating,
			CreatedAt: sale.Review.CreatedAt.Format(dateLayout),
		}
	}
	return response
}

func optionalPurchaseResponse(purchase *domain.ProfilePurchase) *ProfilePurchaseResponse {
	if purchase == nil {
		return nil
	}
	response := toPurchaseResponse(purchase)
	return &response
}

func optionalSaleResponse(sale *domain.ProfileSale) *ProfileSaleResponse {
	if sale == nil {
		return nil
	}
	response := toSaleResponse(sale)
	return &response
}
