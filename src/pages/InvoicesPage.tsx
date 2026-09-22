import { Fragment, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  listInvoicesPage,
  emitInvoice,
  deleteInvoice,
  getInvoice,
  openInvoiceRide,
  INVOICE_STATUS_LABELS,
  STATUS_FILTER_VALUES,
  type Invoice,
  type InvoiceStatusFilter,
} from '../api/invoices'
import { useCompany } from '../company/CompanyContext'
import { useDebouncedValue } from '../hooks/useDebouncedValue'

type TabKey = 'all' | InvoiceStatusFilter

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'all', label: 'Todas' },
  { key: 'draft', label: 'Borradores' },
  { key: 'in_progress', label: 'En proceso' },
  { key: 'authorized', label: 'Autorizadas' },
  { key: 'rejected', label: 'Rechazadas' },
]

function formatInvoiceNumber(invoice: Invoice): string {
  return `${invoice.document_code}-${String(invoice.sequential).padStart(9, '0')}`
}

function formatDate(issueDate: string): string {
  return new Date(issueDate).toLocaleDateString('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function InvoicesPage() {
  const { company } = useCompany()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const [tab, setTab] = useState<TabKey>('all')
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)

  const [busyId, setBusyId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [expandedDetail, setExpandedDetail] = useState<Invoice | null>(null)
  const [expandedLoading, setExpandedLoading] = useState(false)

  useEffect(() => {
    if (company) refresh(company.id, 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company, tab, debouncedSearch, from, to])

  useEffect(() => {
    if (openMenuId === null) return
    function handleClickOutside(event: MouseEvent) {
      if (!(event.target as HTMLElement).closest('.row-menu')) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openMenuId])

  function refresh(companyId: number, pageToLoad: number) {
    setLoading(true)
    listInvoicesPage(companyId, pageToLoad, {
      search: debouncedSearch || undefined,
      status: tab === 'all' ? undefined : STATUS_FILTER_VALUES[tab],
      from: from || undefined,
      to: to || undefined,
    })
      .then((result) => {
        setInvoices(result.data)
        setPage(result.current_page)
        setLastPage(result.last_page)
        setTotal(result.total)
      })
      .catch(() => toast.error('No se pudo cargar las facturas.'))
      .finally(() => setLoading(false))
  }

  async function handleEmit(invoiceId: number) {
    if (!company) return
    setOpenMenuId(null)
    setBusyId(invoiceId)
    try {
      await emitInvoice(company.id, invoiceId)
      toast.success('Factura enviada al SRI. Revisa el estado en unos segundos.')
      refresh(company.id, page)
    } catch {
      toast.error('No se pudo emitir la factura.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(invoice: Invoice) {
    if (!company) return
    setOpenMenuId(null)
    if (!window.confirm(`Eliminar el borrador ${formatInvoiceNumber(invoice)}? Esta accion no se puede deshacer.`)) {
      return
    }
    setDeletingId(invoice.id)
    try {
      await deleteInvoice(company.id, invoice.id)
      refresh(company.id, page)
    } catch {
      toast.error('No se pudo eliminar el borrador.')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleRide(invoiceId: number) {
    if (!company) return
    setOpenMenuId(null)
    try {
      await openInvoiceRide(company.id, invoiceId)
    } catch {
      toast.error('No se pudo abrir el RIDE.')
    }
  }

  async function toggleDetail(invoice: Invoice) {
    setOpenMenuId(null)
    if (expandedId === invoice.id) {
      setExpandedId(null)
      setExpandedDetail(null)
      return
    }
    if (!company) return
    setExpandedId(invoice.id)
    setExpandedDetail(null)
    setExpandedLoading(true)
    try {
      const detail = await getInvoice(company.id, invoice.id)
      setExpandedDetail(detail)
    } catch {
      toast.error('No se pudo cargar el detalle de la factura.')
    } finally {
      setExpandedLoading(false)
    }
  }

  if (!company) return null

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Facturas</h1>
          <p className="dashboard-subtitle">Consulta y administra tus comprobantes electronicos</p>
        </div>
        <Link to="/invoices/new" className="button primary">
          <i className="fa-solid fa-plus" /> Nueva factura
        </Link>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="form-row">
          <label style={{ flex: 2 }}>
            Buscar
            <div className="search-field">
              <div className="search-input">
                <i className="fa-solid fa-magnifying-glass" />
                <input
                  placeholder="Buscar por cliente o secuencial..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </label>
          <label>
            Desde
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label>
            Hasta
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
        </div>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Secuencial</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <Fragment key={invoice.id}>
                  <tr>
                    <td>{formatInvoiceNumber(invoice)}</td>
                    <td>{invoice.customer?.name ?? 'Consumidor final'}</td>
                    <td>{formatDate(invoice.issue_date)}</td>
                    <td>${invoice.total}</td>
                    <td>
                      <span className={`badge ${invoice.status}`}>
                        {INVOICE_STATUS_LABELS[invoice.status] ?? invoice.status}
                      </span>
                    </td>
                    <td>
                      <div className="row-menu">
                        <button
                          type="button"
                          className="row-menu-trigger"
                          aria-label="Acciones"
                          onClick={() => setOpenMenuId((id) => (id === invoice.id ? null : invoice.id))}
                        >
                          <i className="fa-solid fa-ellipsis-vertical" />
                        </button>
                        {openMenuId === invoice.id && (
                          <div className="row-menu-dropdown">
                            {invoice.status === 'draft' && (
                              <>
                                <Link to={`/invoices/${invoice.id}/edit`} onClick={() => setOpenMenuId(null)}>
                                  <i className="fa-solid fa-pen" /> Editar
                                </Link>
                                <button
                                  type="button"
                                  disabled={busyId === invoice.id}
                                  onClick={() => handleEmit(invoice.id)}
                                >
                                  <i className="fa-solid fa-paper-plane" /> Enviar al SRI
                                </button>
                                <button
                                  type="button"
                                  className="danger"
                                  disabled={deletingId === invoice.id}
                                  onClick={() => handleDelete(invoice)}
                                >
                                  <i className="fa-solid fa-trash" /> Eliminar
                                </button>
                              </>
                            )}
                            {invoice.status === 'authorized' && (
                              <button type="button" onClick={() => handleRide(invoice.id)}>
                                <i className="fa-solid fa-file-pdf" /> Descargar RIDE
                              </button>
                            )}
                            <button type="button" onClick={() => toggleDetail(invoice)}>
                              <i className="fa-solid fa-eye" /> Ver detalle
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedId === invoice.id && (
                    <tr>
                      <td colSpan={6} className="invoice-detail-row">
                        {expandedLoading || !expandedDetail ? (
                          <p>Cargando detalle...</p>
                        ) : (
                          <div className="invoice-detail-panel">
                            <div>
                              <span className="section-label">Items</span>
                              <ul className="invoice-detail-items">
                                {(expandedDetail.items ?? []).map((item) => (
                                  <li key={item.id}>
                                    {item.quantity} x {item.name} — ${item.total}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            {(invoice.status === 'rejected' || invoice.status === 'failed') && (
                              <div>
                                <span className="section-label">Mensajes del SRI</span>
                                {(() => {
                                  const lastEvent = [...(expandedDetail.events ?? [])].reverse()[0]
                                  const messages = lastEvent?.payload?.messages ?? []
                                  return messages.length > 0 ? (
                                    <ul className="invoice-detail-items">
                                      {messages.map((message, i) => (
                                        <li key={i}>{message}</li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="muted-inline">No hay mensajes detallados disponibles.</p>
                                  )
                                })()}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={6}>No hay facturas que coincidan con los filtros.</td>
                </tr>
              )}
            </tbody>
          </table>

          {lastPage > 1 && (
            <div className="invoice-actions-bar" style={{ justifyContent: 'center' }}>
              <button type="button" disabled={page <= 1} onClick={() => company && refresh(company.id, page - 1)}>
                <i className="fa-solid fa-chevron-left" /> Anterior
              </button>
              <span style={{ alignSelf: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                Pagina {page} de {lastPage} ({total})
              </span>
              <button
                type="button"
                disabled={page >= lastPage}
                onClick={() => company && refresh(company.id, page + 1)}
              >
                Siguiente <i className="fa-solid fa-chevron-right" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
