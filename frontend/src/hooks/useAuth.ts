import { useCallback, useEffect, useState } from 'react'
import { fetchAuthStatus } from '../services/api'

export type AuthState = 'loading' | 'set-password' | 'login' | 'authenticated'

export function useAuth() {
  const [state, setState] = useState<AuthState>('loading')

  const refresh = useCallback(async () => {
    try {
      const status = await fetchAuthStatus()
      if (!status.password_set) setState('set-password')
      else if (status.authenticated) setState('authenticated')
      else setState('login')
    } catch {
      setState('login')
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { state, refresh }
}
