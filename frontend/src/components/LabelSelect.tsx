import { Label } from '../services/api'

const TRELLO_COLORS: Record<string, string> = {
  green: '#61bd4f',
  yellow: '#f2d600',
  orange: '#ff9f1a',
  red: '#eb5a46',
  purple: '#c377e0',
  blue: '#0079bf',
  sky: '#00c2e0',
  lime: '#51e898',
  pink: '#ff78cb',
  black: '#344563',
}

const NEUTRAL_COLOR = '#8590a2'

/**
 * Trello colour name → hex. The colour is decorative: the chip text is the label name, so an
 * unknown colour (or a new palette variant) just falls back to a neutral grey.
 */
export function labelColor(color: string): string {
  const base = color.replace(/_(dark|light)$/, '')
  return TRELLO_COLORS[base] ?? NEUTRAL_COLOR
}

interface LabelSelectProps {
  labels: Label[]
  value: string
  onChange: (label: string) => void
}

/**
 * Escolha direta, igual à prioridade: todas as etiquetas do board visíveis e **1 toque**;
 * "Sem etiqueta" é o estado inicial e sempre existe.
 */
export default function LabelSelect({ labels, value, onChange }: LabelSelectProps) {
  const options = [{ name: '', color: '' }, ...labels]

  return (
    <div className="chips" role="radiogroup" aria-label="Etiqueta">
      {options.map((option) => (
        <label
          key={option.name || 'sem-etiqueta'}
          className={value === option.name ? 'chip chip--on' : 'chip'}
        >
          <input
            type="radio"
            name="label"
            value={option.name}
            checked={value === option.name}
            onChange={() => onChange(option.name)}
          />
          {option.color ? (
            <span
              className="chip__dot"
              style={{ background: labelColor(option.color) }}
              aria-hidden="true"
            />
          ) : null}
          {option.name || 'Sem etiqueta'}
        </label>
      ))}
    </div>
  )
}
