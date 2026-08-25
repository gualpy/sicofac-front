import type { InvoiceItemInput } from '../api/invoices'
import type { TaxCode } from '../api/products'

export type LiveTotals = {
  subtotal: number
  discount: number
  ice: number
  tax: number
  total: number
  byTaxCode: Record<TaxCode, { subtotal: number; tax: number }>
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/**
 * Mirrors InvoiceItemData / InvoiceTotalsCalculator on the backend, so the
 * "Resumen" card can show live numbers before the draft is actually saved.
 * The server remains the source of truth once the invoice is created.
 */
export function computeLiveTotals(items: InvoiceItemInput[]): LiveTotals {
  const byTaxCode: Record<string, { subtotal: number; tax: number }> = {
    '15': { subtotal: 0, tax: 0 },
    '5': { subtotal: 0, tax: 0 },
    especial: { subtotal: 0, tax: 0 },
    '0': { subtotal: 0, tax: 0 },
    no_objeto: { subtotal: 0, tax: 0 },
    exento: { subtotal: 0, tax: 0 },
  }

  let subtotal = 0
  let discount = 0
  let ice = 0
  let tax = 0

  for (const item of items) {
    const lineSubtotal = Math.max(0, item.quantity * item.unit_price - (item.discount ?? 0))
    const lineIce = round2(lineSubtotal * ((item.ice_rate ?? 0) / 100))
    const lineTax = round2((lineSubtotal + lineIce) * ((item.tax_rate ?? 0) / 100))

    subtotal += lineSubtotal
    discount += item.discount ?? 0
    ice += lineIce
    tax += lineTax

    const code = item.tax_code ?? '15'
    if (byTaxCode[code]) {
      byTaxCode[code].subtotal += lineSubtotal
      byTaxCode[code].tax += lineTax
    }
  }

  return {
    subtotal: round2(subtotal),
    discount: round2(discount),
    ice: round2(ice),
    tax: round2(tax),
    total: round2(subtotal + ice + tax),
    byTaxCode: byTaxCode as LiveTotals['byTaxCode'],
  }
}
