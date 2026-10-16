import type { ReactNode } from 'react'

type Feature = {
  icon: string
  title: string
  text: string
}

const FEATURES: Feature[] = [
  { icon: 'fa-cash-register', title: 'Punto de venta', text: 'POS integrado para vender y facturar al instante.' },
  { icon: 'fa-users', title: 'Multiusuario', text: 'Invita a tu equipo con roles y accesos propios.' },
  { icon: 'fa-file-signature', title: 'Firma SRI', text: 'Certificado y emision electronica validados en tiempo real.' },
]

type Props = {
  headlineTop: string
  headlineAccent: string
  subtitle: string
  children: ReactNode
}

export function AuthLayout({ headlineTop, headlineAccent, subtitle, children }: Props) {
  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <div className="auth-panel-content">
          <div className="auth-brand">
            <span className="auth-brand-mark">
              <i className="fa-solid fa-bolt" />
            </span>
            SICOFAC
          </div>

          <h1 className="auth-headline">
            {headlineTop}
            <br />
            <span>{headlineAccent}</span>
          </h1>
          <p className="auth-subtitle">{subtitle}</p>
        </div>

        <div className="auth-waves" aria-hidden="true">
          <svg viewBox="0 0 1600 220" preserveAspectRatio="none">
            <path className="auth-wave auth-wave-1" d="M0,120 C 200,180 400,60 600,110 C 800,160 1000,60 1200,100 C 1350,130 1500,90 1600,110 L1600,220 L0,220 Z" />
            <path className="auth-wave auth-wave-2" d="M0,150 C 220,90 420,190 650,140 C 850,100 1050,170 1250,130 C 1380,105 1500,140 1600,130 L1600,220 L0,220 Z" />
            <path className="auth-wave auth-wave-3" d="M0,180 C 240,150 460,210 700,170 C 900,140 1100,200 1300,165 C 1420,145 1520,170 1600,160 L1600,220 L0,220 Z" />
          </svg>
        </div>

        <div className="auth-features">
          {FEATURES.map((feature) => (
            <div className="auth-feature" key={feature.title}>
              <span className="auth-feature-icon">
                <i className={`fa-solid ${feature.icon}`} />
              </span>
              <strong>{feature.title}</strong>
              <span>{feature.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="auth-form-side">{children}</div>
    </div>
  )
}
