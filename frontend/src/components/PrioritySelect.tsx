const PRIORITY_LABELS = ['Muito alta', 'Alta', 'Média', 'Baixa', 'Muito baixa']

interface PrioritySelectProps {
  value: string
  onChange: (priority: string) => void
}

export default function PrioritySelect({ value, onChange }: PrioritySelectProps) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-label="Prioridade">
      <option value="">Sem prioridade</option>
      {PRIORITY_LABELS.map((label) => (
        <option key={label} value={label}>
          {label}
        </option>
      ))}
    </select>
  )
}
