import { useEffect, useRef, useState } from 'react'
import CustomFields from './CustomFields'
import LabelSelect from './LabelSelect'
import ListSelect from './ListSelect'
import PrioritySelect from './PrioritySelect'
import { BoardList, CustomField, Label, createCard } from '../services/api'

/** Same limit the domain enforces (backend is the authority). */
const MAX_DESCRIPTION_CHARS = 2000

interface CardFormProps {
  selectedBoardId: string
  boardName: string
  boardsLoading: boolean
  boardsError: string | null
  labels: Label[]
  selectedLabels: string[]
  onToggleLabel: (label: string) => void
  onClearLabels: () => void
  lists: BoardList[]
  selectedListId: string
  onSelectList: (listId: string) => void
  priorityField: CustomField | null
  customFields: CustomField[]
}

/**
 * Captura rápida: o título já vem focado (o primeiro card não custa nenhum
 * toque preparatório), a prioridade é escolhida com um toque e a ação de salvar
 * fica na barra fixa, sempre alcançável. Depois do sucesso o foco volta ao
 * título, para lançar vários cards em série. A prioridade escolhida é mantida
 * entre cards (numa sequência de itens iguais isso economiza toques).
 */
export default function CardForm({
  selectedBoardId,
  boardName,
  boardsLoading,
  boardsError,
  labels,
  selectedLabels,
  onToggleLabel,
  onClearLabels,
  lists,
  selectedListId,
  onSelectList,
  priorityField,
  customFields,
}: CardFormProps) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('')
  const [description, setDescription] = useState('')
  const [descriptionOpen, setDescriptionOpen] = useState(false)
  const [titleError, setTitleError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [due, setDue] = useState('')
  const [dueReminder, setDueReminder] = useState(0)
  const [reminderOn, setReminderOn] = useState(false)
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({})
  const [fieldWarning, setFieldWarning] = useState<string | null>(null)
  const titleRef = useRef<HTMLInputElement | null>(null)

  const descriptionTooLong = description.length > MAX_DESCRIPTION_CHARS
  const canSave = !saving && Boolean(selectedBoardId) && !descriptionTooLong

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setTitleError('O título é obrigatório.')
      setSuccess(false)
      titleRef.current?.focus()
      return
    }
    setTitleError(null)
    if (descriptionTooLong) return
    // FR-006: a confirmação é sempre; o salvamento só acontece depois do diálogo.
    setConfirmOpen(true)
  }

  const doSave = async () => {
    setSaveError(null)
    setSaving(true)
    try {
      const customFieldEntries = Object.entries(customFieldValues).filter(([, value]) => value !== '')
      const result = await createCard({
        title: title.trim(),
        boardId: selectedBoardId,
        priority: priority || undefined,
        description: description.trim() || undefined,
        labels: selectedLabels.length ? selectedLabels : undefined,
        listId: selectedListId || undefined,
        due: due || undefined,
        dueReminder: due && reminderOn ? dueReminder : undefined,
        customFields: customFieldEntries.length
          ? customFieldEntries.map(([field_id, value]) => ({ field_id, value }))
          : undefined,
      })
      setSuccess(true)
      setTitle('')
      setDescription('')
      setDescriptionOpen(false)
      setDue('')
      setReminderOn(false)
      setCustomFieldValues({})
      setFieldWarning(
        result.unapplied.length
          ? `Card criado, mas não foi possível aplicar: ${result.unapplied.join(', ')}.`
          : null,
      )
    } catch (err) {
      setSuccess(false)
      setSaveError(err instanceof Error ? err.message : 'Erro ao salvar o card. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleConfirm = () => {
    setConfirmOpen(false)
    void doSave()
  }

  // FR-010: o foco volta ao título só depois de o botão ser reabilitado — um input desabilitado não
  // recebe foco, e o modal que acabou de fechar teria roubado o foco (autoFocus no Cancelar).
  useEffect(() => {
    if (success && !saving) {
      titleRef.current?.focus()
    }
  }, [success, saving])

  return (
    <form className="capture" onSubmit={handleSubmit} aria-label="Inserir card">
      <div className="field">
        <label className="field__label" htmlFor="card-title">
          Título
        </label>
        <input
          id="card-title"
          ref={titleRef}
          className="input input--title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="O que precisa ser feito?"
          maxLength={512}
          autoFocus
          disabled={saving}
          enterKeyHint="done"
        />
        {titleError && (
          <p className="msg msg--error" role="alert">
            {titleError}
          </p>
        )}
      </div>

      {priorityField && (
        <PrioritySelect
          options={priorityField.options}
          value={priority}
          onChange={setPriority}
          onClear={() => setPriority('')}
        />
      )}

      {labels.length > 0 && (
        <div className="field">
          <span className="field__label" aria-hidden="true">
            Etiqueta
          </span>
          <LabelSelect
            labels={labels}
            value={selectedLabels}
            onToggle={onToggleLabel}
            onClear={onClearLabels}
          />
        </div>
      )}

      {descriptionOpen ? (
        <div className="field">
          <label className="field__label" htmlFor="card-description">
            Descrição
          </label>
          <textarea
            id="card-description"
            className="input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Contexto, links, checklist… (opcional)"
            rows={4}
            autoFocus
            disabled={saving}
          />
          <div className="counter-row">
            <span
              className={descriptionTooLong ? 'counter counter--over' : 'counter'}
              aria-live="polite"
            >
              {description.length}/{MAX_DESCRIPTION_CHARS}
            </span>
          </div>
          {descriptionTooLong && (
            <p className="msg msg--error" role="alert">
              A descrição passa de {MAX_DESCRIPTION_CHARS} caracteres. Reduza para salvar.
            </p>
          )}
          <div className="desc-actions">
            <button
              type="button"
              className="desc-action"
              onClick={() => setDescriptionOpen(false)}
              disabled={saving}
            >
              voltar
            </button>
            <button
              type="button"
              className="desc-action desc-action--danger"
              onClick={() => {
                setDescription('')
                setDescriptionOpen(false)
              }}
              disabled={saving}
            >
              limpar descrição
            </button>
          </div>
        </div>
      ) : description.trim() ? (
        <div className="field">
          <span className="field__label" aria-hidden="true">
            Descrição
          </span>
          <button
            type="button"
            className="desc-summary"
            onClick={() => setDescriptionOpen(true)}
            disabled={saving}
          >
            <span className="desc-summary__text">{description}</span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="desc-open"
          onClick={() => setDescriptionOpen(true)}
          disabled={saving}
        >
          <span className="desc-open__plus" aria-hidden="true">
            +
          </span>
          adicionar descrição
        </button>
      )}

      {lists.length > 0 && (
        <ListSelect lists={lists} value={selectedListId} onChange={onSelectList} />
      )}

      <div className="field">
        <label className="field__label" htmlFor="due">
          Data de entrega
        </label>
        <input
          id="due"
          className="input"
          type="datetime-local"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          disabled={saving}
        />
        {due && (
          <div className="desc-actions">
            <button
              type="button"
              className="desc-action"
              onClick={() => {
                setDue('')
                setReminderOn(false)
              }}
              disabled={saving}
            >
              limpar data
            </button>
          </div>
        )}
      </div>

      {due && (
        <div className="field">
          <span className="field__label" aria-hidden="true">
            Lembrete
          </span>
          <label className="chip">
            <input
              type="checkbox"
              checked={reminderOn}
              onChange={(e) => setReminderOn(e.target.checked)}
            />
            Definir lembrete
          </label>
          {reminderOn && (
            <select
              className="input input--select"
              value={dueReminder}
              onChange={(e) => setDueReminder(Number(e.target.value))}
              aria-label="Quando lembrar"
            >
              <option value={0}>na hora da entrega</option>
              <option value={5}>5 minutos antes</option>
              <option value={10}>10 minutos antes</option>
              <option value={15}>15 minutos antes</option>
              <option value={60}>1 hora antes</option>
              <option value={120}>2 horas antes</option>
              <option value={1440}>1 dia antes</option>
              <option value={2880}>2 dias antes</option>
            </select>
          )}
        </div>
      )}

      {customFields.length > 0 && (
        <CustomFields
          fields={customFields}
          values={customFieldValues}
          onChange={(fieldId, value) =>
            setCustomFieldValues((current) => ({ ...current, [fieldId]: value }))
          }
        />
      )}

      {boardsLoading && <p className="msg msg--info">Carregando board…</p>}
      {boardsError && <p className="msg msg--error">{boardsError}</p>}
      {saveError && (
        <p className="msg msg--error" role="alert">
          {saveError}
        </p>
      )}
      {success && (
        <div className="toast">
          <p className="toast__text" role="status">
            Card criado!
          </p>
        </div>
      )}
      {fieldWarning && <p className="msg msg--info">{fieldWarning}</p>}

      <div className="action-bar">
        <button type="submit" className="button button--primary button--block" disabled={!canSave}>
          {saving ? 'Salvando…' : 'Salvar'}
        </button>
      </div>

      {confirmOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <div className="modal">
            <h2 id="confirm-title" className="modal__title">
              Confirmar inserção?
            </h2>
            <p className="modal__card">“{title.trim()}”</p>
            <p className="modal__board">no board {boardName}</p>
            <div className="modal__actions">
              <button type="button" className="button" onClick={() => setConfirmOpen(false)} autoFocus>
                Cancelar
              </button>
              <button type="button" className="button button--primary" onClick={handleConfirm}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  )
}
