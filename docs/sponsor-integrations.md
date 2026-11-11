# Sponsor integrations

This page records which sponsor technologies are present in the PayPilot code and what is still conditional. A brand mention or planned adapter is not counted as a completed integration.

## Implemented in this repository

| Sponsor | Evidence in the project | State |
| --- | --- | --- |
| PayPal | Backend Sandbox credential check, webhook signature verification, and idempotent durable webhook intake. See `backend/app/integrations/paypal.py` and `backend/app/api/v1/routes.py`. | Partial: H.8 invoice/payment flow and webhook-to-case/Digital-Twin application are still missing. |
| AG Grid | AG Grid React data grids power the recovery inbox, payment reconciliation table, and Udhari ledger. | H.8 grid evidence is present. This does not claim a separate AG Studio integration. |
| Channel3 | Authenticated backend proxy searches the live product API and returns provider provenance plus fetched timestamp. | Adapter implemented; requires Channel3 API key, Supabase sign-in, and judge-visible purchase-analysis context. |
| Elastic | Authenticated evidence search derives workspace IDs from the caller's database memberships and applies the filter server-side. | Adapter implemented; requires a populated `paypilot-evidence` index and read-only key. No ingestion pipeline is included yet. |
| Postman | `postman/PayPilot.postman_collection.json` contains the current API requests. | H.8 not met: replay/tamper/workspace-authorization negative cases and a successful Newman run still need to be added. |
| Render | `render.yaml` declares the FastAPI and Vite static services. | Blueprint only; H.8 hosted health and durable idempotent job workflow are not verified or implemented. |
| APIMatic | FastAPI publishes its OpenAPI contract at `/openapi.json`. | H.8 not met: no Context Plugin use or APIMatic-generated typed PayPal client is present. |

## Still needs partner access or a real implementation

AG Studio, Astropods, Bryntum, KERNEL, and Zapier MCP do not yet meet H.8. They require an agreed product use and working feature code; AG Studio/Bryntum also require vendor package/license access. Astropods, KERNEL, and Zapier MCP need accounts/credentials and user-authorized scopes. No sponsor API keys belong in the frontend or source control.

## Deploying with Render

1. Create a Blueprint from this repository using `render.yaml`.
2. Enter the backend secrets when Render prompts for the `sync: false` variables. Database and Supabase configuration are needed for persisted webhooks and authenticated PayPal checks; PayPal credentials are needed for the Sandbox connection check.
3. After the frontend service exists, update the API's `CORS_ORIGINS` value in Render to the exact HTTPS origin of the deployed frontend. The blueprint's localhost default is only for local development.
4. Confirm the backend at `/api/v1/health`, then redeploy the frontend if the API host reference changed.
5. Add the same Supabase project URL and publishable key to the frontend build environment as `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to enable sign-in for protected sponsor workflows.

Blueprint fields and secret handling follow [Render's Blueprint YAML reference](https://render.com/docs/blueprint-spec). The Postman file uses the v2.1 collection format documented by [Postman](https://learning.postman.com/docs/use/use-collections/collections-schemas).

## API contract handoff

Run the backend and import `http://localhost:8000/openapi.json` into APIMatic, or use the deployed backend's `/openapi.json` URL. Review the imported schema before generating an SDK; do not publish generated clients as vendor-certified without validating them.
