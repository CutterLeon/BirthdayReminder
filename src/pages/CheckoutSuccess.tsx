import { Link } from 'react-router-dom'

export function CheckoutSuccess() {
  return (
    <div className="auth-page">
      <div className="card narrow">
        <h1>Zahlung erhalten</h1>
        <p>
          Die Freischaltung erfolgt in wenigen Sekunden über den Webhook. Danach siehst du alle
          Funktionen im Dashboard.
        </p>
        <Link to="/app" className="btn primary">
          Zum Dashboard
        </Link>
      </div>
    </div>
  )
}
