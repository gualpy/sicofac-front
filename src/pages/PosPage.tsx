import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { listPosCategories, type PosCategory } from '../api/posCategories'
import { listPosProducts, type Product } from '../api/products'
import {
  createInvoice,
  emitInvoice,
  getInvoice,
  INVOICE_STATUS_LABELS,
  IN_PROGRESS_STATUSES,
  type Invoice,
  type InvoiceItemInput,
  type PaymentMethod,
} from '../api/invoices'
import { computeLiveTotals } from '../utils/invoiceTotals'
import { useCompany } from '../company/CompanyContext'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { CustomerSearchField } from '../components/CustomerSearchField'
import type { Customer } from '../api/customers'

type CartLine = {
  product: Product
  quantity: number
}

type PosPaymentOption = {
  key: 'efectivo' | 'tarjeta' | 'transferencia'
  method: PaymentMethod
  label: string
}

const PAYMENT_OPTIONS: PosPaymentOption[] = [
  { key: 'efectivo', method: 'no_utiliza_sist_financiero', label: 'Efectivo' },
  { key: 'tarjeta', method: 'tarjeta_credito', label: 'Tarjeta' },
  { key: 'transferencia', method: 'transferencia_bancaria', label: 'Transferencia' },
]

const QUICK_CASH_AMOUNTS = [5, 10, 20, 50]

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function cartToItems(cart: CartLine[]): InvoiceItemInput[] {
  return cart.map((line) => ({
    code: line.product.code,
    name: line.product.name,
    quantity: line.quantity,
    unit_price: Number(line.product.unit_price),
    tax_rate: Number(line.product.tax_rate),
    tax_code: line.product.tax_code,
    ice_rate: Number(line.product.ice_rate),
    product_id: line.product.id,
  }))
}

export function PosPage() {
  const { company } = useCompany()

  const [categories, setCategories] = useState<PosCategory[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 250)

  const [cart, setCart] = useState<CartLine[]>([])
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false)

  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [paymentKey, setPaymentKey] = useState<PosPaymentOption['key']>('efectivo')
  const [cashReceived, setCashReceived] = useState('')
  const [confirming, setConfirming] = useState(false)

  const [saleResult, setSaleResult] = useState<Invoice | null>(null)

  useEffect(() => {
    if (!company) return
    setLoading(true)
    Promise.all([listPosCategories(company.id), listPosProducts(company.id)])
      .then(([cats, prods]) => {
        setCategories(cats)
        setProducts(prods)
      })
      .catch(() => toast.error('No se pudieron cargar los productos de POS.'))
      .finally(() => setLoading(false))
  }, [company])

  const visibleProducts = useMemo(() => {
    let list = products
    if (selectedCategoryId !== null) {
      list = list.filter((p) => p.pos_category_id === selectedCategoryId)
    }
    const term = debouncedSearch.trim().toLowerCase()
    if (term) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.code.toLowerCase().includes(term) ||
          (p.barcode ?? '').toLowerCase() === term,
      )
    }
    return [...list].sort((a, b) => a.pos_sort_order - b.pos_sort_order || a.name.localeCompare(b.name))
  }, [products, selectedCategoryId, debouncedSearch])

  // Exact barcode match with a USB scanner (acts as a keyboard): add straight to
  // cart instead of just filtering the grid down to one tile.
  useEffect(() => {
    const term = debouncedSearch.trim().toLowerCase()
    if (!term) return
    const exactBarcodeMatches = products.filter((p) => (p.barcode ?? '').toLowerCase() === term)
    if (exactBarcodeMatches.length === 1) {
      addToCart(exactBarcodeMatches[0])
      setSearch('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  function addToCart(product: Product) {
    setCart((rows) => {
      const existing = rows.find((r) => r.product.id === product.id)
      if (existing) {
        return rows.map((r) => (r.product.id === product.id ? { ...r, quantity: r.quantity + 1 } : r))
      }
      return [...rows, { product, quantity: 1 }]
    })
  }

  function changeQuantity(productId: number, delta: number) {
    setCart((rows) =>
      rows
        .map((r) => (r.product.id === productId ? { ...r, quantity: r.quantity + delta } : r))
        .filter((r) => r.quantity > 0),
    )
  }

  function removeLine(productId: number) {
    setCart((rows) => rows.filter((r) => r.product.id !== productId))
  }

  const totals = computeLiveTotals(cartToItems(cart))
  const received = Number(cashReceived || 0)
  const change = round2(received - totals.total)
  const isCash = paymentKey === 'efectivo'
  const canConfirm = !isCash || (received >= totals.total && cashReceived !== '')

  function resetForNewSale() {
    setCart([])
    setCustomer(null)
    setCustomerPickerOpen(false)
    setCheckoutOpen(false)
    setPaymentKey('efectivo')
    setCashReceived('')
    setSearch('')
    setSaleResult(null)
  }

  async function handleConfirmSale() {
    if (!company || cart.length === 0) return
    const option = PAYMENT_OPTIONS.find((o) => o.key === paymentKey)!
    setConfirming(true)
    try {
      const invoice = await createInvoice(company.id, {
        customer_id: customer?.id,
        items: cartToItems(cart),
        payment_methods: [{ method: option.method, value: totals.total }],
      })
      await emitInvoice(company.id, invoice.id)
      const finalInvoice = await getInvoice(company.id, invoice.id)
      setSaleResult(finalInvoice)
      setCheckoutOpen(false)
    } catch {
      // Keep the cart intact so the sale can be retried — never lose it on a
      // creation failure before we have confirmation the invoice exists.
      toast.error('No se pudo registrar la venta. Intenta cobrar de nuevo.')
    } finally {
      setConfirming(false)
    }
  }

  if (!company) return null

  if (saleResult) {
    return <PosSaleResult invoice={saleResult} onNewSale={resetForNewSale} />
  }

  return (
    <div className="pos-page">
      <header className="pos-header">
        <div className="pos-header-brand">
          <span>SICOFAC POS</span>
          <span className="pos-header-company">{company.name}</span>
        </div>
        <div className="pos-search">
          <i className="fa-solid fa-magnifying-glass" />
          <input
            placeholder="Buscar o escanear producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <Link to="/" className="pos-back-link">
          <i className="fa-solid fa-arrow-left" /> Volver a Oficina
        </Link>
      </header>

      <div className="pos-body">
        <div className="pos-catalog">
          <div className="pos-categories">
            <button
              type="button"
              className={`pos-category-chip ${selectedCategoryId === null ? 'active' : ''}`}
              onClick={() => setSelectedCategoryId(null)}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`pos-category-chip ${selectedCategoryId === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategoryId(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {loading ? (
            <p>Cargando productos...</p>
          ) : visibleProducts.length === 0 ? (
            <p className="muted-inline">
              {products.length === 0
                ? 'Aun no hay productos habilitados para POS. Configuralos desde Productos y servicios.'
                : 'No se encontraron productos.'}
            </p>
          ) : (
            <div className="pos-product-grid">
              {visibleProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  className="pos-product-tile"
                  onClick={() => addToCart(product)}
                >
                  <span className="pos-product-name">{product.pos_label || product.name}</span>
                  <span className="pos-product-price">${Number(product.unit_price).toFixed(2)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <aside className="pos-cart">
          <div className="pos-customer">
            <button type="button" className="pos-customer-pill" onClick={() => setCustomerPickerOpen((v) => !v)}>
              <i className="fa-solid fa-user" /> {customer ? customer.name : 'Consumidor final'}
            </button>
            {customerPickerOpen && (
              <div className="pos-popover">
                <CustomerSearchField
                  companyId={company.id}
                  onSelect={(c) => {
                    setCustomer(c)
                    setCustomerPickerOpen(false)
                  }}
                />
                {customer && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomer(null)
                      setCustomerPickerOpen(false)
                    }}
                  >
                    Usar consumidor final
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="pos-cart-lines">
            <span className="section-label">Venta actual</span>
            {cart.length === 0 ? (
              <p className="muted-inline">Toca un producto para agregarlo.</p>
            ) : (
              cart.map((line) => (
                <div className="pos-cart-line" key={line.product.id}>
                  <div className="pos-cart-line-info">
                    <span>{line.product.pos_label || line.product.name}</span>
                    <span className="pos-cart-line-total">
                      ${(Number(line.product.unit_price) * line.quantity).toFixed(2)}
                    </span>
                  </div>
                  <div className="pos-cart-line-qty">
                    <button type="button" onClick={() => changeQuantity(line.product.id, -1)}>
                      -
                    </button>
                    <span>{line.quantity}</span>
                    <button type="button" onClick={() => changeQuantity(line.product.id, 1)}>
                      +
                    </button>
                    <button
                      type="button"
                      className="icon-btn delete"
                      onClick={() => removeLine(line.product.id)}
                    >
                      <i className="fa-solid fa-trash" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pos-totals">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>${totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-row muted">
              <span>IVA</span>
              <span>${totals.tax.toFixed(2)}</span>
            </div>
            <div className="summary-row total">
              <span>TOTAL</span>
              <span className="value">${totals.total.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="button"
            className="primary pos-charge-button"
            disabled={cart.length === 0}
            onClick={() => setCheckoutOpen(true)}
          >
            COBRAR ${totals.total.toFixed(2)}
          </button>
        </aside>
      </div>

      {checkoutOpen && (
        <div className="pos-overlay">
          <div className="pos-overlay-panel">
            <div className="page-header">
              <h2>Cobrar</h2>
              <button type="button" onClick={() => setCheckoutOpen(false)}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className="pos-payment-options">
              {PAYMENT_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={`pos-payment-option ${paymentKey === option.key ? 'active' : ''}`}
                  onClick={() => setPaymentKey(option.key)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="summary-row total" style={{ marginTop: 12 }}>
              <span>Total</span>
              <span className="value">${totals.total.toFixed(2)}</span>
            </div>

            {isCash && (
              <div style={{ marginTop: 12 }}>
                <label>
                  Recibido
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    autoFocus
                  />
                </label>
                <div className="pos-quick-cash">
                  {QUICK_CASH_AMOUNTS.map((amount) => (
                    <button type="button" key={amount} onClick={() => setCashReceived(String(amount))}>
                      ${amount}
                    </button>
                  ))}
                </div>
                <div className="summary-row" style={{ marginTop: 8 }}>
                  <span>Cambio</span>
                  <span>${change > 0 ? change.toFixed(2) : '0.00'}</span>
                </div>
              </div>
            )}

            <button
              type="button"
              className="primary pos-charge-button"
              disabled={!canConfirm || confirming}
              onClick={handleConfirmSale}
              style={{ marginTop: 16 }}
            >
              {confirming ? 'Procesando...' : 'Confirmar venta'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function PosSaleResult({ invoice, onNewSale }: { invoice: Invoice; onNewSale: () => void }) {
  const isAuthorized = invoice.status === 'authorized'
  const isPending = IN_PROGRESS_STATUSES.includes(invoice.status)
  const isRejected = invoice.status === 'rejected'
  const isFailed = invoice.status === 'failed'
  const docNumber = `${invoice.document_code}-${String(invoice.sequential).padStart(9, '0')}`

  return (
    <div className="pos-page pos-result-page">
      <div className="pos-result-card">
        <i
          className={`fa-solid ${isAuthorized ? 'fa-circle-check' : isPending ? 'fa-clock' : 'fa-triangle-exclamation'}`}
          style={{
            fontSize: 48,
            color: isAuthorized ? 'var(--success)' : isPending ? 'var(--warning)' : 'var(--danger)',
          }}
        />
        <h2>{isAuthorized ? 'Venta completada' : 'Venta registrada'}</h2>
        <p className="pos-result-doc">Factura {docNumber}</p>
        <span className={`badge ${invoice.status}`}>{INVOICE_STATUS_LABELS[invoice.status] ?? invoice.status}</span>

        {isPending && (
          <p className="muted-inline" style={{ marginTop: 12 }}>
            La autorizacion del SRI esta siendo procesada. Revisa el estado mas tarde en Facturas.
          </p>
        )}
        {isRejected && (
          <p className="muted-inline" style={{ marginTop: 12 }}>
            El SRI rechazo este comprobante. Revisa el detalle en Facturas.
          </p>
        )}
        {isFailed && (
          <p className="muted-inline" style={{ marginTop: 12 }}>
            Ocurrio un error tecnico al procesar el comprobante. Revisa el detalle en Facturas.
          </p>
        )}

        <button type="button" className="primary pos-charge-button" onClick={onNewSale} style={{ marginTop: 24 }}>
          <i className="fa-solid fa-plus" /> Nueva venta
        </button>
      </div>
    </div>
  )
}
