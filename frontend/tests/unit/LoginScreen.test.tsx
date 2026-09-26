import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import LoginScreen from '../../src/components/LoginScreen'
import { login } from '../../src/services/api'

vi.mock('../../src/services/api', () => ({
  login: vi.fn(),
}))

describe('LoginScreen', () => {
  it('renders the password field and submit button', () => {
    render(<LoginScreen onSuccess={() => {}} />)
    expect(screen.getByLabelText('Senha')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('calls login and onSuccess on submit', async () => {
    vi.mocked(login).mockResolvedValue(undefined)
    const onSuccess = vi.fn()
    render(<LoginScreen onSuccess={onSuccess} />)
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    expect(login).toHaveBeenCalledWith('senha123')
  })

  it('shows the error message on failure', async () => {
    vi.mocked(login).mockRejectedValue(new Error('Senha incorreta.'))
    render(<LoginScreen onSuccess={() => {}} />)
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'errada' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Senha incorreta.')
  })
})
