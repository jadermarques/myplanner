import { useEffect, useState } from 'react'
import { BoardList, fetchLists } from '../services/api'

/**
 * Lists that can receive the card, for the current board.
 *
 * The default is always the FIRST list of the board (FR-002) and the choice is not remembered: a
 * list belongs to one board, so changing boards reloads and resets it (FR-004). A failing request
 * is treated as "no lists": the field is not rendered and the server picks the first list —
 * exactly the behaviour of every card before this feature (FR-005).
 */
export function useLists(boardId: string) {
  const [lists, setLists] = useState<BoardList[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedListId, setSelectedListId] = useState('')

  useEffect(() => {
    setSelectedListId('')
    if (!boardId) {
      setLists([])
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)
    fetchLists(boardId)
      .then((items) => {
        if (!active) return
        setLists(items)
        setSelectedListId(items[0]?.id ?? '')
      })
      .catch(() => {
        if (!active) return
        setLists([])
        setSelectedListId('')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [boardId])

  return { lists, loading, selectedListId, selectList: setSelectedListId }
}
