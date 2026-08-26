import { useEffect, useState, type FormEvent } from 'react'
import {
  listEstablishments,
  createEmissionPoint,
  updateEmissionPoint,
  type Establishment,
} from '../../api/companies'

const DOCUMENT_LABELS: Record<string, string> = {
  '01': 'Factura',
  '04': 'Nota Credito',
  '05': 'Nota Debito',
  '07': 'Comprobante Retencion',
  '03': 'Liquidacion Compra',
  '06': 'Guia Remision',
}

type Props = {
  companyId: number
  companyTradeName: string
}

export function PuntosDeEmisionTab({ companyId, companyTradeName }: Props) {
  const [establishments, setEstablishments] = useState<Establishment[]>([])
  const [establishmentId, setEstablishmentId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId])

  function refresh() {
    setLoading(true)
    listEstablishments(companyId)
      .then((list) => {
        setEstablishments(list)
        setEstablishmentId((current) => current ?? list[0]?.id ?? null)
      })
      .catch(() => setError('No se pudo cargar los puntos de emision.'))
      .finally(() => setLoading(false))
  }

  const establishment = establishments.find((e) => e.id === establishmentId) ?? null

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!establishment) return
    setError(null)
    const form = new FormData(event.currentTarget)

    try {
      await createEmissionPoint(companyId, establishment.id, {
        code: String(form.get('code')),
        description: String(form.get('description') || '') || undefined,
      })
      setShowForm(false)
      refresh()
    } catch {
      setError('No se pudo crear el punto de emision. Revisa que el codigo (3 digitos) no este repetido.')
    }
  }

  async function toggleActive(emissionPointId: number, isActive: boolean) {
    if (!establishment) return
    try {
      await updateEmissionPoint(companyId, establishment.id, emissionPointId, { is_active: !isActive })
      refresh()
    } catch {
      setError('No se pudo actualizar el punto de emision.')
    }
  }

  if (loading) return <p>Cargando...</p>

  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 700 }}>
        Recuerda que eres el responsable de administrar la numeracion de los establecimientos y puntos de
        emision, manteniendo la secuencialidad de los comprobantes firmados electronicamente.
      </p>

      {error && <p role="alert">{error}</p>}

      <div className="form-row" style={{ maxWidth: 500 }}>
        <label>
          Establecimiento
          <select
            value={establishmentId ?? ''}
            onChange={(e) => setEstablishmentId(Number(e.target.value))}
          >
            {establishments.map((est) => (
              <option key={est.id} value={est.id}>
                {est.code} - {est.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Nombre comercial
          <input value={companyTradeName} disabled />
        </label>
      </div>

      <div className="page-header" style={{ marginTop: 16 }}>
        <span className="section-label" style={{ marginBottom: 0 }}>
          Parametrizacion de puntos de emision y secuenciales
        </span>
        <button type="button" className="primary" onClick={() => setShowForm((v) => !v)}>
          <i className="fa-solid fa-plus" /> {showForm ? 'Cancelar' : 'Nuevo'}
        </button>
      </div>

      {showForm && (
        <form className="card" onSubmit={handleCreate}>
          <div className="form-row">
            <label>
              Codigo (3 digitos)
              <input name="code" required maxLength={3} minLength={3} placeholder="002" />
            </label>
            <label>
              Informacion adicional
              <input name="description" placeholder="Opcional" />
            </label>
          </div>
          <button type="submit" className="primary">
            Crear
          </button>
        </form>
      )}

      {establishment && (
        <table className="data-table" style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th>Punto emision</th>
              {Object.values(DOCUMENT_LABELS).map((label) => (
                <th key={label}>{label}</th>
              ))}
              <th>Informacion adicional</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {establishment.emission_points.map((point) => (
              <tr key={point.id}>
                <td>{point.code}</td>
                {Object.keys(DOCUMENT_LABELS).map((code) => (
                  <td key={code}>{point.sequences[code as keyof typeof point.sequences]}</td>
                ))}
                <td>{point.description ?? '-'}</td>
                <td>
                  <span className={`badge ${point.is_active ? 'authorized' : 'rejected'}`}>
                    {point.is_active ? 'ACTIVO' : 'INACTIVO'}
                  </span>
                </td>
                <td>
                  <button type="button" onClick={() => toggleActive(point.id, point.is_active)}>
                    {point.is_active ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
