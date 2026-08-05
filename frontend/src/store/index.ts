import { configureStore } from '@reduxjs/toolkit'

import { authReducer } from './auth'
import { saveStoredAccount } from './authStorage'

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
})

let storedAccount = store.getState().auth.account
store.subscribe(() => {
  const account = store.getState().auth.account
  if (account !== storedAccount) {
    storedAccount = account
    saveStoredAccount(account)
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
