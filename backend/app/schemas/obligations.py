from datetime import date, datetime
from typing import Any, Literal
from pydantic import BaseModel, Field


class ObligationItem(BaseModel):
    id: str
    workspace_id: str
    source_type: Literal[
        "supplier_invoice",
        "purchase_order",
        "recurring_expense",
        "payroll",
        "tax",
        "loan",
        "manual",
    ]
    source_id: str | None = None
    payee_id: str | None = None
    payee_name: str
    amount: float
    currency: str = "USD"
    due_date: date
    earliest_pay_date: date
    latest_pay_date: date
    priority: Literal["critical", "high", "medium", "low"] = "medium"
    late_fee_terms_json: dict[str, Any] = Field(default_factory=dict)
    discount_terms_json: dict[str, Any] = Field(default_factory=dict)
    status: Literal["pending", "scheduled", "executing", "paid", "cancelled"] = "pending"
    created_at: datetime


class ObligationCreateRequest(BaseModel):
    workspace_id: str = "ws-default-01"
    source_type: Literal[
        "supplier_invoice",
        "purchase_order",
        "recurring_expense",
        "payroll",
        "tax",
        "loan",
        "manual",
    ] = "manual"
    source_id: str | None = None
    payee_name: str
    amount: float
    currency: str = "USD"
    due_date: date
    earliest_pay_date: date | None = None
    latest_pay_date: date | None = None
    priority: Literal["critical", "high", "medium", "low"] = "medium"
    late_fee_rate: float = 0.05
    early_discount_rate: float = 0.02
    early_discount_days: int = 10


class ScheduledObligationItem(BaseModel):
    id: str
    obligation_id: str
    payee_name: str
    due_date: date
    proposed_date: date
    proposed_amount: float
    currency: str
    priority: str
    reason_codes: list[str]
    reserve_safe: bool = True
    projected_cash_after: float
    discount_captured: float = 0.0
    late_fee_avoided: float = 0.0
    status: Literal["proposed", "approved", "task_created", "paid"] = "proposed"


class DailyCashForecastPoint(BaseModel):
    date: str
    projected_inflow: float
    scheduled_outflow: float
    projected_cash: float
    reserve_floor: float
    breached: bool = False


class SimulateScheduleRequest(BaseModel):
    workspace_id: str = "ws-default-01"
    scenario_id: Literal["baseline", "delayed_inflow", "low_sales", "unexpected_expense"] = "baseline"
    starting_cash: float = 142500.0
    reserve_floor: float = 15000.0
    forecast_days: int = 30
    prioritize_discounts: bool = True


class SimulateScheduleResponse(BaseModel):
    schedule_id: str
    scenario_id: str
    version: int = 1
    starting_cash: float
    reserve_floor: float
    items: list[ScheduledObligationItem]
    daily_forecast: list[DailyCashForecastPoint]
    total_scheduled_amount: float
    total_discounts_captured: float
    total_late_fees_avoided: float
    reserve_breached: bool
    breach_dates: list[str] = Field(default_factory=list)
    explanation: str


class ScheduleApprovalRequest(BaseModel):
    schedule_id: str
    selected_obligation_ids: list[str] = Field(default_factory=list)
    approver_id: str = "user-cfo"


class ScheduleApprovalResponse(BaseModel):
    schedule_id: str
    approved_items_count: int
    approval_hash: str
    status: str
    approved_at: datetime


class ObligationExecuteRequest(BaseModel):
    obligation_id: str
    schedule_item_id: str | None = None
    execution_type: Literal["provider_direct", "task_reminder"] = "provider_direct"


class ObligationExecuteResponse(BaseModel):
    obligation_id: str
    execution_status: Literal["task_created", "executed", "failed"]
    provider: str
    message: str
    executed_at: datetime
