import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { beforeEach, vi, type Mock } from 'vitest'
import CardForm from '../../src/components/CardForm'
import { createCard } from '../../src/services/api'

vi.mock('../../src/services/api', () => ({
  createCard: vi.fn(),
}))

const mockedCreateCard = createCard as Mock

const labels = [{ name: 'Casa', color: 'green' }]
const lists = [
  { id: 'list-1', name: 'A fazer' },
  { id: 'list-2', name: 'Em andamento' },
]

function renderForm(overrides: Partial<React.ComponentProps<typeof CardForm>> = {}) {
  return render(
    <CardForm
      selectedBoardId="b1"
      boardName="Pessoal"
      boardsLoading={false}
      boardsError={null}
      labels={labels}
      selectedLabels={[]}
      onToggleLabel={() => {}}
      onClearLabels={() => {}}
      lists={[]}
      selectedListId=""
      onSelectList={() => {}}
      priorityField={null}
      customFields={[]}
      {...overrides}
    />,
  )
}

const openDescription = () =>
  fireEvent.click(screen.getByRole('button', { name: 'adicionar descrição' }))

const saveAndConfirm = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
}

describe('CardForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the title field and Save button', () => {
    renderForm()
    expect(screen.getByLabelText('Título')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument()
  })

  it('shows an error when title is empty', async () => {
    renderForm()
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('O título é obrigatório.')
  })

  it('creates a card and shows success', async () => {
    mockedCreateCard.mockResolvedValue({ card_id: 'card-1', unapplied: [] })
    renderForm()
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Comprar leite' } })
    saveAndConfirm()
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Card criado!'))
    expect(mockedCreateCard).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Comprar leite', boardId: 'b1' }),
    )
  })

  it('keeps the description collapsed by default (FR-001)', () => {
    renderForm()
    expect(screen.queryByLabelText('Descrição')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'adicionar descrição' })).toBeInTheDocument()
  })

  it('opens the description field on demand', () => {
    renderForm()
    openDescription()
    expect(screen.getByLabelText('Descrição')).toBeInTheDocument()
  })

  it('sends the description together with the card', async () => {
    mockedCreateCard.mockResolvedValue({ card_id: 'card-1', unapplied: [] })
    renderForm()
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Comprar leite' } })
    openDescription()
    fireEvent.change(screen.getByLabelText('Descrição'), { target: { value: 'linha 1\nlinha 2' } })
    saveAndConfirm()
    await waitFor(() =>
      expect(mockedCreateCard).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Comprar leite',
          boardId: 'b1',
          description: 'linha 1\nlinha 2',
        }),
      ),
    )
  })

  it('clears and collapses the description after success (FR-007)', async () => {
    mockedCreateCard.mockResolvedValue({ card_id: 'card-1', unapplied: [] })
    renderForm()
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Comprar leite' } })
    openDescription()
    fireEvent.change(screen.getByLabelText('Descrição'), { target: { value: 'texto' } })
    saveAndConfirm()
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Card criado!'))
    expect(screen.queryByLabelText('Descrição')).not.toBeInTheDocument()
  })

  it('keeps the typed text when saving fails (SC-004)', async () => {
    mockedCreateCard.mockRejectedValue(new Error('erro ao criar card'))
    renderForm()
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Comprar leite' } })
    openDescription()
    fireEvent.change(screen.getByLabelText('Descrição'), { target: { value: 'rascunho' } })
    saveAndConfirm()
    expect(await screen.findByRole('alert')).toHaveTextContent('erro ao criar card')
    expect(screen.getByLabelText('Descrição')).toHaveValue('rascunho')
  })

  it('still refuses to save without a title when a description is typed (FR-004)', async () => {
    renderForm()
    openDescription()
    fireEvent.change(screen.getByLabelText('Descrição'), { target: { value: 'só descrição' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('O título é obrigatório.')
    expect(mockedCreateCard).not.toHaveBeenCalled()
  })

  it('shows the counter and blocks saving above the limit (FR-005)', () => {
    renderForm()
    openDescription()
    const long = 'x'.repeat(2001)
    fireEvent.change(screen.getByLabelText('Descrição'), { target: { value: long } })
    expect(screen.getByText('2001/2000')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled()
    // o texto digitado nunca é cortado automaticamente
    expect(screen.getByLabelText('Descrição')).toHaveValue(long)
  })

  it('keeps saving enabled exactly at the limit', () => {
    renderForm()
    openDescription()
    fireEvent.change(screen.getByLabelText('Descrição'), { target: { value: 'x'.repeat(2000) } })
    expect(screen.getByText('2000/2000')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeEnabled()
  })

  it('returns the focus to the title after a successful save (FR-007)', async () => {
    mockedCreateCard.mockResolvedValue({ card_id: 'card-1', unapplied: [] })
    renderForm()
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Comprar leite' } })
    saveAndConfirm()

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Card criado!'))
    expect(screen.getByLabelText('Título')).toHaveValue('')
    expect(screen.getByLabelText('Título')).toHaveFocus()
  })

  it('sends every chosen label together with the card (FR-005)', async () => {
    mockedCreateCard.mockResolvedValue({ card_id: 'card-1', unapplied: [] })
    renderForm({ selectedLabels: ['Casa', 'Trabalho'] })
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Comprar leite' } })
    saveAndConfirm()

    await waitFor(() =>
      expect(mockedCreateCard).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Comprar leite',
          boardId: 'b1',
          labels: ['Casa', 'Trabalho'],
        }),
      ),
    )
  })

  it('sends no label when none is chosen (SC-004)', async () => {
    mockedCreateCard.mockResolvedValue({ card_id: 'card-1', unapplied: [] })
    renderForm()
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Comprar leite' } })
    saveAndConfirm()

    await waitFor(() =>
      expect(mockedCreateCard).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Comprar leite', boardId: 'b1' }),
      ),
    )
  })

  it('lets the user turn a label on and off without touching the others (FR-001)', () => {
    const onToggleLabel = vi.fn()
    renderForm({
      labels: [
        { name: 'Casa', color: 'green' },
        { name: 'Trabalho', color: 'blue' },
      ],
      selectedLabels: ['Casa'],
      onToggleLabel,
    })
    fireEvent.click(screen.getByRole('checkbox', { name: 'Trabalho' }))
    expect(onToggleLabel).toHaveBeenCalledWith('Trabalho')
    expect(screen.getByRole('checkbox', { name: 'Casa' })).toBeChecked()
  })

  it('offers "limpar" when labels are chosen (FR-003)', () => {
    const onClearLabels = vi.fn()
    renderForm({ selectedLabels: ['Casa'], onClearLabels })
    fireEvent.click(screen.getByRole('button', { name: 'limpar' }))
    expect(onClearLabels).toHaveBeenCalledTimes(1)
  })

  it('does not show the label item when the board has no labels (FR-010)', () => {
    renderForm({ labels: [] })
    expect(screen.queryByRole('group', { name: 'Etiqueta' })).not.toBeInTheDocument()
    // sem campo personalizado de prioridade, o combobox de prioridade também não aparece
    expect(screen.queryByLabelText('Prioridade')).not.toBeInTheDocument()
  })

  it('sends the chosen destination list with the card (FR-006)', async () => {
    mockedCreateCard.mockResolvedValue({ card_id: 'card-1', unapplied: [] })
    renderForm({ lists, selectedListId: 'list-2' })
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Comprar leite' } })
    saveAndConfirm()

    await waitFor(() =>
      expect(mockedCreateCard).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Comprar leite', boardId: 'b1', listId: 'list-2' }),
      ),
    )
  })

  it('shows the destination list as a single choice (FR-001/FR-002)', () => {
    const onSelectList = vi.fn()
    renderForm({ lists, selectedListId: 'list-1', onSelectList })
    expect(screen.getByLabelText('Lista de destino')).toHaveValue('list-1')
    fireEvent.change(screen.getByLabelText('Lista de destino'), { target: { value: 'list-2' } })
    expect(onSelectList).toHaveBeenCalledWith('list-2')
    expect(onSelectList).toHaveBeenCalledTimes(1)
  })

  it('does not show the destination list field when there are no lists (FR-005)', () => {
    renderForm({ lists: [] })
    expect(screen.queryByLabelText('Lista de destino')).not.toBeInTheDocument()
  })

  describe('descrição: voltar, limpar e resumo', () => {
    it('shows a 2-line summary after voltar, and reopens intact (FR-002/FR-004)', () => {
      renderForm()
      openDescription()
      fireEvent.change(screen.getByLabelText('Descrição'), {
        target: { value: 'linha 1\nlinha 2 com texto longo' },
      })
      fireEvent.click(screen.getByRole('button', { name: 'voltar' }))

      expect(screen.queryByLabelText('Descrição')).not.toBeInTheDocument()
      const summary = screen.getByRole('button', { name: /linha 1/ })
      expect(summary).toBeInTheDocument()

      fireEvent.click(summary)
      expect(screen.getByLabelText('Descrição')).toHaveValue('linha 1\nlinha 2 com texto longo')
    })

    it('keeps the shortcut when there is no text (FR-005)', () => {
      renderForm()
      openDescription()
      fireEvent.click(screen.getByRole('button', { name: 'voltar' }))
      expect(screen.getByRole('button', { name: 'adicionar descrição' })).toBeInTheDocument()
    })

    it('clears the description with "limpar descrição" (FR-003)', () => {
      renderForm()
      openDescription()
      fireEvent.change(screen.getByLabelText('Descrição'), { target: { value: 'texto a apagar' } })
      fireEvent.click(screen.getByRole('button', { name: 'limpar descrição' }))

      expect(screen.queryByLabelText('Descrição')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'adicionar descrição' })).toBeInTheDocument()
    })
  })

  describe('confirmação antes de salvar', () => {
    it('opens the dialog with title and board instead of saving (FR-006)', async () => {
      mockedCreateCard.mockResolvedValue({ card_id: 'card-1', unapplied: [] })
      renderForm()
      fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Comprar leite' } })
      fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

      expect(await screen.findByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText(/Comprar leite/)).toBeInTheDocument()
      expect(screen.getByText(/Pessoal/)).toBeInTheDocument()
      expect(mockedCreateCard).not.toHaveBeenCalled()
    })

    it('does nothing on cancel and keeps the form (FR-007)', async () => {
      renderForm()
      fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Comprar leite' } })
      fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
      fireEvent.click(await screen.findByRole('button', { name: 'Cancelar' }))

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(screen.getByLabelText('Título')).toHaveValue('Comprar leite')
      expect(mockedCreateCard).not.toHaveBeenCalled()
    })

    it('creates exactly once on confirm (FR-007)', async () => {
      mockedCreateCard.mockResolvedValue({ card_id: 'card-1', unapplied: [] })
      renderForm()
      fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Comprar leite' } })
      fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
      fireEvent.click(await screen.findByRole('button', { name: 'Confirmar' }))

      await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Card criado!'))
      expect(mockedCreateCard).toHaveBeenCalledTimes(1)
    })

    it('does not open the dialog for an empty title (FR-008)', async () => {
      renderForm()
      fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
      expect(await screen.findByRole('alert')).toHaveTextContent('O título é obrigatório.')
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(mockedCreateCard).not.toHaveBeenCalled()
    })
  })

  it('renders the priority combobox from the custom field (FR-002)', () => {
    renderForm({
      priorityField: {
        id: 'cf-prior',
        name: 'Prioridade',
        type: 'list',
        options: [
          { id: 'opt-alta', value: 'Alta', color: 'orange' },
          { id: 'opt-media', value: 'Média', color: 'yellow' },
        ],
      },
    })
    const select = screen.getByLabelText('Prioridade')
    const values = Array.from(select.querySelectorAll('option')).map(
      (option) => (option as HTMLOptionElement).value,
    )
    expect(values).toEqual(['', 'Alta', 'Média'])
  })

  it('shows the reminder only when a due date is set (014/FR-005)', () => {
    renderForm()
    expect(screen.queryByRole('checkbox', { name: 'Definir lembrete' })).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Data de entrega'), {
      target: { value: '2026-09-28T10:30' },
    })
    const checkbox = screen.getByRole('checkbox', { name: 'Definir lembrete' })
    expect(checkbox).toBeInTheDocument()
    expect(screen.queryByLabelText('Quando lembrar')).not.toBeInTheDocument()

    fireEvent.click(checkbox)
    expect(screen.getByLabelText('Quando lembrar')).toBeInTheDocument()
  })

  it('sends due, reminder and custom fields together (014/SC-003 + 013/SC-002)', async () => {
    renderForm({
      priorityField: {
        id: 'cf-prior',
        name: 'Prioridade',
        type: 'list',
        options: [{ id: 'opt-alta', value: 'Alta', color: 'orange' }],
      },
      customFields: [{ id: 'cf-text', name: 'Texto', type: 'text', options: [] }],
    })
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Comprar leite' } })
    fireEvent.change(screen.getByLabelText('Prioridade'), { target: { value: 'Alta' } })
    fireEvent.change(screen.getByLabelText('Data de entrega'), {
      target: { value: '2026-09-28T10:30' },
    })
    fireEvent.click(screen.getByRole('checkbox', { name: 'Definir lembrete' }))
    fireEvent.change(screen.getByLabelText('Quando lembrar'), { target: { value: '5' } })
    fireEvent.change(screen.getByLabelText('Texto'), { target: { value: 'oi' } })
    saveAndConfirm()

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Card criado!'))
    expect(mockedCreateCard).toHaveBeenCalledWith(
      expect.objectContaining({
        priority: 'Alta',
        due: '2026-09-28T10:30',
        dueReminder: 5,
        customFields: [{ field_id: 'cf-text', value: 'oi' }],
      }),
    )
  })
})

