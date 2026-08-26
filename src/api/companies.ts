import { apiClient } from './client'

export type Company = {
  id: number
  name: string
  trade_name: string | null
  address: string | null
  phone: string | null
  email: string | null
  logo_path: string | null
  is_rimpe: boolean
  is_special_taxpayer: boolean
  is_popular_business: boolean
  requires_accounting: boolean
  ruc: string
  establishment_code: string | null
  emission_point: string | null
  environment: 'test' | 'production'
  sri_signing_enabled: boolean
  sri_submission_enabled: boolean
  created_at: string
}

export type DocumentSequences = Record<'01' | '04' | '05' | '07' | '03' | '06', number>

export type EmissionPoint = {
  id: number
  code: string
  description: string | null
  is_active: boolean
  sequences: DocumentSequences
}

export type Establishment = {
  id: number
  code: string
  name: string
  address: string | null
  emission_points: EmissionPoint[]
}

export type CertificateInfo = {
  version: number
  status: string
  is_active: boolean
  subject: string | null
  uploaded_at: string
  expires_at: string | null
} | null

export type UpdateProfilePayload = Partial<{
  name: string
  trade_name: string
  address: string
  phone: string
  email: string
  is_rimpe: boolean
  is_special_taxpayer: boolean
  is_popular_business: boolean
  requires_accounting: boolean
}>

type PaginatedResponse<T> = {
  data: T[]
  meta?: { current_page: number; last_page: number; total: number }
}

export async function listCompanies(): Promise<Company[]> {
  const { data } = await apiClient.get<PaginatedResponse<Company>>('/companies')
  return data.data
}

export async function updateCompanyProfile(
  companyId: number,
  payload: UpdateProfilePayload,
): Promise<Company> {
  const { data } = await apiClient.patch<Company>(`/companies/${companyId}/issuer-config`, payload)
  return data
}

export async function fetchLogoBlobUrl(companyId: number): Promise<string | null> {
  try {
    const { data } = await apiClient.get(`/companies/${companyId}/logo`, { responseType: 'blob' })
    return URL.createObjectURL(data as Blob)
  } catch {
    return null
  }
}

export async function uploadLogo(companyId: number, file: File): Promise<void> {
  const form = new FormData()
  form.append('logo', file)
  await apiClient.post(`/companies/${companyId}/logo`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export async function deleteLogo(companyId: number): Promise<void> {
  await apiClient.delete(`/companies/${companyId}/logo`)
}

export async function getCertificate(companyId: number): Promise<CertificateInfo> {
  const { data } = await apiClient.get<CertificateInfo>(`/companies/${companyId}/certificate`)
  return data && 'version' in data ? data : null
}

export async function uploadCertificate(
  companyId: number,
  file: File,
  password: string,
): Promise<{ version: number }> {
  const form = new FormData()
  form.append('certificate', file)
  form.append('certificate_password', password)
  const { data } = await apiClient.post<{ version: number }>(
    `/companies/${companyId}/certificate`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return data
}

export async function activateCertificate(companyId: number, version: number): Promise<void> {
  await apiClient.post(`/companies/${companyId}/certificate/${version}/activate`)
}

export async function listEstablishments(companyId: number): Promise<Establishment[]> {
  const { data } = await apiClient.get<Establishment[]>(`/companies/${companyId}/establishments`)
  return data
}

export async function createEmissionPoint(
  companyId: number,
  establishmentId: number,
  payload: { code: string; description?: string },
): Promise<EmissionPoint> {
  const { data } = await apiClient.post<EmissionPoint>(
    `/companies/${companyId}/establishments/${establishmentId}/emission-points`,
    payload,
  )
  return data
}

export async function updateEmissionPoint(
  companyId: number,
  establishmentId: number,
  emissionPointId: number,
  payload: { description?: string; is_active?: boolean },
): Promise<EmissionPoint> {
  const { data } = await apiClient.patch<EmissionPoint>(
    `/companies/${companyId}/establishments/${establishmentId}/emission-points/${emissionPointId}`,
    payload,
  )
  return data
}
