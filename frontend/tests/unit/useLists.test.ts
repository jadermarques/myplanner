import { act, renderHook, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { useLists } from '../../src/hooks/useLists'
import { fetchLists } from '../../src/services/api'

vi.mock('../../src/services/api', () => ({
  fetchLists: vi.fn(),
}))

describe('useLists', () => {
  it('defaults to the first list of the board (FR-002)', async () => {
    vi.mocked(fetchLists).mockResolvedValue([
      { id: 'l1', name: 'A fazer' },
      { id: 'l2', name: 'Em andamento' },
    ])
    const { result } = renderHook(() => useLists('b1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.selectedListId).toBe('l1')
    expect(fetchLists).toHaveBeenCalledWith('b1')
  })

  it('resets to the first list of the new board when the board changes (FR-004)', async () => {
    vi.mocked(fetchLists).mockResolvedValue([{ id: 'l1', name: 'A fazer' }])
    const { result, rerender } = renderHook(({ boardId }) => useLists(boardId), {
      initialProps: { boardId: 'b1' },
    })
    await waitFor(() => expect(result.current.selectedListId).toBe('l1'))
    act(() => result.current.selectList('l2'))

    vi.mocked(fetchLists).mockResolvedValue([{ id: 'l9', name: 'Backlog' }])
    rerender({ boardId: 'b2' })

    await waitFor(() => expect(result.current.selectedListId).toBe('l9'))
  })

  it('treats a failing request as "no lists" instead of blocking the capture (FR-005)', async () => {
    vi.mocked(fetchLists).mockRejectedValue(new Error('lists request failed: 502'))
    const { result } = renderHook(() => useLists('b1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.lists).toEqual([])
    expect(result.current.selectedListId).toBe('')
  })

  it('does nothing while no board is selected', async () => {
    vi.mocked(fetchLists).mockClear()
    const { result } = renderHook(() => useLists(''))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(fetchLists).not.toHaveBeenCalled()
  })
})
