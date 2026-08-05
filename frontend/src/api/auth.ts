import axios from 'axios'

import { apiClient } from './api'
import type { AuthAccount, AuthCredentials, AuthErrorEnvelope, AuthFailure } from '@/types/auth.type'

type AuthRequestError = Error & { code: string }

function createAuthRequestError(code: string, message: string): AuthRequestError {
  const error = new Error(message) as AuthRequestError
  error.code = code
  error.name = 'AuthRequestError'
  return error
}

function isAuthRequestError(error: unknown): error is AuthRequestError {
  return error instanceof Error && error.name === 'AuthRequestError' && 'code' in error
}

const authMessages: Record<string, string> = {
  invalid_credentials: 'Неверный логин или пароль.',
  invalid_login: 'Логин должен содержать от 3 до 32 букв, цифр или символов ._-',
  login_taken: 'Этот логин уже занят.',
  network_error: 'Не удалось связаться с сервером.',
  unauthorized: 'Сессия завершена. Войдите снова.',
  weak_password: 'Пароль должен содержать не менее 8 символов.',
}

function assertAccount(data: AuthAccount | undefined, fallbackMessage: string): AuthAccount {
  if (!data?.id || !data.login || !data.createdAt) {
    throw createAuthRequestError('invalid_response', fallbackMessage)
  }

  return data
}

function getAxiosErrorMessage(error: unknown, fallbackMessage: string): never {
  if (isAuthRequestError(error)) {
    throw error
  }

  if (axios.isAxiosError<AuthErrorEnvelope>(error)) {
    const status = error.response?.status
    if (!status || status >= 500) {
      throw createAuthRequestError('network_error', authMessages.network_error)
    }

    const code = error.response?.data?.error.code
    const message = code ? (authMessages[code] ?? error.response?.data?.error.message) : fallbackMessage
    throw createAuthRequestError(code ?? 'request_error', message)
  }

  throw createAuthRequestError('unknown_error', fallbackMessage)
}

export async function login(credentials: AuthCredentials): Promise<AuthAccount> {
  try {
    const { data } = await apiClient.post<AuthAccount>('/auth/login', credentials)
    return assertAccount(data, 'Не удалось войти в аккаунт.')
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      throw createAuthRequestError('invalid_credentials', authMessages.invalid_credentials)
    }

    getAxiosErrorMessage(error, 'Не удалось войти в аккаунт.')
  }
}

export async function register(credentials: AuthCredentials): Promise<AuthAccount> {
  try {
    const { data } = await apiClient.post<AuthAccount>('/auth/register', credentials)
    return assertAccount(data, 'Не удалось создать аккаунт.')
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 409) {
      throw createAuthRequestError('login_taken', authMessages.login_taken)
    }

    getAxiosErrorMessage(error, 'Не удалось создать аккаунт.')
  }
}

export async function getCurrentAccount(): Promise<AuthAccount> {
  try {
    const { data } = await apiClient.get<AuthAccount>('/auth/me')
    return assertAccount(data, 'Профиль не найден.')
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      throw createAuthRequestError('unauthorized', authMessages.unauthorized)
    }

    getAxiosErrorMessage(error, 'Профиль не найден.')
  }
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post('/auth/logout')
  } catch (error) {
    getAxiosErrorMessage(error, 'Не удалось выйти из аккаунта.')
  }
}

export function getAuthFailure(error: unknown): AuthFailure {
  if (isAuthRequestError(error)) {
    return { code: error.code, message: error.message }
  }

  return { code: 'unknown_error', message: 'Не удалось выполнить запрос. Попробуйте ещё раз.' }
}
