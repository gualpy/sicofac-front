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

type PaginatedResponse<T> = {
  data: T[]
  current_page: number
  last_page: number
  total: number
}

export type CreateCustomerPayload = {
  name: string
  identification_type: string
  identification_number: string
  email?: string
  phone?: string
  address?: string
}

export async function listCustomers(
  companyId: number,
  page = 1,
): Promise<PaginatedResponse<Customer>> {
  const { data } = await apiClient.get<PaginatedResponse<Customer>>(
    `/companies/${companyId}/customers`,
    { params: { page, per_page: 20 } },
  )
  return data
}

export async function searchCustomers(companyId: number, search: string): Promise<Customer[]> {
  const { data } = await apiClient.get<PaginatedResponse<Customer>>(
    `/companies/${companyId}/customers`,
    { params: { search, per_page: 8 } },
  )
  return data.data
}

export async function getCustomer(companyId: number, customerId: number): Promise<Customer> {
  const { data } = await apiClient.get<Customer>(`/companies/${companyId}/customers/${customerId}`)
  return data
}

export async function createCustomer(
  companyId: number,
  payload: CreateCustomerPayload,
): Promise<Customer> {
  const { data } = await apiClient.post<Customer>(`/companies/${companyId}/customers`, payload)
  return data
}

export type UpdateCustomerPayload = Partial<CreateCustomerPayload>

export async function updateCustomer(
  companyId: number,
  customerId: number,
  payload: UpdateCustomerPayload,
): Promise<Customer> {
  const { data } = await apiClient.put<Customer>(
    `/companies/${companyId}/customers/${customerId}`,
    payload,
  )
  return data
}

export async function deleteCustomer(companyId: number, customerId: number): Promise<void> {
  await apiClient.delete(`/companies/${companyId}/customers/${customerId}`)
}
