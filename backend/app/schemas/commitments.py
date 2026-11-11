from datetime import date
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_serializer, field_validator, model_validator


class CashFlowInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    date: date
    direction: Literal["inflow", "outflow"]
    amount: Decimal = Field(gt=0, max_digits=20, decimal_places=6)
    label: str = Field(min_length=1, max_length=120)


class CommitmentAssessmentRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    currency: str = Field(pattern=r"^[A-Z]{3}$")
    starting_cash: Decimal = Field(max_digits=20, decimal_places=6)
    starting_cash_source: Literal["owner_verified", "connected_balance", "manual_estimate"]
    required_reserve: Decimal = Field(ge=0, max_digits=20, decimal_places=6)
    cash_flows: list[CashFlowInput] = Field(max_length=500)

    @field_validator("currency")
    @classmethod
    def uppercase_currency(cls, value: str) -> str:
        return value.upper()

    @model_validator(mode="after")
    def validate_non_negative_cash(self):
        if self.starting_cash < 0:
            raise ValueError("starting_cash cannot be negative")
        if any(flow.date < date.today() for flow in self.cash_flows):
            raise ValueError("cash_flows must be dated today or in the future")
        return self


class ProjectedCashPoint(BaseModel):
    date: date
    label: str
    direction: Literal["inflow", "outflow", "starting_balance"]
    change: str
    projected_cash: str


class CommitmentAssessmentResponse(BaseModel):
    commitment_id: str | None = None
    status: Literal["safe", "warning", "breach"]
    currency: str
    peak_funding_requirement: str
    minimum_projected_cash: str
    required_reserve: str
    reserve_gap: str
    first_reserve_breach_date: date | None
    scenario_version: str = "cashflow-v1"
    assumptions: list[str]
    missing_inputs: list[str]
    recommendations: list[dict[str, str]]
    projected_cash: list[ProjectedCashPoint]
