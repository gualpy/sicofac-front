
import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Company } from '../api/companies'

type CompanyContextValue = {
  company: Company | null
  selectCompany: (company: Company) => void
  clearCompany: () => void
}

const CompanyContext = createContext<CompanyContextValue | null>(null)

const STORAGE_KEY = 'selectedCompany'

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [company, setCompany] = useState<Company | null>(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Company) : null
  })

  function selectCompany(next: Company) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setCompany(next)
  }

  function clearCompany() {
    localStorage.removeItem(STORAGE_KEY)
    setCompany(null)
  }

  return (
    <CompanyContext.Provider value={{ company, selectCompany, clearCompany }}>
      {children}
    </CompanyContext.Provider>
  )
}

export function useCompany() {
  const ctx = useContext(CompanyContext)
  if (!ctx) {
    throw new Error('useCompany must be used within CompanyProvider')
  }
  return ctx
}
