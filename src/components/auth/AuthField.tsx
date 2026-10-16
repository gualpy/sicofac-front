import { useState, type ReactNode } from 'react'

type Props = {
  label: string
  icon: string
  type?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  minLength?: number
  maxLength?: number
  autoComplete?: string
  rightSlot?: ReactNode
}

export function AuthField({
  label,
  icon,
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
  minLength,
  maxLength,
  autoComplete,
  rightSlot,
}: Props) {
  const [reveal, setReveal] = useState(false)
  const isPassword = type === 'password'
  const resolvedType = isPassword && reveal ? 'text' : type

  return (
    <label className="auth-field">
      <span className="auth-field-top">
        <span className="auth-field-label">{label}</span>
        {rightSlot}
      </span>
      <span className="auth-field-input">
        <i className={`fa-solid ${icon}`} />
        <input
          type={resolvedType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          maxLength={maxLength}
          autoComplete={autoComplete}
        />
        {isPassword && (
          <button
            type="button"
            className="auth-field-toggle"
            onClick={() => setReveal((v) => !v)}
            tabIndex={-1}
            aria-label={reveal ? 'Ocultar contrasena' : 'Mostrar contrasena'}
          >
            <i className={`fa-solid ${reveal ? 'fa-eye-slash' : 'fa-eye'}`} />
          </button>
        )}
      </span>
    </label>
  )
}
