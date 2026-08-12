import { expect, test } from '@playwright/test'

import { mockApi } from './mockApi'

test('admin creates, edits and deletes a recap card setting', async ({ page }) => {
  await mockApi(page, { isAdmin: true })
  await page.goto('/')

  await page.getByRole('link', { name: 'Настройка итогов года' }).click()
  await expect(page.getByRole('heading', { name: 'Настройка итогов года' })).toBeVisible()
  await page.getByRole('button', { name: /Новая карточка|Новое достижение/ }).click()
  await page.getByLabel('Название настройки').fill('Активный покупатель')
  await page.getByLabel('Заголовок карточки').fill('Вы активно искали')
  await page.getByRole('button', { name: 'Сохранить' }).click()
  await expect(page.getByText('Активный покупатель')).toBeVisible()

  await page.getByRole('button', { name: 'Редактировать Активный покупатель' }).click()
  await page.getByLabel('Заголовок карточки').fill('Ваш активный год')
  await page.getByRole('button', { name: 'Сохранить' }).click()
  await expect(page.getByText('Ваш активный год')).toBeVisible()

  await page.getByRole('button', { name: 'Удалить Активный покупатель' }).click()
  await page.getByRole('button', { name: 'Удалить', exact: true }).click()
  await expect(page.getByText('Активный покупатель', { exact: true })).not.toBeVisible()
})

test('regular user does not see recap settings', async ({ page }) => {
  await mockApi(page)
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Настройка итогов года' })).toHaveCount(0)
})

test('admin edits an existing achievement without create or delete controls', async ({ page }) => {
  await mockApi(page, { isAdmin: true })
  await page.goto('/')

  await page.getByRole('link', { name: 'Настройка итогов года' }).click()
  await expect(page.getByRole('heading', { name: /Встроенные (ачивки|достижения)/ })).toBeVisible()
  await expect(page.getByText('Любопытный', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: /создать ачивку|удалить ачивку/i })).toHaveCount(0)

  await page.getByRole('button', { name: 'Редактировать ачивку Любопытный' }).click()
  await page.getByLabel('Название ачивки').fill('Очень любопытный')
  await page.getByLabel('Пороговое значение').fill('750')
  await page.getByRole('radio', { name: 'Иконка Кубок' }).click()
  await page.getByLabel('Ачивка активна').uncheck()
  await page.getByRole('button', { name: 'Сохранить', exact: true }).click()

  await expect(page.getByText('Очень любопытный', { exact: true })).toBeVisible()
  await expect(page.getByText('Отключена', { exact: true })).toBeVisible()
  await expect(page.getByText('Не меньше 750', { exact: true })).toBeVisible()
  await expect(page.getByText('🏆', { exact: true })).toBeVisible()
})
