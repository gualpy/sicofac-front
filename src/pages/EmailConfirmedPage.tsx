import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { AuthLayout } from '../components/auth/AuthLayout'
import { AuthField } from '../components/auth/AuthField'

export function EmailConfirmedPage() {
  const [searchParams] = useSearchParams()
  const ok = searchParams.get('ok') === '1'
  const { resendVerification } = useAuth()
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleResend(event: FormEvent) {
    event.preventDefault()
    if (!email) return
    setSending(true)
    try {
      await resendVerification(email)
      setSent(true)
    } finally {
      setSending(false)
    }
  }

  if (ok) {
    return (
      <AuthLayout headlineTop="Cuenta" headlineAccent="confirmada." subtitle="Ya podes iniciar sesion y emitir tu primera factura electronica.">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div className="auth-card-icon" style={{ margin: '0 auto 16px', width: 52, height: 52, fontSize: 22, background: 'var(--success-pastel-bg)', color: 'var(--success)' }}>
            <i className="fa-solid fa-circle-check" />
          </div>
          <h1 style={{ marginBottom: 8 }}>Cuenta confirmada</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>Ya podes iniciar sesion normalmente.</p>
          <Link to="/login" className="auth-submit" style={{ textDecoration: 'none' }}>
            Ir a iniciar sesion
            <i className="fa-solid fa-arrow-right" />
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout headlineTop="Enlace" headlineAccent="vencido o invalido." subtitle="Pedi un enlace nuevo y segui con tu registro sin perder tiempo.">
      <div className="auth-card">
        <div className="auth-card-header">
          <span className="auth-card-icon" style={{ background: 'var(--danger-pastel-bg)', color: 'var(--danger)' }}>
            <i className="fa-solid fa-triangle-exclamation" />
          </span>
          <div>
            <h1>Enlace invalido o vencido</h1>
            <p>Pedi uno nuevo ingresando tu correo</p>
          </div>
        </div>

        <form onSubmit={handleResend}>
          <AuthField label="Correo electronico" icon="fa-envelope" type="email" value={email} onChange={setEmail} placeholder="nombre@empresa.com" required />
          <button type="submit" className="auth-submit" disabled={sending || sent}>
            {sent ? 'Correo reenviado' : sending ? 'Enviando...' : 'Reenviar correo'}
          </button>
        </form>

        <p className="auth-footer">
          <Link to="/login">Volver a inicio de sesion</Link>
        </p>
      </div>
    </AuthLayout>
  )
}
