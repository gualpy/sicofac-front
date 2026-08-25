import { useEffect, useState, type FormEvent } from 'react'
import { listCustomers, createCustomer, type Customer } from '../api/customers'
import { useCompany } from '../company/CompanyContext'

export function CustomersPage() {
  const { company } = useCompany()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    if (company) refresh(company.id)
  }, [company])

  function refresh(companyId: number) {
    setLoading(true)
    listCustomers(companyId)
      .then(setCustomers)
      .catch(() => setError('No se pudo cargar los clientes.'))
      .finally(() => setLoading(false))
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!company) return
    setError(null)
    const form = new FormData(event.currentTarget)

    try {
      await createCustomer(company.id, {
        name: String(form.get('name')),
        identification_type: String(form.get('identification_type')),
        identification_number: String(form.get('identification_number')),
        email: String(form.get('email') || '') || undefined,
        phone: String(form.get('phone') || '') || undefined,
        address: String(form.get('address') || '') || undefined,
      })
      setShowForm(false)
      refresh(company.id)
    } catch {
      setError('No se pudo crear el cliente. Revisa que la identificacion no este repetida.')
    }
  }

  if (!company) return null

  return (
    <div className="page">
      <div className="page-header">
        <h1>Clientes</h1>
        <button type="button" className="primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancelar' : 'Nuevo cliente'}
        </button>
      </div>

      {error && <p role="alert">{error}</p>}

      {showForm && (
        <form className="card" onSubmit={handleCreate}>
          <div className="form-row">
            <label>
              Nombre / Razon social
              <input name="name" required />
            </label>
            <label>
              Email
              <input name="email" type="email" />
            </label>
          </div>
          <div className="form-row">
            <label>
              Tipo identificacion
              <select name="identification_type" defaultValue="05">
                <option value="04">RUC</option>
                <option value="05">Cedula</option>
                <option value="06">Pasaporte</option>
                <option value="07">Consumidor final</option>
              </select>
            </label>
            <label>
              Numero identificacion
              <input name="identification_number" required maxLength={20} />
            </label>
          </div>
          <div className="form-row">
            <label>
              Telefono
              <input name="phone" />
            </label>
            <label>
              Direccion
              <input name="address" />
            </label>
          </div>
          <button type="submit" className="primary">
            Crear
          </button>
        </form>
      )}

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Identificacion</th>
              <th>Email</th>
              <th>Telefono</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.name}</td>
                <td>
                  {customer.identification_type} {customer.identification_number}
                </td>
                <td>{customer.email ?? '-'}</td>
                <td>{customer.phone ?? '-'}</td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={4}>No hay clientes todavia.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}
