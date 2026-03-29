import { Link } from 'react-router-dom'
import { ArrowRight, Bell, CalendarRange, CheckCircle2, LayoutList } from 'lucide-react'

export function Landing() {
  return (
    <div className="landing">
      <header className="landing-hero">
        <div className="landing-inner">
          <p className="eyebrow">Persönliche Organisation</p>
          <h1>Organizer — Aufgaben, Fortschritt &amp; Geburtstage</h1>
          <p className="lede">
            Eine schlanke Oberfläche für Prioritäten, Fälligkeiten und Erinnerungen. Nach dem Kauf
            per Stripe wird dein Konto freigeschaltet; Administratoren können Zugänge auch manuell
            vergeben.
          </p>
          <div className="cta-row">
            <Link to="/register" className="btn primary">
              Konto erstellen <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn secondary">
              Anmelden
            </Link>
          </div>
        </div>
      </header>

      <section className="landing-grid">
        <div className="feature-card">
          <LayoutList className="feature-icon" size={28} />
          <h2>Einfaches Aufgaben-Dashboard</h2>
          <p>
            Prioritäten, Fälligkeiten und ein klarer Fortschrittsbalken — was erledigt ist und was
            noch offen bleibt, auf einen Blick.
          </p>
        </div>
        <div className="feature-card">
          <CalendarRange className="feature-icon" size={28} />
          <h2>Kalender &amp; Geburtstage</h2>
          <p>
            Kontakte mit Datum und Zeitzone; E-Mail-Erinnerungen gehen um 06:00{' '}
            <em>lokal am Wohnort</em> der Person (über gespeicherte Zeitzone).
          </p>
        </div>
        <div className="feature-card">
          <Bell className="feature-icon" size={28} />
          <h2>Desktop (Windows &amp; Mac)</h2>
          <p>
            Optionale App mit systemeigenen Pop-ups für fällige Aufgaben und Geburtstage — die
            Webseite muss nicht offen bleiben.
          </p>
        </div>
        <div className="feature-card">
          <CheckCircle2 className="feature-icon" size={28} />
          <h2>Hosting</h2>
          <p>
            Web-Frontend statisch hostbar; Backend über Supabase Free Tier und geplante Aufrufe per
            externem Cron — ohne dauernd laufenden eigenen Server.
          </p>
        </div>
      </section>

      <footer className="landing-foot">
        <Link to="/pricing">Preise &amp; Freischaltung</Link>
        <span className="dot">·</span>
        <Link to="/login">Zum Login</Link>
      </footer>
    </div>
  )
}
