interface OfflineNoticeProps {
  visible: boolean
}

export default function OfflineNotice({ visible }: OfflineNoticeProps) {
  if (!visible) return null
  return (
    <div className="offline-notice" role="alert">
      Você precisa de conexão para usar o app.
    </div>
  )
}
