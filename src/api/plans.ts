import { apiClient } from './client'

export type Plan = {
  id: number
  slug: string
  name: string
  price_cents: number
  monthly_document_limit: number | null
  max_establishments: number | null
  max_users: number | null
  // Only present on the admin listing (GET /admin/plans) -- the public
  // endpoint never returns these.
  is_public?: boolean
  sort_order?: number
}

export async function listPlans(): Promise<Plan[]> {
  const { data } = await apiClient.get<{ plans: Plan[] }>('/plans')
  return data.plans
}
