# PayPilot

PayPilot is an AI-assisted financial intelligence platform for small businesses. It helps teams find recoverable money, reconcile payment records, and understand how upcoming commitments affect cash flow.

The project includes a React and TypeScript frontend plus a FastAPI backend. The frontend includes a recovery inbox, payment reconciliation views, commitment planning, cash-flow simulations, and demo sandbox actions. The backend provides a deterministic commitment assessment API, validates Supabase Auth sessions for protected integration checks, validates PayPal Sandbox credentials server-side, and durably stores only verified webhook events.

## Run locally

Install dependencies once if they are not already installed:

```bash
cd frontend && npm ci
cd ..
python3 -m venv backend/.venv
backend/.venv/bin/pip install -r backend/requirements.txt
```

Start the frontend and backend together from the repository root:

```bash
./scripts/dev.sh
```

The script automatically chooses free ports (starting at 5174 for the frontend
and 8011 for the backend), points the frontend at that backend, and configures
local CORS. It prints the URLs when both servers start. Press Ctrl+C to stop
both processes. Existing `.env` files are left untouched.

## Build and checks

```bash
cd frontend
npm run build
npm test
```

## Run the backend

Use Python 3.11 or newer. From the repository root:

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
python3 -m venv backend/.venv
source backend/.venv/bin/activate
pip install -r backend/requirements.txt
uvicorn app.main:app --app-dir backend --reload
```

The API health endpoint works without credentials. Supabase Auth, Postgres webhook storage, and PayPal Sandbox checks require the corresponding server-side values in `.env`. The backend rejects non-Sandbox PayPal URLs. The Settings screen's **Check API** control shows which services are configured.

## Sign in

The app opens on a sign-in page. For the local sample workspace, use
`demo@paypilot.local` / `PayPilotDemo2026!`. This shared demo login only opens
sample data in the browser; it does not authorize protected backend integrations.
For a real Supabase account, set `VITE_SUPABASE_URL` and
`VITE_SUPABASE_PUBLISHABLE_KEY` in `frontend/.env`, then restart the dev launcher.
The server-side `.env` may also use `SUPABASE_URL` and
`SUPABASE_PUBLISHABLE_KEY`. Never place a Supabase secret or service-role key in
the frontend or in a `VITE_` variable.

The initial Supabase schema and tenant RLS policies are in `supabase/migrations/`. Apply the migration to a local or staging Supabase project before using persistence. The migration is not applied to any hosted database by this repository.

See [PROJECT.md](PROJECT.md) for the product and architecture brief, and [TEST_INFRA.md](TEST_INFRA.md) for the test strategy.
