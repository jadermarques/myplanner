import { render, screen } from '@testing-library/react'
import HomeScreen from '../../src/components/HomeScreen'

describe('HomeScreen', () => {
  it('renders the "Inserir card" icon with an accessible name', () => {
    render(<HomeScreen version="0.1.0" />)
    expect(screen.getByRole('button', { name: 'Inserir card' })).toBeInTheDocument()
  })

  it('renders the version in the footer', () => {
    render(<HomeScreen version="0.1.0" />)
    expect(screen.getByText('v0.1.0')).toBeInTheDocument()
  })

  it('shows the "em breve" badge (no action yet)', () => {
    render(<HomeScreen version="0.1.0" />)
    expect(screen.getByText('em breve')).toBeInTheDocument()
  })
})
