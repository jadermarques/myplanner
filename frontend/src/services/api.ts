const BASE_URL = '/api'

export interface Board {
  id: string
  name: string
}

export async function fetchVersion(): Promise<string> {
  const res = await fetch(`${BASE_URL}/version`)
  if (!res.ok) throw new Error(`version request failed: ${res.status}`)
  const data = (await res.json()) as { version: string }
  return data.version
}

export async function fetchHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/health`)
    return res.ok
  } catch {
    return false
  }
}

export async function fetchBoards(): Promise<Board[]> {
  const res = await fetch(`${BASE_URL}/boards`)
  if (!res.ok) throw new Error(`boards request failed: ${res.status}`)
  return (await res.json()) as Board[]
}

export async function createCard(
  title: string,
  boardId: string,
  priority?: string,
): Promise<{ card_id: string }> {
  const res = await fetch(`${BASE_URL}/cards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, board_id: boardId, priority: priority ?? null }),
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { detail?: string } | null
    throw new Error(data?.detail ?? `create card failed: ${res.status}`)
  }
  return (await res.json()) as { card_id: string }
}

