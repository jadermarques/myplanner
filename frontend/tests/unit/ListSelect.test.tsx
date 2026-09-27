import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import ListSelect from '../../src/components/ListSelect'

const lists = [
  { id: 'l1', name: 'A fazer' },
  { id: 'l2', name: 'Em andamento' },
]

describe('ListSelect', () => {
  it('shows the destination list field with every open list', () => {
    render(<ListSelect lists={lists} value="l1" onChange={() => {}} />)
    expect(screen.getByLabelText('Lista de destino')).toHaveValue('l1')
    const options = screen.getAllByRole('option').map((option) => option.textContent)
    expect(options).toEqual(['A fazer', 'Em andamento'])
  })

  it('lets the user pick exactly one list', () => {
    const onChange = vi.fn()
    render(<ListSelect lists={lists} value="l1" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText('Lista de destino'), { target: { value: 'l2' } })
    expect(onChange).toHaveBeenCalledWith('l2')
    expect(onChange).toHaveBeenCalledTimes(1)
  })
})
