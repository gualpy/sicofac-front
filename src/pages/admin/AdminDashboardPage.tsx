import { useEffect, useState, type FormEvent } from 'react'
import {
  activateCompany,
  deactivateCompany,
  getAdminMetrics,
  listAdminCompanies,
  type AdminCompany,
  type AdminMetrics,
} from '../../api/admin'

function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

export function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [companies, setCompanies] = useState<AdminCompany[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<number | null>(null)

  async function load(searchValue: string) {
    setLoading(true)
    try {
      const [metricsData, companiesPage] = await Promise.all([getAdminMetrics(), listAdminCompanies(searchValue)])
      setMetrics(metricsData)
      setCompanies(companiesPage.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSearch(e: FormEvent) {
    e.preventDefault()
    await load(search)
  }

  async function toggleActive(company: AdminCompany) {
    setBusyId(company.id)
    try {
      if (company.is_active) {
        await deactivateCompany(company.id)
      } else {
        await activateCompany(company.id)
      }
      await load(search)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Panel de Super Admin</h1>
      </div>

      {metrics && (
        <div className="stat-grid">
          <div className="stat-card">
            <span className="section-label">MRR estimado</span>
            <span className="stat-value">{formatMoney(metrics.mrr_cents)}</span>
            <span className="stat-sub">precio/12 x activas, no es cobro real</span>
          </div>
          <div className="stat-card">
            <span className="section-label">Empresas activas</span>
            <span className="stat-value">{metrics.active_companies}</span>
          </div>
          <div className="stat-card">
            <span className="section-label">Desactivadas</span>
            <span className="stat-value">{metrics.inactive_companies}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSearch} className="search-field" style={{ marginBottom: 16 }}>
        <div className="search-input">
          <i className="fa-solid fa-magnifying-glass" />
          <input
            type="search"
            placeholder="Buscar por nombre o RUC..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </form>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Empresa</th>
              <th>RUC</th>
              <th>Plan</th>
              <th>Propietario</th>
              <th>Docs. este mes</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {companies.length === 0 && (
              <tr>
                <td colSpan={7}>Sin resultados.</td>
              </tr>
            )}
            {companies.map((company) => (
              <tr key={company.id}>
                <td>{company.name}</td>
                <td>{company.ruc}</td>
                <td>{company.plan?.name ?? 'Sin plan'}</td>
                <td>{company.owner_email ?? '-'}</td>
                <td>{company.documents_this_month}</td>
                <td>
                  <span className={company.is_active ? 'badge badge-success' : 'badge badge-danger'}>
                    {company.is_active ? 'Activa' : 'Desactivada'}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    className="btn-ghost"
                    disabled={busyId === company.id}
                    onClick={() => toggleActive(company)}
                  >
                    {company.is_active ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
