import { useState } from 'react'
import { login } from '../services/api'

interface LoginScreenProps {
  onSuccess: () => void
  totpRequired: boolean
}

export default function LoginScreen({ onSuccess, totpRequired }: LoginScreenProps) {
  const [password, setPassword] = useState('')
  const [totp, setTotp] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await login(password, totpRequired ? totp : undefined)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar.')
    }
  }

  return (
    <main className="home">
      <h1 className="title">Entrar</h1>
      <form onSubmit={handleSubmit} className="card-form" aria-label="Login">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
          aria-label="Senha"
        />
        {totpRequired && (
          <input
            type="text"
            inputMode="numeric"
            value={totp}
            onChange={(e) => setTotp(e.target.value)}
            placeholder="Código do autenticador"
            aria-label="Código TOTP"
          />
        )}
        <button type="submit">Entrar</button>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </form>
    </main>
  )
}
