import { useEffect, useState, type FormEvent } from 'react'
import {
  listProducts,
  createProduct,
  deleteProduct,
  deleteAllProducts,
  downloadProductsExport,
  TAX_CODE_LABELS,
  type Product,
  type TaxCode,
} from '../api/products'
import { useCompany } from '../company/CompanyContext'

export function ProductsPage() {
  const { company } = useCompany()
  const [products, setProducts] = useState<Product[]>([])
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [codeFilter, setCodeFilter] = useState('')
  const [nameFilter, setNameFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (company) refresh(company.id, 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company])

  function refresh(companyId: number, pageToLoad: number) {
    setLoading(true)
    listProducts(companyId, { code: codeFilter || undefined, name: nameFilter || undefined, page: pageToLoad })
      .then((result) => {
        setProducts(result.data)
        setPage(result.current_page)
        setLastPage(result.last_page)
        setTotal(result.total)
      })
      .catch(() => setError('No se pudo cargar los productos.'))
      .finally(() => setLoading(false))
  }

  function handleSearch(event: FormEvent) {
    event.preventDefault()
    if (company) refresh(company.id, 1)
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!company) return
    setError(null)
    const form = new FormData(event.currentTarget)

    try {
      await createProduct(company.id, {
        code: String(form.get('code')),
        auxiliary_code: String(form.get('auxiliary_code') || '') || undefined,
        name: String(form.get('name')),
        unit_price: Number(form.get('unit_price')),
        tax_rate: Number(form.get('tax_rate')),
        tax_code: form.get('tax_code') as TaxCode,
        ice_rate: Number(form.get('ice_rate') || 0),
      })
      setShowForm(false)
      refresh(company.id, 1)
    } catch {
      setError('No se pudo crear el producto. Revisa que el codigo no este repetido.')
    }
  }

  async function handleDelete(productId: number) {
    if (!company) return
    if (!confirm('Eliminar este producto?')) return
    try {
      await deleteProduct(company.id, productId)
      refresh(company.id, page)
    } catch {
      setError('No se pudo eliminar (puede estar referenciado por una factura).')
    }
  }

  async function handleDeleteAll() {
    if (!company) return
    if (!confirm('Esto elimina TODOS los productos que no esten usados en facturas. Continuar?')) return
    setBusy(true)
    try {
      const result = await deleteAllProducts(company.id)
      setError(
        result.skipped > 0
          ? `Se eliminaron ${result.deleted}. Se omitieron ${result.skipped} por estar referenciados en facturas.`
          : null,
      )
      refresh(company.id, 1)
    } catch {
      setError('No se pudo completar la eliminacion.')
    } finally {
      setBusy(false)
    }
  }

  if (!company) return null

  return (
    <div className="page">
      <div className="page-header">
        <h1>Mis productos y servicios</h1>
      </div>

      {error && <p role="alert">{error}</p>}

      <form className="card" onSubmit={handleSearch}>
        <div className="form-row">
          <label>
            Codigo
            <input value={codeFilter} onChange={(e) => setCodeFilter(e.target.value)} />
          </label>
          <label>
            Nombre
            <input value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} />
          </label>
        </div>
        <div className="invoice-actions-bar" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="primary" onClick={() => setShowForm((v) => !v)}>
              <i className="fa-solid fa-plus" /> {showForm ? 'Cancelar' : 'Nuevo'}
            </button>
            <button type="button" className="danger" disabled={busy} onClick={handleDeleteAll}>
              <i className="fa-solid fa-trash" /> Eliminar todos los productos
            </button>
          </div>
          <button type="submit">
            <i className="fa-solid fa-magnifying-glass" /> Buscar
          </button>
        </div>
      </form>

      {showForm && (
        <form className="card" onSubmit={handleCreate}>
          <div className="form-row">
            <label>
              Codigo principal
              <input name="code" required maxLength={50} />
            </label>
            <label>
              Codigo auxiliar
              <input name="auxiliary_code" maxLength={50} />
            </label>
          </div>
          <label>
            Nombre
            <input name="name" required />
          </label>
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

      <span className="section-label">Lista de productos ({total})</span>
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Codigo principal</th>
                <th>Codigo auxiliar</th>
                <th>Nombre</th>
                <th>Valor</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.code}</td>
                  <td>{product.auxiliary_code ?? '-'}</td>
                  <td>{product.name}</td>
                  <td>${product.unit_price}</td>
                  <td>
                    <button type="button" className="icon-btn delete" onClick={() => handleDelete(product.id)}>
                      <i className="fa-solid fa-trash" />
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={5}>No hay productos todavia.</td>
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
                {page} de {lastPage}
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

          <p>
            <a href="#" onClick={(e) => { e.preventDefault(); downloadProductsExport(company.id) }}>
              <i className="fa-solid fa-download" /> Descargar reporte
            </a>
          </p>
        </>
      )}
    </div>
  )
}
