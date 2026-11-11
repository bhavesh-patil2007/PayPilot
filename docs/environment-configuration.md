# Environment configuration

The backend reads the repository-root `.env`; Vite reads `frontend/.env`. Both files are ignored by Git. Copy the corresponding example and restart the affected process after changing values. Never put server credentials in `VITE_` variables.

## Backend configuration

| Variables | Purpose |
| --- | --- |
| `APP_ENV`, `CORS_ORIGINS` | API environment label and allowed frontend origins. |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `DATABASE_URL` | Auth validation, tenant membership lookup, audit records, webhook persistence, and the private evidence bucket. |
| `PAYPAL_ENVIRONMENT`, `PAYPAL_BASE_URL`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID` | Sandbox PayPal integration. Live credentials are separate in `PAYPAL_LIVE_*`; Sandbox remains the default. |
| `CHANNEL3_API_KEY`, `CHANNEL3_BASE_URL` | Authenticated server-side product search. Keep the API key on the backend. |
| `ELASTICSEARCH_URL`, `ELASTICSEARCH_API_KEY`, `ELASTICSEARCH_INDEX` | Private document-page indexing and tenant-filtered evidence search. A Postgres workspace lookup is required. |
| `KERNEL_API_KEY`, `KERNEL_KEY_ROTATED_AFTER_INCIDENT=true` | User-triggered, read-only browser retrieval for public HTTPS pages. The key must be rotated and scoped before this route is enabled. Requires Postgres to save the review trace. |
| `ZAPIER_MCP_ENDPOINT`, `ZAPIER_MCP_TOKEN`, `ZAPIER_MCP_ALLOWED_TOOLS` | Discover Zapier MCP tools and run only explicitly allowlisted actions after in-app user approval. Leave the allowlist empty until each connected action has been reviewed. |

The PayPal adapter uses PayPal's APIMatic-generated Python Server SDK for its typed OAuth token model. The APIMatic Context Plugin is installed in VS Code user settings; reload VS Code to activate it. The Postman collection requires no Postman API key.

The frontend uses AG Grid Community and evaluation packages for AG Studio and Bryntum. Production use of AG Studio or Bryntum may require vendor licenses. No license value belongs in Git.

## Frontend configuration

| Variables | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Browser-visible backend URL. The local launcher and Render set this automatically. |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | Enables real Supabase password sign-in. These are browser-visible publishable values; never use a Supabase secret or service-role key here. |

## Evidence storage setup

Apply the migrations in `supabase/migrations/` to the Supabase project before uploading evidence. `20261112120000_private_evidence_storage.sql` creates a private bucket and workspace-membership policies. Uploads accept PDF, TXT, Markdown, and CSV up to 8 MB; the backend stores the original privately and indexes extracted page text with its workspace ID. Evidence search derives workspace IDs from the authenticated user, never from a browser parameter.

## Current integration behavior

- **PayPal + APIMatic:** Sandbox and Live credential pairs remain isolated. The official generated SDK performs typed OAuth; webhook verification and idempotent webhook persistence remain in the adapter. The full invoice/payment plus Digital Twin judge path is still incomplete.
- **AG Grid / AG Studio:** Recovery and operations grids use AG Grid. The Sponsor Integrations page contains a trial AG Studio recovery dashboard; its guarded natural-language commands only filter a status view.
- **Bryntum:** The Commitments page contains a trial Bryntum Gantt. Dragging a milestone updates a local scenario preview and reserve-breach calculation only; it does not save or pay a commitment.
- **Channel3:** Live search runs server-side and returns provider provenance and a fetch time. It is available from the sponsor page for purchase analysis; it never purchases a result.
- **Elastic:** Evidence originals are stored in private Supabase Storage; extracted pages are indexed and searched with a mandatory tenant filter. Apply migrations and configure an Elastic index before use.
- **KERNEL:** A signed-in user can retrieve title and text from a public HTTPS page on one hostname. The task performs no clicks or form submissions, saves a review trace, and destroys its short-lived browser session. The vendor disclosed a Nov. 4, 2026 security incident involving a small number of API keys and third-party secrets; keep this integration disabled until using a newly rotated scoped key and setting the explicit rotation flag. [KERNEL incident notice](https://www.headfulbrowsercompany.com/blog/public-notice-of-security-incident-nov-4-2026)
- **Postman:** The versioned collection includes API health, commitment assessment, integration status, auth-gating checks, and an unsigned PayPal webhook replay check. Run `npx newman run postman/PayPilot.postman_collection.json --env-var baseUrl=http://localhost:8000` or open it in Postman. Authenticated collection requests need a real Supabase access token.
- **Render hosting:** `render.yaml` defines the API and static frontend deployment.
- **Zapier MCP:** The app lists configured MCP actions; execution requires an explicit server allowlist and user approval. Results are written to workspace audit history. No external action runs during startup or automatically.

## Not claimed as complete

Sponsor code paths do not by themselves prove external account setup, valid credentials, successful hosted deployment, vendor license entitlement, or judge acceptance. `GET /api/v1/integrations/status` reports adapter presence and available configuration without revealing secret values. The listed integrations are intentionally reported as partial until their H.8 evidence is actually demonstrated.
