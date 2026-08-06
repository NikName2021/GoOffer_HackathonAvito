package generator

import "gooffer/backend/internal/domain"

// BuildRecommendations формирует 1–3 следующих шага по метрикам.
// Правила воспроизводимы и не содержат чужих/чувствительных данных.
func BuildRecommendations(metrics *UserMetrics) []domain.Recommendation {
	if metrics == nil {
		return []domain.Recommendation{
			{
				Code:        "explore",
				Title:       "Начните исследовать Авито",
				Description: "Посмотрите свежие объявления — так проще понять, что вам интересно.",
				ActionLabel: "Смотреть объявления",
			},
		}
	}

	recs := make([]domain.Recommendation, 0, 3)

	topCategory := ""
	if len(metrics.TopCategories) > 0 {
		topCategory = metrics.TopCategories[0].Category
	}

	// Вот здесь все реализовал
	// 1. Вернуться к интересной категории
	if topCategory != "" && metrics.TotalViews > 0 {
		recs = append(recs, domain.Recommendation{
			Code:        "browse_top_category",
			Title:       "Продолжите в «" + topCategory + "»",
			Description: "В этом году вы чаще всего смотрели эту категорию — там наверняка есть новое.",
			ActionLabel: "Открыть категорию",
			Category:    topCategory,
		})
	}

	// 2. Избранное без покупок / слабая конверсия
	if metrics.TotalFavorites >= 5 && metrics.TotalPurchases == 0 {
		recs = append(recs, domain.Recommendation{
			Code:        "review_favorites",
			Title:       "Вернитесь к избранному",
			Description: "Вы сохраняли объявления, но пока не покупали. Проверьте, что ещё актуально.",
			ActionLabel: "Открыть избранное",
		})
	} else if metrics.TotalFavorites > metrics.TotalPurchases*3 && metrics.TotalFavorites >= 3 {
		recs = append(recs, domain.Recommendation{
			Code:        "review_favorites",
			Title:       "Проверьте избранное",
			Description: "Часть сохранённых объявлений могла обновиться — загляните снова.",
			ActionLabel: "Открыть избранное",
		})
	}

	// 3. Продавец
	if metrics.TotalSales >= 1 {
		recs = append(recs, domain.Recommendation{
			Code:        "post_listing",
			Title:       "Разместите новое объявление",
			Description: "Вы уже успешно продавали. Новый лот поможет закрепить результат.",
			ActionLabel: "Подать объявление",
		})
	} else if metrics.TotalViews >= 50 && metrics.TotalSales == 0 && metrics.TotalPurchases == 0 {
		recs = append(recs, domain.Recommendation{
			Code:        "try_selling",
			Title:       "Попробуйте продать ненужное",
			Description: "Вы активно смотрите площадку — самое время выставить то, чем не пользуетесь.",
			ActionLabel: "Подать объявление",
		})
	}

	// 4. Покупатель / диалоги
	if metrics.TotalMessages >= 10 && metrics.TotalPurchases == 0 {
		recs = append(recs, domain.Recommendation{
			Code:        "continue_chats",
			Title:       "Продолжите диалоги",
			Description: "У вас уже есть переписки с продавцами — доведите интересные сделки до конца.",
			ActionLabel: "Открыть сообщения",
		})
	}

	// 5. Fallback, если ничего не набралось
	if len(recs) == 0 {
		recs = append(recs, domain.Recommendation{
			Code:        "explore",
			Title:       "Исследуйте новые категории",
			Description: "Загляните в разделы, которые ещё не пробовали — так проще найти полезное.",
			ActionLabel: "Смотреть объявления",
		})
	}

	// Не больше 3 карточек
	if len(recs) > 3 {
		recs = recs[:3]
	}
	return recs
}
