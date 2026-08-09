import { expect, test } from '@playwright/test'

import { mockApi } from './mockApi'
import { profile, profileId } from './mockData'

test('новый запуск из профиля снова показывает посылку', async ({ page }) => {
  await mockApi(page)
  await page.goto('/')
  await page.evaluate(({ key }) => window.localStorage.setItem(key, 'true'), {
    key: `avito-recap-opened:${profileId}:2026`,
  })

  const profileCard = page.getByRole('article').filter({ hasText: profile.name })
  await profileCard.locator('button').last().click()
  await page.getByRole('link', { name: /Перейти на симуляцию/ }).click()

  await expect(page).toHaveURL(new RegExp(`/avito\\?profileId=${profileId}`))
  const storedFlag = await page.evaluate((key) => window.localStorage.getItem(key), `avito-recap-opened:${profileId}:2026`)
  expect(storedFlag).toBeNull()

  await page.getByRole('button', { name: `Открыть итоги года для ${profile.name}` }).click()
  await expect(page.getByRole('button', { name: 'Распаковать итоги года' })).toBeVisible()
})
