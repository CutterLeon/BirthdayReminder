# Organizer

Web- und Desktop-Organizer: **Aufgaben** mit PrioritÃ¤t und FÃ¤lligkeit, **Dashboard** mit erledigt/offen in Prozent, **Geburtstage** mit Zeitzone, **Stripe**-Freischaltung nach Kauf, **Admin**-Einladungen, **E-Mail**-Erinnerungen (06:00 lokale Kontaktzeit), **Tauri**-App mit Pop-up-Benachrichtigungen.

## Voraussetzungen

- Node 20+
- Supabase CLI (optional) fÃ¼r Migrationen und Functions
- FÃ¼r Desktop: Rust + Tauri-AbhÃ¤ngigkeiten

## Entwicklung Web

```bash
cp .env.example .env
npm install
npm run dev
```

Lege eine `.env` mit `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY` an.

## Supabase

1. SQL aus `supabase/migrations/20260329100000_initial.sql` ausfÃ¼hren.
2. Auth E-Mail/Passwort aktivieren.
3. Edge Functions deployen; Secrets: `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `RESEND_FROM`, `CRON_SECRET`.
4. Stripe-Webhook: `checkout.session.completed`, Ziel-URL `.../functions/v1/stripe-webhook`.

**Cron** (z. B. alle 15 Min): `POST .../functions/v1/daily-reminders` mit Header `Authorization: Bearer <CRON_SECRET>`.

## Erster Admin

```sql
update public.profiles set role = 'admin', is_active = true where email = 'du@example.com';
```

## Desktop

```bash
npm run build
npm run desktop:dev
npm run desktop:build
```

## Statisches Hosting

`npm run build` erzeugt `dist/`.

## E2E-Smoke (Playwright)

Python 3 mit pip, dann:

```bash
py -m pip install -r requirements-test.txt
py -m playwright install chromium
npm run test:e2e
```

Startet Vite auf Port **5179** (vermeidet Konflikte), fÃ¼hrt `scripts/e2e_smoke.py` aus und beendet den Server inkl. Kindprozessen (Windows: `taskkill /T`).
