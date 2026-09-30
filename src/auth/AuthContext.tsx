import { createContext, useContext, useState, type ReactNode } from 'react'
import { apiClient } from '../api/client'
import type { Company } from '../api/companies'

type User = {
  id: number
  name: string
  email: string
}

export type RegisterPayload = {
  name: string
  email: string
  password: string
  company_name: string
  company_ruc: string
  company_environment: 'test' | 'production'
}

type AuthContextValue = {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (payload: RegisterPayload) => Promise<Company>
  resendVerification: (email: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [user, setUser] = useState<User | null>(null)

  async function login(email: string, password: string) {
    const { data } = await apiClient.post('/auth/login', { email, password })
    localStorage.setItem('token', data.token)
    setToken(data.token)
    setUser(data.user)
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
    <AuthContext.Provider value={{ user, token, login, register, resendVerification, logout }}>
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
