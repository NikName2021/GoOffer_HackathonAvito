import type { Page, Route } from '@playwright/test'

import { profile, profileId, recap } from './mockData'

const corsHeaders = {
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Origin': 'http://127.0.0.1:4173',
}

async function json(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    body: JSON.stringify(body),
    contentType: 'application/json',
    headers: corsHeaders,
    status,
  })
}

export async function mockApi(page: Page) {
  await page.route('http://localhost:8000/api/**', async (route) => {
    const request = route.request()
    const pathname = new URL(request.url()).pathname

    if (request.method() === 'OPTIONS') {
      await route.fulfill({ headers: corsHeaders, status: 204 })
      return
    }
    if (pathname === '/api/auth/me') return json(route, { createdAt: '2026-01-01T00:00:00Z', id: 'account-1', login: 'tester' })
    if (pathname === '/api/profiles') return json(route, [profile])
    if (pathname === `/api/profiles/${profileId}`) return json(route, profile)
    if (pathname === '/api/recap/generate') return json(route, recap, 201)

    await json(route, { error: { code: 'not_found', message: 'Not found' } }, 404)
  })
}
