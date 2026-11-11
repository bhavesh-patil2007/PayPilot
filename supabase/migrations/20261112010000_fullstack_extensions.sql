-- ============================================================================
-- PAYPILOT FULL-STACK EXTENSIONS: SQL MIGRATION
-- Modules:
--   1. Dispute Defense Studio (Section 1.5)
--   2. Vendor & Invoice Fraud Shield (Section 2.5)
--   3. Smart Obligation Scheduler (Section 3.5)
-- All tables enforce workspace_id for tenant isolation with RLS & explicit grants.
-- ============================================================================

-- ============================================================================
-- MODULE 1: DISPUTE DEFENSE STUDIO TABLES
-- ============================================================================

create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  provider text not null default 'paypal',
  provider_dispute_id text not null,
  payment_id text,
  reason_code text not null,
  disputed_amount numeric(20, 6) not null check (disputed_amount >= 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  status text not null check (status in ('UNDER_REVIEW', 'WAITING_FOR_BUYER', 'WAITING_FOR_SELLER', 'RESOLVED', 'OPEN', 'INQUIRY')),
  response_due_at timestamptz not null,
  provider_created_at timestamptz not null,
  synced_at timestamptz not null default now(),
  unique (workspace_id, provider, provider_dispute_id)
);

create table if not exists public.dispute_evidence (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  dispute_id uuid not null references public.disputes(id) on delete cascade,
  source_record_id text,
  evidence_type text not null check (evidence_type in ('proof_of_delivery', 'order_confirmation', 'customer_communication', 'refund_policy', 'invoice', 'tracking_event', 'other')),
  storage_uri text not null,
  extracted_text text,
  evidence_status text not null default 'available' check (evidence_status in ('available', 'missing', 'weak', 'review_required')),
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.dispute_drafts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  dispute_id uuid not null references public.disputes(id) on delete cascade,
  draft_text text not null,
  checklist_json jsonb not null default '[]'::jsonb,
  model_version text not null default 'gemini-1.5-flash',
  status text not null default 'draft' check (status in ('draft', 'approved', 'submitted')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.dispute_submissions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  dispute_id uuid not null references public.disputes(id) on delete cascade,
  approval_request_id uuid references public.approval_requests(id) on delete set null,
  provider_submission_id text,
  submitted_at timestamptz not null default now(),
  provider_status text not null default 'submitted',
  response_payload_redacted jsonb not null default '{}'::jsonb
);

-- ============================================================================
-- MODULE 2: VENDOR & INVOICE FRAUD SHIELD TABLES
-- ============================================================================

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  legal_name text not null,
  normalized_name text not null,
  verified_status text not null default 'unverified' check (verified_status in ('unverified', 'verified', 'suspicious')),
  verified_contact_ref text,
  created_at timestamptz not null default now()
);

create table if not exists public.vendor_payment_profiles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  destination_fingerprint text not null,
  destination_type text not null default 'bank_wire',
  verified_at timestamptz,
  verified_by uuid references auth.users(id) on delete set null,
  verification_method text not null default 'out_of_band_phone',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  po_number text not null,
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  total_amount numeric(20, 6) not null check (total_amount >= 0),
  status text not null default 'open' check (status in ('draft', 'open', 'partially_fulfilled', 'fulfilled', 'cancelled')),
  expected_delivery_at timestamptz,
  created_at timestamptz not null default now(),
  unique (workspace_id, po_number)
);

create table if not exists public.supplier_invoices (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  invoice_number text not null,
  invoice_date date not null,
  due_date date not null,
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  total_amount numeric(20, 6) not null check (total_amount >= 0),
  document_uri text,
  extraction_status text not null default 'pending' check (extraction_status in ('pending', 'extracted', 'failed')),
  risk_status text not null default 'clear' check (risk_status in ('clear', 'review_required', 'hold', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  unique (workspace_id, vendor_id, invoice_number)
);

create table if not exists public.invoice_line_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.supplier_invoices(id) on delete cascade,
  description text not null,
  quantity numeric(20, 6) not null default 1,
  unit_price numeric(20, 6) not null default 0,
  tax_amount numeric(20, 6) not null default 0,
  line_total numeric(20, 6) not null,
  matched_po_line_id text
);

create table if not exists public.invoice_findings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  invoice_id uuid not null references public.supplier_invoices(id) on delete cascade,
  finding_type text not null check (finding_type in ('duplicate_candidate', 'po_mismatch', 'beneficiary_changed', 'price_variance', 'vendor_impersonation', 'unusual_amount')),
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  evidence_json jsonb not null default '{}'::jsonb,
  status text not null default 'open' check (status in ('open', 'verified_safe', 'confirmed_fraud', 'dismissed')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- MODULE 3: SMART OBLIGATION SCHEDULER TABLES
-- ============================================================================

create table if not exists public.obligations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  source_type text not null check (source_type in ('supplier_invoice', 'purchase_order', 'recurring_expense', 'payroll', 'tax', 'loan', 'manual')),
  source_id text,
  payee_id uuid references public.vendors(id) on delete set null,
  payee_name text not null,
  amount numeric(20, 6) not null check (amount > 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  due_date date not null,
  earliest_pay_date date not null,
  latest_pay_date date not null,
  priority text not null default 'medium' check (priority in ('critical', 'high', 'medium', 'low')),
  late_fee_terms_json jsonb not null default '{}'::jsonb,
  discount_terms_json jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'scheduled', 'executing', 'paid', 'cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.obligation_schedules (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  scenario_id text not null default 'baseline',
  version int not null default 1,
  schedule_status text not null default 'draft' check (schedule_status in ('draft', 'simulated', 'recommended', 'approved', 'rejected')),
  reserve_floor numeric(20, 6) not null default 15000 check (reserve_floor >= 0),
  objective_summary jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.obligation_schedule_items (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.obligation_schedules(id) on delete cascade,
  obligation_id uuid not null references public.obligations(id) on delete cascade,
  proposed_date date not null,
  proposed_amount numeric(20, 6) not null check (proposed_amount > 0),
  reason_codes text[] not null default '{}',
  constraint_results_json jsonb not null default '{}'::jsonb
);

create table if not exists public.payment_instructions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  obligation_id uuid not null references public.obligations(id) on delete cascade,
  approval_request_id uuid references public.approval_requests(id) on delete set null,
  amount numeric(20, 6) not null check (amount > 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  payee_fingerprint text not null,
  scheduled_for date not null,
  provider text not null default 'paypal',
  execution_status text not null default 'prepared' check (execution_status in ('prepared', 'approved', 'queued', 'executed', 'task_created', 'failed')),
  provider_reference text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- INDEXES FOR HIGH-THROUGHPUT TENANT QUERIES
-- ============================================================================

create index if not exists disputes_workspace_status_due_idx on public.disputes (workspace_id, status, response_due_at);
create index if not exists dispute_evidence_dispute_idx on public.dispute_evidence (dispute_id, evidence_type);
create index if not exists vendors_workspace_name_idx on public.vendors (workspace_id, normalized_name);
create index if not exists supplier_invoices_workspace_risk_idx on public.supplier_invoices (workspace_id, risk_status, due_date);
create index if not exists invoice_findings_invoice_severity_idx on public.invoice_findings (invoice_id, severity, status);
create index if not exists obligations_workspace_due_priority_idx on public.obligations (workspace_id, due_date, priority, status);
create index if not exists obligation_schedule_items_schedule_idx on public.obligation_schedule_items (schedule_id, proposed_date);
create index if not exists payment_instructions_workspace_status_idx on public.payment_instructions (workspace_id, execution_status, scheduled_for);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

alter table public.disputes enable row level security;
alter table public.dispute_evidence enable row level security;
alter table public.dispute_drafts enable row level security;
alter table public.dispute_submissions enable row level security;
alter table public.vendors enable row level security;
alter table public.vendor_payment_profiles enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.supplier_invoices enable row level security;
alter table public.invoice_line_items enable row level security;
alter table public.invoice_findings enable row level security;
alter table public.obligations enable row level security;
alter table public.obligation_schedules enable row level security;
alter table public.obligation_schedule_items enable row level security;
alter table public.payment_instructions enable row level security;

-- Workspace membership helper policy for authenticated users
do $$
declare
  t text;
  tables text[] := array[
    'disputes', 'dispute_evidence', 'dispute_drafts', 'dispute_submissions',
    'vendors', 'vendor_payment_profiles', 'purchase_orders', 'supplier_invoices',
    'invoice_findings', 'obligations', 'obligation_schedules', 'payment_instructions'
  ];
begin
  foreach t in array tables loop
    execute format('
      create policy %I_tenant_isolation on public.%I
        for all to authenticated
        using (
          exists (
            select 1 from public.workspaces w
            where w.id = %I.workspace_id and (
              w.created_by = (select auth.uid()) or
              exists (
                select 1 from public.workspace_members wm
                where wm.workspace_id = w.id and wm.user_id = (select auth.uid()) and wm.status = ''active''
              )
            )
          )
        )
        with check (
          exists (
            select 1 from public.workspaces w
            where w.id = %I.workspace_id and (
              w.created_by = (select auth.uid()) or
              exists (
                select 1 from public.workspace_members wm
                where wm.workspace_id = w.id and wm.user_id = (select auth.uid()) and wm.status = ''active''
              )
            )
          )
        );
    ', t, t, t, t);
  end loop;
end $$;

-- Policies for invoice_line_items (joins through supplier_invoices)
create policy invoice_line_items_tenant_isolation on public.invoice_line_items
  for all to authenticated
  using (
    exists (
      select 1 from public.supplier_invoices inv
      join public.workspaces w on w.id = inv.workspace_id
      where inv.id = invoice_line_items.invoice_id and (
        w.created_by = (select auth.uid()) or
        exists (
          select 1 from public.workspace_members wm
          where wm.workspace_id = w.id and wm.user_id = (select auth.uid()) and wm.status = 'active'
        )
      )
    )
  );

-- Policies for obligation_schedule_items (joins through obligation_schedules)
create policy obligation_schedule_items_tenant_isolation on public.obligation_schedule_items
  for all to authenticated
  using (
    exists (
      select 1 from public.obligation_schedules sch
      join public.workspaces w on w.id = sch.workspace_id
      where sch.id = obligation_schedule_items.schedule_id and (
        w.created_by = (select auth.uid()) or
        exists (
          select 1 from public.workspace_members wm
          where wm.workspace_id = w.id and wm.user_id = (select auth.uid()) and wm.status = 'active'
        )
      )
    )
  );

-- Explicit grants to authenticated and service_role
grant select, insert, update, delete on public.disputes to authenticated, service_role;
grant select, insert, update, delete on public.dispute_evidence to authenticated, service_role;
grant select, insert, update, delete on public.dispute_drafts to authenticated, service_role;
grant select, insert, update, delete on public.dispute_submissions to authenticated, service_role;
grant select, insert, update, delete on public.vendors to authenticated, service_role;
grant select, insert, update, delete on public.vendor_payment_profiles to authenticated, service_role;
grant select, insert, update, delete on public.purchase_orders to authenticated, service_role;
grant select, insert, update, delete on public.supplier_invoices to authenticated, service_role;
grant select, insert, update, delete on public.invoice_line_items to authenticated, service_role;
grant select, insert, update, delete on public.invoice_findings to authenticated, service_role;
grant select, insert, update, delete on public.obligations to authenticated, service_role;
grant select, insert, update, delete on public.obligation_schedules to authenticated, service_role;
grant select, insert, update, delete on public.obligation_schedule_items to authenticated, service_role;
grant select, insert, update, delete on public.payment_instructions to authenticated, service_role;
