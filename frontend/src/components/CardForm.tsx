import { useState } from 'react'
import BoardSelect from './BoardSelect'
import PrioritySelect from './PrioritySelect'
import { Board, createCard } from '../services/api'

interface CardFormProps {
  boards: Board[]
  loading: boolean
  error: string | null
  selectedBoardId: string
  onSelectBoard: (boardId: string) => void
}

export default function CardForm({
  boards,
  loading,
  error,
  selectedBoardId,
  onSelectBoard,
}: CardFormProps) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('')
  const [titleError, setTitleError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setTitleError('O título é obrigatório.')
      setSuccess(false)
      return
    }
    setTitleError(null)
    setSaveError(null)
    setSaving(true)
    try {
      await createCard(title.trim(), selectedBoardId, priority || undefined)
      setSuccess(true)
      setTitle('')
    } catch (err) {
      setSuccess(false)
      setSaveError(err instanceof Error ? err.message : 'Erro ao salvar o card. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card-form" aria-label="Inserir card">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Título do card"
        aria-label="Título"
        maxLength={512}
        disabled={saving}
      />
      {titleError && (
        <p className="error" role="alert">
          {titleError}
        </p>
      )}

      <BoardSelect boards={boards} value={selectedBoardId} onChange={onSelectBoard} />
      {loading && <p>Carregando boards…</p>}
      {error && <p className="error">{error}</p>}

      <PrioritySelect value={priority} onChange={setPriority} />

      <button type="submit" disabled={saving || loading || !selectedBoardId}>
        {saving ? 'Salvando…' : 'Salvar'}
      </button>

      {saveError && (
        <p className="error" role="alert">
          {saveError}
        </p>
      )}
      {success && (
        <p className="success" role="status">
          Card criado!
        </p>
      )}
    </form>
  )
}
