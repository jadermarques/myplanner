import { useEffect, useState } from 'react'
import { CustomField, fetchCustomFields } from '../services/api'

const PRIORITY_FIELD_NAME = 'Prioridade'

/**
 * Custom fields of the current board (013).
 *
 * The priority control is fed by the list-typed field named "Prioridade" when it exists; the other
 * fields are rendered below the standard ones. A failing request is treated as "no custom fields":
 * they are optional and must never block the capture (R9). Changing the board reloads and resets.
 */
export function useCustomFields(boardId: string) {
  const [fields, setFields] = useState<CustomField[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!boardId) {
      setFields([])
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)
    fetchCustomFields(boardId)
      .then((items) => {
        if (active) setFields(items)
      })
      .catch(() => {
        if (active) setFields([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [boardId])

  const priorityField =
    fields.find((field) => field.name === PRIORITY_FIELD_NAME && field.type === 'list') ?? null
  const otherFields = fields.filter((field) => field !== priorityField)

  return { fields, priorityField, otherFields, loading }
}