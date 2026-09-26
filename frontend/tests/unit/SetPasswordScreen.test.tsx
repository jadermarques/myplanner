import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import SetPasswordScreen from '../../src/components/SetPasswordScreen'
import { setPassword } from '../../src/services/api'

vi.mock('../../src/services/api', () => ({
  setPassword: vi.fn(),
}))

describe('SetPasswordScreen', () => {
  it('shows the TOTP field when the device is not registered', () => {
    render(<SetPasswordScreen onSuccess={() => {}} totpRequired />)
    expect(screen.getByLabelText('Código TOTP')).toBeInTheDocument()
  })

  it('hides the TOTP field on an already registered device', () => {
    render(<SetPasswordScreen onSuccess={() => {}} totpRequired={false} />)
    expect(screen.queryByLabelText('Código TOTP')).not.toBeInTheDocument()
  })

  it('submits the password together with the TOTP code', async () => {
    vi.mocked(setPassword).mockResolvedValue(undefined)
    const onSuccess = vi.fn()
    render(<SetPasswordScreen onSuccess={onSuccess} totpRequired />)

    fireEvent.change(screen.getByLabelText('Nova senha'), { target: { value: 'senha123' } })
    fireEvent.change(screen.getByLabelText('Confirmar senha'), { target: { value: 'senha123' } })
    fireEvent.change(screen.getByLabelText('Código TOTP'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    expect(setPassword).toHaveBeenCalledWith('senha123', '123456')
  })
})
