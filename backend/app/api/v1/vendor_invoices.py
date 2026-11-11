import hashlib
import json
import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Any

import asyncpg
from fastapi import APIRouter, HTTPException, Query, Request, status

from ...schemas.vendor_invoices import (
    ApprovePaymentRequest,
    ApprovePaymentResponse,
    InvoiceCreateRequest,
    InvoiceExtractResponse,
    InvoiceFindingModel,
    InvoiceLineItemModel,
    InvoiceVerifyResponse,
    SupplierInvoiceDetail,
    SupplierInvoiceItem,
    VendorVerifyProfileRequest,
)

router = APIRouter(tags=["Vendor & Invoice Fraud Shield"])

# -----------------------------------------------------------------------------
# In-Memory Seed Store (Implements Scenario A: The Supplier Invoice Fraud Slice)
# -----------------------------------------------------------------------------
_VERIFIED_VENDORS: dict[str, dict[str, Any]] = {
    "ven-nexus-01": {
        "id": "ven-nexus-01",
        "workspace_id": "ws-default-01",
        "legal_name": "Nexus Industrial Gear LLC",
        "normalized_name": "nexus industrial gear",
        "verified_status": "verified",
        "verified_contact_ref": "+1-415-555-0199 (Chief Procurement Officer)",
        "verified_account": "US-ACH-449102834491",
        "verified_routing": "021000021",
        "verified_bank_name": "JPMorgan Chase N.A.",
        "created_at": datetime.now(timezone.utc) - timedelta(days=120),
    },
    "ven-apex-02": {
        "id": "ven-apex-02",
        "workspace_id": "ws-default-01",
        "legal_name": "Apex Cloud Systems Inc",
        "normalized_name": "apex cloud systems",
        "verified_status": "verified",
        "verified_contact_ref": "billing@apexcloud.io",
        "verified_account": "US-WIRE-992188113",
        "verified_routing": "121000358",
        "verified_bank_name": "Silicon Valley Bank",
        "created_at": datetime.now(timezone.utc) - timedelta(days=90),
    },
}

_PURCHASE_ORDERS: dict[str, dict[str, Any]] = {
    "PO-8812": {
        "po_number": "PO-8812",
        "vendor_id": "ven-nexus-01",
        "currency": "USD",
        "total_amount": 14200.00,
        "status": "partially_fulfilled",
        "line_items": [
            {"description": "Industrial Steel Bearing Assembly #B-400", "quantity": 10, "unit_price": 1420.00, "line_total": 14200.00}
        ],
    }
}

_DEMO_INVOICES: dict[str, dict[str, Any]] = {
    "inv-nex-7701": {
        "id": "inv-nex-7701",
        "workspace_id": "ws-default-01",
        "vendor_id": "ven-nexus-01",
        "vendor_name": "Nexus Industrial Gear LLC",
        "invoice_number": "NEX-9921",
        "invoice_date": date(2024, 11, 1),
        "due_date": date(2024, 11, 20),
        "currency": "USD",
        "total_amount": 14200.00,
        "document_uri": "s3://paypilot-vault/ws-default-01/invoices/nex-9921.pdf",
        "extraction_status": "extracted",
        "risk_status": "clear",
        "po_number": "PO-8812",
        "po_amount": 14200.00,
        "destination_account": "US-ACH-449102834491",
        "destination_routing": "021000021",
        "destination_bank_name": "JPMorgan Chase N.A.",
        "verified_destination_account": "US-ACH-449102834491",
        "beneficiary_verified": True,
        "three_way_match_status": "matched",
        "created_at": datetime.now(timezone.utc) - timedelta(days=10),
        "line_items": [
            {
                "id": "li-01",
                "description": "Industrial Steel Bearing Assembly #B-400",
                "quantity": 10.0,
                "unit_price": 1420.00,
                "tax_amount": 0.0,
                "line_total": 14200.00,
                "matched_po_line_id": "po-li-01",
            }
        ],
        "findings": [],
    },
    "inv-nex-7702": {
        "id": "inv-nex-7702",
        "workspace_id": "ws-default-01",
        "vendor_id": "ven-nexus-01",
        "vendor_name": "Nexus Industrial Gear LLC",
        "invoice_number": "NEX-9921-A",
        "invoice_date": date(2024, 11, 6),
        "due_date": date(2024, 11, 18),
        "currency": "USD",
        "total_amount": 18400.00,
        "document_uri": "s3://paypilot-vault/ws-default-01/invoices/nex-9921-A-fraud-candidate.pdf",
        "extraction_status": "extracted",
        "risk_status": "hold",
        "po_number": "PO-8812",
        "po_amount": 14200.00,
        "destination_account": "US-WIRE-998811229120",
        "destination_routing": "121000244",
        "destination_bank_name": "Wells Fargo / Unregistered Recipient",
        "verified_destination_account": "US-ACH-449102834491",
        "beneficiary_verified": False,
        "three_way_match_status": "partial_mismatch",
        "created_at": datetime.now(timezone.utc) - timedelta(days=2),
        "line_items": [
            {
                "id": "li-10",
                "description": "Industrial Steel Bearing Assembly #B-400 (Altered Qty & Price)",
                "quantity": 10.0,
                "unit_price": 1840.00,
                "tax_amount": 0.0,
                "line_total": 18400.00,
                "matched_po_line_id": "po-li-01",
            }
        ],
        "findings": [
            {
                "id": "FND-BENEFICIARY-01",
                "finding_type": "beneficiary_changed",
                "severity": "critical",
                "title": "Changed Beneficiary Bank Routing (High Risk)",
                "description": (
                    "Payment destination US-WIRE-998811229120 does not match verified historical profile "
                    "US-ACH-449102834491 (JPMorgan Chase). Requires out-of-band verification via trusted phone."
                ),
                "evidence_json": {
                    "previous_account": "US-ACH-449102834491",
                    "new_account": "US-WIRE-998811229120",
                    "previous_bank": "JPMorgan Chase N.A.",
                    "new_bank": "Wells Fargo / Unregistered Recipient",
                },
                "status": "open",
            },
            {
                "id": "FND-PO-MISMATCH-02",
                "finding_type": "po_mismatch",
                "severity": "high",
                "title": "Purchase Order Variance (+$4,200.00)",
                "description": "Invoice total ($18,400.00) exceeds PO #PO-8812 approved limit ($14,200.00) by +29.6%.",
                "evidence_json": {
                    "po_number": "PO-8812",
                    "po_total": 14200.00,
                    "invoice_total": 18400.00,
                    "variance": 4200.00,
                },
                "status": "open",
            },
            {
                "id": "FND-DUP-CANDIDATE-03",
                "finding_type": "duplicate_candidate",
                "severity": "high",
                "title": "Near-Duplicate Invoice Number",
                "description": "Invoice number NEX-9921-A is a synthetic duplicate variant of existing invoice NEX-9921.",
                "evidence_json": {
                    "original_invoice_id": "inv-nex-7701",
                    "original_invoice_number": "NEX-9921",
                    "levenshtein_similarity": 0.92,
                },
                "status": "open",
            },
        ],
    },
    "inv-apx-4102": {
        "id": "inv-apx-4102",
        "workspace_id": "ws-default-01",
        "vendor_id": "ven-apex-02",
        "vendor_name": "Apex Cloud Systems Inc",
        "invoice_number": "APX-4102",
        "invoice_date": date(2024, 11, 4),
        "due_date": date(2024, 11, 24),
        "currency": "USD",
        "total_amount": 3450.00,
        "document_uri": "s3://paypilot-vault/ws-default-01/invoices/apx-4102.pdf",
        "extraction_status": "extracted",
        "risk_status": "clear",
        "po_number": "PO-7740",
        "po_amount": 3450.00,
        "destination_account": "US-WIRE-992188113",
        "destination_routing": "121000358",
        "destination_bank_name": "Silicon Valley Bank",
        "verified_destination_account": "US-WIRE-992188113",
        "beneficiary_verified": True,
        "three_way_match_status": "matched",
        "created_at": datetime.now(timezone.utc) - timedelta(days=6),
        "line_items": [
            {
                "id": "li-20",
                "description": "Monthly Kubernetes Dedicated Cluster & Egress",
                "quantity": 1.0,
                "unit_price": 3450.00,
                "tax_amount": 0.0,
                "line_total": 3450.00,
                "matched_po_line_id": "po-li-77",
            }
        ],
        "findings": [],
    },
}


# -----------------------------------------------------------------------------
# Endpoints
# -----------------------------------------------------------------------------

@router.get("/vendor-invoices", response_model=list[SupplierInvoiceItem])
async def list_vendor_invoices(
    request: Request,
    risk_status: str | None = Query(None),
    vendor_id: str | None = Query(None),
) -> list[SupplierInvoiceItem]:
    """List supplier invoices with risk status and filter options (Section 2.6)."""
    pool: asyncpg.Pool | None = getattr(request.app.state, "database_pool", None)
    if pool is not None:
        try:
            async with pool.acquire() as conn:
                q = "SELECT * FROM public.supplier_invoices WHERE 1=1"
                params: list[Any] = []
                if risk_status:
                    params.append(risk_status)
                    q += f" AND risk_status = ${len(params)}"
                if vendor_id:
                    params.append(uuid.UUID(vendor_id))
                    q += f" AND vendor_id = ${len(params)}"
                q += " ORDER BY due_date ASC"
                rows = await conn.fetch(q, *params)
                if rows:
                    items: list[SupplierInvoiceItem] = []
                    for r in rows:
                        items.append(
                            SupplierInvoiceItem(
                                id=str(r["id"]),
                                workspace_id=str(r["workspace_id"]),
                                vendor_id=str(r["vendor_id"]),
                                vendor_name="Vendor",
                                invoice_number=r["invoice_number"],
                                invoice_date=r["invoice_date"],
                                due_date=r["due_date"],
                                currency=r["currency"],
                                total_amount=float(r["total_amount"]),
                                document_uri=r.get("document_uri"),
                                extraction_status=r["extraction_status"],
                                risk_status=r["risk_status"],
                                findings=[],
                                critical_findings_count=0,
                                created_at=r["created_at"],
                            )
                        )
                    return items
        except Exception:
            pass

    results: list[SupplierInvoiceItem] = []
    for inv in _DEMO_INVOICES.values():
        if risk_status and inv["risk_status"] != risk_status:
            continue
        if vendor_id and inv["vendor_id"] != vendor_id:
            continue

        crit_count = sum(1 for f in inv["findings"] if f["severity"] in ("high", "critical") and f["status"] == "open")
        results.append(
            SupplierInvoiceItem(
                id=inv["id"],
                workspace_id=inv["workspace_id"],
                vendor_id=inv["vendor_id"],
                vendor_name=inv["vendor_name"],
                invoice_number=inv["invoice_number"],
                invoice_date=inv["invoice_date"],
                due_date=inv["due_date"],
                currency=inv["currency"],
                total_amount=inv["total_amount"],
                document_uri=inv.get("document_uri"),
                extraction_status=inv["extraction_status"],
                risk_status=inv["risk_status"],
                po_number=inv.get("po_number"),
                po_amount=inv.get("po_amount"),
                findings=[InvoiceFindingModel(**f) for f in inv["findings"]],
                critical_findings_count=crit_count,
                created_at=inv["created_at"],
            )
        )
    return sorted(results, key=lambda x: x.due_date)


@router.post("/vendor-invoices", response_model=SupplierInvoiceItem, status_code=status.HTTP_201_CREATED)
async def create_vendor_invoice(
    request: Request,
    payload: InvoiceCreateRequest,
) -> SupplierInvoiceItem:
    """Upload and register an invoice with automated fraud and mismatch checks (Section 2.6)."""
    invoice_id = f"inv-{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc)

    # 1. Vendor resolution
    norm_name = payload.vendor_name.strip().lower()
    vendor_match = next((v for v in _VERIFIED_VENDORS.values() if v["normalized_name"] in norm_name or norm_name in v["normalized_name"]), None)
    if not vendor_match:
        vendor_id = f"ven-{uuid.uuid4().hex[:6]}"
        _VERIFIED_VENDORS[vendor_id] = {
            "id": vendor_id,
            "workspace_id": payload.workspace_id,
            "legal_name": payload.vendor_name,
            "normalized_name": norm_name,
            "verified_status": "unverified",
            "verified_contact_ref": "Pending owner verification",
            "verified_account": payload.destination_account or "UNKNOWN",
            "verified_routing": payload.destination_routing or "UNKNOWN",
            "verified_bank_name": payload.destination_bank_name or "UNKNOWN",
            "created_at": now,
        }
    else:
        vendor_id = vendor_match["id"]

    # 2. Automated detection logic (Duplicate, PO Mismatch, Beneficiary change)
    findings: list[dict[str, Any]] = []
    risk_status = "clear"

    # Duplicate check
    for existing in _DEMO_INVOICES.values():
        if existing["invoice_number"].lower() == payload.invoice_number.lower():
            findings.append({
                "id": f"FND-DUP-{uuid.uuid4().hex[:6]}",
                "finding_type": "duplicate_candidate",
                "severity": "critical",
                "title": "Exact Duplicate Invoice Number",
                "description": f"Invoice #{payload.invoice_number} matches existing record {existing['id']}.",
                "evidence_json": {"matched_id": existing["id"], "amount": existing["total_amount"]},
                "status": "open",
            })
            risk_status = "hold"
            break

    # PO Mismatch check
    if payload.po_number:
        po = _PURCHASE_ORDERS.get(payload.po_number)
        if po:
            if payload.total_amount > po["total_amount"]:
                diff = payload.total_amount - po["total_amount"]
                findings.append({
                    "id": f"FND-PO-{uuid.uuid4().hex[:6]}",
                    "finding_type": "po_mismatch",
                    "severity": "high",
                    "title": f"PO Over-Billing (+${diff:,.2f})",
                    "description": f"Invoice amount ${payload.total_amount:,.2f} exceeds PO {payload.po_number} limit of ${po['total_amount']:,.2f}.",
                    "evidence_json": {"po_number": payload.po_number, "po_amount": po["total_amount"], "variance": diff},
                    "status": "open",
                })
                if risk_status != "hold":
                    risk_status = "review_required"

    # Beneficiary change check
    if vendor_match and payload.destination_account:
        if vendor_match.get("verified_account") and vendor_match["verified_account"] != payload.destination_account:
            findings.append({
                "id": f"FND-BEN-{uuid.uuid4().hex[:6]}",
                "finding_type": "beneficiary_changed",
                "severity": "critical",
                "title": "Unverified Beneficiary Account Change",
                "description": f"Remittance destination {payload.destination_account} differs from verified record {vendor_match['verified_account']}.",
                "evidence_json": {"old_account": vendor_match["verified_account"], "new_account": payload.destination_account},
                "status": "open",
            })
            risk_status = "hold"

    new_inv = {
        "id": invoice_id,
        "workspace_id": payload.workspace_id,
        "vendor_id": vendor_id,
        "vendor_name": payload.vendor_name,
        "invoice_number": payload.invoice_number,
        "invoice_date": payload.invoice_date,
        "due_date": payload.due_date,
        "currency": payload.currency,
        "total_amount": payload.total_amount,
        "document_uri": f"s3://paypilot-vault/{payload.workspace_id}/invoices/{payload.document_filename or 'invoice.pdf'}",
        "extraction_status": "extracted",
        "risk_status": risk_status,
        "po_number": payload.po_number,
        "po_amount": _PURCHASE_ORDERS.get(payload.po_number, {}).get("total_amount") if payload.po_number else None,
        "destination_account": payload.destination_account,
        "destination_routing": payload.destination_routing,
        "destination_bank_name": payload.destination_bank_name,
        "verified_destination_account": vendor_match.get("verified_account") if vendor_match else payload.destination_account,
        "beneficiary_verified": bool(vendor_match and vendor_match.get("verified_account") == payload.destination_account),
        "three_way_match_status": "matched" if not any(f["finding_type"] == "po_mismatch" for f in findings) else "partial_mismatch",
        "created_at": now,
        "line_items": [li.model_dump() for li in payload.line_items] or [
            {
                "id": f"li-{uuid.uuid4().hex[:4]}",
                "description": "General supplies / billable services",
                "quantity": 1.0,
                "unit_price": payload.total_amount,
                "tax_amount": 0.0,
                "line_total": payload.total_amount,
                "matched_po_line_id": None,
            }
        ],
        "findings": findings,
    }

    _DEMO_INVOICES[invoice_id] = new_inv

    return SupplierInvoiceItem(
        id=invoice_id,
        workspace_id=payload.workspace_id,
        vendor_id=vendor_id,
        vendor_name=payload.vendor_name,
        invoice_number=payload.invoice_number,
        invoice_date=payload.invoice_date,
        due_date=payload.due_date,
        currency=payload.currency,
        total_amount=payload.total_amount,
        document_uri=new_inv["document_uri"],
        extraction_status="extracted",
        risk_status=risk_status,  # type: ignore
        po_number=payload.po_number,
        po_amount=new_inv.get("po_amount"),
        findings=[InvoiceFindingModel(**f) for f in findings],
        critical_findings_count=len(findings),
        created_at=now,
    )


@router.get("/vendor-invoices/{invoice_id}", response_model=SupplierInvoiceDetail)
async def get_vendor_invoice_detail(
    invoice_id: str,
    request: Request,
) -> SupplierInvoiceDetail:
    """Return invoice details with line items and findings (Section 2.6)."""
    if invoice_id not in _DEMO_INVOICES:
        raise HTTPException(status_code=404, detail="Supplier invoice not found.")
    inv = _DEMO_INVOICES[invoice_id]
    crit_count = sum(1 for f in inv["findings"] if f["severity"] in ("high", "critical") and f["status"] == "open")

    return SupplierInvoiceDetail(
        id=inv["id"],
        workspace_id=inv["workspace_id"],
        vendor_id=inv["vendor_id"],
        vendor_name=inv["vendor_name"],
        invoice_number=inv["invoice_number"],
        invoice_date=inv["invoice_date"],
        due_date=inv["due_date"],
        currency=inv["currency"],
        total_amount=inv["total_amount"],
        document_uri=inv.get("document_uri"),
        extraction_status=inv["extraction_status"],
        risk_status=inv["risk_status"],
        po_number=inv.get("po_number"),
        po_amount=inv.get("po_amount"),
        findings=[InvoiceFindingModel(**f) for f in inv["findings"]],
        critical_findings_count=crit_count,
        created_at=inv["created_at"],
        line_items=[InvoiceLineItemModel(**li) for li in inv["line_items"]],
        destination_account=inv.get("destination_account"),
        destination_routing=inv.get("destination_routing"),
        destination_bank_name=inv.get("destination_bank_name"),
        verified_destination_account=inv.get("verified_destination_account"),
        beneficiary_verified=inv.get("beneficiary_verified", False),
        three_way_match_status=inv.get("three_way_match_status", "matched"),
    )


@router.post("/vendor-invoices/{invoice_id}/extract", response_model=InvoiceExtractResponse)
async def extract_vendor_invoice(
    invoice_id: str,
    request: Request,
) -> InvoiceExtractResponse:
    """Run OCR and structured extraction on private vault document (Section 2.6)."""
    if invoice_id not in _DEMO_INVOICES:
        raise HTTPException(status_code=404, detail="Invoice not found.")
    inv = _DEMO_INVOICES[invoice_id]

    return InvoiceExtractResponse(
        invoice_id=invoice_id,
        vendor_name=inv["vendor_name"],
        invoice_number=inv["invoice_number"],
        invoice_date=inv["invoice_date"],
        due_date=inv["due_date"],
        total_amount=inv["total_amount"],
        currency=inv["currency"],
        line_items=[InvoiceLineItemModel(**li) for li in inv["line_items"]],
        destination_account=inv.get("destination_account"),
        confidence_score=0.98,
    )


@router.post("/vendor-invoices/{invoice_id}/verify", response_model=InvoiceVerifyResponse)
async def verify_vendor_invoice(
    invoice_id: str,
    request: Request,
) -> InvoiceVerifyResponse:
    """Run duplicate, PO, vendor and beneficiary checks (Section 2.6)."""
    if invoice_id not in _DEMO_INVOICES:
        raise HTTPException(status_code=404, detail="Invoice not found.")
    inv = _DEMO_INVOICES[invoice_id]

    findings = [InvoiceFindingModel(**f) for f in inv["findings"]]
    has_critical = any(f.severity == "critical" and f.status == "open" for f in findings)
    has_high = any(f.severity == "high" and f.status == "open" for f in findings)

    recommendation = "approve"
    if has_critical:
        recommendation = "hold"
    elif has_high:
        recommendation = "out_of_band_verify"

    explanation = (
        f"Verified invoice {inv['invoice_number']} for {inv['vendor_name']}. "
        f"{len(findings)} risk findings flagged. "
        + ("Critical beneficiary or duplicate issues detected. Payment execution held." if has_critical else "Checks clear.")
    )

    return InvoiceVerifyResponse(
        invoice_id=invoice_id,
        risk_status=inv["risk_status"],
        findings=findings,
        checks_performed={
            "duplicate_detection": True,
            "po_three_way_match": True,
            "beneficiary_fingerprint_check": True,
            "vendor_domain_validation": True,
        },
        recommendation=recommendation,  # type: ignore
        explanation=explanation,
    )


@router.get("/vendor-invoices/{invoice_id}/findings", response_model=list[InvoiceFindingModel])
async def get_invoice_findings(
    invoice_id: str,
    request: Request,
) -> list[InvoiceFindingModel]:
    """Return findings with evidence and severity (Section 2.6)."""
    if invoice_id not in _DEMO_INVOICES:
        raise HTTPException(status_code=404, detail="Invoice not found.")
    inv = _DEMO_INVOICES[invoice_id]
    return [InvoiceFindingModel(**f) for f in inv["findings"]]


@router.post("/vendors/{vendor_id}/verify-payment-profile", response_model=dict[str, Any])
async def verify_vendor_payment_profile(
    vendor_id: str,
    payload: VendorVerifyProfileRequest,
    request: Request,
) -> dict[str, Any]:
    """Record an authorized out-of-band verification result for supplier bank profile (Section 2.6)."""
    vendor = _VERIFIED_VENDORS.get(vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found.")

    vendor["verified_account"] = payload.destination_fingerprint
    vendor["verified_status"] = "verified"
    vendor["last_verified_at"] = datetime.now(timezone.utc).isoformat()
    vendor["verification_method"] = payload.verification_method

    # Update any open findings on invoices for this vendor
    for inv in _DEMO_INVOICES.values():
        if inv["vendor_id"] == vendor_id:
            for f in inv["findings"]:
                if f["finding_type"] == "beneficiary_changed":
                    f["status"] = "verified_safe"
            if all(f["status"] != "open" for f in inv["findings"]):
                inv["risk_status"] = "clear"

    return {
        "vendor_id": vendor_id,
        "verified": True,
        "destination_fingerprint": payload.destination_fingerprint,
        "verification_method": payload.verification_method,
        "verified_at": datetime.now(timezone.utc).isoformat(),
        "notes": payload.verifier_notes,
    }


@router.post("/vendor-invoices/{invoice_id}/approve-payment", response_model=ApprovePaymentResponse)
async def approve_vendor_payment(
    invoice_id: str,
    payload: ApprovePaymentRequest,
    request: Request,
) -> ApprovePaymentResponse:
    """Create an approval bound to invoice, amount, currency and destination fingerprint (Section 2.6)."""
    if invoice_id not in _DEMO_INVOICES:
        raise HTTPException(status_code=404, detail="Invoice not found.")
    inv = _DEMO_INVOICES[invoice_id]

    # Guardrail: If critical beneficiary finding is still open and not overridden
    open_critical = [f for f in inv["findings"] if f["severity"] == "critical" and f["status"] == "open"]
    if open_critical and not payload.override_reason:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot approve payment with open critical findings without verified out-of-band override reason.",
        )

    inv["risk_status"] = "approved"
    dest = inv.get("destination_account") or "DEFAULT-ACH"
    binding_str = f"{invoice_id}:{inv['total_amount']}:{inv['currency']}:{dest}"
    payload_hash = hashlib.sha256(binding_str.encode("utf-8")).hexdigest()
    approval_id = f"appr-{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc)

    return ApprovePaymentResponse(
        invoice_id=invoice_id,
        approval_request_id=approval_id,
        status="approved",
        destination_fingerprint=dest,
        payload_hash=payload_hash,
        timestamp=now,
    )
