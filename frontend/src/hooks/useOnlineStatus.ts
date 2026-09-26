import { useEffect, useState } from 'react'
import { fetchHealth } from '../services/api'

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState<boolean>(() => navigator.onLine)

  useEffect(() => {
    const check = async () => {
      const healthy = await fetchHealth()
      setOnline(navigator.onLine && healthy)
    }

    const handleOnline = () => {
      void check()
    }
    const handleOffline = () => {
      setOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    void check()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return online
}
