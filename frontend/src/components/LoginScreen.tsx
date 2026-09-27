import { useState } from 'react'
import { login } from '../services/api'

interface LoginScreenProps {
  onSuccess: () => void
}

export default function LoginScreen({ onSuccess }: LoginScreenProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await login(password)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar.')
    }
  }

  return (
    <main className="auth">
      <div className="auth__brand">
        <h1 className="auth__title">Entrar</h1>
        <p className="auth__subtitle">MyPlanner — cards no Trello em segundos.</p>
      </div>

      <form onSubmit={handleSubmit} aria-label="Login">
        <div className="field">
          <label className="field__label" htmlFor="login-password">
            Senha
          </label>
          <input
            id="login-password"
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Sua senha"
            autoComplete="current-password"
            autoFocus
          />
        </div>

        <button type="submit" className="button button--primary button--block">
          Entrar
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


