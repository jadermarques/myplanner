import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import PrioritySelect from '../../src/components/PrioritySelect'

const options = [
  { id: 'opt-alta', value: 'Alta', color: 'orange' },
  { id: 'opt-media', value: 'Média', color: 'yellow' },
]

describe('PrioritySelect', () => {
  it('offers a single-choice combobox without the "sem prioridade" option (FR-001)', () => {
    render(<PrioritySelect options={options} value="" onChange={() => {}} onClear={() => {}} />)
    const select = screen.getByLabelText('Prioridade')
    const values = Array.from(select.querySelectorAll('option')).map(
      (option) => (option as HTMLOptionElement).value,
    )
    expect(values).toEqual(['', 'Alta', 'Média'])
  })

  it('picks exactly one value', () => {
    const onChange = vi.fn()
    render(<PrioritySelect options={options} value="" onChange={onChange} onClear={() => {}} />)
    fireEvent.change(screen.getByLabelText('Prioridade'), { target: { value: 'Alta' } })
    expect(onChange).toHaveBeenCalledWith('Alta')
  })

  it('shows "limpar prioridade" only after a value is chosen (FR-004)', () => {
    const onClear = vi.fn()
    const { rerender } = render(
      <PrioritySelect options={options} value="" onChange={() => {}} onClear={onClear} />,
    )
    expect(screen.queryByRole('button', { name: 'limpar prioridade' })).not.toBeInTheDocument()

    rerender(<PrioritySelect options={options} value="Alta" onChange={() => {}} onClear={onClear} />)
    fireEvent.click(screen.getByRole('button', { name: 'limpar prioridade' }))
    expect(onClear).toHaveBeenCalledTimes(1)
  })
})

