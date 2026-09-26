import { renderHook, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { useBoards } from '../../src/hooks/useBoards'
import { fetchBoards } from '../../src/services/api'

vi.mock('../../src/services/api', () => ({
  fetchBoards: vi.fn(),
}))

describe('useBoards', () => {
  it('selects the last used board from localStorage', async () => {
    localStorage.setItem('myplanner:last_board_id', 'b2')
    vi.mocked(fetchBoards).mockResolvedValue([
      { id: 'b1', name: 'Pessoal' },
      { id: 'b2', name: 'Trabalho' },
    ])
    const { result } = renderHook(() => useBoards())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.selectedBoardId).toBe('b2')
  })

  it('falls back to the first board when no last_used', async () => {
    localStorage.removeItem('myplanner:last_board_id')
    vi.mocked(fetchBoards).mockResolvedValue([{ id: 'b1', name: 'Pessoal' }])
    const { result } = renderHook(() => useBoards())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.selectedBoardId).toBe('b1')
  })
})
