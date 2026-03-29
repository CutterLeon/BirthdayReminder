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
          <p className="eyebrow reveal">Alles, was du nicht vergessen willst</p>
          <h1 className="reveal reveal-d1">
            Aufgaben,
            <br />
            Fokus,
            <br />
            <span style={{ color: 'var(--accent-hot)' }}>Geburtstage.</span>
          </h1>
          <p className="lede reveal reveal-d2">
            Organizer bündelt To-dos, Fälligkeiten und Geburtstags-Erinnerungen an einem Ort. Nach
            der einmaligen Freischaltung per Zahlung ist dein Konto sofort nutzbar — Admins können
            Zugänge bei Bedarf auch manuell freigeben.
          </p>
          <div className="cta-row reveal reveal-d3">
            <Link to="/register" className="btn primary">
              Konto erstellen <ArrowRight size={18} strokeWidth={2.25} aria-hidden />
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
          <h2>Aufgaben im Griff</h2>
          <p>
            Prioritäten, Fälligkeiten und ein klarer Fortschrittsring — du siehst auf einen Blick,
            was noch offen ist und was erledigt ist.
          </p>
        </div>
        <div className="feature-card reveal reveal-d3">
          <CalendarRange className="feature-icon" size={28} strokeWidth={1.75} aria-hidden />
          <h2>Geburtstage mit lokaler Zeit</h2>
          <p>
            Speichere Kontakte mit Datum und Zeitzone. Erinnerungs-Mails gehen um{' '}
            <strong>06:00 Uhr</strong> in der Zeitzone des Kontakts — ohne Standortverfolgung, nur
            die einmal hinterlegte Region.
          </p>
        </div>
        <div className="feature-card reveal reveal-d4">
          <Bell className="feature-icon" size={28} strokeWidth={1.75} aria-hidden />
          <h2>Desktop-App (Windows &amp; Mac)</h2>
          <p>
            Lokale Systembenachrichtigungen für fällige Aufgaben und Geburtstage — du musst den
            Browser nicht dauernd offen halten.
          </p>
        </div>
        <div className="feature-card reveal reveal-d5">
          <CheckCircle2 className="feature-icon" size={28} strokeWidth={1.75} aria-hidden />
          <h2>Einfacher Betrieb</h2>
          <p>
            Schnelles, statisches Frontend; Daten und Auth laufen über Supabase. Geplante Jobs
            (z. B. E-Mails) lassen sich per externem Cron anbinden.
          </p>
        </div>
      </section>

      <footer className="landing-foot">
        <Link to="/pricing">Freischaltung &amp; Preis</Link>
        <span className="dot" aria-hidden>
          ·
        </span>
        <Link to="/register">Registrieren</Link>
      </footer>
    </div>
  )
}
