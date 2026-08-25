import { apiClient } from './client'

export type TaxCode = '15' | '5' | 'especial' | '0' | 'no_objeto' | 'exento'

export const TAX_CODE_LABELS: Record<TaxCode, string> = {
  '15': '15%',
  '5': '5%',
  especial: 'Tarifa especial',
  '0': '0%',
  no_objeto: 'No objeto de IVA',
  exento: 'Exento de IVA',
}

export type Product = {
  id: number
  company_id: number
  code: string
  name: string
  unit_price: string
  tax_rate: string
  tax_code: TaxCode
  ice_rate: string
  is_active: boolean
}

type PaginatedResponse<T> = { data: T[] }

export type CreateProductPayload = {
  code: string
  name: string
  unit_price: number
  tax_rate: number
  tax_code?: TaxCode
  ice_rate?: number
  is_active?: boolean
}

export async function listProducts(companyId: number): Promise<Product[]> {
  const { data } = await apiClient.get<PaginatedResponse<Product>>(
    `/companies/${companyId}/products`,
  )
  return data.data
}

export async function searchProducts(companyId: number, search: string): Promise<Product[]> {
  const { data } = await apiClient.get<PaginatedResponse<Product>>(
    `/companies/${companyId}/products`,
    { params: { search, per_page: 8 } },
  )
  return data.data
}

export async function createProduct(
  companyId: number,
  payload: CreateProductPayload,
): Promise<Product> {
  const { data } = await apiClient.post<Product>(`/companies/${companyId}/products`, payload)
  return data
}
