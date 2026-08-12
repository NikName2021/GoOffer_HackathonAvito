import { expect, test } from '@playwright/test'

import { mockApi } from './mockApi'
import { profile, profileId } from './mockData'

test('пользователь выбирает несколько миссий на финальном слайде', async ({ page }) => {
  await mockApi(page)
  await page.addInitScript(({ key }) => window.localStorage.setItem(key, 'true'), {
    key: `avito-recap-opened:${profileId}:2026`,
  })
  await page.goto(`/avito?profileId=${profileId}`)

  await page.getByRole('button', { name: `Открыть итоги года для ${profile.name}` }).click()
  await page.getByRole('button', { name: /Открыть итог 3: Миссия на следующий год/ }).click()
  await expect(page.getByRole('heading', { name: 'Миссии на следующий год' })).toBeVisible()

  await page.getByRole('button', { name: /Продать три ненужные вещи/ }).click()
  await page.getByRole('button', { name: /Попробовать Авито Доставку/ }).click()
  await page.getByRole('button', { name: 'Сохранить миссии' }).click()

  await expect(page.getByText('0 из 3')).toBeVisible()
  await expect(page.getByText('0 из 1')).toBeVisible()
  const missionCta = page.getByRole('button', { name: /Разместить объявление/ })
  await expect(missionCta).toBeVisible()
  await missionCta.click()
  await expect(page).toHaveURL(new RegExp(`/avito/create\\?profileId=${profileId}`))
})
