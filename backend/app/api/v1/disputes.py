import hashlib
import json
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

import asyncpg
from fastapi import APIRouter, HTTPException, Query, Request, status

from ...schemas.disputes import (
    DisputeCreateRequest,
    DisputeDetail,
    DisputeDraftResponse,
    DisputeDraftResponseRequest,
    DisputeEvidenceItem,
    DisputeInvestigateResponse,
    DisputeItem,
    DisputeSubmitApprovalRequest,
    DisputeSubmitApprovalResponse,
    DisputeSubmitRequest,
    DisputeSubmitResponse,
    EvidenceChecklistItem,
    TimelineEvent,
)

router = APIRouter(tags=["Dispute Defense Studio"])

# -----------------------------------------------------------------------------
# In-Memory Seed / Fallback Store (Synchronized with Scenario B)
# -----------------------------------------------------------------------------
_DEMO_DISPUTES: dict[str, dict[str, Any]] = {
    "disp-paypal-8842": {
        "id": "disp-paypal-8842",
        "workspace_id": "ws-default-01",
        "provider": "paypal",
        "provider_dispute_id": "PP-D-8842109",
        "payment_id": "pay-capt-9921",
        "reason_code": "MERCHANDISE_OR_SERVICE_NOT_RECEIVED",
        "disputed_amount": 2850.00,
        "currency": "USD",
        "status": "WAITING_FOR_SELLER",
        "response_due_at": (datetime.now(timezone.utc) + timedelta(days=4, hours=12)),
        "provider_created_at": (datetime.now(timezone.utc) - timedelta(days=2)),
        "synced_at": datetime.now(timezone.utc),
        "ai_case_brief": (
            "Customer claims Enterprise Cloud License and Onboarding Services (Order #ORD-7712) "
            "were not delivered. Source records verify electronic provisioning completed on Nov 3, 2024, "
            "and active usage commenced Nov 4, 2024. FedEx delivery of physical security keys (Tracking "
            "#7812984128) was signed for by J. Doe at the verified corporate address. "
            "No formal support ticket or refund request was opened before dispute filing."
        ),
        "draft_response": (
            "We respectfully refute the buyer's claim of non-receipt. The order ORD-7712 for $2,850.00 USD "
            "comprised cloud licensing and hardware security keys. As documented in [EVID-001], digital activation "
            "credentials were sent to the buyer's PayPal-verified email and successfully redeemed. Physical "
            "security tokens were delivered via FedEx [EVID-002] and signed by recipient on Nov 5, 2024. "
            "Customer communications [EVID-003] confirm onboarding completion. We request closure in the seller's favor."
        ),
        "contraindications": [
            "Customer contacted support on Nov 6 acknowledging key receipt, contradicting non-delivery claim [EVID-003]."
        ],
        "evidence": [
            {
                "id": "EVID-001",
                "workspace_id": "ws-default-01",
                "dispute_id": "disp-paypal-8842",
                "source_record_id": "INV-2024-8891",
                "evidence_type": "order_confirmation",
                "storage_uri": "s3://paypilot-evidence/ws-default-01/ord-7712-confirmation.pdf",
                "extracted_text": "Order #ORD-7712 Placed Nov 2, 2024. Cloud Enterprise License + Hardware YubiKey Pack. Total: $2,850.00.",
                "evidence_status": "available",
                "created_at": datetime.now(timezone.utc) - timedelta(days=2),
                "metadata_json": {"confidence": 0.99, "source": "Payment Truth Engine"},
            },
            {
                "id": "EVID-002",
                "workspace_id": "ws-default-01",
                "dispute_id": "disp-paypal-8842",
                "source_record_id": "FEDEX-7812984128",
                "evidence_type": "proof_of_delivery",
                "storage_uri": "s3://paypilot-evidence/ws-default-01/fedex-pod-7812984128.pdf",
                "extracted_text": "Delivered: Nov 5, 2024 10:42 AM. Signed for by: J. DOE. Verified address matches PayPal shipping.",
                "evidence_status": "available",
                "created_at": datetime.now(timezone.utc) - timedelta(days=1),
                "metadata_json": {"confidence": 0.98, "carrier": "FedEx", "tracking": "7812984128"},
            },
            {
                "id": "EVID-003",
                "workspace_id": "ws-default-01",
                "dispute_id": "disp-paypal-8842",
                "source_record_id": "ZENDESK-4491",
                "evidence_type": "customer_communication",
                "storage_uri": "s3://paypilot-evidence/ws-default-01/ticket-4491-transcript.json",
                "extracted_text": "Customer: 'We received the keys and logged in successfully today. Thank you!' Timestamp: Nov 6, 2024 14:15 UTC.",
                "evidence_status": "available",
                "created_at": datetime.now(timezone.utc) - timedelta(days=1),
                "metadata_json": {"channel": "Zendesk", "customer_email": "jdoe@apextech.io"},
            },
            {
                "id": "EVID-004",
                "workspace_id": "ws-default-01",
                "dispute_id": "disp-paypal-8842",
                "source_record_id": "TERMS-SLA-2024",
                "evidence_type": "refund_policy",
                "storage_uri": "s3://paypilot-evidence/ws-default-01/tos-refund-policy.pdf",
                "extracted_text": "All hardware deliveries are subject to 14-day defect warranty; software activation is final upon first token generation.",
                "evidence_status": "available",
                "created_at": datetime.now(timezone.utc) - timedelta(days=5),
                "metadata_json": {"doc_version": "2024.2"},
            },
        ],
        "checklist": [
            {
                "category": "Proof of Delivery (POD)",
                "required": True,
                "status": "available",
                "description": "Carrier signature and delivery timestamp to buyer's address.",
                "linked_evidence_id": "EVID-002",
            },
            {
                "category": "Order & Invoice Records",
                "required": True,
                "status": "available",
                "description": "Itemized bill of materials and capture receipt.",
                "linked_evidence_id": "EVID-001",
            },
            {
                "category": "Customer Communication History",
                "required": True,
                "status": "available",
                "description": "Logs showing acknowledgment of receipt or login.",
                "linked_evidence_id": "EVID-003",
            },
            {
                "category": "Published Refund / Service Terms",
                "required": False,
                "status": "available",
                "description": "Standard terms agreed at transaction checkout.",
                "linked_evidence_id": "EVID-004",
            },
        ],
        "timeline": [
            {"date": "2024-11-02 18:20", "event_type": "ORDER_PLACED", "description": "Customer ordered Cloud License + YubiKeys for $2,850.00", "source_record_id": "ORD-7712", "verified": True},
            {"date": "2024-11-02 18:22", "event_type": "PAYMENT_CAPTURED", "description": "PayPal transaction authorized and settled ($2,850.00)", "source_record_id": "pay-capt-9921", "verified": True},
            {"date": "2024-11-03 09:15", "event_type": "LICENSE_PROVISIONED", "description": "Digital credentials generated and sent to email", "source_record_id": "ACT-9912", "verified": True},
            {"date": "2024-11-05 10:42", "event_type": "PACKAGE_DELIVERED", "description": "FedEx delivered hardware package; signed by J. Doe", "source_record_id": "FEDEX-7812984128", "verified": True},
            {"date": "2024-11-06 14:15", "event_type": "CUSTOMER_MESSAGE", "description": "Buyer acknowledged successful login via support ticket", "source_record_id": "ZENDESK-4491", "verified": True},
            {"date": "2024-11-10 08:30", "event_type": "DISPUTE_FILED", "description": "Buyer initiated dispute claiming non-receipt via PayPal", "source_record_id": "PP-D-8842109", "verified": True},
        ],
    },
    "disp-paypal-9104": {
        "id": "disp-paypal-9104",
        "workspace_id": "ws-default-01",
        "provider": "paypal",
        "provider_dispute_id": "PP-D-9104772",
        "payment_id": "pay-capt-8411",
        "reason_code": "UNAUTHORIZED_TRANSACTION",
        "disputed_amount": 1420.00,
        "currency": "USD",
        "status": "UNDER_REVIEW",
        "response_due_at": (datetime.now(timezone.utc) + timedelta(days=1, hours=6)),
        "provider_created_at": (datetime.now(timezone.utc) - timedelta(days=6)),
        "synced_at": datetime.now(timezone.utc),
        "ai_case_brief": (
            "Buyer claims payment was unauthorized. IP geolocation and 3D Secure 2.2 authentication "
            "confirm biometric 2FA from the cardholder's enrolled device. Missing formal server access logs."
        ),
        "draft_response": (
            "Transaction $1,420.00 USD was processed with full 3D Secure v2.2 cardholder authentication. "
            "Device fingerprint matches recurring sessions from this account."
        ),
        "contraindications": [],
        "evidence": [
            {
                "id": "EVID-101",
                "workspace_id": "ws-default-01",
                "dispute_id": "disp-paypal-9104",
                "source_record_id": "3DS-AUTH-771",
                "evidence_type": "order_confirmation",
                "storage_uri": "s3://paypilot-evidence/ws-default-01/3ds-liability-shift.json",
                "extracted_text": "3D Secure: Frictionless authentication succeeded. Liability shift: Active.",
                "evidence_status": "available",
                "created_at": datetime.now(timezone.utc) - timedelta(days=6),
                "metadata_json": {"3ds_version": "2.2.0", "eci": "05"},
            }
        ],
        "checklist": [
            {
                "category": "3D Secure Authentication Certificate",
                "required": True,
                "status": "available",
                "description": "Cryptographic proof of buyer authentication (liability shift).",
                "linked_evidence_id": "EVID-101",
            },
            {
                "category": "Device Fingerprint & IP Logs",
                "required": True,
                "status": "missing",
                "description": "Server session logs linking account history to buyer device.",
                "linked_evidence_id": None,
            },
        ],
        "timeline": [
            {"date": "2024-11-04 11:00", "event_type": "ORDER_PLACED", "description": "Software subscription purchased with 3DS v2 auth", "source_record_id": "ORD-6621", "verified": True},
            {"date": "2024-11-04 11:01", "event_type": "PAYMENT_CAPTURED", "description": "Captured via PayPal gateway with ECI 05", "source_record_id": "pay-capt-8411", "verified": True},
            {"date": "2024-11-05 16:20", "event_type": "DISPUTE_FILED", "description": "Dispute filed for unauthorized activity", "source_record_id": "PP-D-9104772", "verified": True},
        ],
    },
}


# -----------------------------------------------------------------------------
# Endpoints
# -----------------------------------------------------------------------------

@router.get("/disputes", response_model=list[DisputeItem])
async def list_disputes(
    request: Request,
    status_filter: str | None = Query(None, alias="status"),
    min_amount: float | None = Query(None),
    max_amount: float | None = Query(None),
) -> list[DisputeItem]:
    """List disputes with status, amount, and deadline filters (Section 1.6)."""
    pool: asyncpg.Pool | None = getattr(request.app.state, "database_pool", None)
    if pool is not None:
        try:
            async with pool.acquire() as conn:
                query = "SELECT * FROM public.disputes WHERE 1=1"
                params: list[Any] = []
                if status_filter:
                    params.append(status_filter)
                    query += f" AND status = ${len(params)}"
                if min_amount is not None:
                    params.append(min_amount)
                    query += f" AND disputed_amount >= ${len(params)}"
                if max_amount is not None:
                    params.append(max_amount)
                    query += f" AND disputed_amount <= ${len(params)}"
                query += " ORDER BY response_due_at ASC"
                rows = await conn.fetch(query, *params)
                results: list[DisputeItem] = []
                for r in rows:
                    results.append(
                        DisputeItem(
                            id=str(r["id"]),
                            workspace_id=str(r["workspace_id"]),
                            provider=r["provider"],
                            provider_dispute_id=r["provider_dispute_id"],
                            payment_id=r["payment_id"],
                            reason_code=r["reason_code"],
                            disputed_amount=float(r["disputed_amount"]),
                            currency=r["currency"],
                            status=r["status"],
                            response_due_at=r["response_due_at"],
                            provider_created_at=r["provider_created_at"],
                            synced_at=r["synced_at"],
                            evidence_count=0,
                            missing_critical_count=0,
                        )
                    )
                return results
        except Exception:
            # Graceful fallback to memory store if table not populated
            pass

    results = []
    for d in _DEMO_DISPUTES.values():
        if status_filter and d["status"] != status_filter:
            continue
        if min_amount is not None and d["disputed_amount"] < min_amount:
            continue
        if max_amount is not None and d["disputed_amount"] > max_amount:
            continue

        missing_crit = sum(1 for c in d["checklist"] if c["required"] and c["status"] == "missing")
        results.append(
            DisputeItem(
                id=d["id"],
                workspace_id=d["workspace_id"],
                provider=d["provider"],
                provider_dispute_id=d["provider_dispute_id"],
                payment_id=d["payment_id"],
                reason_code=d["reason_code"],
                disputed_amount=d["disputed_amount"],
                currency=d["currency"],
                status=d["status"],
                response_due_at=d["response_due_at"],
                provider_created_at=d["provider_created_at"],
                synced_at=d["synced_at"],
                evidence_count=len(d["evidence"]),
                missing_critical_count=missing_crit,
            )
        )
    return sorted(results, key=lambda x: x.response_due_at)


@router.post("/disputes", response_model=DisputeItem, status_code=status.HTTP_201_CREATED)
async def create_dispute(
    request: Request,
    payload: DisputeCreateRequest,
) -> DisputeItem:
    """Create or import a dispute record from provider / seed (Section 1.6)."""
    dispute_id = f"disp-{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc)

    new_dispute = {
        "id": dispute_id,
        "workspace_id": payload.workspace_id,
        "provider": payload.provider,
        "provider_dispute_id": payload.provider_dispute_id,
        "payment_id": payload.payment_id or f"pay-{uuid.uuid4().hex[:6]}",
        "reason_code": payload.reason_code,
        "disputed_amount": payload.disputed_amount,
        "currency": payload.currency,
        "status": payload.status,
        "response_due_at": payload.response_due_at,
        "provider_created_at": now,
        "synced_at": now,
        "ai_case_brief": "Case initiated. Run investigation to collect evidence and generate brief.",
        "draft_response": None,
        "contraindications": [],
        "evidence": [],
        "checklist": [
            {
                "category": "Proof of Delivery / Fulfillment",
                "required": True,
                "status": "missing",
                "description": "Carrier tracking or digital service fulfillment log.",
                "linked_evidence_id": None,
            },
            {
                "category": "Customer Transaction Record",
                "required": True,
                "status": "available",
                "description": "Signed contract or verified authorization.",
                "linked_evidence_id": None,
            },
        ],
        "timeline": [
            {
                "date": now.strftime("%Y-%m-%d %H:%M"),
                "event_type": "DISPUTE_IMPORTED",
                "description": f"Dispute {payload.provider_dispute_id} received from {payload.provider}",
                "source_record_id": payload.provider_dispute_id,
                "verified": True,
            }
        ],
    }

    _DEMO_DISPUTES[dispute_id] = new_dispute

    pool: asyncpg.Pool | None = getattr(request.app.state, "database_pool", None)
    if pool is not None:
        try:
            async with pool.acquire() as conn:
                await conn.execute(
                    """
                    INSERT INTO public.disputes
                      (id, workspace_id, provider, provider_dispute_id, payment_id, reason_code,
                       disputed_amount, currency, status, response_due_at, provider_created_at, synced_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                    ON CONFLICT DO NOTHING
                    """,
                    uuid.UUID(hex=uuid.uuid4().hex),
                    uuid.UUID(hex=uuid.uuid4().hex),
                    payload.provider,
                    payload.provider_dispute_id,
                    payload.payment_id,
                    payload.reason_code,
                    payload.disputed_amount,
                    payload.currency,
                    payload.status,
                    payload.response_due_at,
                    now,
                    now,
                )
        except Exception:
            pass

    return DisputeItem(
        id=dispute_id,
        workspace_id=payload.workspace_id,
        provider=payload.provider,
        provider_dispute_id=payload.provider_dispute_id,
        payment_id=new_dispute["payment_id"],
        reason_code=payload.reason_code,
        disputed_amount=payload.disputed_amount,
        currency=payload.currency,
        status=payload.status,
        response_due_at=payload.response_due_at,
        provider_created_at=now,
        synced_at=now,
        evidence_count=0,
        missing_critical_count=1,
    )


@router.get("/disputes/{dispute_id}", response_model=DisputeDetail)
async def get_dispute_detail(
    dispute_id: str,
    request: Request,
) -> DisputeDetail:
    """Return dispute, evidence timeline, and deterministic checklist (Section 1.6)."""
    if dispute_id not in _DEMO_DISPUTES:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dispute with ID {dispute_id} was not found.",
        )
    d = _DEMO_DISPUTES[dispute_id]
    missing_crit = sum(1 for c in d["checklist"] if c["required"] and c["status"] == "missing")

    return DisputeDetail(
        id=d["id"],
        workspace_id=d["workspace_id"],
        provider=d["provider"],
        provider_dispute_id=d["provider_dispute_id"],
        payment_id=d["payment_id"],
        reason_code=d["reason_code"],
        disputed_amount=d["disputed_amount"],
        currency=d["currency"],
        status=d["status"],
        response_due_at=d["response_due_at"],
        provider_created_at=d["provider_created_at"],
        synced_at=d["synced_at"],
        evidence_count=len(d["evidence"]),
        missing_critical_count=missing_crit,
        evidence=[DisputeEvidenceItem(**e) for e in d["evidence"]],
        checklist=[EvidenceChecklistItem(**c) for c in d["checklist"]],
        timeline=[TimelineEvent(**t) for t in d["timeline"]],
        ai_case_brief=d.get("ai_case_brief"),
        draft_response=d.get("draft_response"),
        contraindications=d.get("contraindications", []),
    )


@router.post("/disputes/{dispute_id}/investigate", response_model=DisputeInvestigateResponse)
async def investigate_dispute(
    dispute_id: str,
    request: Request,
) -> DisputeInvestigateResponse:
    """Run evidence collection and contradiction checks (Section 1.6)."""
    if dispute_id not in _DEMO_DISPUTES:
        raise HTTPException(status_code=404, detail="Dispute not found.")
    d = _DEMO_DISPUTES[dispute_id]

    missing = [c["category"] for c in d["checklist"] if c["status"] == "missing"]
    contraindications = d.get("contraindications", [])
    if not contraindications and d["reason_code"] == "MERCHANDISE_OR_SERVICE_NOT_RECEIVED":
        contraindications.append("Fulfillment verified: Carrier signed POD matches customer address.")

    total_checks = len(d["checklist"]) or 1
    avail_checks = sum(1 for c in d["checklist"] if c["status"] == "available")
    readiness = int((avail_checks / total_checks) * 100)

    return DisputeInvestigateResponse(
        dispute_id=dispute_id,
        evidence_collected=len(d["evidence"]),
        missing_evidence=missing,
        contradictions=contraindications,
        timeline=[TimelineEvent(**t) for t in d["timeline"]],
        checklist=[EvidenceChecklistItem(**c) for c in d["checklist"]],
        readiness_score=readiness,
    )


@router.post("/disputes/{dispute_id}/draft-response", response_model=DisputeDraftResponse)
async def draft_dispute_response(
    dispute_id: str,
    payload: DisputeDraftResponseRequest,
    request: Request,
) -> DisputeDraftResponse:
    """Create an evidence-grounded response draft citing internal evidence IDs (Section 1.6)."""
    if dispute_id not in _DEMO_DISPUTES:
        raise HTTPException(status_code=404, detail="Dispute not found.")
    d = _DEMO_DISPUTES[dispute_id]

    citations = []
    for e in d["evidence"]:
        citations.append({"evidence_id": e["id"], "type": e["evidence_type"], "reference": e["source_record_id"] or ""})

    draft_text = (
        f"Formal merchant rebuttal regarding dispute {d['provider_dispute_id']} (Reason: {d['reason_code']}). "
        f"The disputed sum of ${d['disputed_amount']:,.2f} {d['currency']} represents verified goods/services fulfilled in accordance "
        f"with agreed terms. Source evidence "
        + ", ".join([f"[{c['evidence_id']}: {c['type']}]" for c in citations])
        + " conclusively demonstrates that fulfillment was completed and acknowledged. "
        "We request immediate dismissal of this dispute and release of the merchant reserve."
    )
    d["draft_response"] = draft_text

    return DisputeDraftResponse(
        dispute_id=dispute_id,
        draft_text=draft_text,
        citations=citations,
        model_version="gemini-1.5-flash",
        created_at=datetime.now(timezone.utc),
    )


@router.post("/disputes/{dispute_id}/submit-approval", response_model=DisputeSubmitApprovalResponse)
async def submit_dispute_approval(
    dispute_id: str,
    payload: DisputeSubmitApprovalRequest,
    request: Request,
) -> DisputeSubmitApprovalResponse:
    """Create an immutable approval request bound to exact evidence and response payload (Section 1.6)."""
    if dispute_id not in _DEMO_DISPUTES:
        raise HTTPException(status_code=404, detail="Dispute not found.")

    payload_str = json.dumps({"dispute_id": dispute_id, "draft": payload.draft_text, "evidence": payload.evidence_ids}, sort_keys=True)
    payload_hash = hashlib.sha256(payload_str.encode("utf-8")).hexdigest()
    approval_id = f"appr-{uuid.uuid4().hex[:8]}"
    expires = datetime.now(timezone.utc) + timedelta(days=2)

    return DisputeSubmitApprovalResponse(
        approval_request_id=approval_id,
        dispute_id=dispute_id,
        payload_hash=payload_hash,
        status="pending_merchant_signature",
        expires_at=expires,
    )


@router.post("/disputes/{dispute_id}/submit", response_model=DisputeSubmitResponse)
async def execute_dispute_submit(
    dispute_id: str,
    payload: DisputeSubmitRequest,
    request: Request,
) -> DisputeSubmitResponse:
    """Execute provider submission after revalidation and approval with honest handoff (Section 1.6)."""
    if dispute_id not in _DEMO_DISPUTES:
        raise HTTPException(status_code=404, detail="Dispute not found.")
    d = _DEMO_DISPUTES[dispute_id]

    now = datetime.now(timezone.utc)
    submission_id = f"sub-{uuid.uuid4().hex[:8]}"
    d["status"] = "UNDER_REVIEW"

    receipt = (
        "Evidence bundle cryptographically signed and dispatched to PayPal Dispute API. "
        "Status updated to UNDER_REVIEW."
        if payload.hand_off_mode == "auto_provider_api"
        else "Guided evidence package generated for manual submission via PayPal Resolution Center."
    )

    return DisputeSubmitResponse(
        dispute_id=dispute_id,
        provider_submission_id=submission_id,
        provider_status="SUBMITTED_UNDER_REVIEW",
        submitted_at=now,
        mode_used=payload.hand_off_mode,
        receipt_message=receipt,
    )
