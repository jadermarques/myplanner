import { useState } from 'react'
import { setPassword as submitPassword } from '../services/api'

interface SetPasswordScreenProps {
  onSuccess: () => void
  totpRequired: boolean
}

export default function SetPasswordScreen({ onSuccess, totpRequired }: SetPasswordScreenProps) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [totp, setTotp] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError('As senhas não conferem.')
      return
    }
    try {
      await submitPassword(password, totpRequired ? totp : undefined)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao definir a senha.')
    }
  }

  return (
    <main className="home">
      <h1 className="title">Definir senha</h1>
      <form onSubmit={handleSubmit} className="card-form" aria-label="Definir senha">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Nova senha (mínimo 8 caracteres)"
          aria-label="Nova senha"
        />
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirmar senha"
          aria-label="Confirmar senha"
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
        <button type="submit">Salvar</button>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </form>
    </main>
  )
}
