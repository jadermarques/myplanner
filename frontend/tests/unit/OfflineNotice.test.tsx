import { render, screen } from '@testing-library/react'
import OfflineNotice from '../../src/components/OfflineNotice'

describe('OfflineNotice', () => {
  it('renders the connection message when visible', () => {
    render(<OfflineNotice visible />)
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Você precisa de conexão para usar o app.',
    )
  })

  it('renders nothing when hidden', () => {
    const { container } = render(<OfflineNotice visible={false} />)
    expect(container).toBeEmptyDOMElement()
  })
})
