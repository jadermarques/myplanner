import { useEffect, useState } from 'react'
import { Board, fetchBoards } from '../services/api'

const LAST_USED_KEY = 'myplanner:last_board_id'

export function useBoards(enabled = true) {
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBoardId, setSelectedBoardId] = useState('')

  useEffect(() => {
    if (!enabled) return
    fetchBoards()
      .then((list) => {
        setBoards(list)
        const lastUsed = localStorage.getItem(LAST_USED_KEY)
        const initial = list.some((b) => b.id === lastUsed) ? lastUsed! : (list[0]?.id ?? '')
        setSelectedBoardId(initial)
      })
      .catch(() => setError('Não foi possível carregar os boards.'))
      .finally(() => setLoading(false))
  }, [enabled])

  const selectBoard = (boardId: string) => {
    setSelectedBoardId(boardId)
    localStorage.setItem(LAST_USED_KEY, boardId)
  }

  return { boards, loading, error, selectedBoardId, selectBoard }
}
