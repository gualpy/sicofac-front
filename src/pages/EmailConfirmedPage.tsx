import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

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
      <div className="auth-page">
        <div className="card narrow" style={{ textAlign: 'center' }}>
          <i className="fa-solid fa-circle-check" style={{ fontSize: 40, color: 'var(--success)' }} />
          <h1>Cuenta confirmada</h1>
          <p className="muted-inline">Ya podes iniciar sesion normalmente.</p>
          <Link to="/login" className="button primary" style={{ marginTop: 12 }}>
            Ir a iniciar sesion
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <form className="card narrow" onSubmit={handleResend} style={{ textAlign: 'center' }}>
        <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: 40, color: 'var(--danger)' }} />
        <h1>Enlace invalido o vencido</h1>
        <p className="muted-inline">Pedi uno nuevo ingresando tu correo.</p>
        <label style={{ textAlign: 'left' }}>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <button type="submit" className="primary" disabled={sending || sent} style={{ marginTop: 8 }}>
          {sent ? 'Correo reenviado' : sending ? 'Enviando...' : 'Reenviar correo'}
        </button>
        <p style={{ marginTop: 12 }}>
          <Link to="/login">Volver a inicio de sesion</Link>
        </p>
      </form>
    </div>
  )
}
