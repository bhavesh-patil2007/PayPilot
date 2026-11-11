# FinCora AI — Full-Stack Extensions Technical Architecture

This document outlines the design, data models, API contracts, and user experience workflows for the three enterprise extensions implemented in FinCora AI:
1. **Dispute Defense Studio**
2. **Vendor & Invoice Fraud Shield**
3. **Smart Obligation Scheduler**

---

## 1. Dispute Defense Studio

### Purpose
Enables merchants to assemble evidence cases, track regulatory deadlines, evaluate deterministic evidence completeness, and prepare provider-grounded rebuttals with cryptographic submission bindings.

### Data Model (`supabase/migrations/20261112010000_fullstack_extensions.sql`)
- `disputes`: Tracks provider dispute ID, disputed amount, currency, status, response deadline, and sync timestamps.
- `dispute_evidence`: Links source records (orders, delivery proofs, support communications) with extracted text, storage URIs, and confidence ratings.
- `dispute_drafts`: Stores AI-generated response drafts with citation anchors (`[EVID-xxx]`) and checklist validation.
- `dispute_submissions`: Records immutable submission payloads with provider response identifiers.

### API Surface (`backend/app/api/v1/disputes.py`)
- `GET /api/v1/disputes` — Filterable dispute inbox with deadline urgency.
- `GET /api/v1/disputes/{id}` — Case workspace with evidence timeline and checklist.
- `POST /api/v1/disputes/{id}/investigate` — Evidence collection and contradiction checks.
- `POST /api/v1/disputes/{id}/draft-response` — Evidence-grounded response generation.
- `POST /api/v1/disputes/{id}/submit-approval` — Cryptographic approval request creation.
- `POST /api/v1/disputes/{id}/submit` — Provider dispatch or guided manual portal handoff.

### UI Components (`frontend/src/views/DisputeDefenseView.tsx`)
- **Dispute Inbox:** Sortable case register with deadline countdowns and status chips.
- **Case Workspace:** Chronological audit trail and deterministic checklist.
- **Evidence Drawer:** High-fidelity document viewer with OCR confidence scores and citation snippets.
- **Approval Review Modal:** Full cryptographic payload binding preview prior to submission.

---

## 2. Vendor & Invoice Fraud Shield

### Purpose
Pre-payment verification gate preventing fraudulent outgoing disbursements by cross-checking purchase orders, duplicate records, and unauthorized remittance instruction alterations.

### Data Model
- `vendors`: Canonical supplier directory with normalized names and verified contacts.
- `vendor_payment_profiles`: Active and historical bank wire / ACH destinations with verification audit logs.
- `purchase_orders`: Approved PO records with quantities, unit prices, and status.
- `supplier_invoices`: Ingested invoices with extraction and risk status flags.
- `invoice_line_items`: Line-level breakdown with PO matching keys.
- `invoice_findings`: Risk signals detailing exact mismatched fields and severity levels.

### API Surface (`backend/app/api/v1/vendor_invoices.py`)
- `POST /api/v1/vendor-invoices` — Register and upload an invoice.
- `POST /api/v1/vendor-invoices/{id}/extract` — Run field-level structured extraction.
- `POST /api/v1/vendor-invoices/{id}/verify` — Execute duplicate, PO, and beneficiary checks.
- `GET /api/v1/vendor-invoices/{id}/findings` — Detailed explainable risk diagnostic list.
- `POST /api/v1/vendors/{id}/verify-payment-profile` — Record out-of-band contact verification.
- `POST /api/v1/vendor-invoices/{id}/approve-payment` — Exact amount and destination bound approval.

### UI Components (`frontend/src/views/InvoiceFraudShieldView.tsx`)
- **Review Queue Table:** Displays invoice status, risk flags, and PO numbers.
- **Three-Way Matching Panel:** Visual line-by-line comparison between invoice, PO, and receipts.
- **Beneficiary Guardrail:** Alerts on destination account mismatches and prompts for out-of-band confirmation.
- **Intake Modal:** Direct PDF/image upload pipeline.

---

## 3. Smart Obligation Scheduler

### Purpose
Cash-aware planning engine that optimizes when to execute approved commitments against forward cash forecasts while enforcing strict safety reserve floors.

### Data Model
- `obligations`: Multi-source obligations (invoices, payroll, rent, taxes, loans) with early discount and late fee terms.
- `obligation_schedules`: Multi-scenario schedule plans linked to Digital Twin snapshots.
- `obligation_schedule_items`: Recommended execution dates with constraint reason codes.
- `payment_instructions`: Approved execution records bound to payee, date, and provider.

### API Surface (`backend/app/api/v1/obligations.py`)
- `GET /api/v1/obligations` — List obligations by date, priority, and status.
- `POST /api/v1/obligations` — Create an obligation manually or from source.
- `POST /api/v1/obligations/simulate-schedule` — Run greedy priority scheduling algorithm.
- `GET /api/v1/obligation-schedules/{id}` — Fetch detailed schedule breakdown.
- `POST /api/v1/obligation-schedules/{id}/approve` — Authorize schedule execution.
- `POST /api/v1/obligations/{id}/execute` — Dispatch payout or create external task reminder.

### UI Components (`frontend/src/views/ObligationSchedulerView.tsx`)
- **Twin Scenario Selector:** Stress-test against Baseline, Delayed Inflows, and Stress Shocks.
- **30-Day Cash Trajectory:** Interactive sparkline displaying daily cash curves and $15,000 reserve floor breaches.
- **Unified Obligation Register:** Table of scheduled payments with discount capture and penalty avoidance metrics.
