import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import PrioritySelect from '../../src/components/PrioritySelect'

describe('PrioritySelect', () => {
  it('offers only the configured priority labels, all visible at once', () => {
    render(<PrioritySelect value="" onChange={() => {}} />)
    const values = screen.getAllByRole('radio').map((option) => (option as HTMLInputElement).value)
    expect(values).toEqual(['', 'Muito alta', 'Alta', 'Média', 'Baixa', 'Muito baixa'])
  })

  it('selects with a single click, without opening any modal step', () => {
    const onChange = vi.fn()
    render(<PrioritySelect value="" onChange={onChange} />)
    fireEvent.click(screen.getByLabelText('Alta'))
    expect(onChange).toHaveBeenCalledWith('Alta')
  })

  it('marks the current value so the choice is visible at a glance', () => {
    render(<PrioritySelect value="Média" onChange={() => {}} />)
    expect(screen.getByRole('radio', { name: 'Média' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Alta' })).not.toBeChecked()
  })
})

