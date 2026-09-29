import type { FormEvent } from 'react'
import type { CreateCustomerPayload } from '../api/customers'

export type CustomerFormValues = {
  name?: string | null
  identification_type?: string | null
  identification_number?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
}

type Props = {
  initialValues?: CustomerFormValues
  submitLabel?: string
  submitting?: boolean
  error?: string | null
  onSubmit: (payload: CreateCustomerPayload) => void
  onCancel?: () => void
}

/**
 * Plain presentational Customer create/edit form, shared by CustomersPage
 * and the POS quick-create drawer. Deliberately knows nothing about POS,
 * carts, or any external identification-lookup provider — a future
 * lookupIdentification() result would feed `initialValues` from whichever
 * caller wires it, never live inside this component.
 */
export function CustomerForm({
  initialValues,
  submitLabel = 'Crear',
  submitting = false,
  error,
  onSubmit,
  onCancel,
}: Props) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    onSubmit({
      name: String(form.get('name')),
      identification_type: String(form.get('identification_type')),
      identification_number: String(form.get('identification_number')),
      email: String(form.get('email') || '') || undefined,
      phone: String(form.get('phone') || '') || undefined,
      address: String(form.get('address') || '') || undefined,
    })
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      {error && <p role="alert">{error}</p>}
      <div className="form-row">
        <label>
          Nombre / Razon social
          <input name="name" defaultValue={initialValues?.name ?? ''} required />
        </label>
        <label>
          Email
          <input name="email" type="email" defaultValue={initialValues?.email ?? ''} />
        </label>
      </div>
      <div className="form-row">
        <label>
          Tipo identificacion
          <select name="identification_type" defaultValue={initialValues?.identification_type ?? '05'}>
            <option value="04">RUC</option>
            <option value="05">Cedula</option>
            <option value="06">Pasaporte</option>
            <option value="07">Consumidor final</option>
          </select>
        </label>
        <label>
          Numero identificacion
          <input
            name="identification_number"
            defaultValue={initialValues?.identification_number ?? ''}
            required
            maxLength={20}
          />
        </label>
      </div>
      <div className="form-row">
        <label>
          Telefono
          <input name="phone" defaultValue={initialValues?.phone ?? ''} />
        </label>
        <label>
          Direccion
          <input name="address" defaultValue={initialValues?.address ?? ''} />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" className="primary" disabled={submitting}>
          {submitting ? 'Guardando...' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={submitting}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
