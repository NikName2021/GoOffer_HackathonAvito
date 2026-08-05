import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import { getAuthFailure, getCurrentAccount, login, logout, register } from '@/api'
import { loadStoredAccount } from './authStorage'
import type { AuthAccount, AuthCredentials, AuthFailure } from '@/types/auth.type'

type AuthStatus = 'idle' | 'checking' | 'submitting' | 'logging-out'

interface AuthState {
  account: AuthAccount | null
  error: string | null
  status: AuthStatus
}

const initialState: AuthState = {
  account: loadStoredAccount(),
  error: null,
  status: 'idle',
}

const thunkOptions = {
  serializeError: () => ({ message: 'Auth request failed' }),
}

export const restoreSession = createAsyncThunk<AuthAccount, void, { rejectValue: AuthFailure }>(
  'auth/restoreSession',
  async (_, { rejectWithValue }) => {
    try {
      return await getCurrentAccount()
    } catch (error) {
      return rejectWithValue(getAuthFailure(error))
    }
  },
  thunkOptions,
)

export const loginAccount = createAsyncThunk<AuthAccount, AuthCredentials, { rejectValue: AuthFailure }>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      return await login(credentials)
    } catch (error) {
      return rejectWithValue(getAuthFailure(error))
    }
  },
  thunkOptions,
)

export const registerAccount = createAsyncThunk<AuthAccount, AuthCredentials, { rejectValue: AuthFailure }>(
  'auth/register',
  async (credentials, { rejectWithValue }) => {
    try {
      return await register(credentials)
    } catch (error) {
      return rejectWithValue(getAuthFailure(error))
    }
  },
  thunkOptions,
)

export const logoutAccount = createAsyncThunk<void, void, { rejectValue: AuthFailure }>(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await logout()
    } catch (error) {
      return rejectWithValue(getAuthFailure(error))
    }
  },
  thunkOptions,
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(restoreSession.pending, (state) => {
        state.status = 'checking'
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.account = action.payload
        state.status = 'idle'
      })
      .addCase(restoreSession.rejected, (state, action) => {
        if (action.payload?.code === 'unauthorized') state.account = null
        state.status = 'idle'
      })
      .addCase(logoutAccount.pending, (state) => {
        state.error = null
        state.status = 'logging-out'
      })
      .addCase(logoutAccount.fulfilled, (state) => {
        state.account = null
        state.status = 'idle'
      })
      .addCase(logoutAccount.rejected, (state, action) => {
        state.error = action.payload?.message ?? 'Не удалось выйти из аккаунта.'
        state.status = 'idle'
      })
      .addMatcher(
        (action) => action.type === loginAccount.pending.type || action.type === registerAccount.pending.type,
        (state) => {
          state.error = null
          state.status = 'submitting'
        },
      )
      .addMatcher(
        (action) => action.type === loginAccount.fulfilled.type || action.type === registerAccount.fulfilled.type,
        (state, action: ReturnType<typeof loginAccount.fulfilled>) => {
          state.account = action.payload
          state.error = null
          state.status = 'idle'
        },
      )
      .addMatcher(
        (action) => action.type === loginAccount.rejected.type || action.type === registerAccount.rejected.type,
        (state, action: ReturnType<typeof loginAccount.rejected>) => {
          state.error = action.payload?.message ?? 'Ошибка авторизации.'
          state.status = 'idle'
        },
      )
  },
})

export const { clearAuthError } = authSlice.actions
export const authReducer = authSlice.reducer
