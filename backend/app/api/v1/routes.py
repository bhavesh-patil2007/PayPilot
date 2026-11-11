import hashlib
import io
import ipaddress
import json
import re
import socket
import uuid
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlsplit

import asyncpg
import httpx
from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile, status
from pydantic import BaseModel, Field
from urllib.parse import quote

from ...core.auth import AuthenticatedUser, require_supabase_user
from ...core.config import Settings, get_settings
from ...domain.commitment_assessment import assess_commitment
from ...integrations.paypal import PayPalClient, PayPalNotConfigured, PayPalUnavailable
from ...schemas.commitments import CommitmentAssessmentRequest, CommitmentAssessmentResponse


router = APIRouter()


class KernelEvidenceRequest(BaseModel):
    url: str = Field(min_length=10, max_length=1500)


class ZapierActionRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    arguments: dict[str, Any] = Field(default_factory=dict)
    approved: bool


async def _user_workspace(pool: asyncpg.Pool, user_id: str) -> tuple[uuid.UUID, uuid.UUID]:
    try:
        actor_id = uuid.UUID(user_id)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Authenticated user identity is invalid.") from exc
    async with pool.acquire() as connection:
        row = await connection.fetchrow(
            """SELECT w.id FROM public.workspaces w
               LEFT JOIN public.workspace_members wm ON wm.workspace_id = w.id
               WHERE w.created_by = $1 OR (wm.user_id = $1 AND wm.status = 'active')
               ORDER BY (w.created_by = $1) DESC, w.created_at ASC LIMIT 1""",
            actor_id,
        )
    if row is None:
        raise HTTPException(status_code=403, detail="Create or join a workspace before using sponsor tools.")
    return row["id"], actor_id


async def _write_sponsor_trace(
    pool: asyncpg.Pool,
    workspace_id: uuid.UUID,
    actor_id: uuid.UUID,
    vendor: str,
    target_id: str | None,
    metadata: dict[str, Any],
) -> int:
    async with pool.acquire() as connection:
        return await connection.fetchval(
            """INSERT INTO public.audit_logs
               (workspace_id, actor_id, action, target_type, target_id, reason, metadata)
               VALUES ($1, $2, $3, 'sponsor_task', $4, $5, $6::jsonb) RETURNING id""",
            workspace_id, actor_id, f"sponsor.{vendor}", target_id,
            "User-authorized sponsor workflow", json.dumps(metadata, default=str),
        )


def _zapier_tool_is_financial(name: str, description: str | None) -> bool:
    text = f"{name} {description or ''}".casefold()
    return any(term in text for term in ("payment", "refund", "payout", "transfer", "charge", "checkout", "money movement"))


@router.get("/health")
async def health(request: Request, settings: Settings = Depends(get_settings)) -> dict[str, Any]:
    return {
        "status": "ok",
        "service": "paypilot-api",
        "environment": settings.app_env,
        "database_configured": bool(request.app.state.database_pool),
        "supabase_auth_configured": settings.supabase_auth_configured,
        "paypal_sandbox_configured": settings.paypal_sandbox_configured,
        "paypal_configured": settings.paypal_configured,
        "paypal_environment": settings.paypal_environment,
        "paypal_webhooks_configured": settings.paypal_webhooks_configured,
    }


@router.post("/commitments/assess", response_model=CommitmentAssessmentResponse)
async def commitment_assessment(payload: CommitmentAssessmentRequest) -> CommitmentAssessmentResponse:
    return assess_commitment(payload)


@router.get("/integrations/paypal/status")
async def paypal_status(settings: Settings = Depends(get_settings)) -> dict[str, str | bool]:
    return {
        "provider": "paypal",
        "environment": settings.paypal_environment,
        "configured": settings.paypal_configured,
        "webhooks_configured": settings.paypal_webhooks_configured,
    }


@router.get("/integrations/status")
async def integration_status(settings: Settings = Depends(get_settings)) -> dict[str, Any]:
    """Report implemented/configured status without exposing secrets."""
    return {
        "integrations": [
            {"id": "paypal", "name": "PayPal", "implemented": True, "configured": settings.paypal_webhooks_configured, "h8_status": "partial", "evidence": "Sandbox OAuth and signature-verified webhook intake; invoice/payment judge path and case/Digital-Twin update remain incomplete."},
            {"id": "ag-grid", "name": "AG Grid", "implemented": True, "configured": True, "h8_status": "partial", "evidence": "Interactive recovery, reconciliation, and ledger grids are present; separate AG Studio widget and guarded natural-language dashboard change are missing."},
            {"id": "ag-studio", "name": "AG Studio", "implemented": True, "configured": True, "h8_status": "partial", "evidence": "AG Studio React hosts a recovery analytics grid with guarded natural-language status filters; local evaluation is available, production needs the vendor license."},
            {"id": "apimatic", "name": "APIMatic", "implemented": True, "configured": True, "h8_status": "partial", "evidence": "APIMatic PayPal Context Plugin is installed in VS Code; the backend PayPal adapter uses the APIMatic-generated official Server SDK typed OAuth token model."},
            {"id": "bryntum", "name": "Bryntum", "implemented": True, "configured": True, "h8_status": "partial", "evidence": "Bryntum Gantt trial shows commitment milestones and computes a local reserve-breach preview when dates move; saving a changed scenario requires explicit follow-up."},
            {"id": "channel3", "name": "Channel3", "implemented": True, "configured": settings.channel3_configured, "h8_status": "partial", "evidence": "Server-side live product-search adapter returns provider provenance and fetch timestamp; it is not yet connected to purchase analysis."},
            {"id": "elastic", "name": "Elastic", "implemented": True, "configured": settings.elasticsearch_configured, "h8_status": "partial", "evidence": "Authenticated evidence search derives active workspaces and applies a mandatory workspace filter; populated index and isolation evidence are missing."},
            {"id": "kernel", "name": "KERNEL", "implemented": True, "configured": settings.kernel_configured, "h8_status": "partial", "evidence": "User-triggered public-page retrieval is restricted to a single public hostname, has no form/click actions, and persists a reviewable title/text trace."},
            {"id": "postman", "name": "Postman", "implemented": True, "configured": True, "h8_status": "partial", "evidence": "Versioned collection covers health, assessment, integration status, credential checks, product search, and workspace-scoped evidence; run evidence remains to be captured."},
            {"id": "zapier", "name": "Zapier MCP", "implemented": True, "configured": settings.zapier_configured, "h8_status": "partial", "evidence": "MCP tools can be discovered and only environment-allowlisted actions can run after explicit user approval; action result metadata is audited."},
        ]
    }


@router.post("/integrations/kernel/evidence")
async def kernel_public_evidence(
    payload: KernelEvidenceRequest,
    request: Request,
    user: AuthenticatedUser = Depends(require_supabase_user),
    settings: Settings = Depends(get_settings),
) -> dict[str, Any]:
    """Read a public URL in a short-lived KERNEL browser, then destroy the session."""
    if not settings.kernel_configured:
        raise HTTPException(status_code=503, detail="Configure KERNEL_API_KEY on the backend.")
    if not settings.kernel_key_rotated_after_incident:
        raise HTTPException(status_code=503, detail="Before browser retrieval, rotate KERNEL_API_KEY and set KERNEL_KEY_ROTATED_AFTER_INCIDENT=true.")
    pool: asyncpg.Pool | None = request.app.state.database_pool
    if pool is None:
        raise HTTPException(status_code=503, detail="DATABASE_URL is required to save the browser-task trace.")
    parsed = urlsplit(payload.url.strip())
    if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password or parsed.query or parsed.fragment:
        raise HTTPException(status_code=400, detail="Use a public HTTPS page URL without credentials, query parameters, or fragments.")
    if parsed.port not in (None, 443):
        raise HTTPException(status_code=400, detail="Only HTTPS on the default port is allowed.")
    try:
        addresses = socket.getaddrinfo(parsed.hostname, 443, type=socket.SOCK_STREAM)
        if not addresses or any(not ipaddress.ip_address(item[4][0]).is_global for item in addresses):
            raise ValueError("non-public destination")
    except (OSError, ValueError) as exc:
        raise HTTPException(status_code=400, detail="The URL must resolve only to public internet addresses.") from exc
    host = parsed.hostname.lower()
    if host in {"localhost", "metadata.google.internal"} or host.endswith((".local", ".internal")):
        raise HTTPException(status_code=400, detail="Private and local hosts are not allowed.")

    from kernel import AsyncKernel
    from playwright.async_api import async_playwright

    kernel = AsyncKernel(api_key=settings.kernel_api_key.get_secret_value())
    browser = None
    try:
        browser = await kernel.browsers.create(
            name=f"paypilot-evidence-{uuid.uuid4().hex[:10]}",
            headless=True,
            start_url=payload.url.strip(),
            timeout_seconds=60,
            network={"allowed_hosts": [host]},
        )
        async with async_playwright() as playwright:
            chromium = await playwright.chromium.connect_over_cdp(browser.cdp_ws_url)
            context = chromium.contexts[0]
            page = context.pages[0] if context.pages else await context.new_page()
            async def keep_to_authorized_host(route_handler):
                requested = urlsplit(route_handler.request.url)
                if requested.scheme not in {"http", "https"} or requested.hostname != host:
                    await route_handler.abort()
                else:
                    await route_handler.continue_()
            await context.route("**/*", keep_to_authorized_host)
            await page.goto(payload.url.strip(), wait_until="domcontentloaded", timeout=20000)
            final_url = page.url
            if urlsplit(final_url).hostname != host:
                raise HTTPException(status_code=400, detail="Navigation left the authorized hostname; no evidence was saved.")
            title = (await page.title())[:250]
            text = (await page.locator("body").inner_text(timeout=5000))[:8000]
            await chromium.close()
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail="KERNEL could not retrieve the authorized public page.") from exc
    finally:
        if browser is not None:
            try:
                await kernel.browsers.delete_by_id(browser.session_id)
            except Exception:
                pass
        await kernel.close()

    workspace_id, actor_id = await _user_workspace(pool, user.id)
    audit_id = await _write_sponsor_trace(pool, workspace_id, actor_id, "kernel", host, {
        "url": final_url, "title": title, "text_excerpt": text[:1500], "retrieved_at": datetime.now(timezone.utc).isoformat(),
        "read_only": True, "review_required": True,
    })
    return {"provider": "KERNEL", "trace_id": str(audit_id), "url": final_url, "title": title, "text": text, "review_required": True}


@router.get("/integrations/zapier/tools")
async def zapier_list_tools(
    user: AuthenticatedUser = Depends(require_supabase_user), settings: Settings = Depends(get_settings),
) -> dict[str, Any]:
    del user
    if not settings.zapier_configured:
        raise HTTPException(status_code=503, detail="Configure ZAPIER_MCP_ENDPOINT and ZAPIER_MCP_TOKEN on the backend.")
    from mcp import ClientSession
    from mcp.client.streamable_http import streamablehttp_client
    try:
        async with streamablehttp_client(settings.zapier_mcp_endpoint, headers={"Authorization": f"Bearer {settings.zapier_mcp_token.get_secret_value()}"}) as (read_stream, write_stream, _):
            async with ClientSession(read_stream, write_stream) as session:
                await session.initialize()
                result = await session.list_tools()
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Zapier MCP tool discovery failed.") from exc
    allowed = settings.zapier_allowed_tool_names
    tools = [{"name": tool.name, "description": tool.description or "", "input_schema": tool.inputSchema,
              "allowlisted": tool.name in allowed and not _zapier_tool_is_financial(tool.name, tool.description)} for tool in result.tools]
    return {"provider": "Zapier MCP", "tools": tools}


@router.post("/integrations/zapier/actions")
async def zapier_run_action(
    payload: ZapierActionRequest, request: Request,
    user: AuthenticatedUser = Depends(require_supabase_user), settings: Settings = Depends(get_settings),
) -> dict[str, Any]:
    if not payload.approved:
        raise HTTPException(status_code=400, detail="Review and approve the action in the app before running it.")
    if not settings.zapier_configured or payload.name not in settings.zapier_allowed_tool_names:
        raise HTTPException(status_code=403, detail="This Zapier action is not enabled in the backend allowlist.")
    if len(json.dumps(payload.arguments, default=str)) > 8000:
        raise HTTPException(status_code=413, detail="Action arguments exceed the 8 KB limit.")
    pool: asyncpg.Pool | None = request.app.state.database_pool
    if pool is None:
        raise HTTPException(status_code=503, detail="DATABASE_URL is required to audit Zapier actions.")
    from mcp import ClientSession
    from mcp.client.streamable_http import streamablehttp_client
    try:
        async with streamablehttp_client(settings.zapier_mcp_endpoint, headers={"Authorization": f"Bearer {settings.zapier_mcp_token.get_secret_value()}"}) as (read_stream, write_stream, _):
            async with ClientSession(read_stream, write_stream) as session:
                await session.initialize()
                tools = await session.list_tools()
                selected_tool = next((tool for tool in tools.tools if tool.name == payload.name), None)
                if selected_tool is None:
                    raise HTTPException(status_code=404, detail="Zapier did not publish the allowlisted action.")
                if _zapier_tool_is_financial(selected_tool.name, selected_tool.description):
                    raise HTTPException(status_code=403, detail="Financial or money-movement Zapier actions are blocked.")
                result = await session.call_tool(payload.name, payload.arguments)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Zapier MCP action failed.") from exc
    if result.isError:
        raise HTTPException(status_code=502, detail="Zapier reported an action error.")
    result_text = [item.text[:1000] for item in result.content if getattr(item, "text", None)]
    workspace_id, actor_id = await _user_workspace(pool, user.id)
    audit_id = await _write_sponsor_trace(pool, workspace_id, actor_id, "zapier", payload.name, {
        "tool": payload.name, "arguments": payload.arguments, "result_excerpt": result_text, "approved": True,
    })
    return {"provider": "Zapier MCP", "tool": payload.name, "trace_id": str(audit_id), "result": result_text}


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
        raise HTTPException(status_code=503, detail="CHANNEL3_API_KEY is not configured on the backend.")
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
        raise HTTPException(
            status_code=503,
            detail="Set ELASTICSEARCH_URL and ELASTICSEARCH_API_KEY on the backend to enable Elastic evidence search.",
        )
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


@router.post("/integrations/elastic/evidence-upload")
async def elastic_evidence_upload(
    request: Request,
    file: UploadFile = File(...),
    user: AuthenticatedUser = Depends(require_supabase_user),
    settings: Settings = Depends(get_settings),
) -> dict[str, Any]:
    """Store an evidence file privately and index page text with tenant metadata."""
    if not settings.elasticsearch_configured or not settings.supabase_auth_configured:
        raise HTTPException(status_code=503, detail="Configure Elastic and Supabase on the backend before uploading evidence.")
    pool: asyncpg.Pool | None = request.app.state.database_pool
    if pool is None:
        raise HTTPException(status_code=503, detail="DATABASE_URL is required for workspace-scoped evidence uploads.")
    workspace_id, actor_id = await _user_workspace(pool, user.id)
    raw = await file.read(8 * 1024 * 1024 + 1)
    if len(raw) > 8 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Evidence files are limited to 8 MB.")
    filename = (file.filename or "evidence.txt").split("/")[-1].split("\\")[-1]
    safe_name = re.sub(r"[^A-Za-z0-9._-]", "_", filename)[:100] or "evidence.txt"
    suffix = safe_name.lower().rsplit(".", 1)[-1] if "." in safe_name else ""
    if suffix == "pdf" or file.content_type == "application/pdf":
        try:
            from pypdf import PdfReader
            reader = PdfReader(io.BytesIO(raw), strict=True)
            if len(reader.pages) > 100:
                raise HTTPException(status_code=413, detail="PDF evidence is limited to 100 pages.")
            pages = [(number, (page.extract_text() or "").strip()) for number, page in enumerate(reader.pages, start=1)]
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=400, detail="The uploaded PDF could not be read.") from exc
    elif suffix in {"txt", "md", "csv"}:
        try:
            pages = [(1, raw.decode("utf-8-sig").strip())]
        except UnicodeDecodeError as exc:
            raise HTTPException(status_code=400, detail="Text evidence must use UTF-8 encoding.") from exc
    else:
        raise HTTPException(status_code=415, detail="Supported evidence formats are PDF, TXT, MD, and CSV.")
    pages = [(number, text[:50000]) for number, text in pages if text][:100]
    if not pages:
        raise HTTPException(status_code=400, detail="No extractable text was found in this file.")

    document_id = str(uuid.uuid4())
    storage_path = f"{workspace_id}/{document_id}/{safe_name}"
    bearer = request.headers.get("authorization", "")
    storage_url = f"{settings.supabase_url.rstrip('/')}/storage/v1/object/paypilot-evidence-private/{quote(storage_path, safe='/')}"
    storage_headers = {
        "apikey": settings.supabase_publishable_key.get_secret_value(),
        "Authorization": bearer,
        "Content-Type": file.content_type or "application/octet-stream",
        "x-upsert": "false",
    }
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            stored = await client.post(storage_url, headers=storage_headers, content=raw)
            if stored.status_code >= 400:
                raise HTTPException(status_code=502, detail="Supabase private storage rejected the evidence upload; check the storage migration and workspace policy.")
            indexed: list[str] = []
            for page_number, text in pages:
                response = await client.put(
                    f"{settings.elasticsearch_url.rstrip('/')}/{quote(settings.elasticsearch_index, safe='-_')}/_doc/{document_id}-{page_number}?refresh=wait_for",
                    headers={"Authorization": f"ApiKey {settings.elasticsearch_api_key.get_secret_value()}", "Content-Type": "application/json"},
                    json={"workspace_id": str(workspace_id), "document_id": document_id, "title": safe_name,
                          "content": text[:50000], "source_url": f"paypilot://evidence/{document_id}",
                          "page": page_number, "uploaded_by": str(actor_id), "created_at": datetime.now(timezone.utc).isoformat()},
                )
                if response.status_code >= 400:
                    raise HTTPException(status_code=502, detail="Elastic indexing failed after private upload; remove the uploaded file and retry.")
                indexed.append(str(page_number))
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="Evidence storage or indexing is temporarily unavailable.") from exc
    audit_id = await _write_sponsor_trace(pool, workspace_id, actor_id, "elastic.upload", document_id, {
        "filename": safe_name, "pages_indexed": indexed, "private_storage": True,
    })
    return {"provider": "Elastic", "document_id": document_id, "filename": safe_name,
            "pages_indexed": len(indexed), "trace_id": str(audit_id), "private_storage": True}


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
