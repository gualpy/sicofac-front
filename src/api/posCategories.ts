import { apiClient } from './client'

export type PosCategory = {
  id: number
  company_id: number
  name: string
  sort_order: number
  is_active: boolean
}

export type CreatePosCategoryPayload = {
  name: string
  sort_order?: number
  is_active?: boolean
}

export type UpdatePosCategoryPayload = Partial<CreatePosCategoryPayload>

export async function listPosCategories(companyId: number): Promise<PosCategory[]> {
  const { data } = await apiClient.get<PosCategory[]>(`/companies/${companyId}/pos-categories`)
  return data
}

export async function createPosCategory(
  companyId: number,
  payload: CreatePosCategoryPayload,
): Promise<PosCategory> {
  const { data } = await apiClient.post<PosCategory>(
    `/companies/${companyId}/pos-categories`,
    payload,
  )
  return data
}

export async function updatePosCategory(
  companyId: number,
  categoryId: number,
  payload: UpdatePosCategoryPayload,
): Promise<PosCategory> {
  const { data } = await apiClient.put<PosCategory>(
    `/companies/${companyId}/pos-categories/${categoryId}`,
    payload,
  )
  return data
}

export async function deletePosCategory(companyId: number, categoryId: number): Promise<void> {
  await apiClient.delete(`/companies/${companyId}/pos-categories/${categoryId}`)
}
