import { useEffect, useState, type FormEvent } from 'react'
import { isAxiosError } from 'axios'
import {
  inviteMember,
  listMembers,
  revokeInvitation,
  type CompanyMember,
  type PendingInvitation,
} from '../../api/companies'

const ROLE_LABELS: Record<string, string> = {
  owner: 'Propietario',
  admin: 'Administrador',
  seller: 'Vendedor',
}

type Props = {
  companyId: number
}

export function UsuariosTab({ companyId }: Props) {
  const [members, setMembers] = useState<CompanyMember[]>([])
  const [pending, setPending] = useState<PendingInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId])

  function refresh() {
    setLoading(true)
    listMembers(companyId)
      .then((result) => {
        setMembers(result.members)
        setPending(result.pending_invitations)
      })
      .catch(() => setError('No se pudo cargar los usuarios.'))
      .finally(() => setLoading(false))
  }

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSending(true)
    const form = new FormData(event.currentTarget)

    try {
      await inviteMember(companyId, {
        email: String(form.get('email')),
        role: form.get('role') === 'admin' ? 'admin' : 'seller',
      })
      setShowForm(false)
      refresh()
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 422) {
        setError(err.response.data?.errors?.email?.[0] ?? 'No se pudo enviar la invitacion.')
      } else {
        setError('No se pudo enviar la invitacion.')
      }
    } finally {
      setSending(false)
    }
  }

  async function handleRevoke(invitationId: number) {
    try {
      await revokeInvitation(companyId, invitationId)
      refresh()
    } catch {
      setError('No se pudo cancelar la invitacion.')
    }
  }

  if (loading) return <p>Cargando...</p>

  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 700 }}>
        Invita a otras personas de tu empresa (cajeros, administrativos) para que tengan su propio inicio
        de sesion dentro de esta misma empresa.
      </p>

      {error && <p role="alert">{error}</p>}

      <div className="page-header" style={{ marginTop: 16 }}>
        <span className="section-label" style={{ marginBottom: 0 }}>
          Usuarios
        </span>
        <button type="button" className="primary" onClick={() => setShowForm((v) => !v)}>
          <i className="fa-solid fa-plus" /> {showForm ? 'Cancelar' : 'Invitar usuario'}
        </button>
      </div>

      {showForm && (
        <form className="card" onSubmit={handleInvite}>
          <div className="form-row">
            <label>
              Email
              <input name="email" type="email" required placeholder="empleado@correo.com" />
            </label>
            <label>
              Rol
              <select name="role" defaultValue="seller">
                <option value="seller">Vendedor</option>
                <option value="admin">Administrador</option>
              </select>
            </label>
          </div>
          <button type="submit" className="primary" disabled={sending}>
            {sending ? 'Enviando...' : 'Enviar invitacion'}
          </button>
        </form>
      )}

      <table className="data-table" style={{ marginTop: 12 }}>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={`member-${member.id}`}>
              <td>{member.name}</td>
              <td>{member.email}</td>
              <td>{ROLE_LABELS[member.role] ?? member.role}</td>
              <td>
                <span className={`badge ${member.status === 'active' ? 'authorized' : 'rejected'}`}>
                  {member.status === 'active' ? 'ACTIVO' : 'INACTIVO'}
                </span>
              </td>
              <td></td>
            </tr>
          ))}
          {pending.map((invitation) => (
            <tr key={`invitation-${invitation.id}`}>
              <td>-</td>
              <td>{invitation.email}</td>
              <td>{ROLE_LABELS[invitation.role] ?? invitation.role}</td>
              <td>
                <span className="badge processing">PENDIENTE</span>
              </td>
              <td>
                <button type="button" onClick={() => handleRevoke(invitation.id)}>
                  Cancelar invitacion
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
