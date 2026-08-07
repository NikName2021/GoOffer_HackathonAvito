import type { Recap, Story } from '@/types/recap.type'

type Metrics = Pick<
  Recap,
  | 'total_views'
  | 'total_messages'
  | 'total_favorites'
  | 'total_purchases'
  | 'total_sales'
  | 'activity_days'
  | 'top_categories'
  | 'achievements'
>

function personaFrom(m: Metrics): string {
  if (m.total_sales >= 5 && m.total_sales >= m.total_purchases) return 'seller'
  if (m.total_purchases >= 5 && m.total_purchases > m.total_sales) return 'buyer'
  if (m.activity_days < 40 && m.total_views < 200) return 'newbie'
  if (m.total_views >= 800) return 'explorer'
  return 'mixed'
}

export function buildStory(m: Metrics, name?: string): Story {
  const persona = personaFrom(m)
  const top = m.top_categories?.[0]
  const who = name ? name.split(' ')[0] : 'Вы'

  const headlines: Record<string, string> = {
    seller: `${who}, ваш год продавца получился сильным`,
    buyer: `${who}, вы охотились за лучшими находками`,
    explorer: `${who}, вы исследовали площадку по полной`,
    newbie: `${who}, ваш путь на Авито только начинается`,
    mixed: `${who}, ваш год на площадке — в балансе`,
  }

  const parts = [
    `За год — ${m.total_views.toLocaleString('ru-RU')} просмотров и ${m.activity_days} дней активности.`,
  ]
  if (m.total_purchases > 0 || m.total_sales > 0) {
    parts.push(`Сделок: ${m.total_purchases} покупок и ${m.total_sales} продаж.`)
  }
  if (top) parts.push(`Чаще всего вы были в категории «${top.category}».`)
  if (m.achievements?.length) parts.push(`Открыто ачивок: ${m.achievements.length}.`)

  const insights: string[] = []
  if (m.total_views >= 500) insights.push('Вы много смотрели объявления — база для удачных сделок.')
  if (m.total_messages >= 30) insights.push('Вы активно писали в чаты: диалоги двигают сделки.')
  if (m.total_favorites >= 50) insights.push('Избранное помогало не терять интересные варианты.')
  if (m.total_sales >= 5) insights.push('Продажи подтверждают, что объявления работали.')
  if (m.total_purchases >= 5) insights.push('Вы не просто смотрели — вы покупали.')
  if (m.activity_days >= 100) insights.push('Регулярность: площадка была с вами почти весь год.')
  if (insights.length === 0) insights.push('Ещё много возможностей впереди — начните с рекомендации ниже.')

  return {
    persona,
    headline: headlines[persona] ?? headlines.mixed,
    summary: parts.join(' '),
    insights: insights.slice(0, 4),
    highlights: [
        top ? `Топ: «${top.category}»` : 'Год на Авито',
        m.total_sales >= 5
        ? `${m.total_sales} продаж`
        : m.total_views >= 100
            ? `${m.total_views} просмотров`
            : 'Персональные итоги',
        m.activity_days >= 100
        ? `${m.activity_days} дней активности`
        : m.achievements?.length
            ? `${m.achievements.length} ачивок`
            : 'Ваш стиль на площадке',
    ],
    }
}

export function withStory<T extends Metrics>(recap: T, name?: string): T & { story: Story } {
  const existing = (recap as { story?: Story }).story
  if (existing?.headline) return recap as T & { story: Story }
  return { ...recap, story: buildStory(recap, name) }
}