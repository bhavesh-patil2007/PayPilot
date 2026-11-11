from datetime import date
from decimal import Decimal

from ..schemas.commitments import (
    CommitmentAssessmentRequest,
    CommitmentAssessmentResponse,
    ProjectedCashPoint,
)


def assess_commitment(request: CommitmentAssessmentRequest) -> CommitmentAssessmentResponse:
    """Project dated cash flows using Decimal arithmetic; this is not a bank-balance estimate."""
    current_cash = request.starting_cash
    minimum_cash = current_cash
    first_breach = date.today() if current_cash < request.required_reserve else None
    projection = [
        ProjectedCashPoint(
            date=date.today(),
            label="Starting balance",
            direction="starting_balance",
            change=format(current_cash, "f"),
            projected_cash=format(current_cash, "f"),
        )
    ]

    for flow in sorted(
        request.cash_flows,
        key=lambda item: (item.date, 0 if item.direction == "outflow" else 1, item.label),
    ):
        change = flow.amount if flow.direction == "inflow" else -flow.amount
        current_cash += change
        minimum_cash = min(minimum_cash, current_cash)
        if first_breach is None and current_cash < request.required_reserve:
            first_breach = flow.date
        projection.append(
            ProjectedCashPoint(
                date=flow.date,
                label=flow.label,
                direction=flow.direction,
                change=format(change, "f"),
                projected_cash=format(current_cash, "f"),
            )
        )

    reserve_gap = max(Decimal("0"), request.required_reserve - minimum_cash)
    peak_funding_requirement = max(Decimal("0"), request.starting_cash - minimum_cash)
    if first_breach is not None:
        status = "breach"
        recommendations = [{"type": "request_deposit", "amount": format(reserve_gap, "f")}]
    elif minimum_cash <= request.required_reserve:
        status = "warning"
        recommendations = [{"type": "review_timing", "amount": "0"}]
    else:
        status = "safe"
        recommendations = []

    assumptions = [
        f"Starting cash source: {request.starting_cash_source}.",
        "Each listed cash flow is assumed to settle in full on its stated date; same-day outflows precede inflows.",
        "This assessment uses only the values supplied for this scenario.",
    ]
    missing_inputs = []
    if request.starting_cash_source == "manual_estimate":
        missing_inputs.append("Starting cash is a manual estimate and has not been verified.")

    return CommitmentAssessmentResponse(
        status=status,
        currency=request.currency,
        peak_funding_requirement=format(peak_funding_requirement, "f"),
        minimum_projected_cash=format(minimum_cash, "f"),
        required_reserve=format(request.required_reserve, "f"),
        reserve_gap=format(reserve_gap, "f"),
        first_reserve_breach_date=first_breach,
        assumptions=assumptions,
        missing_inputs=missing_inputs,
        recommendations=recommendations,
        projected_cash=projection,
    )
