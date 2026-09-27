import { useEffect, useState } from 'react'
import { Label, fetchLabels } from '../services/api'

/**
 * Labels offered for the current board, as a multiple choice.
 *
 * Each label is turned on and off on its own (FR-001) and any number of them can be chosen
 * (FR-002). A failing request is treated as "no labels": the label is optional and must never
 * block the capture (FR-010). Changing the board clears the choice and reloads, because a label
 * belongs to one board (FR-009) — a label from another board would be dropped on save.
 */
export function useLabels(boardId: string) {
  const [labels, setLabels] = useState<Label[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])

  useEffect(() => {
    setSelectedLabels([])
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

  const toggleLabel = (name: string) =>
    setSelectedLabels((current) =>
      current.includes(name) ? current.filter((item) => item !== name) : [...current, name],
    )

  const clearLabels = () => setSelectedLabels([])

  return { labels, loading, selectedLabels, toggleLabel, clearLabels }
}
