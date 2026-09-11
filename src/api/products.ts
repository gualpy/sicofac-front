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
  auxiliary_code: string | null
  name: string
  unit_price: string
  tax_rate: string
  tax_code: TaxCode
  ice_rate: string
  is_active: boolean
}

type PaginatedResponse<T> = {
  data: T[]
  current_page: number
  last_page: number
  total: number
}

export type CreateProductPayload = {
  code: string
  auxiliary_code?: string
  name: string
  unit_price: number
  tax_rate: number
  tax_code?: TaxCode
  ice_rate?: number
  is_active?: boolean
}

export async function listProducts(
  companyId: number,
  filters: { code?: string; name?: string; page?: number } = {},
): Promise<PaginatedResponse<Product>> {
  debugger // TEMPORAL: sacar despues de debuggear
  const { data } = await apiClient.get<PaginatedResponse<Product>>(
    `/companies/${companyId}/products`,
    { params: { ...filters, per_page: 10 } },
  )
  return data
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

export async function deleteProduct(companyId: number, productId: number): Promise<void> {
  await apiClient.delete(`/companies/${companyId}/products/${productId}`)
}

export async function deleteAllProducts(
  companyId: number,
): Promise<{ deleted: number; skipped: number }> {
  const { data } = await apiClient.delete<{ deleted: number; skipped: number }>(
    `/companies/${companyId}/products`,
  )
  return data
}

export async function downloadProductsExport(companyId: number): Promise<void> {
  const { data } = await apiClient.get(`/companies/${companyId}/products/export`, {
    responseType: 'blob',
  })
  const url = URL.createObjectURL(data as Blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'productos.csv'
  link.click()
  URL.revokeObjectURL(url)
}
