import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { beforeEach, vi, type Mock } from 'vitest'
import CardForm from '../../src/components/CardForm'
import { createCard } from '../../src/services/api'

vi.mock('../../src/services/api', () => ({
  createCard: vi.fn(),
}))

const mockedCreateCard = createCard as Mock

const labels = [{ name: 'Casa', color: 'green' }]

function renderForm(overrides: Partial<React.ComponentProps<typeof CardForm>> = {}) {
  return render(
    <CardForm
      selectedBoardId="b1"
      boardsLoading={false}
      boardsError={null}
      labels={labels}
      selectedLabel=""
      onSelectLabel={() => {}}
      {...overrides}
    />,
  )
}

const openDescription = () =>
  fireEvent.click(screen.getByRole('button', { name: 'adicionar descrição' }))

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
    mockedCreateCard.mockResolvedValue({ card_id: 'card-1' })
    renderForm()
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Comprar leite' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Card criado!'))
    expect(mockedCreateCard).toHaveBeenCalledWith('Comprar leite', 'b1', undefined, undefined, undefined)
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
    mockedCreateCard.mockResolvedValue({ card_id: 'card-1' })
    renderForm()
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Comprar leite' } })
    openDescription()
    fireEvent.change(screen.getByLabelText('Descrição'), { target: { value: 'linha 1\nlinha 2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    await waitFor(() =>
      expect(mockedCreateCard).toHaveBeenCalledWith(
        'Comprar leite',
        'b1',
        undefined,
        'linha 1\nlinha 2',
        undefined,
      ),
    )
  })

  it('clears and collapses the description after success (FR-007)', async () => {
    mockedCreateCard.mockResolvedValue({ card_id: 'card-1' })
    renderForm()
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Comprar leite' } })
    openDescription()
    fireEvent.change(screen.getByLabelText('Descrição'), { target: { value: 'texto' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Card criado!'))
    expect(screen.queryByLabelText('Descrição')).not.toBeInTheDocument()
  })

  it('keeps the typed text when saving fails (SC-004)', async () => {
    mockedCreateCard.mockRejectedValue(new Error('erro ao criar card'))
    renderForm()
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Comprar leite' } })
    openDescription()
    fireEvent.change(screen.getByLabelText('Descrição'), { target: { value: 'rascunho' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
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
    mockedCreateCard.mockResolvedValue({ card_id: 'card-1' })
    renderForm()
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Comprar leite' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Card criado!'))
    expect(screen.getByLabelText('Título')).toHaveValue('')
    expect(screen.getByLabelText('Título')).toHaveFocus()
  })

  it('sends the chosen label together with the card (FR-006)', async () => {
    mockedCreateCard.mockResolvedValue({ card_id: 'card-1' })
    renderForm({ selectedLabel: 'Casa' })
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Comprar leite' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() =>
      expect(mockedCreateCard).toHaveBeenCalledWith(
        'Comprar leite',
        'b1',
        undefined,
        undefined,
        'Casa',
      ),
    )
  })

  it('sends no label when none is chosen (SC-002)', async () => {
    mockedCreateCard.mockResolvedValue({ card_id: 'card-1' })
    renderForm()
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Comprar leite' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() =>
      expect(mockedCreateCard).toHaveBeenCalledWith(
        'Comprar leite',
        'b1',
        undefined,
        undefined,
        undefined,
      ),
    )
  })

  it('shows the label choices of the board, and lets the user pick one (FR-003)', () => {
    const onSelectLabel = vi.fn()
    renderForm({
      labels: [
        { name: 'Casa', color: 'green' },
        { name: 'Trabalho', color: 'blue' },
      ],
      onSelectLabel,
    })
    fireEvent.click(screen.getByLabelText('Trabalho'))
    expect(onSelectLabel).toHaveBeenCalledWith('Trabalho')
  })

  it('does not show the label item when the board has no labels (FR-008)', () => {
    renderForm({ labels: [] })
    expect(screen.queryByRole('radiogroup', { name: 'Etiqueta' })).not.toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: 'Prioridade' })).toBeInTheDocument()
  })
})

