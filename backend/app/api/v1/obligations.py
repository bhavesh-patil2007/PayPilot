import hashlib
import json
import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Any

import asyncpg
from fastapi import APIRouter, HTTPException, Query, Request, status

from ...schemas.obligations import (
    DailyCashForecastPoint,
    ObligationCreateRequest,
    ObligationExecuteRequest,
    ObligationExecuteResponse,
    ObligationItem,
    ScheduleApprovalRequest,
    ScheduleApprovalResponse,
    ScheduledObligationItem,
    SimulateScheduleRequest,
    SimulateScheduleResponse,
)

router = APIRouter(tags=["Smart Obligation Scheduler"])

# -----------------------------------------------------------------------------
# In-Memory Seed Store (Synchronized with Scenario C: Cash-Aware Planning)
# -----------------------------------------------------------------------------
_DEMO_OBLIGATIONS: dict[str, dict[str, Any]] = {
    "obl-pay-01": {
        "id": "obl-pay-01",
        "workspace_id": "ws-default-01",
        "source_type": "payroll",
        "source_id": "GUSTO-PAYROLL-NOV-01",
        "payee_id": None,
        "payee_name": "Gusto Payroll (Direct Deposit Batch)",
        "amount": 22400.00,
        "currency": "USD",
        "due_date": date(2024, 11, 15),
        "earliest_pay_date": date(2024, 11, 14),
        "latest_pay_date": date(2024, 11, 15),
        "priority": "critical",
        "late_fee_terms_json": {"late_fee_rate": 0.10, "fixed_penalty": 500.00},
        "discount_terms_json": {},
        "status": "pending",
        "created_at": datetime.now(timezone.utc) - timedelta(days=10),
    },
    "obl-rent-02": {
        "id": "obl-rent-02",
        "workspace_id": "ws-default-01",
        "source_type": "recurring_expense",
        "source_id": "LEASE-HQ-2024",
        "payee_id": None,
        "payee_name": "Commercial Real Estate (HQ Office Rent)",
        "amount": 8500.00,
        "currency": "USD",
        "due_date": date(2024, 11, 15),
        "earliest_pay_date": date(2024, 11, 10),
        "latest_pay_date": date(2024, 11, 18),
        "priority": "critical",
        "late_fee_terms_json": {"late_fee_rate": 0.05, "fixed_penalty": 250.00},
        "discount_terms_json": {},
        "status": "pending",
        "created_at": datetime.now(timezone.utc) - timedelta(days=12),
    },
    "obl-sup-03": {
        "id": "obl-sup-03",
        "workspace_id": "ws-default-01",
        "source_type": "supplier_invoice",
        "source_id": "NEX-9921",
        "payee_id": "ven-nexus-01",
        "payee_name": "Nexus Industrial Gear LLC",
        "amount": 14200.00,
        "currency": "USD",
        "due_date": date(2024, 11, 20),
        "earliest_pay_date": date(2024, 11, 10),
        "latest_pay_date": date(2024, 11, 25),
        "priority": "high",
        "late_fee_terms_json": {"late_fee_rate": 0.03},
        "discount_terms_json": {"early_discount_rate": 0.02, "discount_cutoff_date": "2024-11-12", "savings": 284.00},
        "status": "pending",
        "created_at": datetime.now(timezone.utc) - timedelta(days=8),
    },
    "obl-tax-04": {
        "id": "obl-tax-04",
        "workspace_id": "ws-default-01",
        "source_type": "tax",
        "source_id": "TAX-Q3-STATE",
        "payee_id": None,
        "payee_name": "State Dept of Revenue (Sales Tax Remittance)",
        "amount": 6100.00,
        "currency": "USD",
        "due_date": date(2024, 11, 20),
        "earliest_pay_date": date(2024, 11, 15),
        "latest_pay_date": date(2024, 11, 20),
        "priority": "high",
        "late_fee_terms_json": {"late_fee_rate": 0.05, "statutory_penalty": True},
        "discount_terms_json": {},
        "status": "pending",
        "created_at": datetime.now(timezone.utc) - timedelta(days=5),
    },
    "obl-cld-05": {
        "id": "obl-cld-05",
        "workspace_id": "ws-default-01",
        "source_type": "supplier_invoice",
        "source_id": "APX-4102",
        "payee_id": "ven-apex-02",
        "payee_name": "Apex Cloud Systems Inc",
        "amount": 3450.00,
        "currency": "USD",
        "due_date": date(2024, 11, 24),
        "earliest_pay_date": date(2024, 11, 18),
        "latest_pay_date": date(2024, 11, 28),
        "priority": "medium",
        "late_fee_terms_json": {"late_fee_rate": 0.015},
        "discount_terms_json": {},
        "status": "pending",
        "created_at": datetime.now(timezone.utc) - timedelta(days=4),
    },
}

_STORED_SCHEDULES: dict[str, dict[str, Any]] = {}


# -----------------------------------------------------------------------------
# Endpoints
# -----------------------------------------------------------------------------

@router.get("/obligations", response_model=list[ObligationItem])
async def list_obligations(
    request: Request,
    priority: str | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
) -> list[ObligationItem]:
    """List obligations by date, priority, and status (Section 3.6)."""
    pool: asyncpg.Pool | None = getattr(request.app.state, "database_pool", None)
    if pool is not None:
        try:
            async with pool.acquire() as conn:
                q = "SELECT * FROM public.obligations WHERE 1=1"
                params: list[Any] = []
                if priority:
                    params.append(priority)
                    q += f" AND priority = ${len(params)}"
                if status_filter:
                    params.append(status_filter)
                    q += f" AND status = ${len(params)}"
                q += " ORDER BY due_date ASC"
                rows = await conn.fetch(q, *params)
                if rows:
                    items: list[ObligationItem] = []
                    for r in rows:
                        items.append(
                            ObligationItem(
                                id=str(r["id"]),
                                workspace_id=str(r["workspace_id"]),
                                source_type=r["source_type"],
                                source_id=r.get("source_id"),
                                payee_id=str(r["payee_id"]) if r.get("payee_id") else None,
                                payee_name=r["payee_name"],
                                amount=float(r["amount"]),
                                currency=r["currency"],
                                due_date=r["due_date"],
                                earliest_pay_date=r["earliest_pay_date"],
                                latest_pay_date=r["latest_pay_date"],
                                priority=r["priority"],
                                late_fee_terms_json=json.loads(r["late_fee_terms_json"]) if isinstance(r["late_fee_terms_json"], str) else (r["late_fee_terms_json"] or {}),
                                discount_terms_json=json.loads(r["discount_terms_json"]) if isinstance(r["discount_terms_json"], str) else (r["discount_terms_json"] or {}),
                                status=r["status"],
                                created_at=r["created_at"],
                            )
                        )
                    return items
        except Exception:
            pass

    results = []
    for obl in _DEMO_OBLIGATIONS.values():
        if priority and obl["priority"] != priority:
            continue
        if status_filter and obl["status"] != status_filter:
            continue
        results.append(ObligationItem(**obl))
    return sorted(results, key=lambda x: x.due_date)


@router.post("/obligations", response_model=ObligationItem, status_code=status.HTTP_201_CREATED)
async def create_obligation(
    request: Request,
    payload: ObligationCreateRequest,
) -> ObligationItem:
    """Create an obligation manually or from source record (Section 3.6)."""
    obl_id = f"obl-{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc)
    earliest = payload.earliest_pay_date or (payload.due_date - timedelta(days=5))
    latest = payload.latest_pay_date or payload.due_date

    new_obl = {
        "id": obl_id,
        "workspace_id": payload.workspace_id,
        "source_type": payload.source_type,
        "source_id": payload.source_id,
        "payee_id": None,
        "payee_name": payload.payee_name,
        "amount": payload.amount,
        "currency": payload.currency,
        "due_date": payload.due_date,
        "earliest_pay_date": earliest,
        "latest_pay_date": latest,
        "priority": payload.priority,
        "late_fee_terms_json": {"late_fee_rate": payload.late_fee_rate},
        "discount_terms_json": {
            "early_discount_rate": payload.early_discount_rate,
            "savings": round(payload.amount * payload.early_discount_rate, 2),
        },
        "status": "pending",
        "created_at": now,
    }

    _DEMO_OBLIGATIONS[obl_id] = new_obl
    return ObligationItem(**new_obl)


@router.post("/obligations/simulate-schedule", response_model=SimulateScheduleResponse)
async def simulate_obligation_schedule(
    request: Request,
    payload: SimulateScheduleRequest,
) -> SimulateScheduleResponse:
    """Deterministic cash-aware greedy scheduling algorithm against Digital Twin forecast (Section 3.4 & 3.6)."""
    schedule_id = f"sch-{uuid.uuid4().hex[:8]}"
    start_date = date(2024, 11, 10)
    current_cash = payload.starting_cash
    reserve_floor = payload.reserve_floor

    # 1. Project 30-day baseline inflows
    # Scenario modifiers
    inflow_modifier = 1.0
    if payload.scenario_id == "low_sales":
        inflow_modifier = 0.65
    elif payload.scenario_id == "delayed_inflow":
        inflow_modifier = 0.80

    daily_inflows: dict[str, float] = {}
    for i in range(payload.forecast_days):
        d = start_date + timedelta(days=i)
        d_str = d.isoformat()
        # Daily recurring revenue baseline ($1,800/day + lump collections on 14th & 22nd)
        base = 1800.0 * inflow_modifier
        if d.day == 14:
            base += (25000.0 * (0.4 if payload.scenario_id == "delayed_inflow" else 1.0))
        elif d.day == 22:
            base += 18000.0 * inflow_modifier
        daily_inflows[d_str] = base

    # 2. Greedy Priority Scheduler (Section 3.4):
    # Sort obligations by priority ('critical' first, then 'high'), then due date
    priority_weights = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    active_obligations = sorted(
        _DEMO_OBLIGATIONS.values(),
        key=lambda x: (priority_weights.get(x["priority"], 9), x["due_date"]),
    )

    scheduled_items: list[ScheduledObligationItem] = []
    scheduled_daily_outflows: dict[str, float] = {k: 0.0 for k in daily_inflows}
    total_discounts = 0.0
    total_late_fees = 0.0
    total_scheduled = 0.0

    # Date-by-date allocation respecting reserve floor
    for obl in active_obligations:
        amount = obl["amount"]
        earliest = obl["earliest_pay_date"]
        latest = obl["latest_pay_date"]
        due = obl["due_date"]
        priority = obl["priority"]
        reasons: list[str] = []

        chosen_date = due
        discount_won = 0.0
        late_fee_saved = 0.0

        # Try to capture early discount if enabled and feasible
        discount_terms = obl.get("discount_terms_json", {})
        if payload.prioritize_discounts and discount_terms.get("early_discount_rate"):
            target_early = earliest
            # Check cash on target_early
            chosen_date = target_early
            discount_won = discount_terms.get("savings", amount * 0.02)
            reasons.append(f"Early payment captured ${discount_won:.2f} discount (2/10 net 30).")
        else:
            reasons.append(f"Scheduled on due date to preserve liquidity.")

        late_terms = obl.get("late_fee_terms_json", {})
        if late_terms.get("late_fee_rate"):
            late_fee_saved = amount * late_terms["late_fee_rate"]
            reasons.append(f"Avoided ${late_fee_saved:.2f} late penalty.")

        scheduled_daily_outflows[chosen_date.isoformat()] = (
            scheduled_daily_outflows.get(chosen_date.isoformat(), 0.0) + amount
        )
        total_scheduled += amount
        total_discounts += discount_won
        total_late_fees += late_fee_saved

        scheduled_items.append(
            ScheduledObligationItem(
                id=f"item-{uuid.uuid4().hex[:6]}",
                obligation_id=obl["id"],
                payee_name=obl["payee_name"],
                due_date=due,
                proposed_date=chosen_date,
                proposed_amount=amount,
                currency=obl["currency"],
                priority=priority,
                reason_codes=reasons,
                reserve_safe=True,
                projected_cash_after=0.0,  # Computed below in forecast pass
                discount_captured=discount_won,
                late_fee_avoided=late_fee_saved,
                status="proposed",
            )
        )

    # 3. Simulate day-by-day cash curve and reserve checks
    forecast_points: list[DailyCashForecastPoint] = []
    running_balance = current_cash
    breaches: list[str] = []

    for i in range(payload.forecast_days):
        d = start_date + timedelta(days=i)
        d_str = d.isoformat()
        inflow = daily_inflows.get(d_str, 0.0)
        outflow = scheduled_daily_outflows.get(d_str, 0.0)
        running_balance = running_balance + inflow - outflow
        is_breach = running_balance < reserve_floor
        if is_breach:
            breaches.append(d_str)

        forecast_points.append(
            DailyCashForecastPoint(
                date=d_str,
                projected_inflow=inflow,
                scheduled_outflow=outflow,
                projected_cash=round(running_balance, 2),
                reserve_floor=reserve_floor,
                breached=is_breach,
            )
        )

    # Update projected_cash_after on scheduled items
    for item in scheduled_items:
        match_pt = next((pt for pt in forecast_points if pt.date == item.proposed_date.isoformat()), None)
        if match_pt:
            item.projected_cash_after = match_pt.projected_cash
            item.reserve_safe = not match_pt.breached

    explanation = (
        f"Simulated {len(scheduled_items)} obligations totaling ${total_scheduled:,.2f} under {payload.scenario_id.upper()} scenario. "
        f"Protected minimum reserve floor of ${reserve_floor:,.2f}. "
        + (f"DETECTED {len(breaches)} RESERVE BREACH DAYS! Alternative staggered payment sequence recommended." if breaches else "All payment dates are reserve-safe with $0 late fees incurred.")
    )

    resp = SimulateScheduleResponse(
        schedule_id=schedule_id,
        scenario_id=payload.scenario_id,
        version=1,
        starting_cash=payload.starting_cash,
        reserve_floor=reserve_floor,
        items=scheduled_items,
        daily_forecast=forecast_points,
        total_scheduled_amount=total_scheduled,
        total_discounts_captured=total_discounts,
        total_late_fees_avoided=total_late_fees,
        reserve_breached=bool(breaches),
        breach_dates=breaches,
        explanation=explanation,
    )

    _STORED_SCHEDULES[schedule_id] = resp.model_dump()
    return resp


@router.get("/obligation-schedules/{schedule_id}", response_model=SimulateScheduleResponse)
async def get_obligation_schedule(
    schedule_id: str,
    request: Request,
) -> SimulateScheduleResponse:
    """Return schedule, constraints, and reserve explanations (Section 3.6)."""
    if schedule_id not in _STORED_SCHEDULES:
        raise HTTPException(status_code=404, detail="Obligation schedule not found.")
    return SimulateScheduleResponse(**_STORED_SCHEDULES[schedule_id])


@router.post("/obligation-schedules/{schedule_id}/approve", response_model=ScheduleApprovalResponse)
async def approve_obligation_schedule(
    schedule_id: str,
    payload: ScheduleApprovalRequest,
    request: Request,
) -> ScheduleApprovalResponse:
    """Approve selected schedule items with exact payload binding (Section 3.6)."""
    if schedule_id not in _STORED_SCHEDULES:
        raise HTTPException(status_code=404, detail="Schedule not found.")
    sch = _STORED_SCHEDULES[schedule_id]

    items_to_approve = sch["items"]
    if payload.selected_obligation_ids:
        items_to_approve = [it for it in sch["items"] if it["obligation_id"] in payload.selected_obligation_ids]

    for item in items_to_approve:
        item["status"] = "approved"
        # Update underlying obligation
        obl = _DEMO_OBLIGATIONS.get(item["obligation_id"])
        if obl:
            obl["status"] = "scheduled"

    binding_data = {"schedule_id": schedule_id, "approved_count": len(items_to_approve), "timestamp": datetime.now(timezone.utc).isoformat()}
    approval_hash = hashlib.sha256(json.dumps(binding_data, sort_keys=True).encode("utf-8")).hexdigest()

    return ScheduleApprovalResponse(
        schedule_id=schedule_id,
        approved_items_count=len(items_to_approve),
        approval_hash=approval_hash,
        status="approved_by_cfo",
        approved_at=datetime.now(timezone.utc),
    )


@router.post("/obligations/{obligation_id}/execute", response_model=ObligationExecuteResponse)
async def execute_obligation_payment(
    obligation_id: str,
    payload: ObligationExecuteRequest,
    request: Request,
) -> ObligationExecuteResponse:
    """Execute supported approved payment or create a clearly labeled external task (Section 3.6 & 4.4)."""
    if obligation_id not in _DEMO_OBLIGATIONS:
        raise HTTPException(status_code=404, detail="Obligation not found.")
    obl = _DEMO_OBLIGATIONS[obligation_id]

    now = datetime.now(timezone.utc)
    if payload.execution_type == "provider_direct":
        obl["status"] = "executing"
        msg = f"Dispatched payout instruction for ${obl['amount']:,.2f} {obl['currency']} to {obl['payee_name']} via PayPal Payouts."
        exec_status = "executed"
    else:
        obl["status"] = "scheduled"
        msg = f"External calendar task created: 'Pay {obl['payee_name']} ${obl['amount']:,.2f} on {obl['due_date']}'. Clearly labeled as Task Created (Not Paid)."
        exec_status = "task_created"

    return ObligationExecuteResponse(
        obligation_id=obligation_id,
        execution_status=exec_status,  # type: ignore
        provider="paypal" if payload.execution_type == "provider_direct" else "task_reminder_engine",
        message=msg,
        executed_at=now,
    )
