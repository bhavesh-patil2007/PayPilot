# Sponsor integrations

This page records which sponsor technologies are present in the PayPilot code and what is still conditional. A brand mention or planned adapter is not counted as a completed integration.

## Implemented in this repository

| Sponsor | Evidence in the project | State |
| --- | --- | --- |
| PayPal | Backend Sandbox credential check, webhook signature verification, and durable verified-event storage. See `backend/app/integrations/paypal.py` and `backend/app/api/v1/routes.py`. | Implemented; needs PayPal Sandbox credentials and a database to run end to end. |
| AG Grid | React data grids power the recovery inbox, payment reconciliation table, and Udhari ledger. | Implemented in the frontend. |
| Postman | `postman/PayPilot.postman_collection.json` contains health, commitment assessment, PayPal status, and protected connection-check requests. | Importable collection; run against a configured API. |
| Render | `render.yaml` declares the FastAPI and Vite static services. | Deployment blueprint; requires Render setup and production environment values. |
| APIMatic | FastAPI publishes its OpenAPI contract at `/openapi.json`, which can be imported into APIMatic. | API contract is available; APIMatic account-side generation is not performed by this repository. |

## Still needs partner access or a real implementation

Astropods, Bryntum, Channel3, Elastic, KERNEL, and Zapier MCP are not claimed as integrations. They require an agreed product use, vendor account/credentials or license, and working feature code before they can be marked implemented. No sponsor API keys belong in the frontend or source control.

## Deploying with Render

1. Create a Blueprint from this repository using `render.yaml`.
2. Enter the backend secrets when Render prompts for the `sync: false` variables. Database and Supabase configuration are needed for persisted webhooks and authenticated PayPal checks; PayPal credentials are needed for the Sandbox connection check.
3. After the frontend service exists, update the API's `CORS_ORIGINS` value in Render to the exact HTTPS origin of the deployed frontend. The blueprint's localhost default is only for local development.
4. Confirm the backend at `/api/v1/health`, then redeploy the frontend if the API host reference changed.

Blueprint fields and secret handling follow [Render's Blueprint YAML reference](https://render.com/docs/blueprint-spec). The Postman file uses the v2.1 collection format documented by [Postman](https://learning.postman.com/docs/use/use-collections/collections-schemas).

## APIMatic handoff

Run the backend and import `http://localhost:8000/openapi.json` into APIMatic, or use the deployed backend's `/openapi.json` URL. Review the imported schema before generating an SDK; do not publish generated clients as vendor-certified without validating them.
