package domain

type Achievement struct {
	Slug        string
	Title       string
	Description string
	Icon        string
	Category    string
}

var DefaultAchievements = []Achievement{
	{
		Slug:        "curious",
		Title:       "Любопытный",
		Description: "Просмотрел не менее 500 объявлений за год",
		Icon:        "👀",
		Category:    "views",
	},
	{
		Slug:        "explorer",
		Title:       "Исследователь",
		Description: "Просмотрел не менее 1000 объявлений за год",
		Icon:        "🔍",
		Category:    "views",
	},
	{
		Slug:        "seller_master",
		Title:       "Мастер продаж",
		Description: "Продал не менее 5 товаров за год",
		Icon:        "🏆",
		Category:    "sales",
	},
	{
		Slug:        "shopaholic",
		Title:       "Шопоголик",
		Description: "Купил не менее 10 товаров за год",
		Icon:        "🛍️",
		Category:    "sales",
	},
	{
		Slug:        "veteran",
		Title:       "Ветеран",
		Description: "Был активен не менее 300 дней в году",
		Icon:        "⭐",
		Category:    "activity",
	},
	{
		Slug:        "enthusiast",
		Title:       "Энтузиаст",
		Description: "Был активен не менее 100 дней в году",
		Icon:        "🔥",
		Category:    "activity",
	},
}
