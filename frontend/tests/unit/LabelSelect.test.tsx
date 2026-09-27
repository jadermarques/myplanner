import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import LabelSelect, { labelColor } from '../../src/components/LabelSelect'

const labels = [
  { name: 'Casa', color: 'green' },
  { name: 'Trabalho', color: 'orange_dark' },
]

const noop = () => {}

describe('LabelSelect', () => {
  it('offers every board label as a checkbox (FR-002)', () => {
    render(<LabelSelect labels={labels} value={[]} onToggle={noop} onClear={noop} />)
    const names = screen.getAllByRole('checkbox').map((input) => (input as HTMLInputElement).value)
    expect(names).toEqual(['Casa', 'Trabalho'])
  })

  it('turns one label on without touching the others (FR-001)', () => {
    const onToggle = vi.fn()
    render(
      <LabelSelect labels={labels} value={['Trabalho']} onToggle={onToggle} onClear={noop} />,
    )
    fireEvent.click(screen.getByRole('checkbox', { name: 'Casa' }))
    expect(onToggle).toHaveBeenCalledWith('Casa')
  })

  it('marks every chosen label at the same time (FR-005)', () => {
    render(<LabelSelect labels={labels} value={['Casa', 'Trabalho']} onToggle={noop} onClear={noop} />)
    expect(screen.getByRole('checkbox', { name: 'Casa' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Trabalho' })).toBeChecked()
  })

  it('has no "Sem etiqueta" option anymore', () => {
    render(<LabelSelect labels={labels} value={[]} onToggle={noop} onClear={noop} />)
    expect(screen.queryByText('Sem etiqueta')).not.toBeInTheDocument()
  })

  it('offers "limpar" only when at least one label is chosen (FR-003)', () => {
    const onClear = vi.fn()
    const { rerender } = render(
      <LabelSelect labels={labels} value={[]} onToggle={noop} onClear={onClear} />,
    )
    expect(screen.queryByRole('button', { name: 'limpar' })).not.toBeInTheDocument()

    rerender(<LabelSelect labels={labels} value={['Casa']} onToggle={noop} onClear={onClear} />)
    fireEvent.click(screen.getByRole('button', { name: 'limpar' }))
    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('shows one colour dot per label', () => {
    const { container } = render(
      <LabelSelect labels={labels} value={[]} onToggle={noop} onClear={noop} />,
    )
    expect(container.querySelectorAll('.chip__dot')).toHaveLength(2)
  })

  it('maps Trello colours to a visible dot colour', () => {
    expect(labelColor('green')).toBe('#61bd4f')
    expect(labelColor('green_dark')).toBe('#61bd4f')
    expect(labelColor('cor-nova-do-trello')).toBe('#8590a2')
  })
})
