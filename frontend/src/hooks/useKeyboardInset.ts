import { useEffect, useState } from 'react'

/**
 * Altura que o teclado do sistema rouba da área visível.
 *
 * No Android a janela é redimensionada e nada é necessário; no iOS a janela de
 * layout permanece e só a "+visual" encolhe — sem isso a barra de ação ficaria
 * atrás do teclado. Devolve 0 quando a API não existe (ex.: testes em jsdom).
 */
export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0)

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return

    const update = () => {
      const overlap = window.innerHeight - viewport.height - viewport.offsetTop
      setInset(overlap > 80 ? Math.round(overlap) : 0)
    }

    viewport.addEventListener('resize', update)
    viewport.addEventListener('scroll', update)
    update()
    return () => {
      viewport.removeEventListener('resize', update)
      viewport.removeEventListener('scroll', update)
    }
  }, [])

  return inset
}
