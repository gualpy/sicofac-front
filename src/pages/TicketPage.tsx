import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getInvoice, PAYMENT_METHOD_LABELS, type Invoice } from '../api/invoices'
import { useCompany } from '../company/CompanyContext'

function formatInvoiceNumber(invoice: Invoice): string {
  return `${invoice.document_code}-${String(invoice.sequential).padStart(9, '0')}`
}

function formatDateTime(value: string): string {
  const date = new Date(value)
  return `${date.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${date.toLocaleTimeString(
    'es-EC',
    { hour: '2-digit', minute: '2-digit' },
  )}`
}

export function TicketPage() {
  const { company } = useCompany()
  const { id } = useParams<{ id: string }>()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!company || !id) return
    setLoading(true)
    getInvoice(company.id, Number(id))
      .then(setInvoice)
      .catch(() => setError('No se pudo cargar la factura.'))
      .finally(() => setLoading(false))
  }, [company, id])

  if (!company) return null

  if (loading) {
    return (
      <div className="ticket-page-wrap">
        <p>Cargando...</p>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="ticket-page-wrap">
        <p role="alert">{error ?? 'Factura no encontrada.'}</p>
        <Link to="/invoices">Volver a Facturas</Link>
      </div>
    )
  }

  if (invoice.status !== 'authorized') {
    return (
      <div className="ticket-page-wrap">
        <p role="alert">El ticket solo esta disponible para facturas autorizadas por el SRI.</p>
        <Link to="/invoices">Volver a Facturas</Link>
      </div>
    )
  }

  const iva = Number(invoice.tax_15) + Number(invoice.tax_5) + Number(invoice.tax_special)
  const ice = Number(invoice.ice_total)

  return (
    <div className="ticket-page-wrap">
      <div className="ticket-page-toolbar">
        <Link to="/invoices">
          <i className="fa-solid fa-arrow-left" /> Volver a Facturas
        </Link>
        <button type="button" className="primary" onClick={() => window.print()}>
          <i className="fa-solid fa-print" /> Imprimir
        </button>
      </div>

      <div className="ticket-80mm">
        <div className="ticket-center">
          <strong>{company.name}</strong>
          <span>RUC {company.ruc}</span>
          {company.address && <span>{company.address}</span>}
          {company.phone && <span>Tel: {company.phone}</span>}
          {company.environment === 'test' && <span className="ticket-test-banner">AMBIENTE DE PRUEBAS</span>}
        </div>

        <div className="ticket-rule" />

        <div className="ticket-center">
          <strong>FACTURA {formatInvoiceNumber(invoice)}</strong>
          <span>{formatDateTime(invoice.created_at)}</span>
        </div>

        <div className="ticket-rule" />

        <div className="ticket-row">
          <span>Cliente</span>
          <span>{invoice.customer?.name ?? 'Consumidor final'}</span>
        </div>
        {invoice.customer?.identification_number && (
          <div className="ticket-row">
            <span>Identificacion</span>
            <span>{invoice.customer.identification_number}</span>
          </div>
        )}

        <div className="ticket-rule" />

        {(invoice.items ?? []).map((item) => (
          <div className="ticket-item" key={item.id}>
            <div className="ticket-row">
              <span>{item.name}</span>
            </div>
            <div className="ticket-row ticket-item-sub">
              <span>{item.quantity} x ${item.unit_price}</span>
              <span>${item.total}</span>
            </div>
          </div>
        ))}

        <div className="ticket-rule" />

        <div className="ticket-row">
          <span>Subtotal</span>
          <span>${invoice.subtotal}</span>
        </div>
        {ice > 0 && (
          <div className="ticket-row">
            <span>ICE</span>
            <span>${invoice.ice_total}</span>
          </div>
        )}
        <div className="ticket-row">
          <span>IVA</span>
          <span>${iva.toFixed(2)}</span>
        </div>
        <div className="ticket-row ticket-total">
          <span>TOTAL</span>
          <span>${invoice.total}</span>
        </div>

        <div className="ticket-rule" />

        {(invoice.payment_methods ?? []).map((pm) => (
          <div className="ticket-row" key={pm.id}>
            <span>{PAYMENT_METHOD_LABELS[pm.method]}</span>
            <span>${pm.value}</span>
          </div>
        ))}

        <div className="ticket-rule" />

        <div className="ticket-center ticket-small">
          <span>Num. autorizacion</span>
          <span className="ticket-break">{invoice.sri_authorization_number ?? '-'}</span>
          <span style={{ marginTop: 6 }}>Clave de acceso</span>
          <span className="ticket-break">{invoice.access_key ?? '-'}</span>
        </div>

        <div className="ticket-rule" />

        <p className="ticket-center ticket-small">
          Representacion grafica del comprobante electronico autorizado por el SRI.
        </p>
      </div>
    </div>
  )
}
