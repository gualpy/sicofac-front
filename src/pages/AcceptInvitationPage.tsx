import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { acceptInvitation, getInvitation, type InvitationDetails } from '../api/invitations'

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

  if (loading) {
    return (
      <div className="auth-page">
        <p>Cargando...</p>
      </div>
    )
  }

  if (invalid || !invitation) {
    return (
      <div className="auth-page">
        <div className="card narrow" style={{ textAlign: 'center' }}>
          <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: 40, color: 'var(--danger)' }} />
          <h1>Invitacion invalida o vencida</h1>
          <p className="muted-inline">Pide al administrador que te envie una nueva invitacion.</p>
          <p style={{ marginTop: 16 }}>
            <Link to="/login">Volver a inicio de sesion</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <form className="card narrow" onSubmit={handleSubmit}>
        <h1>SICOFAC</h1>
        <p className="muted-inline">
          Te invitaron a unirte a <strong>{invitation.company_name}</strong> como{' '}
          <strong>{ROLE_LABELS[invitation.role] ?? invitation.role}</strong>.
        </p>

        {invitation.requires_password ? (
          <>
            <label>
              Nombre
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label>
              Contrasena
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </label>
          </>
        ) : (
          <p className="muted-inline">
            Ya tenes una cuenta con <strong>{invitation.email}</strong>. Acepta para que tu cuenta tambien
            tenga acceso a esta empresa.
          </p>
        )}

        {error && <p role="alert">{error}</p>}

        <button type="submit" className="primary" disabled={submitting}>
          {submitting ? 'Procesando...' : 'Aceptar invitacion'}
        </button>
      </form>
    </div>
  )
}
