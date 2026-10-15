import type { ApiEnvelope } from '@/types/auth'

const TOKEN_KEY = 'calmus.token'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* private mode */
  }
}

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') || 'http://calendar-mus/api/v1'

export class ApiError extends Error {
  code: number
  errors: Record<string, string[]>

  constructor(message: string, code = 500, errors: Record<string, string[]> = {}) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.errors = errors
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiEnvelope<T>> {
  const headers = new Headers(options.headers || {})
  if (!headers.has('Accept')) headers.set('Accept', 'application/json')
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  let payload: ApiEnvelope<T> | null = null
  try {
    payload = (await response.json()) as ApiEnvelope<T>
  } catch {
    throw new ApiError('Некорректный ответ сервера', response.status || 500)
  }

  if (!payload.success) {
    const errors =
      payload.data && typeof payload.data === 'object' && 'errors' in (payload.data as object)
        ? ((payload.data as { errors?: Record<string, string[]> }).errors ?? {})
        : {}
    throw new ApiError(payload.message || 'Ошибка запроса', payload.code || response.status, errors)
  }

  return payload
}
