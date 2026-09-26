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
    <form onSubmit={handleSubmit} className="card-form" aria-label="Trocar senha">
      <input
        type="password"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        placeholder="Senha atual"
        aria-label="Senha atual"
      />
      <input
        type="password"
        value={next}
        onChange={(e) => setNext(e.target.value)}
        placeholder="Nova senha"
        aria-label="Nova senha"
      />
      <button type="submit">Trocar</button>
      <button type="button" onClick={onDone}>
        Voltar
      </button>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {done && (
        <p className="success" role="status">
          Senha alterada!
        </p>
      )}
    </form>
  )
}
