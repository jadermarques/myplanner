import { CustomField } from '../services/api'

interface CustomFieldsProps {
  fields: CustomField[]
  values: Record<string, string>
  onChange: (fieldId: string, value: string) => void
}

/**
 * Campos personalizados do board (013/FR-006), cada um no seu tipo e com os valores do Trello.
 * A gravação é best-effort (R9): o valor viaja como string e o servidor o mapeia pelo tipo.
 */
export default function CustomFields({ fields, values, onChange }: CustomFieldsProps) {
  return (
    <>
      {fields.map((field) => {
        const value = values[field.id] ?? ''
        return (
          <div className="field" key={field.id}>
            <label className="field__label" htmlFor={`cf-${field.id}`}>
              {field.name}
            </label>

            {field.type === 'list' && (
              <select
                id={`cf-${field.id}`}
                className="input input--select"
                value={value}
                onChange={(event) => onChange(field.id, event.target.value)}
              >
                <option value="" disabled hidden />
                {field.options.map((option) => (
                  <option key={option.id} value={option.value}>
                    {option.value}
                  </option>
                ))}
              </select>
            )}

            {field.type === 'checkbox' && (
              <label className="chip">
                <input
                  id={`cf-${field.id}`}
                  type="checkbox"
                  checked={value === 'true'}
                  onChange={(event) => onChange(field.id, event.target.checked ? 'true' : 'false')}
                />
                {field.name}
              </label>
            )}

            {field.type === 'number' && (
              <input
                id={`cf-${field.id}`}
                className="input"
                type="number"
                value={value}
                onChange={(event) => onChange(field.id, event.target.value)}
              />
            )}

            {field.type === 'date' && (
              <input
                id={`cf-${field.id}`}
                className="input"
                type="date"
                value={value}
                onChange={(event) => onChange(field.id, event.target.value)}
              />
            )}

            {field.type === 'text' && (
              <input
                id={`cf-${field.id}`}
                className="input"
                type="text"
                value={value}
                onChange={(event) => onChange(field.id, event.target.value)}
              />
            )}
          </div>
        )
      })}
    </>
  )
}