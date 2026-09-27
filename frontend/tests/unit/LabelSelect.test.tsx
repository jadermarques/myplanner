import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import LabelSelect, { labelColor } from '../../src/components/LabelSelect'

const labels = [
  { name: 'Casa', color: 'green' },
  { name: 'Trabalho', color: 'orange_dark' },
]

describe('LabelSelect', () => {
  it('offers every board label plus the "no label" option', () => {
    render(<LabelSelect labels={labels} value="" onChange={() => {}} />)
    const values = screen.getAllByRole('radio').map((input) => (input as HTMLInputElement).value)
    expect(values).toEqual(['', 'Casa', 'Trabalho'])
  })

  it('selects a label with a single click', () => {
    const onChange = vi.fn()
    render(<LabelSelect labels={labels} value="" onChange={onChange} />)
    fireEvent.click(screen.getByLabelText('Casa'))
    expect(onChange).toHaveBeenCalledWith('Casa')
  })

  it('marks the current label and keeps "Sem etiqueta" available', () => {
    render(<LabelSelect labels={labels} value="Trabalho" onChange={() => {}} />)
    expect(screen.getByRole('radio', { name: 'Trabalho' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Sem etiqueta' })).not.toBeChecked()
  })

  it('shows one colour dot per label, and none for "Sem etiqueta"', () => {
    const { container } = render(<LabelSelect labels={labels} value="" onChange={() => {}} />)
    expect(container.querySelectorAll('.chip__dot')).toHaveLength(2)
  })

  it('maps Trello colours to a visible dot colour', () => {
    expect(labelColor('green')).toBe('#61bd4f')
    expect(labelColor('green_dark')).toBe('#61bd4f')
    expect(labelColor('cor-nova-do-trello')).toBe('#8590a2')
  })
})
