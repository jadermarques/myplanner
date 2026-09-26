import { useEffect, useState } from 'react'
import HomeScreen from './components/HomeScreen'
import OfflineNotice from './components/OfflineNotice'
import { useOnlineStatus } from './hooks/useOnlineStatus'
import { fetchVersion } from './services/api'

export default function App() {
  const online = useOnlineStatus()
  const [version, setVersion] = useState<string | null>(null)

  useEffect(() => {
    fetchVersion()
      .then(setVersion)
      .catch(() => setVersion('unknown'))
  }, [])

  return (
    <>
      <OfflineNotice visible={!online} />
      {version === null ? (
        <p className="loading" role="status">
          Carregando…
        </p>
      ) : (
        <HomeScreen version={version} />
      )}
    </>
  )
}
