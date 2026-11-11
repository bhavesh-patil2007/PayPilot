# Sponsor integrations

This page tracks the sponsor integrations still present in FinCora and their current limits. Adapter code alone does not prove credentials, vendor setup, or H.8 judge evidence.

| Sponsor | Current use | State and setup |
| --- | --- | --- |
| PayPal | Sandbox auth/webhook verification and durable event intake. The backend uses PayPal's APIMatic-generated typed SDK for OAuth. | Partial: the full invoice/payment path and webhook-to-case/Digital-Twin update are not complete. |
| AG Grid | Recovery, payment reconciliation, and ledger grids. | Community grids are present. |
| AG Studio | Recovery dashboard with guarded, read-only status filters. | Trial frontend package; production license may be required. |
| APIMatic | PayPal Context Plugin installed in local VS Code; generated PayPal Server SDK used in the backend adapter. | Reload VS Code to activate the plugin. No APIMatic key is needed at runtime. |
| Bryntum | Commitment Gantt with local due-date scenario and reserve-breach preview. | Trial package; changes are not persisted and production license may be required. |
| Channel3 | Authenticated server-side product search with provenance and fetch time. | Requires valid Channel3 credentials and a signed-in Supabase user. Search does not place an order. |
| Elastic | Private Supabase evidence storage, page indexing, and tenant-filtered evidence search. | Apply the evidence storage migration and configure Elastic/Supabase before upload. |
| KERNEL | User-triggered read-only public-page retrieval with a review trace. | Disabled until a newly rotated scoped key is configured and the rotation flag is set. |
| Postman | Versioned collection with smoke and authorization-negative requests. | Newman run succeeds locally; authenticated integration calls still need a real Supabase session. |
| Render | API, static frontend, and idempotent review workflow defined in `render.yaml`. | Hosted run needs Render API credentials and the workflow slug. |
| Zapier MCP | Tool discovery and an explicit-approval action flow with audit metadata; financial tools are blocked. | No action is enabled until a tool name is placed on the server allowlist. |

Secrets stay on the backend and must not be committed or exposed through `VITE_` variables. See [environment configuration](environment-configuration.md) for variable names and setup details.
