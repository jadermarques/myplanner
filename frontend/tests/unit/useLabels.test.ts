import { act, renderHook, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { useLabels } from '../../src/hooks/useLabels'
import { fetchLabels } from '../../src/services/api'

vi.mock('../../src/services/api', () => ({
  fetchLabels: vi.fn(),
}))

describe('useLabels', () => {
  it('loads the labels of the current board', async () => {
    vi.mocked(fetchLabels).mockResolvedValue([{ name: 'Casa', color: 'green' }])
    const { result } = renderHook(() => useLabels('b1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.labels).toEqual([{ name: 'Casa', color: 'green' }])
    expect(fetchLabels).toHaveBeenCalledWith('b1')
  })

  it('turns labels on and off one by one, without affecting the others (FR-001)', async () => {
    vi.mocked(fetchLabels).mockResolvedValue([
      { name: 'Casa', color: 'green' },
      { name: 'Trabalho', color: 'blue' },
    ])
    const { result } = renderHook(() => useLabels('b1'))
    await waitFor(() => expect(result.current.labels).toHaveLength(2))

    act(() => result.current.toggleLabel('Casa'))
    act(() => result.current.toggleLabel('Trabalho'))
    expect(result.current.selectedLabels).toEqual(['Casa', 'Trabalho'])

    act(() => result.current.toggleLabel('Casa'))
    expect(result.current.selectedLabels).toEqual(['Trabalho'])
  })

  it('clears every chosen label at once (FR-003)', async () => {
    vi.mocked(fetchLabels).mockResolvedValue([
      { name: 'Casa', color: 'green' },
      { name: 'Trabalho', color: 'blue' },
    ])
    const { result } = renderHook(() => useLabels('b1'))
    await waitFor(() => expect(result.current.labels).toHaveLength(2))
    act(() => result.current.toggleLabel('Casa'))
    act(() => result.current.toggleLabel('Trabalho'))

    act(() => result.current.clearLabels())
    expect(result.current.selectedLabels).toEqual([])
  })

  it('clears the choice and loads the new board labels when the board changes (FR-009)', async () => {
    vi.mocked(fetchLabels).mockResolvedValue([{ name: 'Casa', color: 'green' }])
    const { result, rerender } = renderHook(({ boardId }) => useLabels(boardId), {
      initialProps: { boardId: 'b1' },
    })
    await waitFor(() => expect(result.current.labels).toHaveLength(1))
    act(() => result.current.toggleLabel('Casa'))
    expect(result.current.selectedLabels).toEqual(['Casa'])

    vi.mocked(fetchLabels).mockResolvedValue([{ name: 'Trabalho', color: 'blue' }])
    rerender({ boardId: 'b2' })

    await waitFor(() => expect(result.current.selectedLabels).toEqual([]))
    expect(result.current.labels).toEqual([{ name: 'Trabalho', color: 'blue' }])
  })

  it('treats a failing request as "no labels" instead of blocking the capture (FR-010)', async () => {
    vi.mocked(fetchLabels).mockRejectedValue(new Error('labels request failed: 502'))
    const { result } = renderHook(() => useLabels('b1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.labels).toEqual([])
    expect(result.current.selectedLabels).toEqual([])
  })

  it('does nothing while no board is selected', async () => {
    vi.mocked(fetchLabels).mockClear()
    const { result } = renderHook(() => useLabels(''))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(fetchLabels).not.toHaveBeenCalled()
    expect(result.current.labels).toEqual([])
  })
})
