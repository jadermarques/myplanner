import { Board } from '../services/api'

interface BoardSelectProps {
  boards: Board[]
  value: string
  onChange: (boardId: string) => void
  loading?: boolean
}

/**
 * Chip compacto com o board atual — fica no cabeçalho, fora do caminho da
 * digitação, e mantém o picker nativo (rápido e acessível).
 */
export default function BoardSelect({ boards, value, onChange, loading = false }: BoardSelectProps) {
  if (boards.length === 0) {
    return (
      <span className="board-chip board-chip--empty">
        {loading ? 'Carregando board…' : 'Sem board'}
      </span>
    )
  }

  return (
    <div className="board-chip">
      <select
        className="board-chip__select"
        aria-label="Board"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {boards.map((board) => (
          <option key={board.id} value={board.id}>
            {board.name}
          </option>
        ))}
      </select>
      <span className="board-chip__caret" aria-hidden="true">
        ▾
      </span>
    </div>
  )
}
