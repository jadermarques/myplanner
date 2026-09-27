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
  value: string[]
  onToggle: (label: string) => void
  onClear: () => void
}

/**
 * Escolha múltipla: cada etiqueta do board é uma caixa de seleção — 1 toque liga, outro desliga,
 * e uma nunca mexe nas outras (FR-001). "limpar" aparece só quando há algo marcado, para desmarcar
 * tudo de uma vez (FR-003); nenhuma marcada significa "sem etiqueta" (FR-004).
 */
export default function LabelSelect({ labels, value, onToggle, onClear }: LabelSelectProps) {
  return (
    <div className="chips" role="group" aria-label="Etiqueta">
      {labels.map((option) => {
        const chosen = value.includes(option.name)
        return (
          <label key={option.name} className={chosen ? 'chip chip--on' : 'chip'}>
            <input
              type="checkbox"
              name="label"
              value={option.name}
              checked={chosen}
              onChange={() => onToggle(option.name)}
            />
            {option.color ? (
              <span
                className="chip__dot"
                style={{ background: labelColor(option.color) }}
                aria-hidden="true"
              />
            ) : null}
            {option.name}
          </label>
        )
      })}
      {value.length > 0 && (
        <button type="button" className="chip chip--ghost" onClick={onClear}>
          limpar
        </button>
      )}
    </div>
  )
}
