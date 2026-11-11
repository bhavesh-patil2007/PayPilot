# PayPilot

PayPilot is an AI-assisted financial intelligence platform for small businesses. It helps teams find recoverable money, reconcile payment records, and understand how upcoming commitments affect cash flow.

The project includes a React and TypeScript frontend plus a FastAPI backend. The frontend includes a recovery inbox, payment reconciliation views, commitment planning, cash-flow simulations, and demo sandbox actions. The backend provides a deterministic commitment assessment API, validates Supabase Auth sessions for protected integration checks, validates PayPal Sandbox credentials server-side, and durably stores only verified webhook events.

## Run locally

```bash
cd frontend
npm ci
npm run dev
```

Vite prints the local development URL after it starts.

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

The API is available at `http://localhost:8000/api/v1`; its OpenAPI page is at `http://localhost:8000/docs`. The health endpoint works without credentials. Supabase Auth, Postgres webhook storage, and PayPal Sandbox checks require the corresponding server-side values in `.env`. The backend rejects non-Sandbox PayPal URLs. The Settings screen's **Check API** control shows which services are configured.

The initial Supabase schema and tenant RLS policies are in `supabase/migrations/`. Apply the migration to a local or staging Supabase project before using persistence. The migration is not applied to any hosted database by this repository.

See [PROJECT.md](PROJECT.md) for the product and architecture brief, and [TEST_INFRA.md](TEST_INFRA.md) for the test strategy.
