import { useEffect, useState, type FormEvent } from 'react'
import { listProducts, createProduct, TAX_CODE_LABELS, type Product, type TaxCode } from '../api/products'
import { useCompany } from '../company/CompanyContext'

export function ProductsPage() {
  const { company } = useCompany()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    if (company) refresh(company.id)
  }, [company])

  function refresh(companyId: number) {
    setLoading(true)
    listProducts(companyId)
      .then(setProducts)
      .catch(() => setError('No se pudo cargar los productos.'))
      .finally(() => setLoading(false))
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!company) return
    setError(null)
    const form = new FormData(event.currentTarget)

    try {
      await createProduct(company.id, {
        code: String(form.get('code')),
        name: String(form.get('name')),
        unit_price: Number(form.get('unit_price')),
        tax_rate: Number(form.get('tax_rate')),
        tax_code: form.get('tax_code') as TaxCode,
        ice_rate: Number(form.get('ice_rate') || 0),
      })
      setShowForm(false)
      refresh(company.id)
    } catch {
      setError('No se pudo crear el producto. Revisa que el codigo no este repetido.')
    }
  }

  if (!company) return null

  return (
    <div className="page">
      <div className="page-header">
        <h1>Productos</h1>
        <button type="button" className="primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancelar' : 'Nuevo producto'}
        </button>
      </div>

      {error && <p role="alert">{error}</p>}

      {showForm && (
        <form className="card" onSubmit={handleCreate}>
          <div className="form-row">
            <label>
              Codigo
              <input name="code" required maxLength={50} />
            </label>
            <label>
              Nombre
              <input name="name" required />
            </label>
          </div>
          <div className="form-row">
            <label>
              Precio unitario
              <input name="unit_price" type="number" step="0.01" min="0" required />
            </label>
            <label>
              Tarifa IVA
              <select name="tax_code" defaultValue="15">
                {Object.entries(TAX_CODE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="form-row">
            <label>
              IVA %
              <input name="tax_rate" type="number" step="0.01" min="0" max="100" defaultValue={15} required />
            </label>
            <label>
              ICE %
              <input name="ice_rate" type="number" step="0.01" min="0" max="100" defaultValue={0} />
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
              <th>Codigo</th>
              <th>Nombre</th>
              <th>Precio</th>
              <th>Tarifa</th>
              <th>ICE</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.code}</td>
                <td>{product.name}</td>
                <td>{product.unit_price}</td>
                <td>{TAX_CODE_LABELS[product.tax_code] ?? `${product.tax_rate}%`}</td>
                <td>{Number(product.ice_rate) > 0 ? `${product.ice_rate}%` : '-'}</td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={5}>No hay productos todavia.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}
