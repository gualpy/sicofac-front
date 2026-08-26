import { useState } from 'react'
import { useCompany } from '../company/CompanyContext'
import { PerfilYFirmaTab } from '../components/settings/PerfilYFirmaTab'
import { PuntosDeEmisionTab } from '../components/settings/PuntosDeEmisionTab'
import { ProductsPage } from './ProductsPage'

type Tab = 'perfil' | 'productos' | 'puntos'

const TABS: Array<{ id: Tab; label: string; icon: string }> = [
  { id: 'perfil', label: 'Perfil y firma', icon: 'fa-id-badge' },
  { id: 'productos', label: 'Productos y servicios', icon: 'fa-boxes-stacked' },
  { id: 'puntos', label: 'Puntos de emision', icon: 'fa-code-branch' },
]

export function SettingsPage() {
  const { company } = useCompany()
  const [tab, setTab] = useState<Tab>('perfil')
  const [visited, setVisited] = useState<Set<Tab>>(new Set(['perfil']))

  if (!company) return null

  function selectTab(next: Tab) {
    setTab(next)
    setVisited((prev) => new Set(prev).add(next))
  }

  return (
    <div className="page" style={{ maxWidth: 1100 }}>
      <h1>Configuracion</h1>

      <div className="tabs">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={tab === item.id ? 'tab active' : 'tab'}
            onClick={() => selectTab(item.id)}
          >
            <i className={`fa-solid ${item.icon}`} /> {item.label}
          </button>
        ))}
      </div>

      <div className="tab-panel">
        {tab === 'perfil' && <PerfilYFirmaTab company={company} />}
        {visited.has('productos') && (
          <div style={{ display: tab === 'productos' ? 'block' : 'none' }}>
            <ProductsPage />
          </div>
        )}
        {tab === 'puntos' && <PuntosDeEmisionTab companyId={company.id} companyTradeName={company.trade_name ?? company.name} />}
      </div>
    </div>
  )
}
