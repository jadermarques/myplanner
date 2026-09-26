import { useEffect, useState } from 'react'
import { Device, fetchDevices, revokeDevice } from '../services/api'

function formatLastUsed(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

interface DeviceListProps {
  onBack: () => void
}

export default function DeviceList({ onBack }: DeviceListProps) {
  const [devices, setDevices] = useState<Device[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDevices()
      .then(setDevices)
      .catch(() => setError('Não foi possível carregar os aparelhos.'))
  }, [])

  const handleRevoke = async (deviceId: string) => {
    setError(null)
    try {
      await revokeDevice(deviceId)
      setDevices((list) => list.filter((device) => device.id !== deviceId))
    } catch {
      setError('Não foi possível revogar o aparelho.')
    }
  }

  return (
    <div className="card-form" aria-label="Aparelhos">
      <button type="button" onClick={onBack}>
        Voltar
      </button>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <ul className="device-list">
        {devices.map((device) => (
          <li key={device.id}>
            <span className="device-info">
              <strong>{device.name}</strong>
              <small>Último uso: {formatLastUsed(device.last_used_at)}</small>
            </span>
            <button type="button" onClick={() => handleRevoke(device.id)}>
              Revogar
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
