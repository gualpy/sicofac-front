import { apiClient } from './client'
import type { TaxCode } from './products'

export type PaymentMethod =
  | 'no_utiliza_sist_financiero'
  | 'compensacion_deudas'
  | 'tarjeta_debito'
  | 'dinero_electronico'
  | 'tarjeta_prepago'
  | 'tarjeta_credito'
  | 'transferencia_bancaria'
  | 'otros'
  | 'endoso_titulos'

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  no_utiliza_sist_financiero: 'Efectivo',
  compensacion_deudas: 'Compensacion de deudas',
  tarjeta_debito: 'Tarjeta de debito',
  dinero_electronico: 'Dinero electronico',
  tarjeta_prepago: 'Tarjeta prepago',
  tarjeta_credito: 'Tarjeta de credito',
  transferencia_bancaria: 'Transferencia bancaria',
  otros: 'Otra forma de pago',
  endoso_titulos: 'Endoso de titulos',
}

export const QUICK_PAYMENT_METHODS: PaymentMethod[] = [
  'no_utiliza_sist_financiero',
  'tarjeta_debito',
  'tarjeta_credito',
  'transferencia_bancaria',
  'otros',
]

export type PaymentTermUnit = 'dias' | 'meses' | 'anios'

export const PAYMENT_TERM_UNIT_LABELS: Record<PaymentTermUnit, string> = {
  dias: 'Dias',
  meses: 'Meses',
  anios: 'Anios',
}

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  processing: 'Procesando',
  xml_built: 'XML generado',
  signed: 'Firmado',
  sent_reception: 'Enviado',
  authorized: 'Autorizado',
  rejected: 'Rechazado',
  failed: 'Fallido',
}

export type InvoiceItemInput = {
  code: string
  name: string
  quantity: number
  unit_price: number
  discount?: number
  tax_rate?: number
  tax_code?: TaxCode
  ice_rate?: number
  product_id?: number
}

export type PaymentMethodInput = {
  method: PaymentMethod
  value: number
  term_value?: number
  term_unit?: PaymentTermUnit
}

export type AdditionalFieldInput = {
  name: string
  description: string
}

export type Invoice = {
  id: number
  company_id: number
  customer_id: number | null
  document_code: string
  sequential: number
  issue_date: string
  status: string
  currency: string
  guide_number: string | null
  is_negotiable: boolean
  subtotal: string
  discount: string
  subtotal_15: string
  subtotal_5: string
  subtotal_special: string
  subtotal_zero: string
  subtotal_not_subject: string
  subtotal_exempt: string
  tax: string
  tax_15: string
  tax_5: string
  tax_special: string
  ice_total: string
  has_tip: boolean
  tip_amount: string
  total: string
  customer?: { id: number; name: string } | null
  payment_methods?: Array<{ id: number; method: PaymentMethod; value: string; term_value: number | null; term_unit: PaymentTermUnit | null }>
  additional_fields?: Array<{ id: number; name: string; description: string }>
}

type PaginatedResponse<T> = { data: T[] }

export type InvoicePage = {
  data: Invoice[]
  current_page: number
  last_page: number
  total: number
}

export type CreateInvoicePayload = {
  customer_id?: number
  document_code?: string
  establishment_code?: string
  emission_point?: string
  guide_number?: string
  is_negotiable?: boolean
  has_tip?: boolean
  items: InvoiceItemInput[]
  payment_methods?: PaymentMethodInput[]
  additional_fields?: AdditionalFieldInput[]
}

export async function listInvoices(companyId: number): Promise<Invoice[]> {
  const { data } = await apiClient.get<PaginatedResponse<Invoice>>(
    `/companies/${companyId}/invoices`,
  )
  return data.data
}

export async function listInvoicesPage(companyId: number, page: number): Promise<InvoicePage> {
  const { data } = await apiClient.get<InvoicePage>(`/companies/${companyId}/invoices`, {
    params: { page },
  })
  return data
}

export async function createInvoice(
  companyId: number,
  payload: CreateInvoicePayload,
): Promise<Invoice> {
  const { data } = await apiClient.post<Invoice>(`/companies/${companyId}/invoices`, payload)
  return data
}

export async function emitInvoice(companyId: number, invoiceId: number): Promise<void> {
  await apiClient.post(`/companies/${companyId}/invoices/${invoiceId}/emit`)
}

export async function openInvoiceRide(companyId: number, invoiceId: number): Promise<void> {
  const { data } = await apiClient.get(`/companies/${companyId}/invoices/${invoiceId}/ride`, {
    responseType: 'blob',
  })
  const url = URL.createObjectURL(data as Blob)
  window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
