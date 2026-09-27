import { BoardList } from '../services/api'

interface ListSelectProps {
  lists: BoardList[]
  value: string
  onChange: (listId: string) => void
}

/**
 * Lista de destino do card — último campo do formulário.
 *
 * Escolha única e discreta: o padrão (primeira lista do board) já vem correto, então o controle
 * precisa ser silencioso antes de ser rápido. Sem listas carregadas, o campo não existe e o
 * servidor decide a primeira lista (R8).
 */
export default function ListSelect({ lists, value, onChange }: ListSelectProps) {
  return (
    <div className="field">
      <label className="field__label" htmlFor="destination-list">
        Lista de destino
      </label>
      <select
        id="destination-list"
        className="input input--select"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {lists.map((list) => (
          <option key={list.id} value={list.id}>
            {list.name}
          </option>
        ))}
      </select>
    </div>
  )
}
