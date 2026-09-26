import { useCallback, useEffect, useState } from 'react'
import { fetchAuthStatus } from '../services/api'

export type AuthState = 'loading' | 'set-password' | 'login' | 'authenticated'

export function useAuth() {
  const [state, setState] = useState<AuthState>('loading')
  const [deviceRegistered, setDeviceRegistered] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const status = await fetchAuthStatus()
      setDeviceRegistered(status.device_registered)
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

  return { state, deviceRegistered, refresh }
}
