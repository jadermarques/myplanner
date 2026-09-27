interface OfflineNoticeProps {
  visible: boolean
}

/** Faixa no fluxo do conteúdo: informa sem sobrepor nada (FR-009).
 *
 * O ícone é desenhado por CSS (`::before`): o texto do `role="alert"` precisa
 * continuar sendo exatamente a mensagem, como os testes verificam.
 */
export default function OfflineNotice({ visible }: OfflineNoticeProps) {
  if (!visible) return null
  return (
    <div className="banner banner--danger" role="alert">
      Você precisa de conexão para usar o app.
    </div>
  )
}
