import hashlib
import json
from datetime import datetime, timezone
from typing import Any

import asyncpg
import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from urllib.parse import quote

from ...core.auth import AuthenticatedUser, require_supabase_user
from ...core.config import Settings, get_settings
from ...domain.commitment_assessment import assess_commitment
from ...integrations.paypal import PayPalClient, PayPalNotConfigured, PayPalUnavailable
from ...schemas.commitments import CommitmentAssessmentRequest, CommitmentAssessmentResponse


router = APIRouter()


@router.get("/health")
async def health(request: Request, settings: Settings = Depends(get_settings)) -> dict[str, Any]:
    return {
        "status": "ok",
        "service": "paypilot-api",
        "environment": settings.app_env,
        "database_configured": bool(request.app.state.database_pool),
        "supabase_auth_configured": bool(settings.supabase_url and settings.supabase_publishable_key),
        "paypal_sandbox_configured": settings.paypal_configured,
        "paypal_webhooks_configured": settings.paypal_webhooks_configured,
    }


@router.post("/commitments/assess", response_model=CommitmentAssessmentResponse)
async def commitment_assessment(payload: CommitmentAssessmentRequest) -> CommitmentAssessmentResponse:
    return assess_commitment(payload)


@router.get("/integrations/paypal/status")
async def paypal_status(settings: Settings = Depends(get_settings)) -> dict[str, str | bool]:
    return {
        "provider": "paypal",
        "environment": "sandbox",
        "configured": settings.paypal_configured,
        "webhooks_configured": settings.paypal_webhooks_configured,
    }


@router.get("/integrations/status")
async def integration_status(settings: Settings = Depends(get_settings)) -> dict[str, Any]:
    """Report implemented/configured status without exposing secrets."""
    return {
        "integrations": [
            {"id": "paypal", "name": "PayPal", "implemented": True, "configured": settings.paypal_webhooks_configured, "evidence": "Sandbox OAuth and signature-verified webhook intake; invoice/payment judge path remains incomplete."},
            {"id": "ag-grid", "name": "AG Grid", "implemented": True, "configured": True, "evidence": "Interactive recovery, reconciliation, and ledger grids."},
            {"id": "ag-studio", "name": "AG Studio", "implemented": False, "configured": False, "evidence": "Requires licensed AG Studio React package and configured AI provider."},
            {"id": "apimatic", "name": "APIMatic", "implemented": False, "configured": False, "evidence": "OpenAPI is exposed; no APIMatic-generated typed PayPal client or Context Plugin evidence yet."},
            {"id": "astropods", "name": "Astropods", "implemented": False, "configured": settings.astropods_configured, "evidence": "Agent run workflow is not connected to PayPilot tools or persisted traces."},
            {"id": "bryntum", "name": "Bryntum", "implemented": False, "configured": False, "evidence": "Current commitment timeline is custom SVG; Bryntum package and license are not installed."},
            {"id": "channel3", "name": "Channel3", "implemented": True, "configured": settings.channel3_configured, "evidence": "Server-side product search proxy returns provider provenance and fetch timestamp."},
            {"id": "elastic", "name": "Elastic", "implemented": True, "configured": settings.elasticsearch_configured, "evidence": "Evidence search is server-side, derives active workspaces from the authenticated user, and applies a mandatory workspace filter."},
            {"id": "kernel", "name": "KERNEL", "implemented": False, "configured": settings.kernel_configured, "evidence": "User-authorized browser-task policy and trace storage are not implemented."},
            {"id": "postman", "name": "Postman", "implemented": True, "configured": True, "evidence": "Versioned collection is present; required negative scenarios and successful run evidence remain incomplete."},
            {"id": "render", "name": "Render", "implemented": True, "configured": False, "evidence": "Blueprint is present; hosted health and durable job workflow are not verified."},
            {"id": "zapier", "name": "Zapier MCP", "implemented": False, "configured": settings.zapier_mcp_configured, "evidence": "Approved external action and saved result/audit flow are not implemented."},
        ]
    }


@router.post("/integrations/channel3/search")
async def channel3_product_search(
    query: str = Query(min_length=2, max_length=240),
    limit: int = Query(default=10, ge=1, le=20),
    user: AuthenticatedUser = Depends(require_supabase_user),
    settings: Settings = Depends(get_settings),
) -> dict[str, Any]:
    """Search Channel3 through a server-side key and return provenance."""
    del user  # Validate the caller before using the shared provider credential.
    if not settings.channel3_configured:
        raise HTTPException(status_code=503, detail="Channel3 API key is not configured on the backend.")
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                f"{settings.channel3_base_url.rstrip('/')}/v1/search",
                headers={"x-api-key": settings.channel3_api_key.get_secret_value(), "Accept": "application/json"},
                json={"query": query, "limit": limit},
            )
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="Channel3 product search is temporarily unavailable.") from exc
    if response.status_code == 401:
        raise HTTPException(status_code=502, detail="Channel3 rejected the configured API key.")
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail="Channel3 could not complete product search.")
    payload = response.json()
    products = payload.get("data", payload.get("items", payload.get("products", []))) if isinstance(payload, dict) else []
    return {
        "provider": "Channel3",
        "query": query,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "products": products if isinstance(products, list) else [],
    }


@router.post("/integrations/elastic/evidence-search")
async def elastic_evidence_search(
    request: Request,
    query: str = Query(min_length=2, max_length=240),
    user: AuthenticatedUser = Depends(require_supabase_user),
    settings: Settings = Depends(get_settings),
) -> dict[str, Any]:
    """Search evidence only inside workspace IDs resolved from the auth user."""
    if not settings.elasticsearch_configured:
        raise HTTPException(status_code=503, detail="Elastic evidence search is not configured on the backend.")
    pool: asyncpg.Pool | None = request.app.state.database_pool
    if pool is None:
        raise HTTPException(status_code=503, detail="Workspace database is required for tenant-scoped evidence search.")
    try:
        user_id = __import__("uuid").UUID(user.id)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Authenticated user identity is invalid.") from exc
    async with pool.acquire() as connection:
        workspace_ids = await connection.fetch(
            """
            SELECT DISTINCT w.id::text AS id
            FROM public.workspaces w
            LEFT JOIN public.workspace_members wm ON wm.workspace_id = w.id
            WHERE w.created_by = $1 OR (wm.user_id = $1 AND wm.status = 'active')
            """,
            user_id,
        )
    allowed_workspaces = [row["id"] for row in workspace_ids]
    if not allowed_workspaces:
        return {"provider": "Elastic", "query": query, "fetched_at": datetime.now(timezone.utc).isoformat(), "evidence": []}

    endpoint = f"{settings.elasticsearch_url.rstrip('/')}/{quote(settings.elasticsearch_index, safe='-_')}/_search"
    body = {
        "size": 10,
        "_source": ["workspace_id", "title", "content", "source_url", "page", "created_at"],
        "query": {
            "bool": {
                "must": [{"multi_match": {"query": query, "fields": ["title^2", "content"]}}],
                "filter": [{"terms": {"workspace_id": allowed_workspaces}}],
            }
        },
        "highlight": {"fields": {"content": {"fragment_size": 240, "number_of_fragments": 1}}},
    }
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            response = await client.post(
                endpoint,
                headers={"Authorization": f"ApiKey {settings.elasticsearch_api_key.get_secret_value()}", "Accept": "application/json"},
                json=body,
            )
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="Elastic evidence search is temporarily unavailable.") from exc
    if response.status_code in (401, 403):
        raise HTTPException(status_code=502, detail="Elastic rejected the configured API key or index permissions.")
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail="Elastic could not complete evidence search.")
    hits = response.json().get("hits", {}).get("hits", [])
    evidence = []
    for hit in hits:
        source = hit.get("_source", {})
        fragments = hit.get("highlight", {}).get("content", [])
        snippet = fragments[0] if fragments else str(source.get("content", ""))[:240]
        evidence.append({
            "id": hit.get("_id"),
            "title": source.get("title") or "Evidence record",
            "snippet": snippet,
            "source_url": source.get("source_url"),
            "page": source.get("page"),
            "score": hit.get("_score"),
        })
    return {"provider": "Elastic", "query": query, "fetched_at": datetime.now(timezone.utc).isoformat(), "evidence": evidence}


@router.post("/integrations/paypal/connection-check")
async def paypal_connection_check(
    user: AuthenticatedUser = Depends(require_supabase_user),
    settings: Settings = Depends(get_settings),
) -> dict[str, str | bool]:
    del user  # The session is validated before spending a provider API call.
    try:
        await PayPalClient(settings).access_token()
    except PayPalNotConfigured as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="PayPal Sandbox credentials are not configured on this backend.",
        ) from exc
    except PayPalUnavailable as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="PayPal Sandbox could not validate the configured credentials.",
        ) from exc
    return {"provider": "paypal", "environment": "sandbox", "connected": True}


@router.post("/webhooks/paypal", status_code=status.HTTP_202_ACCEPTED)
async def receive_paypal_webhook(request: Request, settings: Settings = Depends(get_settings)) -> dict[str, Any]:
    pool: asyncpg.Pool | None = request.app.state.database_pool
    if pool is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Webhook storage is not configured; the event was not acknowledged.",
        )

    raw_body = await request.body()
    try:
        event = json.loads(raw_body)
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON webhook body.") from exc
    if not isinstance(event, dict) or not isinstance(event.get("id"), str) or not event.get("id"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Webhook event ID is required.")

    try:
        verified = await PayPalClient(settings).verify_webhook(request.headers, event)
    except PayPalNotConfigured as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="PayPal webhook verification is not configured.",
        ) from exc
    except PayPalUnavailable as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="PayPal webhook verification is temporarily unavailable.",
        ) from exc
    if not verified:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="PayPal webhook signature is invalid.")

    payload_hash = hashlib.sha256(raw_body).hexdigest()
    received_at = datetime.now(timezone.utc)
    try:
        async with pool.acquire() as connection:
            inserted = await connection.fetchrow(
                """
                INSERT INTO public.webhook_events
                    (provider, event_id, event_type, payload_hash, payload, received_at, verified_at, status)
                VALUES ('paypal', $1, $2, $3, $4::jsonb, $5, $5, 'received')
                ON CONFLICT (provider, event_id) DO NOTHING
                RETURNING event_id, payload_hash
                """,
                event["id"],
                event.get("event_type", "unknown"),
                payload_hash,
                json.dumps(event, separators=(",", ":")),
                received_at,
            )
    except asyncpg.PostgresError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Verified event could not be durably stored; it was not acknowledged.",
        ) from exc

    if inserted is None:
        async with pool.acquire() as connection:
            stored_hash = await connection.fetchval(
                "SELECT payload_hash FROM public.webhook_events WHERE provider = 'paypal' AND event_id = $1",
                event["id"],
            )
        if stored_hash != payload_hash:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A verified webhook reused an event ID with a different payload.",
            )

    return {
        "received": True,
        "duplicate": inserted is None,
        "event_id": event["id"],
        "processing_status": "received",
    }
