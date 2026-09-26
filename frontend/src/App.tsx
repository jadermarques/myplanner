import { useEffect, useState } from 'react'
import CardForm from './components/CardForm'
import ChangePasswordScreen from './components/ChangePasswordScreen'
import DeviceList from './components/DeviceList'
import LoginScreen from './components/LoginScreen'
import OfflineNotice from './components/OfflineNotice'
import SetPasswordScreen from './components/SetPasswordScreen'
import { useAuth } from './hooks/useAuth'
import { useBoards } from './hooks/useBoards'
import { useOnlineStatus } from './hooks/useOnlineStatus'
import { fetchVersion, logout } from './services/api'

export default function App() {
  const online = useOnlineStatus()
  const { state, deviceRegistered, refresh } = useAuth()
  const [version, setVersion] = useState<string | null>(null)
  const [showChange, setShowChange] = useState(false)
  const [showDevices, setShowDevices] = useState(false)
  const { boards, loading, error, selectedBoardId, selectBoard } = useBoards(
    state === 'authenticated',
  )

  useEffect(() => {
    if (state === 'authenticated') {
      fetchVersion()
        .then(setVersion)
        .catch(() => setVersion('unknown'))
    }
  }, [state])

  const handleLogout = async () => {
    await logout()
    await refresh()
  }

  return (
    <>
      <OfflineNotice visible={!online} />
      {state === 'loading' && (
        <p className="loading" role="status">
          Carregando…
        </p>
      )}
      {state === 'set-password' && <SetPasswordScreen onSuccess={refresh} />}
      {state === 'login' && <LoginScreen onSuccess={refresh} totpRequired={!deviceRegistered} />}
      {state === 'authenticated' && (
        <main className="home">
          <h1 className="title">Inserir card</h1>
          {showDevices ? (
            <DeviceList onBack={() => setShowDevices(false)} />
          ) : showChange ? (
            <ChangePasswordScreen onDone={() => setShowChange(false)} />
          ) : (
            <CardForm
              boards={boards}
              loading={loading}
              error={error}
              selectedBoardId={selectedBoardId}
              onSelectBoard={selectBoard}
            />
          )}
          <div className="actions">
            <button
              type="button"
              onClick={() => {
                setShowDevices(false)
                setShowChange((value) => !value)
              }}
            >
              Trocar senha
            </button>
            <button
              type="button"
              onClick={() => {
                setShowChange(false)
                setShowDevices((value) => !value)
              }}
            >
              Aparelhos
            </button>
            <button type="button" onClick={handleLogout}>
              Sair
            </button>
          </div>
          <footer className="footer">
            <span>v{version ?? '…'}</span>
          </footer>
        </main>
      )}
    </>
  )
}


