import { useEffect, useRef, useState } from 'react'
import BoardSelect from './components/BoardSelect'
import CardForm from './components/CardForm'
import ChangePasswordScreen from './components/ChangePasswordScreen'
import LoginScreen from './components/LoginScreen'
import OfflineNotice from './components/OfflineNotice'
import SetPasswordScreen from './components/SetPasswordScreen'
import { useAuth } from './hooks/useAuth'
import { useBoards } from './hooks/useBoards'
import { useKeyboardInset } from './hooks/useKeyboardInset'
import { useLabels } from './hooks/useLabels'
import { useOnlineStatus } from './hooks/useOnlineStatus'
import { fetchVersion, logout } from './services/api'

export default function App() {
  const online = useOnlineStatus()
  const keyboardInset = useKeyboardInset()
  const { state, refresh } = useAuth()
  const [version, setVersion] = useState<string | null>(null)
  const [showChange, setShowChange] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const toolsRef = useRef<HTMLDivElement | null>(null)
  const { boards, loading, error, selectedBoardId, selectBoard } = useBoards(
    state === 'authenticated',
  )
  const { labels, selectedLabel, selectLabel } = useLabels(
    state === 'authenticated' ? selectedBoardId : '',
  )

  useEffect(() => {
    if (state === 'authenticated') {
      fetchVersion()
        .then(setVersion)
        .catch(() => setVersion('unknown'))
    }
  }, [state])

  // O menu secundário fecha ao tocar fora ou com Esc.
  useEffect(() => {
    if (!menuOpen) return
    const onPointerDown = (event: MouseEvent) => {
      if (!toolsRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  const handleLogout = async () => {
    setMenuOpen(false)
    await logout()
    await refresh()
  }

  return (
    <div className="app" style={{ ['--keyboard-inset' as string]: `${keyboardInset}px` }}>
      <OfflineNotice visible={!online} />

      {state === 'loading' && (
        <p className="loading" role="status">
          Carregando…
        </p>
      )}

      {state === 'set-password' && <SetPasswordScreen onSuccess={refresh} />}
      {state === 'login' && <LoginScreen onSuccess={refresh} />}

      {state === 'authenticated' && (
        <>
          <header className="app-header">
            <div className="brand">
              <span className="brand__mark" aria-hidden="true">
                ▤
              </span>
              <span className="brand__name">MyPlanner</span>
            </div>

            <div className="app-header__tools" ref={toolsRef}>
              <BoardSelect
                boards={boards}
                value={selectedBoardId}
                onChange={selectBoard}
                loading={loading}
              />
              <button
                type="button"
                className="icon-button"
                aria-label="Mais opções"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
              >
                ⋯
              </button>

              {menuOpen && (
                <div className="menu-panel" role="menu">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false)
                      setShowChange(true)
                    }}
                  >
                    Trocar senha
                  </button>
                  <button type="button" role="menuitem" onClick={handleLogout}>
                    Sair
                  </button>
                </div>
              )}
            </div>
          </header>

          <main className="app-main">
            <h1 className="app-title">Inserir card</h1>

            {showChange ? (
              <ChangePasswordScreen onDone={() => setShowChange(false)} />
            ) : (
              <CardForm
                selectedBoardId={selectedBoardId}
                boardsLoading={loading}
                boardsError={error}
                labels={labels}
                selectedLabel={selectedLabel}
                onSelectLabel={selectLabel}
              />
            )}

            <footer className="app-footer">
              <span>v{version ?? '…'}</span>
            </footer>
          </main>
        </>
      )}
    </div>
  )
}



