import { apiClient } from './client'

export type Customer = {
  id: number
  company_id: number
  name: string
  identification_type: string
  identification_number: string
  email: string | null
  phone: string | null
  address: string | null
}

type PaginatedResponse<T> = { data: T[] }

export type CreateCustomerPayload = {
  name: string
  identification_type: string
  identification_number: string
  email?: string
  phone?: string
  address?: string
}

export async function listCustomers(companyId: number): Promise<Customer[]> {
  const { data } = await apiClient.get<PaginatedResponse<Customer>>(
    `/companies/${companyId}/customers`,
  )
  return data.data
}

export async function searchCustomers(companyId: number, search: string): Promise<Customer[]> {
  const { data } = await apiClient.get<PaginatedResponse<Customer>>(
    `/companies/${companyId}/customers`,
    { params: { search, per_page: 8 } },
  )
  return data.data
}

export async function createCustomer(
  companyId: number,
  payload: CreateCustomerPayload,
): Promise<Customer> {
  const { data } = await apiClient.post<Customer>(`/companies/${companyId}/customers`, payload)
  return data
}
