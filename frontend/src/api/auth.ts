import axios from 'axios'
import { apiClient } from './api'

export interface Account {
  id: string
  login: string
  created_at: string
}

export interface AuthResponse {
  account: Account
  expires_at: string
}

export async function login(loginName: string, password: string): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', {
    login: loginName,
    password,
  })
  return data
}

export async function register(loginName: string, password: string): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', {
    login: loginName,
    password,
  })
  return data
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout')
}

export async function fetchMe(): Promise<Account | null> {
  try {
    const { data } = await apiClient.get<Account>('/auth/me')
    return data
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.status === 401) return null
    throw e
  }
}