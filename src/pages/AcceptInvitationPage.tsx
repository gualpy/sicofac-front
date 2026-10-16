import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { acceptInvitation, getInvitation, type InvitationDetails } from '../api/invitations'
import { AuthLayout } from '../components/auth/AuthLayout'
import { AuthField } from '../components/auth/AuthField'

const ROLE_LABELS: Record<string, string> = {
  owner: 'Propietario',
  admin: 'Administrador',
  seller: 'Vendedor',
}

export function AcceptInvitationPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [invalid, setInvalid] = useState(false)
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!token) return
    getInvitation(token)
      .then(setInvitation)
      .catch(() => setInvalid(true))
      .finally(() => setLoading(false))
  }, [token])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!token) return
    setError(null)
    setSubmitting(true)
    try {
      await acceptInvitation(token, invitation?.requires_password ? { name, password } : {})
      navigate('/login')
    } catch {
      setError('No se pudo aceptar la invitacion.')
    } finally {
      setSubmitting(false)
    }
  }

  const layoutProps = {
    headlineTop: 'Sumate a',
    headlineAccent: 'tu equipo.',
    subtitle: 'Un espacio de trabajo listo para que factures y gestiones junto a tu empresa.',
  }

  if (loading) {
    return (
      <AuthLayout {...layoutProps}>
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>Cargando...</p>
        </div>
      </AuthLayout>
    )
  }

  if (invalid || !invitation) {
    return (
      <AuthLayout headlineTop="Invitacion" headlineAccent="no disponible." subtitle="Pedi al administrador que te envie una invitacion nueva.">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div className="auth-card-icon" style={{ margin: '0 auto 16px', width: 52, height: 52, fontSize: 22, background: 'var(--danger-pastel-bg)', color: 'var(--danger)' }}>
            <i className="fa-solid fa-triangle-exclamation" />
          </div>
          <h1 style={{ marginBottom: 8 }}>Invitacion invalida o vencida</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Pide al administrador que te envie una nueva invitacion.</p>
          <p className="auth-footer">
            <Link to="/login">Volver a inicio de sesion</Link>
          </p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout {...layoutProps}>
      <div className="auth-card">
        <div className="auth-card-header">
          <span className="auth-card-icon">
            <i className="fa-solid fa-user-group" />
          </span>
          <div>
            <h1>Aceptar invitacion</h1>
            <p>
              Te invitaron a <strong>{invitation.company_name}</strong> como {ROLE_LABELS[invitation.role] ?? invitation.role}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {invitation.requires_password ? (
            <>
              <AuthField label="Nombre" icon="fa-user" value={name} onChange={setName} placeholder="Nombre y apellido" required autoComplete="name" />
              <AuthField
                label="Contrasena"
                icon="fa-lock"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="Minimo 8 caracteres"
                minLength={8}
                required
                autoComplete="new-password"
              />
            </>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>
              Ya tenes una cuenta con <strong>{invitation.email}</strong>. Acepta para que tu cuenta tambien tenga acceso a esta empresa.
            </p>
          )}

          {error && <p role="alert">{error}</p>}

          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting ? 'Procesando...' : 'Aceptar invitacion'}
            <i className="fa-solid fa-arrow-right" />
          </button>
        </form>
      </div>
    </AuthLayout>
  )
}
