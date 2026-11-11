from datetime import datetime
from typing import Any, Literal
from pydantic import BaseModel, Field


class DisputeEvidenceItem(BaseModel):
    id: str
    workspace_id: str
    dispute_id: str
    source_record_id: str | None = None
    evidence_type: Literal[
        "proof_of_delivery",
        "order_confirmation",
        "customer_communication",
        "refund_policy",
        "invoice",
        "tracking_event",
        "other",
    ]
    storage_uri: str
    extracted_text: str | None = None
    evidence_status: Literal["available", "missing", "weak", "review_required"] = "available"
    created_at: datetime
    metadata_json: dict[str, Any] = Field(default_factory=dict)


class EvidenceChecklistItem(BaseModel):
    category: str
    required: bool
    status: Literal["available", "missing", "weak", "review_required"]
    description: str
    linked_evidence_id: str | None = None


class TimelineEvent(BaseModel):
    date: str
    event_type: str
    description: str
    source_record_id: str | None = None
    verified: bool = True


class DisputeItem(BaseModel):
    id: str
    workspace_id: str
    provider: str = "paypal"
    provider_dispute_id: str
    payment_id: str | None = None
    reason_code: str
    disputed_amount: float
    currency: str
    status: Literal["UNDER_REVIEW", "WAITING_FOR_BUYER", "WAITING_FOR_SELLER", "RESOLVED", "OPEN", "INQUIRY"]
    response_due_at: datetime
    provider_created_at: datetime
    synced_at: datetime
    evidence_count: int = 0
    missing_critical_count: int = 0


class DisputeDetail(DisputeItem):
    evidence: list[DisputeEvidenceItem] = Field(default_factory=list)
    checklist: list[EvidenceChecklistItem] = Field(default_factory=list)
    timeline: list[TimelineEvent] = Field(default_factory=list)
    ai_case_brief: str | None = None
    draft_response: str | None = None
    contraindications: list[str] = Field(default_factory=list)


class DisputeCreateRequest(BaseModel):
    workspace_id: str = "ws-default-01"
    provider: str = "paypal"
    provider_dispute_id: str
    payment_id: str | None = None
    reason_code: str
    disputed_amount: float
    currency: str = "USD"
    status: Literal["UNDER_REVIEW", "WAITING_FOR_BUYER", "WAITING_FOR_SELLER", "RESOLVED", "OPEN", "INQUIRY"] = "WAITING_FOR_SELLER"
    response_due_at: datetime
    evidence_items: list[dict[str, Any]] = Field(default_factory=list)


class DisputeInvestigateResponse(BaseModel):
    dispute_id: str
    evidence_collected: int
    missing_evidence: list[str]
    contradictions: list[str]
    timeline: list[TimelineEvent]
    checklist: list[EvidenceChecklistItem]
    readiness_score: int


class DisputeDraftResponseRequest(BaseModel):
    notes: str | None = None
    tone: Literal["firm", "concise", "formal"] = "firm"


class DisputeDraftResponse(BaseModel):
    dispute_id: str
    draft_text: str
    citations: list[dict[str, str]]
    model_version: str = "gemini-1.5-flash"
    created_at: datetime


class DisputeSubmitApprovalRequest(BaseModel):
    draft_text: str
    evidence_ids: list[str]
    approver_email: str | None = None


class DisputeSubmitApprovalResponse(BaseModel):
    approval_request_id: str
    dispute_id: str
    payload_hash: str
    status: str
    expires_at: datetime


class DisputeSubmitRequest(BaseModel):
    approval_request_id: str
    hand_off_mode: Literal["auto_provider_api", "manual_provider_portal"] = "auto_provider_api"


class DisputeSubmitResponse(BaseModel):
    dispute_id: str
    provider_submission_id: str
    provider_status: str
    submitted_at: datetime
    mode_used: str
    receipt_message: str
