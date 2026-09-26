import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import DeviceList from '../../src/components/DeviceList'
import { fetchDevices, revokeDevice } from '../../src/services/api'

vi.mock('../../src/services/api', () => ({
  fetchDevices: vi.fn(),
  revokeDevice: vi.fn(),
}))

describe('DeviceList', () => {
  it('renders the devices and revokes one', async () => {
    vi.mocked(fetchDevices).mockResolvedValue([
      { id: 'd1', name: 'Chrome no Android', created_at: 'c', last_used_at: 'l' },
    ])
    vi.mocked(revokeDevice).mockResolvedValue(undefined)

    render(<DeviceList onBack={() => {}} />)
    expect(await screen.findByText('Chrome no Android')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Revogar' }))
    await waitFor(() => expect(revokeDevice).toHaveBeenCalledWith('d1'))
    await waitFor(() => expect(screen.queryByText('Chrome no Android')).not.toBeInTheDocument())
  })

  it('shows the last use of each device (US2/AC1)', async () => {
    vi.mocked(fetchDevices).mockResolvedValue([
      {
        id: 'd1',
        name: 'Chrome no Android',
        created_at: '2026-09-25T12:00:00+00:00',
        last_used_at: '2026-09-25T12:00:00+00:00',
      },
    ])

    render(<DeviceList onBack={() => {}} />)
    const lastUsed = await screen.findByText(/^Último uso: /)
    // formatted for humans (pt-BR date/time), never the raw ISO string
    expect(lastUsed.textContent).toMatch(/\d{2}\/\d{2}\/\d{4}/)
    expect(lastUsed.textContent).not.toContain('T12:00:00')
  })
})
