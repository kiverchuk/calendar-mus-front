import {
  computed,
  inject,
  provide,
  ref,
  type ComputedRef,
  type InjectionKey,
  type Ref,
} from 'vue'
import {
  forgotPasswordRequest,
  loginRequest,
  logoutRequest,
  meRequest,
  registerRequest,
  resetPasswordRequest,
  updateMeRequest,
} from '@/api/auth'
import { getToken, setToken } from '@/api/client'
import type { AuthUser, Gender } from '@/types/auth'

export interface AuthContext {
  user: Ref<AuthUser | null>
  token: Ref<string | null>
  ready: Ref<boolean>
  isAuthenticated: ComputedRef<boolean>
  bootstrap: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (payload: {
    name: string
    email: string
    password: string
    gender: Gender
  }) => Promise<void>
  forgotPassword: (email: string) => Promise<string>
  resetPassword: (payload: {
    email: string
    token: string
    password: string
    password_confirmation: string
  }) => Promise<string>
  updateProfile: (payload: {
    name?: string
    email?: string
    gender?: Gender
    password?: string
    password_confirmation?: string
  }) => Promise<void>
  logout: () => Promise<void>
}

const AuthKey: InjectionKey<AuthContext> = Symbol.for('calmus-auth')

function createAuthContext(): AuthContext {
  const user = ref<AuthUser | null>(null)
  const token = ref<string | null>(getToken())
  const ready = ref(false)
  const isAuthenticated = computed(() => Boolean(token.value && user.value))

  const applySession = (nextUser: AuthUser, nextToken: string) => {
    user.value = nextUser
    token.value = nextToken
    setToken(nextToken)
  }

  const clearSession = () => {
    user.value = null
    token.value = null
    setToken(null)
  }

  const bootstrap = async () => {
    if (!token.value) {
      ready.value = true
      return
    }

    try {
      const res = await meRequest()
      user.value = res.data.user
    } catch {
      clearSession()
    } finally {
      ready.value = true
    }
  }

  const login = async (email: string, password: string) => {
    const res = await loginRequest(email, password)
    applySession(res.data.user, res.data.token)
  }

  const register = async (payload: {
    name: string
    email: string
    password: string
    gender: Gender
  }) => {
    const res = await registerRequest(payload)
    applySession(res.data.user, res.data.token)
  }

  const forgotPassword = async (email: string) => {
    const res = await forgotPasswordRequest(email)
    return res.message
  }

  const resetPassword = async (payload: {
    email: string
    token: string
    password: string
    password_confirmation: string
  }) => {
    const res = await resetPasswordRequest(payload)
    return res.message
  }

  const updateProfile = async (payload: {
    name?: string
    email?: string
    gender?: Gender
    password?: string
    password_confirmation?: string
  }) => {
    const res = await updateMeRequest(payload)
    user.value = res.data.user
  }

  const logout = async () => {
    try {
      if (token.value) await logoutRequest()
    } catch {
      /* ignore network/logout errors */
    } finally {
      clearSession()
    }
  }

  return {
    user,
    token,
    ready,
    isAuthenticated,
    bootstrap,
    login,
    register,
    forgotPassword,
    resetPassword,
    updateProfile,
    logout,
  }
}

let sharedAuth: AuthContext | null = null

function authContext() {
  if (!sharedAuth) sharedAuth = createAuthContext()
  return sharedAuth
}

export function provideAuth() {
  const context = authContext()
  provide(AuthKey, context)
  return context
}

export function useAuth() {
  return inject(AuthKey, null) ?? authContext()
}
