import { useEffect, useState } from 'react'
import { Label, fetchLabels } from '../services/api'

/**
 * Labels offered for the current board.
 *
 * A failing request is treated as "no labels": the label is optional and must never block the
 * capture (FR-008). Changing the board clears the choice and reloads, because a label belongs
 * to one board (FR-007) — a label from another board would be silently dropped on save.
 */
export function useLabels(boardId: string) {
  const [labels, setLabels] = useState<Label[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLabel, setSelectedLabel] = useState('')

  useEffect(() => {
    setSelectedLabel('')
    if (!boardId) {
      setLabels([])
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)
    fetchLabels(boardId)
      .then((list) => {
        if (active) setLabels(list)
      })
      .catch(() => {
        if (active) setLabels([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [boardId])

  return { labels, loading, selectedLabel, selectLabel: setSelectedLabel }
}
