import type { AuthAccount } from '@/types/auth.type'

const AUTH_STORAGE_KEY = 'gooffer.account'

export function loadStoredAccount(): AuthAccount | null {
  try {
    const storedValue = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!storedValue) return null

    const account = JSON.parse(storedValue) as Partial<AuthAccount>
    if (!account.id || !account.login || !account.createdAt) return null
    return account as AuthAccount
  } catch {
    return null
  }
}

export function saveStoredAccount(account: AuthAccount | null) {
  if (account) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(account))
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }
}
