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
            Preise
          </Link>
        </div>
      </nav>

      <header className="landing-hero">
        <div className="landing-inner">
          <p className="eyebrow reveal">Persönliche Organisation</p>
          <h1 className="reveal reveal-d1">
            Aufgaben,
            <br />
            Fortschritt,
            <br />
            <span style={{ color: 'var(--accent-hot)' }}>Geburtstage.</span>
          </h1>
          <p className="lede reveal reveal-d2">
            Eine ruhige Oberfläche für Prioritäten, Fälligkeiten und Erinnerungen. Nach dem Kauf per
            Stripe wird dein Konto freigeschaltet; Administratoren können Zugänge auch manuell
            vergeben.
          </p>
          <div className="cta-row reveal reveal-d3">
            <Link to="/register" className="btn primary">
              Konto erstellen <ArrowRight size={18} strokeWidth={2.25} aria-hidden />
            </Link>
            <Link to="/login" className="btn secondary">
              Einloggen
            </Link>
          </div>
        </div>
      </header>

      <section className="landing-grid" aria-label="Funktionen">
        <div className="feature-card reveal reveal-d2">
          <LayoutList className="feature-icon" size={28} strokeWidth={1.75} aria-hidden />
          <h2>Aufgaben-Dashboard</h2>
          <p>
            Prioritäten, Fälligkeiten und ein Fortschrittsring — erledigt und offen im gleichen
            Atemzug.
          </p>
        </div>
        <div className="feature-card reveal reveal-d3">
          <CalendarRange className="feature-icon" size={28} strokeWidth={1.75} aria-hidden />
          <h2>Kalender &amp; Geburtstage</h2>
          <p>
            Kontakte mit Datum und Zeitzone; E-Mails um <strong>06:00</strong> lokal am Wohnort —
            per gespeicherter Zeitzone, nicht Live-GPS.
          </p>
        </div>
        <div className="feature-card reveal reveal-d4">
          <Bell className="feature-icon" size={28} strokeWidth={1.75} aria-hidden />
          <h2>Desktop Windows &amp; Mac</h2>
          <p>
            System-Benachrichtigungen für Fälliges und Geburtstage — die Website muss nicht offen
            bleiben.
          </p>
        </div>
        <div className="feature-card reveal reveal-d5">
          <CheckCircle2 className="feature-icon" size={28} strokeWidth={1.75} aria-hidden />
          <h2>Hosting</h2>
          <p>
            Frontend statisch; Backend über Supabase Free Tier und geplante Aufrufe per externem
            Cron.
          </p>
        </div>
      </section>

      <footer className="landing-foot">
        <Link to="/pricing">Preise &amp; Freischaltung</Link>
        <span className="dot" aria-hidden>
          ·
        </span>
        <Link to="/register">Registrieren</Link>
      </footer>
    </div>
  )
}
