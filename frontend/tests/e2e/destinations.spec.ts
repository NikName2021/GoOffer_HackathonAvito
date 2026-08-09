import { expect, test } from '@playwright/test'

import { mockApi } from './mockApi'
import { profileId } from './mockData'

test('CTA destinations render the expected mocked Avito pages', async ({ page }) => {
  await mockApi(page)

  const destinations = [
    [`/avito/search?category=Электроника&profileId=${profileId}`, 'Электроника'],
    [`/avito/favorites?profileId=${profileId}`, 'Избранное'],
    [`/avito/recommendations?profileId=${profileId}`, 'Рекомендации для вас'],
    [`/avito/my/items?profileId=${profileId}`, 'Мои объявления'],
    [`/avito/messages?profileId=${profileId}`, 'Сообщения'],
    [`/avito/create?profileId=${profileId}`, 'Разместить объявление'],
  ] as const

  for (const [path, heading] of destinations) {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
  }

  await page.goto(`/avito/favorites?profileId=${profileId}`)
  await expect(page.getByRole('heading', { name: 'Беспроводные наушники' })).toBeVisible()
  await expect(page.locator('.avito-mock-card-image img').first()).toBeVisible()

  await page.goto(`/avito/my/items/own-ad-1?profileId=${profileId}`)
  await expect(page.getByRole('heading', { level: 1, name: 'Игровая консоль' })).toBeVisible()
})
