import { useEffect, useState } from 'react'
import CardForm from './components/CardForm'
import OfflineNotice from './components/OfflineNotice'
import { useBoards } from './hooks/useBoards'
import { useOnlineStatus } from './hooks/useOnlineStatus'
import { fetchVersion } from './services/api'

export default function App() {
  const online = useOnlineStatus()
  const [version, setVersion] = useState<string | null>(null)
  const { boards, loading, error, selectedBoardId, selectBoard } = useBoards()

  useEffect(() => {
    fetchVersion().then(setVersion).catch(() => setVersion('unknown'))
  }, [])

  return (
    <>
      <OfflineNotice visible={!online} />
      {version === null ? (
        <p className="loading" role="status">
          Carregando…
        </p>
      ) : (
        <main className="home">
          <h1 className="title">Inserir card</h1>
          <CardForm
            boards={boards}
            loading={loading}
            error={error}
            selectedBoardId={selectedBoardId}
            onSelectBoard={selectBoard}
          />
          <footer className="footer">
            <span>v{version}</span>
          </footer>
        </main>
      )}
    </>
  )
}

