import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useCompany } from '../company/CompanyContext'

export function AppShell() {
  const { logout } = useAuth()
  const { company, clearCompany } = useCompany()

  async function handleLogout() {
    await logout()
    clearCompany()
  }

  return (
    <div>
      <header className="topbar">
        <span className="brand">SICOFAC</span>
        <nav>
          <Link to="/">Dashboard</Link>
          {company && (
            <>
              <Link to="/customers">Clientes</Link>
              <Link to="/products">Productos</Link>
              <Link to="/invoices">Facturas</Link>
            </>
          )}
        </nav>
        <span className="company-badge">
          {company ? `${company.name} (${company.ruc})` : 'Sin empresa asignada'}
        </span>
        <button type="button" onClick={() => handleLogout()}>
          Salir
        </button>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
