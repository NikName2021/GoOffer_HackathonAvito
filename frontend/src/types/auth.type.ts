export interface AuthCredentials {
  login: string
  password: string
}

export interface AuthAccount {
  id: string
  login: string
  createdAt: string
}

export interface AuthFailure {
  code: string
  message: string
}

export interface AuthErrorEnvelope {
  error: {
    code: string
    message: string
    request_id?: string
  }
}
