import { CustomFieldOption } from '../services/api'

interface PrioritySelectProps {
  options: CustomFieldOption[]
  value: string
  onChange: (priority: string) => void
  onClear: () => void
}

/**
 * Prioridade como combobox de escolha única (013/FR-001), alimentada pelas opções do campo
 * personalizado "Prioridade" do board. O estado vazio é "sem prioridade" e NÃO aparece na lista;
 * "limpar prioridade" devolve ao vazio depois de escolher.
 */
export default function PrioritySelect({ options, value, onChange, onClear }: PrioritySelectProps) {
  return (
    <div className="field">
      <label className="field__label" htmlFor="priority">
        Prioridade
      </label>
      <select
        id="priority"
        className="input input--select"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="" disabled hidden />
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.value}
          </option>
        ))}
      </select>
      {value && (
        <div className="desc-actions">
          <button type="button" className="desc-action" onClick={onClear}>
            limpar prioridade
          </button>
        </div>
      )}
    </div>
  )
}
