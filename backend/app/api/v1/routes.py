import hashlib
import json
from datetime import datetime, timezone
from typing import Any

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Request, status

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
