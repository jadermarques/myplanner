const BASE_URL = '/api'

export interface Board {
  id: string
  name: string
}

export interface AuthStatus {
  password_set: boolean
  authenticated: boolean
}

function csrfHeaders(): Record<string, string> {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/)
  return match ? { 'X-CSRF-Token': decodeURIComponent(match[1]) } : {}
}

async function postJson(path: string, body: unknown, withCsrf = false): Promise<Response> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (withCsrf) Object.assign(headers, csrfHeaders())
  return fetch(`${BASE_URL}${path}`, { method: 'POST', headers, body: JSON.stringify(body) })
}

async function detailOr(res: Response, fallback: string): Promise<string> {
  const data = (await res.json().catch(() => null)) as { detail?: string } | null
  return data?.detail ?? fallback
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

export async function fetchAuthStatus(): Promise<AuthStatus> {
  const res = await fetch(`${BASE_URL}/auth/status`)
  if (!res.ok) throw new Error(`auth status failed: ${res.status}`)
  return (await res.json()) as AuthStatus
}

export async function login(password: string): Promise<void> {
  const res = await postJson('/auth/login', { password })
  if (!res.ok) throw new Error(await detailOr(res, 'Erro ao entrar.'))
}

export async function setPassword(password: string): Promise<void> {
  const res = await postJson('/auth/set-password', { password })
  if (!res.ok) throw new Error(await detailOr(res, 'Erro ao definir a senha.'))
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const res = await postJson('/auth/change-password', {
    current_password: currentPassword,
    new_password: newPassword,
  })
  if (!res.ok) throw new Error(await detailOr(res, 'Erro ao trocar a senha.'))
}

export async function logout(): Promise<void> {
  await fetch(`${BASE_URL}/auth/logout`, { method: 'POST' })
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
    headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
    body: JSON.stringify({ title, board_id: boardId, priority: priority ?? null }),
  })
  if (!res.ok) throw new Error(await detailOr(res, `create card failed: ${res.status}`))
  return (await res.json()) as { card_id: string }
}


