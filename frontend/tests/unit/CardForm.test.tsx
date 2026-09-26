import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, type Mock } from 'vitest'
import CardForm from '../../src/components/CardForm'
import { createCard } from '../../src/services/api'

vi.mock('../../src/services/api', () => ({
  createCard: vi.fn(),
}))

const mockedCreateCard = createCard as Mock

const boards = [{ id: 'b1', name: 'Pessoal' }]

describe('CardForm', () => {
  it('renders the title field and Save button', () => {
    render(
      <CardForm boards={boards} loading={false} error={null} selectedBoardId="b1" onSelectBoard={() => {}} />,
    )
    expect(screen.getByLabelText('Título')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument()
  })

  it('shows an error when title is empty', async () => {
    render(
      <CardForm boards={boards} loading={false} error={null} selectedBoardId="b1" onSelectBoard={() => {}} />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('O título é obrigatório.')
  })

  it('creates a card and shows success', async () => {
    mockedCreateCard.mockResolvedValue({ card_id: 'card-1' })
    render(
      <CardForm boards={boards} loading={false} error={null} selectedBoardId="b1" onSelectBoard={() => {}} />,
    )
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Comprar leite' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Card criado!'))
    expect(mockedCreateCard).toHaveBeenCalledWith('Comprar leite', 'b1', undefined)
  })
})
