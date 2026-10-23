import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type Props = {
  title: string
  updatedAt: string
  children: ReactNode
}

export function LegalLayout({ title, updatedAt, children }: Props) {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <Link to="/" className="legal-brand">
          <span className="auth-brand-mark">
            <i className="fa-solid fa-bolt" />
          </span>
          SICOFAC
        </Link>
        <Link to="/register">Volver al registro</Link>
      </header>

      <main className="legal-content">
        <h1>{title}</h1>
        <p className="legal-updated">Ultima actualizacion: {updatedAt}</p>
        {children}
      </main>
    </div>
  )
}
