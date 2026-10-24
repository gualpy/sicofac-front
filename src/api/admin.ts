import { apiClient } from './client'
import type { Plan } from './plans'

export type AdminCompany = {
  id: number
  name: string
  ruc: string
  is_active: boolean
  created_at: string
  plan: { id: number; name: string; slug: string; price_cents: number } | null
  owner_email: string | null
  owner_name: string | null
  documents_this_month: number
}

export type AdminCompaniesPage = {
  data: AdminCompany[]
  current_page: number
  last_page: number
  total: number
}

export type AdminMetrics = {
  mrr_cents: number
  active_companies: number
  inactive_companies: number
  companies_by_plan: { plan_name: string; companies_count: number }[]
}

export type PlanPayload = {
  slug: string
  name: string
  price_cents: number
  monthly_document_limit: number | null
  max_establishments: number | null
  max_users: number | null
  is_public: boolean
  sort_order: number
}

export async function listAdminCompanies(search = '', page = 1): Promise<AdminCompaniesPage> {
  const { data } = await apiClient.get('/admin/companies', { params: { search: search || undefined, page } })
  return data
}

export async function activateCompany(id: number): Promise<void> {
  await apiClient.post(`/admin/companies/${id}/activate`)
}

export async function deactivateCompany(id: number): Promise<void> {
  await apiClient.post(`/admin/companies/${id}/deactivate`)
}

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const { data } = await apiClient.get('/admin/metrics')
  return data
}

export async function listAdminPlans(): Promise<Plan[]> {
  const { data } = await apiClient.get<{ plans: Plan[] }>('/admin/plans')
  return data.plans
}

export async function createAdminPlan(payload: PlanPayload): Promise<Plan> {
  const { data } = await apiClient.post('/admin/plans', payload)
  return data
}

export async function updateAdminPlan(id: number, payload: Partial<PlanPayload>): Promise<Plan> {
  const { data } = await apiClient.put(`/admin/plans/${id}`, payload)
  return data
}

export async function deleteAdminPlan(id: number): Promise<void> {
  await apiClient.delete(`/admin/plans/${id}`)
}

export async function requestAdminMagicLink(email: string): Promise<void> {
  await apiClient.post('/auth/admin/magic-link', { email })
}
