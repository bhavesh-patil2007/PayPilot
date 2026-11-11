from datetime import date, datetime
from typing import Any, Literal
from pydantic import BaseModel, Field


class InvoiceLineItemModel(BaseModel):
    id: str | None = None
    description: str
    quantity: float
    unit_price: float
    tax_amount: float = 0.0
    line_total: float
    matched_po_line_id: str | None = None


class InvoiceFindingModel(BaseModel):
    id: str
    finding_type: Literal[
        "duplicate_candidate",
        "po_mismatch",
        "beneficiary_changed",
        "price_variance",
        "vendor_impersonation",
        "unusual_amount",
    ]
    severity: Literal["low", "medium", "high", "critical"]
    title: str
    description: str
    evidence_json: dict[str, Any] = Field(default_factory=dict)
    status: Literal["open", "verified_safe", "confirmed_fraud", "dismissed"] = "open"
    reviewed_by: str | None = None
    reviewed_at: datetime | None = None


class SupplierInvoiceItem(BaseModel):
    id: str
    workspace_id: str
    vendor_id: str
    vendor_name: str
    invoice_number: str
    invoice_date: date
    due_date: date
    currency: str
    total_amount: float
    document_uri: str | None = None
    extraction_status: Literal["pending", "extracted", "failed"] = "extracted"
    risk_status: Literal["clear", "review_required", "hold", "approved", "rejected"] = "clear"
    po_number: str | None = None
    po_amount: float | None = None
    findings: list[InvoiceFindingModel] = Field(default_factory=list)
    critical_findings_count: int = 0
    created_at: datetime


class SupplierInvoiceDetail(SupplierInvoiceItem):
    line_items: list[InvoiceLineItemModel] = Field(default_factory=list)
    destination_account: str | None = None
    destination_routing: str | None = None
    destination_bank_name: str | None = None
    verified_destination_account: str | None = None
    beneficiary_verified: bool = False
    three_way_match_status: Literal["matched", "partial_mismatch", "po_missing", "unmatched"] = "matched"


class InvoiceCreateRequest(BaseModel):
    workspace_id: str = "ws-default-01"
    vendor_name: str
    invoice_number: str
    invoice_date: date
    due_date: date
    currency: str = "USD"
    total_amount: float
    po_number: str | None = None
    destination_account: str | None = None
    destination_routing: str | None = None
    destination_bank_name: str | None = None
    line_items: list[InvoiceLineItemModel] = Field(default_factory=list)
    document_filename: str | None = None


class InvoiceExtractResponse(BaseModel):
    invoice_id: str
    vendor_name: str
    invoice_number: str
    invoice_date: date
    due_date: date
    total_amount: float
    currency: str
    line_items: list[InvoiceLineItemModel]
    destination_account: str | None = None
    confidence_score: float = 0.98


class InvoiceVerifyResponse(BaseModel):
    invoice_id: str
    risk_status: Literal["clear", "review_required", "hold", "approved", "rejected"]
    findings: list[InvoiceFindingModel]
    checks_performed: dict[str, bool]
    recommendation: Literal["approve", "hold", "out_of_band_verify", "reject"]
    explanation: str


class VendorVerifyProfileRequest(BaseModel):
    destination_fingerprint: str
    verification_method: Literal["out_of_band_phone", "in_person", "dual_control_call"] = "out_of_band_phone"
    verifier_notes: str


class ApprovePaymentRequest(BaseModel):
    approver_id: str = "user-finance-lead"
    override_reason: str | None = None


class ApprovePaymentResponse(BaseModel):
    invoice_id: str
    approval_request_id: str
    status: Literal["approved", "queued_for_execution"]
    destination_fingerprint: str
    payload_hash: str
    timestamp: datetime
