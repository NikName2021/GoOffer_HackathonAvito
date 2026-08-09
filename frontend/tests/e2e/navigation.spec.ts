import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('http://localhost:8000/api/**', (route) => route.fulfill({
    body: JSON.stringify({ error: { code: 'unauthorized', message: 'Unauthorized' } }),
    contentType: 'application/json',
    status: 401,
  }))
})

test('кнопка возврата видна у левого края и ведёт к профилям', async ({ page }) => {
  await page.goto('/avito')

  const backLink = page.getByRole('link', { name: 'Вернуться к профилям' })
  await expect(backLink).toBeVisible()

  const box = await backLink.boundingBox()
  expect(box?.x).toBeLessThanOrEqual(64)

  await backLink.click()
  await expect(page).toHaveURL('/')
})
