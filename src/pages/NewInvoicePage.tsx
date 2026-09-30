import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  createInvoice,
  updateInvoice,
  getInvoice,
  emitInvoice,
  PAYMENT_METHOD_LABELS,
  PAYMENT_TERM_UNIT_LABELS,
  type InvoiceItemInput,
  type PaymentMethod,
  type PaymentMethodInput,
  type PaymentTermUnit,
} from '../api/invoices'
import { listEstablishments, type Establishment } from '../api/companies'
import { TAX_CODE_LABELS, type TaxCode, type Product } from '../api/products'
import { getCustomer, createCustomer, type Customer } from '../api/customers'
import { useCompany } from '../company/CompanyContext'
import { CustomerSearchField, looksLikeIdentification } from '../components/CustomerSearchField'
import { CustomerForm, type CustomerFormValues } from '../components/CustomerForm'
import { ProductSearchField } from '../components/ProductSearchField'
import { computeLiveTotals } from '../utils/invoiceTotals'

function taxRateForCode(code: TaxCode): number {
  if (code === '15') return 15
  if (code === '5') return 5
  return 0
}

function extractErrorMessage(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })
    ?.response?.data
  const firstFieldError = data?.errors ? Object.values(data.errors)[0]?.[0] : undefined
  return firstFieldError ?? data?.message ?? fallback
}

function guessIdentification(term: string): CustomerFormValues {
  const digits = term.replace(/\D/g, '')
  if (!looksLikeIdentification(term)) return {}
  return {
    identification_number: digits,
    identification_type: digits.length === 13 ? '04' : '05',
  }
}

export function NewInvoicePage() {
  const { company } = useCompany()
  const navigate = useNavigate()
  const { id } = useParams()
  const invoiceId = id ? Number(id) : null
  const isEdit = invoiceId !== null

  const [establishments, setEstablishments] = useState<Establishment[]>([])
  const [establishmentId, setEstablishmentId] = useState<number | null>(null)
  const [emissionPointId, setEmissionPointId] = useState<number | null>(null)
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [guideNumber, setGuideNumber] = useState('')
  const [isNegotiable, setIsNegotiable] = useState(false)

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [customerDrawerOpen, setCustomerDrawerOpen] = useState(false)
  const [customerDrawerInitial, setCustomerDrawerInitial] = useState<CustomerFormValues>({})
  const [customerDrawerError, setCustomerDrawerError] = useState<string | null>(null)
  const [customerDrawerSubmitting, setCustomerDrawerSubmitting] = useState(false)
  const [items, setItems] = useState<InvoiceItemInput[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodInput[]>([
    { method: 'no_utiliza_sist_financiero', value: 0 },
  ])

  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState<'draft' | 'emit' | null>(null)
  const [loadingInvoice, setLoadingInvoice] = useState(isEdit)

  useEffect(() => {
    if (!company) return
    let cancelled = false

    async function load() {
      const list = await listEstablishments(company!.id)
      if (cancelled) return
      setEstablishments(list)

      if (invoiceId === null) {
        if (list.length > 0) {
          setEstablishmentId(list[0].id)
          if (list[0].emission_points.length > 0) {
            setEmissionPointId(list[0].emission_points[0].id)
          }
        }
        return
      }

      try {
        const invoice = await getInvoice(company!.id, invoiceId)
        if (cancelled) return

        setGuideNumber(invoice.guide_number ?? '')
        setIsNegotiable(invoice.is_negotiable)
        setIssueDate(invoice.issue_date.slice(0, 10))
        setItems(
          (invoice.items ?? []).map((item) => ({
            code: item.code,
            name: item.name,
            quantity: Number(item.quantity),
            unit_price: Number(item.unit_price),
            discount: Number(item.discount),
            tax_rate: Number(item.tax_rate),
            tax_code: item.tax_code,
            ice_rate: Number(item.ice_rate),
            ice_code: item.ice_code ?? undefined,
            product_id: item.product_id ?? undefined,
          })),
        )

        if (invoice.payment_methods && invoice.payment_methods.length > 0) {
          setPaymentMethods(
            invoice.payment_methods.map((pm) => ({
              method: pm.method,
              value: Number(pm.value),
              term_value: pm.term_value ?? undefined,
              term_unit: pm.term_unit ?? undefined,
            })),
          )
        }

        const est = list.find((e) => e.code === invoice.establishment_code) ?? list[0] ?? null
        setEstablishmentId(est?.id ?? null)
        const ep = est?.emission_points.find((p) => p.code === invoice.emission_point) ?? est?.emission_points[0] ?? null
        setEmissionPointId(ep?.id ?? null)

        if (invoice.customer_id) {
          try {
            const fullCustomer = await getCustomer(company!.id, invoice.customer_id)
            if (!cancelled) setCustomer(fullCustomer)
          } catch {
            // Non-fatal: the form still works, just without a prefilled customer card.
          }
        }
      } catch {
        if (!cancelled) setError('No se pudo cargar la factura a editar.')
      } finally {
        if (!cancelled) setLoadingInvoice(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [company, invoiceId])

  useEffect(() => {
    if (!customerDrawerOpen) return
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') closeCustomerDrawer()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [customerDrawerOpen])

  useEffect(() => {
    // Keep the single-row case effortless (mirrors the old radio-button
    // behaviour): only auto-fill the amount when there's exactly one
    // payment method, since once the user splits it across several we
    // can't guess how they want the total redistributed.
    const liveTotal = computeLiveTotals(items).total
    setPaymentMethods((rows) =>
      rows.length === 1 && rows[0].value !== liveTotal ? [{ ...rows[0], value: liveTotal }] : rows,
    )
  }, [items])

  if (!company) return null

  function openCustomerDrawer(term: string) {
    setCustomerDrawerInitial(guessIdentification(term))
    setCustomerDrawerError(null)
    setCustomerDrawerOpen(true)
  }

  function closeCustomerDrawer() {
    setCustomerDrawerOpen(false)
    setCustomerDrawerError(null)
  }

  async function handleCreateCustomerFromDrawer(payload: Parameters<typeof createCustomer>[1]) {
    if (!company) return
    setCustomerDrawerError(null)
    setCustomerDrawerSubmitting(true)
    try {
      const created = await createCustomer(company.id, payload)
      setCustomer(created)
      closeCustomerDrawer()
    } catch (err) {
      setCustomerDrawerError(
        extractErrorMessage(err, 'No se pudo crear el cliente. Revisa que la identificacion no este repetida.'),
      )
    } finally {
      setCustomerDrawerSubmitting(false)
    }
  }

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
        ice_code: product.ice_code ?? undefined,
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

  function addPaymentMethod() {
    setPaymentMethods((rows) => [...rows, { method: 'no_utiliza_sist_financiero', value: 0 }])
  }

  function updatePaymentMethod(index: number, patch: Partial<PaymentMethodInput>) {
    setPaymentMethods((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  function removePaymentMethod(index: number) {
    setPaymentMethods((rows) => rows.filter((_, i) => i !== index))
  }

  const paymentMethodsTotal = paymentMethods.reduce((sum, pm) => sum + (Number(pm.value) || 0), 0)
  const paymentMethodsMismatch =
    paymentMethods.length > 0 && Math.abs(paymentMethodsTotal - totals.total) > 0.01

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
    if (paymentMethodsMismatch) {
      setError('La suma de las formas de pago no coincide con el total de la factura.')
      return
    }

    setSubmitting(mode)
    try {
      const payload = {
        customer_id: customer?.id,
        establishment_code: selectedEstablishment?.code,
        emission_point: selectedEmissionPoint?.code,
        guide_number: guideNumber || undefined,
        is_negotiable: isNegotiable,
        items,
        payment_methods: paymentMethods,
      }

      const invoice = isEdit && invoiceId !== null
        ? await updateInvoice(company.id, invoiceId, payload)
        : await createInvoice(company.id, payload)

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
        <span className="current">{isEdit ? 'Editar borrador' : 'Nueva factura'}</span>
      </div>

      {error && <p role="alert">{error}</p>}
      {loadingInvoice && <p>Cargando factura...</p>}

      {!loadingInvoice && <div className="invoice-doc">
        <div className="invoice-doc-header">
          <div className="invoice-doc-toprow">
            <div className="issuer-block">
              <span className="issuer-name">{company.trade_name || company.name}</span>
              <div className="contact-line">
                <i className="fa-solid fa-id-card" /> RUC: {company.ruc}
              </div>
              {(company.address || company.phone || company.email) && (
                <div className="contact-line-secondary">
                  {[company.address, company.phone, company.email].filter(Boolean).join(' · ')}
                </div>
              )}
            </div>

            <div className="invoice-number-block">
              <div className="invoice-number-top">
                <span className="invoice-doc-title">FACTURA</span>
                <span className="badge draft">BORRADOR</span>
              </div>
              <span className="invoice-number-badge">
                {selectedEstablishment?.code ?? '---'}-{selectedEmissionPoint?.code ?? '---'}-?????????
              </span>
              <span className="issue-date">{formattedDate}</span>
            </div>
          </div>

          <div className="form-row comprobante-fields-row">
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
          <div className="facturar-a-row">
            <span className="section-label">Facturar a</span>
            <CustomerSearchField
              companyId={company.id}
              onSelect={setCustomer}
              onCreateNew={(term) => openCustomerDrawer(term)}
            />
          </div>
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
            <span className="muted-inline">Consumidor final</span>
          )}
        </div>

        <div>
          <div className="detalle-header-row">
            <span className="section-label">Detalle de la factura</span>
            <ProductSearchField companyId={company.id} onSelect={addFromProduct} />
            <button type="button" onClick={addManualLine}>
              <i className="fa-solid fa-plus" /> Agregar linea
            </button>
          </div>

          <table className="data-table line-items-table" style={{ marginTop: 8 }}>
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
            <div className="payment-methods-list">
              {paymentMethods.map((pm, index) => (
                <div className="item-row" key={index}>
                  <label>
                    Metodo
                    <select
                      value={pm.method}
                      onChange={(e) => updatePaymentMethod(index, { method: e.target.value as PaymentMethod })}
                    >
                      {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((method) => (
                        <option key={method} value={method}>
                          {PAYMENT_METHOD_LABELS[method]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Valor
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={pm.value}
                      onChange={(e) => updatePaymentMethod(index, { value: Number(e.target.value) || 0 })}
                    />
                  </label>
                  <label>
                    Plazo (opcional)
                    <input
                      type="number"
                      min="1"
                      value={pm.term_value ?? ''}
                      onChange={(e) =>
                        updatePaymentMethod(index, {
                          term_value: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                    />
                  </label>
                  <label>
                    Unidad
                    <select
                      value={pm.term_unit ?? 'dias'}
                      onChange={(e) => updatePaymentMethod(index, { term_unit: e.target.value as PaymentTermUnit })}
                      disabled={!pm.term_value}
                    >
                      {(Object.keys(PAYMENT_TERM_UNIT_LABELS) as PaymentTermUnit[]).map((unit) => (
                        <option key={unit} value={unit}>
                          {PAYMENT_TERM_UNIT_LABELS[unit]}
                        </option>
                      ))}
                    </select>
                  </label>
                  {paymentMethods.length > 1 && (
                    <button type="button" className="icon-btn delete" onClick={() => removePaymentMethod(index)}>
                      <i className="fa-solid fa-trash" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={addPaymentMethod} style={{ marginTop: 8 }}>
              <i className="fa-solid fa-plus" /> Agregar forma de pago
            </button>
            <p className="muted-inline" style={paymentMethodsMismatch ? { color: 'var(--danger)' } : undefined}>
              Asignado: ${paymentMethodsTotal.toFixed(2)} de ${totals.total.toFixed(2)}
              {paymentMethodsMismatch && ' — no coincide con el total'}
            </p>
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
            {submitting === 'draft' ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Guardar borrador'}
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
      </div>}

      {customerDrawerOpen && (
        <div className="pos-overlay pos-drawer-overlay">
          <div className="pos-drawer-panel">
            <div className="page-header">
              <h2>Nuevo cliente</h2>
              <button type="button" onClick={closeCustomerDrawer} aria-label="Cerrar">
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <CustomerForm
              initialValues={customerDrawerInitial}
              submitLabel="Guardar cliente"
              submitting={customerDrawerSubmitting}
              error={customerDrawerError}
              onSubmit={handleCreateCustomerFromDrawer}
              onCancel={closeCustomerDrawer}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}
