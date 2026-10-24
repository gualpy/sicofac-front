import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { apiClient } from '../api/client'
import type { Company } from '../api/companies'

type User = {
  id: number
  name: string
  email: string
  is_super_admin: boolean
}

export type RegisterPayload = {
  name: string
  email: string
  password: string
  company_name: string
  company_ruc: string
  company_environment: 'test' | 'production'
  plan_id: number
  terms_accepted: boolean
}

type AuthContextValue = {
  user: User | null
  token: string | null
  authLoading: boolean
  login: (email: string, password: string) => Promise<User>
  loginWithToken: (token: string) => void
  register: (payload: RegisterPayload) => Promise<Company>
  resendVerification: (email: string) => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (payload: ResetPasswordPayload) => Promise<void>
  logout: () => Promise<void>
}

export type ResetPasswordPayload = {
  email: string
  token: string
  password: string
  password_confirmation: string
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Runs on mount (persisted token from a previous session) and whenever
  // token changes (login, loginWithToken, logout) -- the only place `user`
  // gets (re)populated, since login() below also sets it directly.
  useEffect(() => {
    let cancelled = false
    if (!token) {
      setAuthLoading(false)
      return
    }
    apiClient
      .get('/auth/me')
      .then(({ data }) => {
        if (!cancelled) setUser(data)
      })
      .catch(() => {
        if (!cancelled) {
          localStorage.removeItem('token')
          setToken(null)
        }
      })
      .finally(() => {
        if (!cancelled) setAuthLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  async function login(email: string, password: string): Promise<User> {
    const { data } = await apiClient.post('/auth/login', { email, password })
    localStorage.setItem('token', data.token)
    setToken(data.token)
    setUser(data.user)
    return data.user as User
  }

  function loginWithToken(newToken: string): void {
    localStorage.setItem('token', newToken)
    setToken(newToken)
  }

  async function register(payload: RegisterPayload): Promise<Company> {
    // No token/session here on purpose -- the account is created but stays
    // "pendiente de confirmar" until the user clicks the emailed link, so
    // there's nothing to log in with yet (see AuthController::register()).
    const { data } = await apiClient.post('/auth/register', payload)
    return data.company as Company
  }

  async function resendVerification(email: string): Promise<void> {
    await apiClient.post('/auth/email/resend', { email })
  }

  async function forgotPassword(email: string): Promise<void> {
    await apiClient.post('/auth/forgot-password', { email })
  }

  async function resetPassword(payload: ResetPasswordPayload): Promise<void> {
    await apiClient.post('/auth/reset-password', payload)
  }

  async function logout() {
    try {
      await apiClient.delete('/auth/logout')
    } finally {
      localStorage.removeItem('token')
      setToken(null)
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        authLoading,
        login,
        loginWithToken,
        register,
        resendVerification,
        forgotPassword,
        resetPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
