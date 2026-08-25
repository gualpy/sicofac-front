import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  createInvoice,
  emitInvoice,
  QUICK_PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  type InvoiceItemInput,
  type PaymentMethod,
} from '../api/invoices'
import { listEstablishments, type Establishment } from '../api/companies'
import { TAX_CODE_LABELS, type TaxCode, type Product } from '../api/products'
import type { Customer } from '../api/customers'
import { useCompany } from '../company/CompanyContext'
import { CustomerSearchField } from '../components/CustomerSearchField'
import { ProductSearchField } from '../components/ProductSearchField'
import { computeLiveTotals } from '../utils/invoiceTotals'

function taxRateForCode(code: TaxCode): number {
  if (code === '15') return 15
  if (code === '5') return 5
  return 0
}

export function NewInvoicePage() {
  const { company } = useCompany()
  const navigate = useNavigate()

  const [establishments, setEstablishments] = useState<Establishment[]>([])
  const [establishmentId, setEstablishmentId] = useState<number | null>(null)
  const [emissionPointId, setEmissionPointId] = useState<number | null>(null)
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [guideNumber, setGuideNumber] = useState('')
  const [isNegotiable, setIsNegotiable] = useState(false)

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [items, setItems] = useState<InvoiceItemInput[]>([])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('no_utiliza_sist_financiero')

  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState<'draft' | 'emit' | null>(null)

  useEffect(() => {
    if (!company) return
    listEstablishments(company.id).then((list) => {
      setEstablishments(list)
      if (list.length > 0) {
        setEstablishmentId(list[0].id)
        if (list[0].emission_points.length > 0) {
          setEmissionPointId(list[0].emission_points[0].id)
        }
      }
    })
  }, [company])

  if (!company) return null

  const selectedEstablishment = establishments.find((e) => e.id === establishmentId) ?? null
  const emissionPoints = selectedEstablishment?.emission_points ?? []
  const selectedEmissionPoint = emissionPoints.find((p) => p.id === emissionPointId) ?? null

  const totals = computeLiveTotals(items)

  function addFromProduct(product: Product) {
    setItems((rows) => [
      ...rows,
      {
        code: product.code,
        name: product.name,
        quantity: 1,
        unit_price: Number(product.unit_price),
        discount: 0,
        tax_rate: Number(product.tax_rate),
        tax_code: product.tax_code,
        ice_rate: Number(product.ice_rate),
        product_id: product.id,
      },
    ])
  }

  function addManualLine() {
    setItems((rows) => [
      ...rows,
      { code: '', name: '', quantity: 1, unit_price: 0, discount: 0, tax_rate: 15, tax_code: '15', ice_rate: 0 },
    ])
  }

  function updateItem(index: number, patch: Partial<InvoiceItemInput>) {
    setItems((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  function removeItem(index: number) {
    setItems((rows) => rows.filter((_, i) => i !== index))
  }

  async function handleSubmit(mode: 'draft' | 'emit') {
    if (!company) return
    setError(null)

    if (items.length === 0) {
      setError('Agrega al menos un producto o servicio.')
      return
    }
    if (items.some((item) => !item.code || !item.name)) {
      setError('Cada linea necesita codigo y descripcion.')
      return
    }

    setSubmitting(mode)
    try {
      const invoice = await createInvoice(company.id, {
        customer_id: customer?.id,
        establishment_code: selectedEstablishment?.code,
        emission_point: selectedEmissionPoint?.code,
        guide_number: guideNumber || undefined,
        is_negotiable: isNegotiable,
        items,
        payment_methods: [{ method: paymentMethod, value: totals.total }],
      })

      if (mode === 'emit') {
        await emitInvoice(company.id, invoice.id)
      }

      navigate('/invoices')
    } catch {
      setError('No se pudo guardar la factura. Revisa los datos ingresados.')
    } finally {
      setSubmitting(null)
    }
  }

  const formattedDate = new Intl.DateTimeFormat('es-EC', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(issueDate + 'T00:00:00'))

  return (
    <div className="page" style={{ maxWidth: 1200 }}>
      <div className="breadcrumb">
        <Link to="/invoices">Facturacion</Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: 10 }} />
        <span className="current">Nueva factura</span>
      </div>

      {error && <p role="alert">{error}</p>}

      <div className="invoice-doc">
        <div className="invoice-doc-header">
          <div className="issuer-block">
            <span className="issuer-name">{company.trade_name || company.name}</span>
            <div className="contact-line">
              <i className="fa-solid fa-id-card" /> RUC: {company.ruc}
            </div>
            {company.address && (
              <div className="contact-line">
                <i className="fa-solid fa-location-dot" /> {company.address}
              </div>
            )}
            {company.phone && (
              <div className="contact-line">
                <i className="fa-solid fa-phone" /> {company.phone}
              </div>
            )}
            {company.email && (
              <div className="contact-line">
                <i className="fa-solid fa-envelope" /> {company.email}
              </div>
            )}
          </div>

          <div className="invoice-number-block">
            <h1>FACTURA</h1>
            <span className="invoice-number-badge">
              {selectedEstablishment?.code ?? '---'}-{selectedEmissionPoint?.code ?? '---'}-?????????
            </span>
            <span className="issue-date">{formattedDate}</span>
            <span className="badge draft">BORRADOR</span>
          </div>

          <div className="comprobante-fields">
            <h3>Datos del comprobante</h3>
            <label>
              Establecimiento
              <select
                value={establishmentId ?? ''}
                onChange={(e) => {
                  const id = Number(e.target.value)
                  setEstablishmentId(id)
                  const est = establishments.find((x) => x.id === id)
                  setEmissionPointId(est?.emission_points[0]?.id ?? null)
                }}
              >
                {establishments.map((est) => (
                  <option key={est.id} value={est.id}>
                    {est.code} - {est.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Punto de emision
              <select value={emissionPointId ?? ''} onChange={(e) => setEmissionPointId(Number(e.target.value))}>
                {emissionPoints.map((point) => (
                  <option key={point.id} value={point.id}>
                    {point.code}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Fecha de emision
              <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
            </label>
            <label>
              Guia de remision
              <input
                placeholder="Ingrese numero (opcional)"
                value={guideNumber}
                onChange={(e) => setGuideNumber(e.target.value)}
                maxLength={17}
              />
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isNegotiable}
                onChange={(e) => setIsNegotiable(e.target.checked)}
              />
              Factura comercial negociable
            </label>
          </div>
        </div>

        <div>
          <span className="section-label">Facturar a</span>
          <CustomerSearchField companyId={company.id} onSelect={setCustomer} />
          {customer ? (
            <div className="selected-card">
              <div className="avatar">
                <i className="fa-solid fa-user" />
              </div>
              <div className="details">
                <span className="name">{customer.name}</span>
                <span>
                  {customer.identification_type} {customer.identification_number}
                </span>
                <div className="contact-row">
                  {customer.address && (
                    <span>
                      <i className="fa-solid fa-location-dot" /> {customer.address}
                    </span>
                  )}
                  {customer.phone && (
                    <span>
                      <i className="fa-solid fa-phone" /> {customer.phone}
                    </span>
                  )}
                  {customer.email && (
                    <span>
                      <i className="fa-solid fa-envelope" /> {customer.email}
                    </span>
                  )}
                </div>
              </div>
              <button type="button" onClick={() => setCustomer(null)}>
                <i className="fa-solid fa-pen" /> Cambiar
              </button>
            </div>
          ) : (
            <p style={{ marginTop: 10, fontSize: 13, color: 'var(--text-muted)' }}>
              Sin cliente seleccionado: se factura a consumidor final.
            </p>
          )}
        </div>

        <div>
          <div className="page-header" style={{ marginBottom: 10 }}>
            <span className="section-label" style={{ marginBottom: 0 }}>
              Detalle de la factura
            </span>
            <button type="button" onClick={addManualLine}>
              <i className="fa-solid fa-plus" /> Agregar linea
            </button>
          </div>
          <ProductSearchField companyId={company.id} onSelect={addFromProduct} />

          <table className="data-table line-items-table" style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>#</th>
                <th>Codigo</th>
                <th>Descripcion</th>
                <th>Cantidad</th>
                <th>Precio unitario</th>
                <th>IVA</th>
                <th>Descuento</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const lineSubtotal = Math.max(0, item.quantity * item.unit_price - (item.discount ?? 0))
                const lineIce = round2(lineSubtotal * ((item.ice_rate ?? 0) / 100))
                const lineTax = round2((lineSubtotal + lineIce) * ((item.tax_rate ?? 0) / 100))
                const lineTotal = round2(lineSubtotal + lineIce + lineTax)

                return (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>
                      <input
                        value={item.code}
                        onChange={(e) => updateItem(index, { code: e.target.value })}
                        style={{ width: 70 }}
                      />
                    </td>
                    <td>
                      <input
                        value={item.name}
                        onChange={(e) => updateItem(index, { name: e.target.value })}
                        style={{ width: 220 }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                        style={{ width: 60 }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, { unit_price: Number(e.target.value) })}
                        style={{ width: 80 }}
                      />
                    </td>
                    <td>
                      <select
                        value={item.tax_code}
                        onChange={(e) => {
                          const taxCode = e.target.value as TaxCode
                          updateItem(index, { tax_code: taxCode, tax_rate: taxRateForCode(taxCode) })
                        }}
                      >
                        {Object.entries(TAX_CODE_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.discount ?? 0}
                        onChange={(e) => updateItem(index, { discount: Number(e.target.value) })}
                        style={{ width: 70 }}
                      />
                    </td>
                    <td>${lineTotal.toFixed(2)}</td>
                    <td>
                      <button type="button" className="icon-btn delete" onClick={() => removeItem(index)}>
                        <i className="fa-solid fa-trash" />
                      </button>
                    </td>
                  </tr>
                )
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ color: 'var(--text-muted)' }}>
                    Busca un producto o agrega una linea manual.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="two-col">
          <div>
            <span className="section-label">Forma de pago</span>
            <div className="payment-methods">
              {QUICK_PAYMENT_METHODS.map((method) => (
                <label className="payment-method-option" key={method}>
                  <input
                    type="radio"
                    name="payment_method"
                    checked={paymentMethod === method}
                    onChange={() => setPaymentMethod(method)}
                  />
                  {PAYMENT_METHOD_LABELS[method]}
                </label>
              ))}
            </div>
          </div>

          <div className="summary-card">
            <span className="section-label">Resumen</span>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>${totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-row muted">
              <span>Descuento</span>
              <span>${totals.discount.toFixed(2)}</span>
            </div>
            {totals.byTaxCode['15'].subtotal > 0 && (
              <div className="summary-row muted">
                <span>Subtotal 15%</span>
                <span>${totals.byTaxCode['15'].subtotal.toFixed(2)}</span>
              </div>
            )}
            {totals.byTaxCode['5'].subtotal > 0 && (
              <div className="summary-row muted">
                <span>Subtotal 5%</span>
                <span>${totals.byTaxCode['5'].subtotal.toFixed(2)}</span>
              </div>
            )}
            <div className="summary-row">
              <span>IVA</span>
              <span>${totals.tax.toFixed(2)}</span>
            </div>
            <div className="summary-row muted">
              <span>ICE</span>
              <span>${totals.ice.toFixed(2)}</span>
            </div>
            <div className="summary-row total">
              <span>Total a pagar</span>
              <span className="value">${totals.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="invoice-actions-bar">
          <button type="button" disabled={submitting !== null} onClick={() => handleSubmit('draft')}>
            <i className="fa-solid fa-floppy-disk" />
            {submitting === 'draft' ? 'Guardando...' : 'Guardar borrador'}
          </button>
          <button
            type="button"
            className="primary"
            disabled={submitting !== null}
            onClick={() => handleSubmit('emit')}
          >
            <i className="fa-solid fa-paper-plane" />
            {submitting === 'emit' ? 'Emitiendo...' : 'Emitir factura'}
          </button>
        </div>
      </div>
    </div>
  )
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}
