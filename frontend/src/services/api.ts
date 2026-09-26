const BASE_URL = '/api'

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
