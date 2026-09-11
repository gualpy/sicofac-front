import { useEffect, useState, type FormEvent } from 'react'
import {
  listCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  type Customer,
} from '../api/customers'
import { useCompany } from '../company/CompanyContext'

function matchesSearch(customer: Customer, term: string): boolean {
  const needle = term.trim().toLowerCase()
  if (!needle) return true

  const haystacks = [
    customer.name,
    customer.identification_number,
    `${customer.identification_type} ${customer.identification_number}`,
    customer.email ?? '',
    customer.phone ?? '',
  ]

  return haystacks.some((value) => value.toLowerCase().includes(needle))
}

export function CustomersPage() {
  const { company } = useCompany()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)

  useEffect(() => {
    if (company) refresh(company.id, 1)
  }, [company])

  useEffect(() => {
    if (openMenuId === null) return
    function handleClickOutside(event: MouseEvent) {
      if (!(event.target as HTMLElement).closest('.row-menu')) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openMenuId])

  function refresh(companyId: number, pageToLoad: number) {
    setLoading(true)
    listCustomers(companyId, pageToLoad)
      .then((result) => {
        setCustomers(result.data)
        setPage(result.current_page)
        setLastPage(result.last_page)
        setTotal(result.total)
      })
      .catch(() => setError('No se pudo cargar los clientes.'))
      .finally(() => setLoading(false))
  }

  function openCreateForm() {
    setEditingCustomer(null)
    setShowForm(true)
    setError(null)
  }

  function openEditForm(customer: Customer) {
    setEditingCustomer(customer)
    setShowForm(true)
    setError(null)
    setOpenMenuId(null)
  }

  function closeForm() {
    setShowForm(false)
    setEditingCustomer(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!company) return
    setError(null)
    const form = new FormData(event.currentTarget)
    const payload = {
      name: String(form.get('name')),
      identification_type: String(form.get('identification_type')),
      identification_number: String(form.get('identification_number')),
      email: String(form.get('email') || '') || undefined,
      phone: String(form.get('phone') || '') || undefined,
      address: String(form.get('address') || '') || undefined,
    }

    try {
      if (editingCustomer) {
        await updateCustomer(company.id, editingCustomer.id, payload)
      } else {
        await createCustomer(company.id, payload)
      }
      closeForm()
      refresh(company.id, editingCustomer ? page : 1)
    } catch {
      setError(
        editingCustomer
          ? 'No se pudo actualizar el cliente. Revisa que la identificacion no este repetida.'
          : 'No se pudo crear el cliente. Revisa que la identificacion no este repetida.',
      )
    }
  }

  async function handleDelete(customer: Customer) {
    if (!company) return
    setOpenMenuId(null)
    if (!window.confirm(`Eliminar a "${customer.name}"? Esta accion no se puede deshacer.`)) return

    setError(null)
    setDeletingId(customer.id)
    try {
      await deleteCustomer(company.id, customer.id)
      refresh(company.id, page)
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(
        message ??
          'No se pudo eliminar el cliente. Verifica que no tenga facturas asociadas.',
      )
    } finally {
      setDeletingId(null)
    }
  }

  if (!company) return null

  const filteredCustomers = customers.filter((customer) => matchesSearch(customer, search))

  return (
    <div className="page">
      <div className="page-header">
        <h1>Clientes</h1>
        <button type="button" className="primary" onClick={() => (showForm ? closeForm() : openCreateForm())}>
          {showForm ? 'Cancelar' : 'Nuevo cliente'}
        </button>
      </div>

      {error && <p role="alert">{error}</p>}

      <div className="search-field" style={{ marginBottom: 16 }}>
        <div className="search-input">
          <i className="fa-solid fa-magnifying-glass" />
          <input
            placeholder="Buscar por nombre, identificacion, email o telefono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {showForm && (
        <form className="card" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>
              Nombre / Razon social
              <input name="name" defaultValue={editingCustomer?.name ?? ''} required />
            </label>
            <label>
              Email
              <input name="email" type="email" defaultValue={editingCustomer?.email ?? ''} />
            </label>
          </div>
          <div className="form-row">
            <label>
              Tipo identificacion
              <select name="identification_type" defaultValue={editingCustomer?.identification_type ?? '05'}>
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
                defaultValue={editingCustomer?.identification_number ?? ''}
                required
                maxLength={20}
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Telefono
              <input name="phone" defaultValue={editingCustomer?.phone ?? ''} />
            </label>
            <label>
              Direccion
              <input name="address" defaultValue={editingCustomer?.address ?? ''} />
            </label>
          </div>
          <button type="submit" className="primary">
            {editingCustomer ? 'Guardar cambios' : 'Crear'}
          </button>
        </form>
      )}

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Identificacion</th>
                <th>Email</th>
                <th>Telefono</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.name}</td>
                  <td>
                    {customer.identification_type} {customer.identification_number}
                  </td>
                  <td>{customer.email ?? '-'}</td>
                  <td>{customer.phone ?? '-'}</td>
                  <td>
                    <div className="row-menu">
                      <button
                        type="button"
                        className="row-menu-trigger"
                        aria-label="Acciones"
                        onClick={() => setOpenMenuId((id) => (id === customer.id ? null : customer.id))}
                      >
                        <i className="fa-solid fa-ellipsis-vertical" />
                      </button>
                      {openMenuId === customer.id && (
                        <div className="row-menu-dropdown">
                          <button type="button" onClick={() => openEditForm(customer)}>
                            <i className="fa-solid fa-pen" /> Editar
                          </button>
                          <button
                            type="button"
                            className="danger"
                            disabled={deletingId === customer.id}
                            onClick={() => handleDelete(customer)}
                          >
                            <i className="fa-solid fa-trash" /> Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    {search ? 'Ningun cliente coincide con la busqueda.' : 'No hay clientes todavia.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {lastPage > 1 && (
            <div className="invoice-actions-bar" style={{ justifyContent: 'center' }}>
              <button type="button" disabled={page <= 1} onClick={() => company && refresh(company.id, page - 1)}>
                <i className="fa-solid fa-chevron-left" />
              </button>
              <span style={{ alignSelf: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                Pagina {page} de {lastPage} ({total} clientes)
              </span>
              <button
                type="button"
                disabled={page >= lastPage}
                onClick={() => company && refresh(company.id, page + 1)}
              >
                <i className="fa-solid fa-chevron-right" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
