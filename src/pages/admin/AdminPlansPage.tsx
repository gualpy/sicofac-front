import { useEffect, useState, type FormEvent } from 'react'
import { isAxiosError } from 'axios'
import {
  createAdminPlan,
  deleteAdminPlan,
  listAdminPlans,
  updateAdminPlan,
  type PlanPayload,
} from '../../api/admin'
import type { Plan } from '../../api/plans'

const EMPTY_FORM: PlanPayload = {
  slug: '',
  name: '',
  price_cents: 0,
  monthly_document_limit: null,
  max_establishments: null,
  max_users: null,
  is_public: true,
  sort_order: 0,
}

function toYearlyPrice(cents: number): string {
  return (cents / 100).toFixed(2)
}

export function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | 'new' | null>(null)
  const [form, setForm] = useState<PlanPayload>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      setPlans(await listAdminPlans())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function startCreate() {
    setForm(EMPTY_FORM)
    setError(null)
    setEditingId('new')
  }

  function startEdit(plan: Plan) {
    setForm({
      slug: plan.slug,
      name: plan.name,
      price_cents: plan.price_cents,
      monthly_document_limit: plan.monthly_document_limit,
      max_establishments: plan.max_establishments,
      max_users: plan.max_users,
      is_public: plan.is_public ?? true,
      sort_order: plan.sort_order ?? 0,
    })
    setError(null)
    setEditingId(plan.id)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      if (editingId === 'new') {
        await createAdminPlan(form)
      } else if (editingId !== null) {
        await updateAdminPlan(editingId, form)
      }
      setEditingId(null)
      await load()
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 422) {
        const firstError = Object.values(err.response.data?.errors ?? {})[0] as string[] | undefined
        setError(firstError?.[0] ?? 'Revisa los datos.')
        return
      }
      setError('No se pudo guardar el plan.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(plan: Plan) {
    setError(null)
    try {
      await deleteAdminPlan(plan.id)
      await load()
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 409) {
        setError(err.response.data?.message ?? 'No se puede borrar este plan.');
        return
      }
      setError('No se pudo borrar el plan.')
    }
  }

  function limitField(label: string, value: number | null, onChange: (v: number | null) => void) {
    return (
      <label className="auth-field">
        <span className="auth-field-top">
          <span className="auth-field-label">{label}</span>
        </span>
        <input
          type="number"
          min={1}
          value={value ?? ''}
          placeholder="Vacio = ilimitado"
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        />
      </label>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Planes</h1>
        <button type="button" className="primary" onClick={startCreate}>
          Nuevo plan
        </button>
      </div>

      {error && editingId === null && <p role="alert">{error}</p>}

      {editingId !== null && (
        <form onSubmit={handleSubmit} className="plan-edit-form">
          <div className="auth-field-row">
            <label className="auth-field">
              <span className="auth-field-top">
                <span className="auth-field-label">Slug</span>
              </span>
              <input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                required
                disabled={editingId !== 'new'}
              />
            </label>
            <label className="auth-field">
              <span className="auth-field-top">
                <span className="auth-field-label">Nombre</span>
              </span>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            </label>
          </div>

          <div className="auth-field-row">
            <label className="auth-field">
              <span className="auth-field-top">
                <span className="auth-field-label">Precio anual (USD)</span>
              </span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={toYearlyPrice(form.price_cents)}
                onChange={(e) => setForm((f) => ({ ...f, price_cents: Math.round(Number(e.target.value) * 100) }))}
                required
              />
            </label>
            <label className="auth-field">
              <span className="auth-field-top">
                <span className="auth-field-label">Orden</span>
              </span>
              <input
                type="number"
                min={0}
                value={form.sort_order}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
              />
            </label>
          </div>

          <div className="auth-field-row">
            {limitField('Documentos/mes', form.monthly_document_limit, (v) =>
              setForm((f) => ({ ...f, monthly_document_limit: v })),
            )}
            {limitField('Establecimientos', form.max_establishments, (v) =>
              setForm((f) => ({ ...f, max_establishments: v })),
            )}
            {limitField('Usuarios', form.max_users, (v) => setForm((f) => ({ ...f, max_users: v })))}
          </div>

          <label className="auth-checkbox-row">
            <input
              type="checkbox"
              checked={form.is_public}
              onChange={(e) => setForm((f) => ({ ...f, is_public: e.target.checked }))}
            />
            <span>Publico (aparece en registro y landing). Si no, es solo venta asistida.</span>
          </label>

          {error && <p role="alert">{error}</p>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button type="button" className="btn-ghost" onClick={() => setEditingId(null)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Plan</th>
              <th>Precio/ano</th>
              <th>Docs/mes</th>
              <th>Establec.</th>
              <th>Usuarios</th>
              <th>Publico</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan.id}>
                <td>{plan.name}</td>
                <td>${toYearlyPrice(plan.price_cents)}</td>
                <td>{plan.monthly_document_limit ?? 'Ilimitado'}</td>
                <td>{plan.max_establishments ?? 'Ilimitado'}</td>
                <td>{plan.max_users ?? 'Ilimitado'}</td>
                <td>{plan.is_public ? 'Si' : 'No'}</td>
                <td style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn-ghost" onClick={() => startEdit(plan)}>
                    Editar
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => handleDelete(plan)}>
                    Borrar
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
