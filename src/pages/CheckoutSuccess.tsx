import { Link } from 'react-router-dom'

export function CheckoutSuccess() {
  return (
    <div className="auth-page">
      <div className="card narrow">
        <h1>Zahlung erfolgreich</h1>
        <p>
          Dein Konto wird gleich freigeschaltet — das dauert in der Regel nur wenige Sekunden.
          Anschließend hast du vollen Zugriff auf Aufgaben und Geburtstage.
        </p>
        <Link to="/app" className="btn primary">
          Weiter zum Dashboard
        </Link>
      </div>
    </div>
  )
}
