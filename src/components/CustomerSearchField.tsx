import { useEffect, useRef, useState } from 'react'
import { searchCustomers, type Customer } from '../api/customers'
import { useDebouncedValue } from '../hooks/useDebouncedValue'

type Props = {
  companyId: number
  onSelect: (customer: Customer) => void
}

export function CustomerSearchField({ companyId, onSelect }: Props) {
  const [term, setTerm] = useState('')
  const [results, setResults] = useState<Customer[]>([])
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const debouncedTerm = useDebouncedValue(term, 300)
  const boxRef = useRef<HTMLDivElement>(null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    if (debouncedTerm.trim().length < 1) {
      setResults([])
      return
    }
    const requestId = ++requestIdRef.current
    searchCustomers(companyId, debouncedTerm.trim())
      .then((data) => {
        if (requestIdRef.current === requestId) {
          setResults(data)
          setActiveIndex(-1)
        }
      })
      .catch(() => {
        if (requestIdRef.current === requestId) setResults([])
      })
  }, [companyId, debouncedTerm])

  function selectCustomer(customer: Customer) {
    onSelect(customer)
    setTerm('')
    setResults([])
    setOpen(false)
    setActiveIndex(-1)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((i) => (i + 1) % results.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((i) => (i - 1 + results.length) % results.length)
    } else if (event.key === 'Enter') {
      if (activeIndex >= 0) {
        event.preventDefault()
        selectCustomer(results[activeIndex])
      }
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="search-field" ref={boxRef}>
      <div className="search-input">
        <i className="fa-solid fa-magnifying-glass" />
        <input
          placeholder="Buscar por RUC o nombre"
          value={term}
          onChange={(e) => {
            setTerm(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
        />
      </div>
      {open && results.length > 0 && (
        <ul className="search-results">
          {results.map((customer, index) => (
            <li
              key={customer.id}
              className={index === activeIndex ? 'active' : undefined}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => selectCustomer(customer)}
            >
              <strong>{customer.name}</strong>
              <span>{customer.identification_number}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
