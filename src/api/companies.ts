import { apiClient } from './client'

export type Company = {
  id: number
  name: string
  trade_name: string | null
  address: string | null
  phone: string | null
  email: string | null
  ruc: string
  establishment_code: string | null
  emission_point: string | null
  environment: 'test' | 'production'
  sri_signing_enabled: boolean
  sri_submission_enabled: boolean
  created_at: string
}

export type EmissionPoint = {
  id: number
  code: string
  description: string | null
}

export type Establishment = {
  id: number
  code: string
  name: string
  address: string | null
  emission_points: EmissionPoint[]
}

type PaginatedResponse<T> = {
  data: T[]
  meta?: { current_page: number; last_page: number; total: number }
}

export async function listCompanies(): Promise<Company[]> {
  const { data } = await apiClient.get<PaginatedResponse<Company>>('/companies')
  return data.data
}

export async function listEstablishments(companyId: number): Promise<Establishment[]> {
  const { data } = await apiClient.get<Establishment[]>(`/companies/${companyId}/establishments`)
  return data
}
