import { Link } from 'react-router-dom'
import { ArrowRight, Bell, CalendarRange, CheckCircle2, LayoutList } from 'lucide-react'

export function Landing() {
  return (
    <div className="landing">
      <nav className="landing-top reveal" aria-label="Hauptnavigation">
        <Link to="/" className="landing-logo">
          Organizer
        </Link>
        <div className="landing-top-links">
          <Link to="/login">Anmelden</Link>
          <Link to="/pricing" className="pill-accent">
            Freischaltung
          </Link>
        </div>
      </nav>

      <header className="landing-hero">
        <div className="landing-inner">
          <p className="eyebrow reveal">Kopf frei. Kalender voll.</p>
          <h1 className="reveal reveal-d1">
            Listen,
            <br />
            Fokus,
            <br />
            <span style={{ color: 'var(--accent-hot)' }}>Geburtstage.</span>
          </h1>
          <p className="lede reveal reveal-d2">
            Organizer ist die schmale Fläche zwischen To-do und Torte: Prioritäten mit Kontur,
            Fälligkeiten mit Rand, und die Tage, die du nicht vergessen darfst. Einmal
            freigeschaltet — sofort produktiv. Wer verwalten muss, kann Zugänge auch manuell
            freigeben.
          </p>
          <div className="cta-row reveal reveal-d3">
            <Link to="/register" className="btn primary">
              Loslegen <ArrowRight size={18} strokeWidth={2.25} aria-hidden />
            </Link>
            <Link to="/login" className="btn secondary">
              Anmelden
            </Link>
          </div>
        </div>
      </header>

      <section className="landing-grid" aria-label="Funktionen">
        <div className="feature-card reveal reveal-d2">
          <LayoutList className="feature-icon" size={28} strokeWidth={1.75} aria-hidden />
          <h2>Alles auf einer Leinwand</h2>
          <p>
            Ein Ring, der zählt: was dringt vor, was kann warten, was ist schon erledigt — ohne
            zwischen fünf Apps zu springen.
          </p>
        </div>
        <div className="feature-card reveal reveal-d3">
          <CalendarRange className="feature-icon" size={28} strokeWidth={1.75} aria-hidden />
          <h2>Geburtstage mit Lokalsinn</h2>
          <p>
            Jeder Kontakt bringt seine Zeitzone mit. Erinnerungen gehen um{' '}
            <strong>06:00 Uhr</strong> dort, wo der Mensch wohnt — einmal hinterlegt, kein
            Standort-Tracking.
          </p>
        </div>
        <div className="feature-card reveal reveal-d4">
          <Bell className="feature-icon" size={28} strokeWidth={1.75} aria-hidden />
          <h2>Auch wenn der Browser schläft</h2>
          <p>
            Native Hinweise auf Windows und Mac — für Fälliges und Geburtstage, ohne dass ein Tab
            offen bleiben muss.
          </p>
        </div>
        <div className="feature-card reveal reveal-d5">
          <CheckCircle2 className="feature-icon" size={28} strokeWidth={1.75} aria-hidden />
          <h2>Leichtgewicht, fest verwurzelt</h2>
          <p>
            Schnelles statisches Frontend, zuverlässige Daten in der Cloud — für dich spürbar
            schnell, technisch ohne Ballast.
          </p>
        </div>
      </section>

      <footer className="landing-foot">
        <Link to="/pricing">Freischalten</Link>
        <span className="dot" aria-hidden>
          ·
        </span>
        <Link to="/register">Konto anlegen</Link>
      </footer>
    </div>
  )
}
