import { useEffect, useRef, useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useCompany } from '../company/CompanyContext'

export function AppShell() {
  const { logout } = useAuth()
  const { company, clearCompany } = useCompany()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
              <Link to="/invoices">Facturas</Link>
              <Link to="/pos">
                <i className="fa-solid fa-cash-register" /> Punto de venta
              </Link>
              <Link to="/settings">
                <i className="fa-solid fa-gear" /> Configuracion
              </Link>
            </>
          )}
        </nav>
        <div className="user-menu" ref={menuRef}>
          <button type="button" className="user-menu-trigger" onClick={() => setMenuOpen((v) => !v)}>
            <span className="user-menu-name">{company ? company.name : 'Sin empresa asignada'}</span>
            <i className="fa-solid fa-chevron-down" />
          </button>
          {menuOpen && (
            <div className="user-menu-dropdown">
              {company && (
                <>
                  <div className="user-menu-info">
                    <strong>{company.name}</strong>
                    <span>RUC {company.ruc}</span>
                  </div>
                  <hr />
                  <Link to="/settings" onClick={() => setMenuOpen(false)}>
                    <i className="fa-solid fa-gear" /> Configuracion
                  </Link>
                </>
              )}
              <button type="button" onClick={() => handleLogout()}>
                <i className="fa-solid fa-right-from-bracket" /> Cerrar sesion
              </button>
            </div>
          )}
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
