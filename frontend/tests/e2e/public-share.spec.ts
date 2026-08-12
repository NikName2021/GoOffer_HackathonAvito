import { expect, test } from '@playwright/test'

import { mockApi } from './mockApi'
import { profileId } from './mockData'

const token = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
const mobileStoryToken = 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB'

test('owner selects only shareable cards and opens the public link', async ({ page }) => {
  const shareBodies: Array<{ card_ids: string[]; format: string }> = []
  await mockApi(page)
  page.on('request', (request) => {
    if (request.url().endsWith(`/api/recap/${profileId}/2026/shares`)) {
      shareBodies.push(request.postDataJSON())
    }
  })
  await page.addInitScript(({ key }) => window.localStorage.setItem(key, 'true'), {
    key: `avito-recap-opened:${profileId}:2026`,
  })
  await page.goto(`/avito?profileId=${profileId}`)
  await page.locator('.avito-static-recap-link').click()
  await page.getByRole('button', { name: 'Поделиться' }).click()

  await page.getByRole('button', { name: 'Создать и открыть ссылку' }).click()
  await expect(page).toHaveURL(`/share/${token}`)
  await expect(page.getByText('Публичная подборка · без приватных данных')).toBeVisible()
  expect(shareBodies).toEqual([{ card_ids: ['year_overview', 'year_final'], format: 'responsive' }])
})

test('expired public link shows a clear error without loading private APIs', async ({ page }) => {
  const privateRequests: string[] = []
  await mockApi(page)
  page.on('request', (request) => {
    const pathname = new URL(request.url()).pathname
    if (/^\/api\/(auth|profiles|recap\/generate)/.test(pathname)) privateRequests.push(request.url())
  })
  await page.goto('/share/expired-token')

  await expect(page.getByText('Ссылка недействительна или срок её действия истёк.')).toBeVisible()
  expect(privateRequests).toEqual([])
})

test('mobile story uses a dedicated 9:16 layout', async ({ page }) => {
  await mockApi(page)
  await page.goto(`/share/${mobileStoryToken}`)

  await expect(page.getByRole('region', { name: 'История 9:16' })).toBeVisible()
})
