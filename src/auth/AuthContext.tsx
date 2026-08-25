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
    const { data } = await apiClient.post('/auth/register', payload)
    localStorage.setItem('token', data.token)
    setToken(data.token)
    setUser(data.user)
    return data.company as Company
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
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
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
