const PRIORITY_LABELS = ['Muito alta', 'Alta', 'Média', 'Baixa', 'Muito baixa']

interface PrioritySelectProps {
  value: string
  onChange: (priority: string) => void
}

/**
 * Escolha direta: todas as opções visíveis e **1 toque** (a lista suspensa
 * anterior custava 2). Rádios nativos preservam a navegação por teclado.
 */
export default function PrioritySelect({ value, onChange }: PrioritySelectProps) {
  const options = [
    { label: 'Sem prioridade', value: '' },
    ...PRIORITY_LABELS.map((label) => ({ label, value: label })),
  ]

  return (
    <div className="chips" role="radiogroup" aria-label="Prioridade">
      {options.map((option) => (
        <label
          key={option.label}
          className={value === option.value ? 'chip chip--on' : 'chip'}
        >
          <input
            type="radio"
            name="priority"
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          {option.label}
        </label>
      ))}
    </div>
  )
}
