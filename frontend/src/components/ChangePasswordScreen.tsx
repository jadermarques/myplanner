import { useState } from 'react'
import { changePassword } from '../services/api'

interface ChangePasswordScreenProps {
  onDone: () => void
}

export default function ChangePasswordScreen({ onDone }: ChangePasswordScreenProps) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await changePassword(current, next)
      setDone(true)
      setCurrent('')
      setNext('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao trocar a senha.')
    }
  }

  return (
    <form className="capture" onSubmit={handleSubmit} aria-label="Trocar senha">
      <div className="field">
        <label className="field__label" htmlFor="current-password">
          Senha atual
        </label>
        <input
          id="current-password"
          className="input"
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          placeholder="Senha atual"
          autoComplete="current-password"
        />
      </div>

      <div className="field">
        <label className="field__label" htmlFor="next-password">
          Nova senha
        </label>
        <input
          id="next-password"
          className="input"
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
        />
      </div>

      {error && (
        <p className="msg msg--error" role="alert">
          {error}
        </p>
      )}
      {done && (
        <div className="toast">
          <p className="toast__text" role="status">
            Senha alterada!
          </p>
        </div>
      )}

      <div className="action-bar">
        <button type="submit" className="button button--primary button--block">
          Trocar
        </button>
        <button
          type="button"
          className="button button--block"
          style={{ marginTop: 'var(--space-2)', background: 'transparent', color: 'var(--muted)' }}
          onClick={onDone}
        >
          Voltar
        </button>
      </div>
    </form>
  )
}

