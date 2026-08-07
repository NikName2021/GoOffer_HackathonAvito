package generator

import (
	"fmt"
	"strings"

	"gooffer/backend/internal/domain"
)

// BuildStory собирает связный текст итогов по метрикам и ачивкам.
// Правила воспроизводимы, без PII и чужих данных.
func BuildStory(year int, metrics *UserMetrics, achievements []domain.Achievement) domain.Story {
	if metrics == nil {
		return domain.Story{
			Persona:  "newbie",
			Headline: fmt.Sprintf("Ваш %d год на Авито только начинается", year),
			Summary:  "Пока мало активности за год — самое время открыть каталог и сохранить первое объявление в избранное.",
			Insights: []string{
				"Мало действий за год — итоги ещё формируются.",
				"Даже несколько просмотров уже показывают интересы.",
			},
			Highlights: []string{
				"Старт на площадке",
				"Итоги ещё формируются",
				"Впереди много возможностей",
			},
		}
	}

	persona := detectPersona(metrics)
	top := topCategoryName(metrics)

	return domain.Story{
		Persona:    persona,
		Headline:   buildHeadline(year, persona, metrics, top),
		Summary:    buildSummary(year, persona, metrics, top, achievements),
		Insights:   buildInsights(metrics, top, achievements),
		Highlights: buildHighlights(metrics, top, achievements),
	}
}

func detectPersona(m *UserMetrics) string {
	switch {
	case m.TotalSales >= 5 && m.TotalPurchases >= 5:
		return "mixed"
	case m.TotalSales >= 3 && m.TotalSales >= m.TotalPurchases:
		return "seller"
	case m.TotalPurchases >= 3 && m.TotalPurchases > m.TotalSales:
		return "buyer"
	case m.TotalViews >= 500 || m.ActivityDays >= 100:
		return "explorer"
	default:
		return "newbie"
	}
}

func topCategoryName(m *UserMetrics) string {
	if len(m.TopCategories) == 0 {
		return ""
	}
	return m.TopCategories[0].Category
}

func buildHeadline(year int, persona string, m *UserMetrics, top string) string {
	switch persona {
	case "seller":
		if top != "" {
			return fmt.Sprintf("%d: год продавца в категории «%s»", year, top)
		}
		return fmt.Sprintf("%d: вы активно продавали на Авито", year)
	case "buyer":
		if top != "" {
			return fmt.Sprintf("%d: охота за выгодным в «%s»", year, top)
		}
		return fmt.Sprintf("%d: год удачных находок", year)
	case "mixed":
		return fmt.Sprintf("%d: и покупали, и продавали — полный цикл", year)
	case "explorer":
		if top != "" {
			return fmt.Sprintf("%d: %d просмотров, главный интерес — «%s»", year, m.TotalViews, top)
		}
		return fmt.Sprintf("%d: год исследований на площадке", year)
	default:
		return fmt.Sprintf("%d: ваш старт на Авито", year)
	}
}

func buildSummary(
	year int,
	persona string,
	m *UserMetrics,
	top string,
	achievements []domain.Achievement,
) string {
	var b strings.Builder

	b.WriteString(fmt.Sprintf(
		"За %d год вы были активны %d %s: %d просмотров, %d сообщений, %d покупок и %d продаж.",
		year,
		m.ActivityDays,
		dayWord(m.ActivityDays),
		m.TotalViews,
		m.TotalMessages,
		m.TotalPurchases,
		m.TotalSales,
	))

	if top != "" {
		b.WriteString(fmt.Sprintf(" Чаще всего вас тянуло в «%s».", top))
	}

	switch persona {
	case "seller":
		b.WriteString(" Вы больше отдавали товары в новые руки, чем искали для себя.")
	case "buyer":
		b.WriteString(" Вы чаще закрывали сделки как покупатель.")
	case "mixed":
		b.WriteString(" Вы использовали Авито и для покупок, и для продаж.")
	case "explorer":
		b.WriteString(" Вы много смотрели и сравнивали — классический исследователь площадки.")
	default:
		b.WriteString(" Активности пока немного, но интерес уже виден.")
	}

	if len(achievements) > 0 {
		b.WriteString(fmt.Sprintf(
			" Получено ачивок: %d — это отражение вашего стиля на площадке.",
			len(achievements),
		))
	}

	return b.String()
}

func buildInsights(m *UserMetrics, top string, achievements []domain.Achievement) []string {
	insights := make([]string, 0, 4)

	if top != "" && m.TotalViews > 0 {
		insights = append(insights, fmt.Sprintf(
			"Топ-категория «%s» набралась из ваших просмотров и действий за год.",
			top,
		))
	}

	if m.TotalFavorites >= 5 && m.TotalPurchases == 0 {
		insights = append(insights,
			"Много избранного и мало покупок — интерес есть, сделка ещё не закрыта.",
		)
	}

	if m.TotalMessages >= 10 && m.TotalPurchases == 0 {
		insights = append(insights,
			"Вы уже писали продавцам: диалоги — короткий путь к сделке.",
		)
	}

	if m.TotalSales >= 1 {
		insights = append(insights,
			"Продажи в этом году были: имеет смысл закрепить результат новым объявлением.",
		)
	}

	if m.ActivityDays >= 100 {
		insights = append(insights, fmt.Sprintf(
			"Активность %d дней из года — вы возвращались на площадку регулярно.",
			m.ActivityDays,
		))
	}

	if len(achievements) == 0 {
		insights = append(insights,
			"Пороги ачивок ещё не пройдены — больше просмотров и сделок откроют бейджи.",
		)
	} else if len(insights) < 2 {
		insights = append(insights, fmt.Sprintf(
			"Бейджи (%d) выданы по прозрачным порогам: просмотры, сообщения, сделки, дни активности.",
			len(achievements),
		))
	}

	if len(insights) > 4 {
		insights = insights[:4]
	}
	if len(insights) == 0 {
		insights = append(insights, "Итоги собраны только из ваших действий на площадке за выбранный год.")
	}
	return insights
}

func buildHighlights(m *UserMetrics, top string, achievements []domain.Achievement) []string {
	h := make([]string, 0, 3)

	if top != "" {
		h = append(h, fmt.Sprintf("Топ: «%s»", top))
	}
	if m.TotalSales >= 5 {
		h = append(h, fmt.Sprintf("%d продаж за год", m.TotalSales))
	} else if m.TotalPurchases >= 5 {
		h = append(h, fmt.Sprintf("%d покупок за год", m.TotalPurchases))
	} else if m.TotalViews >= 100 {
		h = append(h, fmt.Sprintf("%d просмотров", m.TotalViews))
	}
	if m.ActivityDays >= 100 {
		h = append(h, fmt.Sprintf("%d дней активности", m.ActivityDays))
	} else if len(achievements) > 0 {
		h = append(h, fmt.Sprintf("%d ачивок", len(achievements)))
	}
	if m.TotalMessages >= 20 && len(h) < 3 {
		h = append(h, fmt.Sprintf("%d сообщений в чатах", m.TotalMessages))
	}
	if m.TotalFavorites >= 20 && len(h) < 3 {
		h = append(h, fmt.Sprintf("%d в избранном", m.TotalFavorites))
	}

	fallbacks := []string{"Год на Авито", "Персональные итоги", "Ваш стиль на площадке"}
	for _, f := range fallbacks {
		if len(h) >= 3 {
			break
		}
		h = append(h, f)
	}
	if len(h) > 3 {
		h = h[:3]
	}
	return h
}

func dayWord(n int) string {
	n = n % 100
	if n >= 11 && n <= 14 {
		return "дней"
	}
	switch n % 10 {
	case 1:
		return "день"
	case 2, 3, 4:
		return "дня"
	default:
		return "дней"
	}
}
