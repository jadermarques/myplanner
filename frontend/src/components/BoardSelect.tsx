import { Board } from '../services/api'

interface BoardSelectProps {
  boards: Board[]
  value: string
  onChange: (boardId: string) => void
}

export default function BoardSelect({ boards, value, onChange }: BoardSelectProps) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-label="Board">
      {boards.map((board) => (
        <option key={board.id} value={board.id}>
          {board.name}
        </option>
      ))}
    </select>
  )
}
