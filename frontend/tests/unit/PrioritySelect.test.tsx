import { render, screen } from '@testing-library/react'
import PrioritySelect from '../../src/components/PrioritySelect'

describe('PrioritySelect', () => {
  it('lists only the configured priority labels', () => {
    render(<PrioritySelect value="" onChange={() => {}} />)
    expect(screen.getByRole('option', { name: 'Sem prioridade' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Muito alta' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Alta' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Média' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Baixa' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Muito baixa' })).toBeInTheDocument()
  })
})
