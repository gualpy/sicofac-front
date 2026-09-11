import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useCompany } from '../company/CompanyContext'
import { listCustomers } from '../api/customers'
import {
  listInvoicesPage,
  INVOICE_STATUS_LABELS,
  type Invoice,
} from '../api/invoices'

const ENVIRONMENT_LABELS: Record<string, string> = {
  test: 'Pruebas',
  production: 'Produccion',
}

const MAX_STATS_PAGES = 8

function formatMoney(value: number): string {
  return `$${value.toFixed(2)}`
}

function formatRelativeDate(isoDate: string): string {
  const date = new Date(isoDate)
  const today = new Date()
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const diffDays = Math.round((startOfDay(today) - startOfDay(date)) / 86_400_000)

  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'
  return date.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatInvoiceNumber(invoice: Invoice): string {
  return `${invoice.document_code}-${String(invoice.sequential).padStart(9, '0')}`
}

type DashboardStats = {
  billedToday: number
  invoicesToday: number
  billedMonth: number
  invoicesMonth: number
}

export function DashboardPage() {
  const { company } = useCompany()
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [clientsTotal, setClientsTotal] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!company) return
    let cancelled = false
    setLoading(true)

    async function load() {
      const now = new Date()
      const todayKey = now.toDateString()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      let page = 1
      let firstPage: Invoice[] = []
      const monthInvoices: Invoice[] = []

      while (page <= MAX_STATS_PAGES) {
        const result = await listInvoicesPage(company!.id, page)
        if (page === 1) firstPage = result.data

        let reachedOlder = false
        for (const invoice of result.data) {
          const issueDate = new Date(invoice.issue_date)
          if (issueDate < monthStart) {
            reachedOlder = true
            break
          }
          monthInvoices.push(invoice)
        }

        if (reachedOlder || page >= result.last_page) break
        page += 1
      }

      const authorizedMonth = monthInvoices.filter((i) => i.status === 'authorized')
      const authorizedToday = authorizedMonth.filter(
        (i) => new Date(i.issue_date).toDateString() === todayKey,
      )

      const customersResult = await listCustomers(company!.id, 1)

      if (cancelled) return

      setRecentInvoices(firstPage.slice(0, 6))
      setStats({
        billedToday: authorizedToday.reduce((sum, i) => sum + Number(i.total), 0),
        invoicesToday: authorizedToday.length,
        billedMonth: authorizedMonth.reduce((sum, i) => sum + Number(i.total), 0),
        invoicesMonth: monthInvoices.length,
      })
      setClientsTotal(customersResult.total)
      setLoading(false)
    }

    load().catch(() => setLoading(false))

    return () => {
      cancelled = true
    }
  }, [company])

  if (!company) {
    return <Navigate to="/company" replace />
  }

  const monthLabel = new Date().toLocaleDateString('es-EC', { month: 'long' })

  return (
    <div className="page dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>{company.name}</h1>
          <p className="dashboard-subtitle">
            RUC {company.ruc} &nbsp;&bull;&nbsp; Ambiente:{' '}
            {ENVIRONMENT_LABELS[company.environment] ?? company.environment}
          </p>
        </div>
        <Link to="/invoices/new" className="button primary">
          <i className="fa-solid fa-plus" /> Nueva factura
        </Link>
      </div>

      {!loading && stats && (
        <div className="stat-grid">
          <div className="stat-card">
            <span className="section-label">Facturado hoy</span>
            <span className="stat-value">{formatMoney(stats.billedToday)}</span>
            <span className="stat-sub">{stats.invoicesToday} facturas</span>
          </div>
          <div className="stat-card">
            <span className="section-label">Este mes</span>
            <span className="stat-value">{formatMoney(stats.billedMonth)}</span>
            <span className="stat-sub" style={{ textTransform: 'capitalize' }}>
              {monthLabel}
            </span>
          </div>
          <div className="stat-card">
            <span className="section-label">Facturas</span>
            <span className="stat-value">{stats.invoicesMonth}</span>
            <span className="stat-sub">este mes</span>
          </div>
          <div className="stat-card">
            <span className="section-label">Clientes</span>
            <span className="stat-value">{clientsTotal ?? '-'}</span>
            <span className="stat-sub">registrados</span>
          </div>
        </div>
      )}

      <span className="section-label">Acciones rapidas</span>
      <div className="quick-actions">
        <Link to="/invoices/new" className="button primary">
          <i className="fa-solid fa-plus" /> Nueva factura
        </Link>
        <Link to="/customers" className="button">
          <i className="fa-solid fa-plus" /> Nuevo cliente
        </Link>
        <Link to="/invoices" className="button">
          Ver facturas
        </Link>
      </div>

      <div className="dashboard-activity-header">
        <span className="section-label">Actividad reciente</span>
        {recentInvoices.length > 0 && (
          <Link to="/invoices" className="dashboard-see-all">
            Ver todas <i className="fa-solid fa-arrow-right" />
          </Link>
        )}
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : recentInvoices.length === 0 ? (
        <div className="empty-state">
          <p>Aun no tienes facturas emitidas.</p>
          <Link to="/invoices/new" className="button primary">
            Crear primera factura
          </Link>
        </div>
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Factura</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>{formatInvoiceNumber(invoice)}</td>
                  <td>{invoice.customer?.name ?? 'Consumidor final'}</td>
                  <td>{formatRelativeDate(invoice.issue_date)}</td>
                  <td>${invoice.total}</td>
                  <td>
                    <span className={`badge ${invoice.status}`}>
                      {INVOICE_STATUS_LABELS[invoice.status] ?? invoice.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
