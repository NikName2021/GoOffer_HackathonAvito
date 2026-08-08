import { describe, it, expect } from 'vitest'
import { buildStory, withStory } from './buildStory'

const baseMetrics = {
  total_views: 620,
  total_messages: 40,
  total_favorites: 30,
  total_purchases: 3,
  total_sales: 12,
  activity_days: 200,
  top_categories: [{ category: 'Электроника', count: 662 }],
  achievements: [
    {
      slug: 'curious',
      title: 'Любопытный',
      description: 'Просмотрел более 500 объявлений',
      icon: '👀',
      category: 'views',
    },
  ],
}

describe('buildStory', () => {
  it('для продавца выбирает persona seller', () => {
    const story = buildStory(baseMetrics, 'Алексей Продавец')
    expect(story.persona).toBe('seller')
    expect(story.headline).toBeTruthy()
    expect(story.summary.length).toBeGreaterThan(10)
    expect(story.insights.length).toBeGreaterThan(0)
  })

  it('добавляет highlights', () => {
    const story = buildStory(baseMetrics, 'Алексей')
    expect(story.highlights).toBeDefined()
    expect(story.highlights!.length).toBeGreaterThan(0)
  })

  it('для низкой активности даёт newbie/слабый профиль', () => {
    const story = buildStory(
      {
        total_views: 20,
        total_messages: 1,
        total_favorites: 2,
        total_purchases: 0,
        total_sales: 0,
        activity_days: 10,
        top_categories: [],
        achievements: [],
      },
      'Елена',
    )
    expect(story.persona).toBeTruthy()
    expect(story.headline).toBeTruthy()
  })
})

describe('withStory', () => {
  it('не перезаписывает story, если headline уже есть с backend', () => {
    const recap = {
      ...baseMetrics,
      story: {
        persona: 'seller',
        headline: 'Готовый заголовок с API',
        summary: 'summary',
        insights: ['insight'],
        highlights: ['Топ: «Электроника»'],
      },
    }
    const out = withStory(recap, 'Алексей')
    expect(out.story.headline).toBe('Готовый заголовок с API')
  })

  it('строит story, если его нет', () => {
    const recap = { ...baseMetrics }
    const out = withStory(recap, 'Алексей')
    expect(out.story.headline).toBeTruthy()
    expect(out.story.persona).toBeTruthy()
  })
})