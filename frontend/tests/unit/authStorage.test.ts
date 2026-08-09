import { beforeEach, describe, expect, it } from '@jest/globals'

import { loadStoredAccount, saveStoredAccount } from '@/store/authStorage'

describe('auth storage admin role', () => {
  beforeEach(() => localStorage.clear())

  it('persists the backend administrator flag', () => {
    const account = { createdAt: '2026-01-01T00:00:00Z', id: 'account-1', isAdmin: true, login: 'nikita' }
    saveStoredAccount(account)
    expect(loadStoredAccount()).toEqual(account)
  })

  it('rejects a legacy account without an administrator flag', () => {
    localStorage.setItem('gooffer.account', JSON.stringify({ createdAt: '2026-01-01', id: '1', login: 'nikita' }))
    expect(loadStoredAccount()).toBeNull()
  })
})
