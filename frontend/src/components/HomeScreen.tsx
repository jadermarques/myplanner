interface HomeScreenProps {
  version: string
}

export default function HomeScreen({ version }: HomeScreenProps) {
  return (
    <main className="home">
      <button type="button" className="insert-card" aria-label="Inserir card" disabled>
        <span className="insert-card__icon" aria-hidden="true">
          ＋
        </span>
        <span className="insert-card__label">Inserir card</span>
        <span className="insert-card__badge">em breve</span>
      </button>
      <footer className="footer">
        <span>v{version}</span>
      </footer>
    </main>
  )
}
