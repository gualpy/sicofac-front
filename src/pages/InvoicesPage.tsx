import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { listInvoices, emitInvoice, openInvoiceRide, INVOICE_STATUS_LABELS, type Invoice } from '../api/invoices'
import { useCompany } from '../company/CompanyContext'

export function InvoicesPage() {
  const { company } = useCompany()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<number | null>(null)

  useEffect(() => {
    if (company) refresh(company.id)
  }, [company])

  function refresh(companyId: number) {
    setLoading(true)
    listInvoices(companyId)
      .then(setInvoices)
      .catch(() => toast.error('No se pudo cargar las facturas.'))
      .finally(() => setLoading(false))
  }

  async function handleEmit(invoiceId: number) {
    if (!company) return
    setBusyId(invoiceId)
    try {
      await emitInvoice(company.id, invoiceId)
      refresh(company.id)
    } catch {
      toast.error('No se pudo emitir la factura.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleRide(invoiceId: number) {
    if (!company) return
    try {
      await openInvoiceRide(company.id, invoiceId)
    } catch {
      toast.error('No se pudo abrir el RIDE.')
    }
  }

  if (!company) return null

  return (
    <div className="page">
      <div className="page-header">
        <h1>Facturas</h1>
        <Link to="/invoices/new" className="button primary">
          <i className="fa-solid fa-plus" /> Nueva factura
        </Link>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Secuencial</th>
              <th>Cliente</th>
              <th>Subtotal</th>
              <th>IVA</th>
              <th>ICE</th>
              <th>Total</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td>
                  {invoice.document_code}-{String(invoice.sequential).padStart(9, '0')}
                </td>
                <td>{invoice.customer?.name ?? 'Consumidor final'}</td>
                <td>{invoice.subtotal}</td>
                <td>{(Number(invoice.tax_15) + Number(invoice.tax_5) + Number(invoice.tax_special)).toFixed(2)}</td>
                <td>{Number(invoice.ice_total) > 0 ? invoice.ice_total : '-'}</td>
                <td>{invoice.total}</td>
                <td>
                  <span className={`badge ${invoice.status}`}>
                    {INVOICE_STATUS_LABELS[invoice.status] ?? invoice.status}
                  </span>
                </td>
                <td>
                  {invoice.status === 'draft' && (
                    <button
                      type="button"
                      disabled={busyId === invoice.id}
                      onClick={() => handleEmit(invoice.id)}
                    >
                      Emitir
                    </button>
                  )}
                  {invoice.status === 'authorized' && (
                    <button type="button" onClick={() => handleRide(invoice.id)}>
                      <i className="fa-solid fa-file-pdf" /> RIDE
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={8}>No hay facturas todavia.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}
