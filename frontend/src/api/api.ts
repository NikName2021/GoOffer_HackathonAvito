import axios from 'axios'

const DEFAULT_BASE_URL = '/http://localhost:8001'

export const API_BASE_URL = import.meta.env.VITE_BASE_API_URL?.trim() || DEFAULT_BASE_URL

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})
