import { apiRequest } from '@/api/client'
import type { AuthPayload, AuthUser, Gender } from '@/types/auth'

export function loginRequest(email: string, password: string) {
  return apiRequest<AuthPayload>('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function registerRequest(payload: {
  name: string
  email: string
  password: string
  gender: Gender
}) {
  return apiRequest<AuthPayload>('/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function forgotPasswordRequest(email: string) {
  return apiRequest<null>('/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export function resetPasswordRequest(payload: {
  email: string
  token: string
  password: string
  password_confirmation: string
}) {
  return apiRequest<null>('/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function meRequest() {
  return apiRequest<{ user: AuthUser }>('/me', { method: 'GET' })
}

export function updateMeRequest(payload: {
  name?: string
  email?: string
  gender?: Gender
  password?: string
  password_confirmation?: string
}) {
  return apiRequest<{ user: AuthUser }>('/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function logoutRequest() {
  return apiRequest<null>('/logout', { method: 'POST' })
}
