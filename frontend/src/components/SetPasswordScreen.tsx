import { useState } from 'react'
import { setPassword as submitPassword } from '../services/api'

interface SetPasswordScreenProps {
  onSuccess: () => void
}

export default function SetPasswordScreen({ onSuccess }: SetPasswordScreenProps) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError('As senhas não conferem.')
      return
    }
    try {
      await submitPassword(password)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao definir a senha.')
    }
  }

  return (
    <main className="auth">
      <div className="auth__brand">
        <h1 className="auth__title">Definir senha</h1>
        <p className="auth__subtitle">
          Primeiro acesso: escolha uma senha forte para proteger seus cards.
        </p>
      </div>

      <form onSubmit={handleSubmit} aria-label="Definir senha">
        <div className="field">
          <label className="field__label" htmlFor="new-password">
            Nova senha
          </label>
          <input
            id="new-password"
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
            autoFocus
          />
        </div>

        <div className="field">
          <label className="field__label" htmlFor="confirm-password">
            Confirmar senha
          </label>
          <input
            id="confirm-password"
            className="input"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repita a senha"
            autoComplete="new-password"
          />
        </div>

        <button type="submit" className="button button--primary button--block">
          Salvar
        </button>

        {error && (
          <p className="msg msg--error" role="alert">
            {error}
          </p>
        )}
      </form>
    </main>
  )
}

