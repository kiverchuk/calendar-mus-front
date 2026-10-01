export type Gender = 1 | 2

export interface AuthUser {
  id: number
  name: string
  email: string
  gender: number
  email_verified_at: string | null
  created_at?: string
  updated_at?: string
}

export interface ApiEnvelope<T> {
  success: boolean
  code: number
  message: string
  data: T
}

export interface AuthPayload {
  user: AuthUser
  token: string
}

export type AuthMode = 'login' | 'register' | 'forgot' | 'reset'
