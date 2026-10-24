import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listPlans, type Plan } from '../api/plans'
import { formatPlanPrice, formatPlanCount } from '../utils/plan'

const FEATURES = [
  {
    icon: 'fa-file-signature',
    title: 'Firma y envio al SRI',
    text: 'Generamos, firmamos (XAdES-BES) y transmitimos tus comprobantes electronicos sin que toques una linea de XML.',
  },
  {
    icon: 'fa-cash-register',
    title: 'Punto de venta integrado',
    text: 'Vendes y facturas desde la misma pantalla, sin un sistema aparte para el mostrador.',
  },
  {
    icon: 'fa-users',
    title: 'Multiusuario con roles',
    text: 'Propietario, administrador y vendedor: cada quien con los permisos que le corresponden.',
  },
  {
    icon: 'fa-chart-simple',
    title: 'Planes por volumen',
    text: 'Pagas segun cuanto facturas, sin sorpresas ni letra chica.',
  },
]

export function LandingPage() {
  const [plans, setPlans] = useState<Plan[]>([])

  useEffect(() => {
    listPlans()
      .then(setPlans)
      .catch(() => setPlans([]))
  }, [])

  return (
    <div className="landing-page">
      <header className="landing-nav">
        <div className="landing-brand">
          <span className="auth-brand-mark">
            <i className="fa-solid fa-bolt" />
          </span>
          SICOFAC
        </div>
        <nav>
          <a href="#planes">Precios</a>
          <Link to="/login" className="btn-ghost">
            Iniciar sesion
          </Link>
          <Link to="/register" className="btn-primary">
            Crear cuenta
          </Link>
        </nav>
      </header>

      <section className="landing-hero">
        <h1>
          Factura electronica <span>sin fricción.</span>
        </h1>
        <p>
          SICOFAC firma y envia tus comprobantes al SRI, gestiona tu punto de venta y a tu equipo, todo
          desde un mismo lugar. Crea tu cuenta y emiti tu primera factura hoy mismo.
        </p>
        <div className="landing-hero-cta">
          <Link to="/register" className="btn-primary btn-lg">
            Crear cuenta gratis
            <i className="fa-solid fa-arrow-right" />
          </Link>
          <a href="#planes" className="btn-ghost btn-lg">
            Ver planes
          </a>
        </div>
      </section>

      <section className="landing-features">
        {FEATURES.map((feature) => (
          <div className="landing-feature-card" key={feature.title}>
            <span className="landing-feature-icon">
              <i className={`fa-solid ${feature.icon}`} />
            </span>
            <h3>{feature.title}</h3>
            <p>{feature.text}</p>
          </div>
        ))}
      </section>

      <section className="landing-pricing" id="planes">
        <h2>Planes simples, sin letra chica</h2>
        <p className="landing-pricing-sub">Ciclo anual. Cambia de plan cuando lo necesites.</p>

        <div className="landing-pricing-grid">
          {plans.map((plan) => (
            <div className="landing-plan-card" key={plan.id}>
              <strong>{plan.name}</strong>
              <span className="landing-plan-price">{formatPlanPrice(plan.price_cents)}</span>
              <ul>
                <li>{formatPlanCount(plan.monthly_document_limit, 'documento/mes', 'documentos/mes')}</li>
                <li>{formatPlanCount(plan.max_establishments, 'establecimiento', 'establecimientos')}</li>
                <li>{formatPlanCount(plan.max_users, 'usuario', 'usuarios')}</li>
                <li>Punto de venta</li>
                <li>Multiusuario</li>
              </ul>
              <Link to="/register" className="btn-primary">
                Elegir {plan.name}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <footer className="landing-footer">
        <span>&copy; {new Date().getFullYear()} SICOFAC</span>
        <div>
          <Link to="/terminos">Terminos de Servicio</Link>
          <Link to="/privacidad">Politica de Privacidad</Link>
        </div>
      </footer>
    </div>
  )
}
