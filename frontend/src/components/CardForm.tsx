import { useState } from 'react'
import BoardSelect from './BoardSelect'
import PrioritySelect from './PrioritySelect'
import { Board, createCard } from '../services/api'

/** Same limit the domain enforces (backend is the authority). */
const MAX_DESCRIPTION_CHARS = 2000

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
  const [description, setDescription] = useState('')
  const [descriptionOpen, setDescriptionOpen] = useState(false)
  const [titleError, setTitleError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)

  const descriptionTooLong = description.length > MAX_DESCRIPTION_CHARS

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setTitleError('O título é obrigatório.')
      setSuccess(false)
      return
    }
    setTitleError(null)
    if (descriptionTooLong) return
    setSaveError(null)
    setSaving(true)
    try {
      await createCard(
        title.trim(),
        selectedBoardId,
        priority || undefined,
        description.trim() || undefined,
      )
      setSuccess(true)
      setTitle('')
      setDescription('')
      setDescriptionOpen(false)
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

      {descriptionOpen ? (
        <div className="description-field">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição (opcional)"
            aria-label="Descrição"
            rows={4}
            autoFocus
            disabled={saving}
          />
          <span className={descriptionTooLong ? 'counter over' : 'counter'} aria-live="polite">
            {description.length}/{MAX_DESCRIPTION_CHARS}
          </span>
          {descriptionTooLong && (
            <p className="error" role="alert">
              A descrição passa de {MAX_DESCRIPTION_CHARS} caracteres. Reduza para salvar.
            </p>
          )}
        </div>
      ) : (
        <button
          type="button"
          className="link-button"
          onClick={() => setDescriptionOpen(true)}
          disabled={saving}
        >
          adicionar descrição
        </button>
      )}

      <button type="submit" disabled={saving || loading || !selectedBoardId || descriptionTooLong}>
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
