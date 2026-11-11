-- Core PayPilot tenant, commitment, audit, and verified webhook storage.
-- Every exposed tenant table has RLS and explicit API grants.

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 120),
  base_currency text not null check (base_currency ~ '^[A-Z]{3}$'),
  timezone text not null default 'UTC',
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'analyst', 'viewer')),
  status text not null default 'active' check (status in ('active', 'invited', 'suspended')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  provider text not null,
  external_account_id text,
  status text not null default 'disconnected' check (status in ('disconnected', 'connected', 'error')),
  secret_ref text,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, provider)
);

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete set null,
  provider text not null,
  event_id text not null,
  event_type text not null,
  payload_hash text not null check (payload_hash ~ '^[a-f0-9]{64}$'),
  payload jsonb not null,
  status text not null default 'received' check (status in ('received', 'processing', 'processed', 'failed')),
  received_at timestamptz not null default now(),
  verified_at timestamptz not null,
  processed_at timestamptz,
  last_error_code text,
  unique (provider, event_id)
);

create table if not exists public.financial_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  event_type text not null,
  direction text not null check (direction in ('inflow', 'outflow')),
  amount numeric(20, 6) not null check (amount >= 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  occurred_at timestamptz not null,
  provenance text not null check (provenance in ('paypal_sandbox', 'paypal_live', 'imported', 'manual')),
  source_ref text,
  source_record_hash text,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  provider text not null,
  provider_payment_id text not null,
  amount numeric(20, 6) not null check (amount >= 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  status text not null,
  occurred_at timestamptz,
  provenance text not null check (provenance in ('paypal_sandbox', 'paypal_live', 'imported', 'manual')),
  source_event_id uuid references public.webhook_events(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (workspace_id, provider, provider_payment_id)
);

create table if not exists public.commitments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  commitment_type text not null,
  title text not null check (length(trim(title)) between 1 and 160),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  status text not null default 'draft' check (status in ('draft', 'awaiting_approval', 'approved', 'rejected', 'active', 'completed', 'cancelled')),
  required_reserve numeric(20, 6) not null default 0 check (required_reserve >= 0),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id)
);

create table if not exists public.commitment_cashflows (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  commitment_id uuid not null,
  direction text not null check (direction in ('inflow', 'outflow')),
  amount numeric(20, 6) not null check (amount > 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  due_date date not null,
  confidence text not null default 'confirmed' check (confidence in ('confirmed', 'pending', 'forecast', 'manual_estimate')),
  label text not null,
  created_at timestamptz not null default now(),
  foreign key (workspace_id, commitment_id) references public.commitments(workspace_id, id) on delete cascade
);

create table if not exists public.commitment_assessments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  commitment_id uuid not null references public.commitments(id) on delete cascade,
  model_version text not null,
  result jsonb not null,
  assumptions jsonb not null default '[]'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  foreign key (workspace_id, commitment_id) references public.commitments(workspace_id, id) on delete cascade
);

create table if not exists public.approval_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  action_type text not null,
  target_ref text not null,
  amount numeric(20, 6) check (amount is null or amount >= 0),
  currency text check (currency is null or currency ~ '^[A-Z]{3}$'),
  payload jsonb not null,
  payload_hash text not null check (payload_hash ~ '^[a-f0-9]{64}$'),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'expired', 'executed')),
  expires_at timestamptz not null,
  requested_by uuid not null references auth.users(id) on delete restrict,
  decided_by uuid references auth.users(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  unique (workspace_id, id)
);

create table if not exists public.action_executions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  approval_id uuid not null,
  idempotency_key text not null,
  payload_hash text not null check (payload_hash ~ '^[a-f0-9]{64}$'),
  provider_ref text,
  status text not null default 'queued' check (status in ('queued', 'submitted', 'succeeded', 'failed', 'verified')),
  created_at timestamptz not null default now(),
  unique (workspace_id, idempotency_key),
  foreign key (workspace_id, approval_id) references public.approval_requests(workspace_id, id) on delete restrict
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists financial_events_workspace_time_idx on public.financial_events (workspace_id, occurred_at desc);
create index if not exists payments_workspace_time_idx on public.payments (workspace_id, occurred_at desc);
create index if not exists commitments_workspace_status_idx on public.commitments (workspace_id, status, created_at desc);
create index if not exists commitment_cashflows_workspace_due_idx on public.commitment_cashflows (workspace_id, due_date);
create index if not exists approvals_pending_idx on public.approval_requests (workspace_id, expires_at) where status = 'pending';
create index if not exists webhook_received_idx on public.webhook_events (received_at) where status in ('received', 'failed');
create index if not exists audit_logs_workspace_time_idx on public.audit_logs (workspace_id, created_at desc);

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.integrations enable row level security;
alter table public.webhook_events enable row level security;
alter table public.financial_events enable row level security;
alter table public.payments enable row level security;
alter table public.commitments enable row level security;
alter table public.commitment_cashflows enable row level security;
alter table public.commitment_assessments enable row level security;
alter table public.approval_requests enable row level security;
alter table public.action_executions enable row level security;
alter table public.audit_logs enable row level security;

create policy workspaces_read_member_or_creator on public.workspaces
  for select to authenticated
  using (
    created_by = (select auth.uid())
    or exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = id and wm.user_id = (select auth.uid()) and wm.status = 'active'
    )
  );
create policy workspaces_create_self on public.workspaces
  for insert to authenticated with check (created_by = (select auth.uid()));
create policy workspaces_update_admin on public.workspaces
  for update to authenticated
  using (exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = id and wm.user_id = (select auth.uid()) and wm.status = 'active' and wm.role in ('owner', 'admin')
  ))
  with check (created_by = (select auth.uid()) or exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = id and wm.user_id = (select auth.uid()) and wm.status = 'active' and wm.role in ('owner', 'admin')
  ));

create policy workspace_members_read_self on public.workspace_members
  for select to authenticated using (user_id = (select auth.uid()));
create policy workspace_members_add_owner on public.workspace_members
  for insert to authenticated with check (
    user_id = (select auth.uid()) and role = 'owner'
    and exists (select 1 from public.workspaces w where w.id = workspace_id and w.created_by = (select auth.uid()))
  );
create policy integrations_read_member on public.integrations
  for select to authenticated using (exists (
    select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.user_id = (select auth.uid()) and wm.status = 'active'
  ));
create policy financial_events_read_member on public.financial_events
  for select to authenticated using (exists (
    select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.user_id = (select auth.uid()) and wm.status = 'active'
  ));
create policy payments_read_member on public.payments
  for select to authenticated using (exists (
    select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.user_id = (select auth.uid()) and wm.status = 'active'
  ));

create policy commitments_read_member on public.commitments
  for select to authenticated using (exists (
    select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.user_id = (select auth.uid()) and wm.status = 'active'
  ));
create policy commitments_create_editor on public.commitments
  for insert to authenticated with check (
    created_by = (select auth.uid()) and exists (
      select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.user_id = (select auth.uid()) and wm.status = 'active' and wm.role in ('owner', 'admin', 'analyst')
    )
  );
create policy commitments_update_editor on public.commitments
  for update to authenticated
  using (exists (
    select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.user_id = (select auth.uid()) and wm.status = 'active' and wm.role in ('owner', 'admin', 'analyst')
  ))
  with check (exists (
    select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.user_id = (select auth.uid()) and wm.status = 'active' and wm.role in ('owner', 'admin', 'analyst')
  ));

create policy commitment_cashflows_read_member on public.commitment_cashflows
  for select to authenticated using (exists (
    select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.user_id = (select auth.uid()) and wm.status = 'active'
  ));
create policy commitment_cashflows_write_editor on public.commitment_cashflows
  for all to authenticated
  using (exists (
    select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.user_id = (select auth.uid()) and wm.status = 'active' and wm.role in ('owner', 'admin', 'analyst')
  ))
  with check (exists (
    select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.user_id = (select auth.uid()) and wm.status = 'active' and wm.role in ('owner', 'admin', 'analyst')
  ));

create policy assessments_read_member on public.commitment_assessments
  for select to authenticated using (exists (
    select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.user_id = (select auth.uid()) and wm.status = 'active'
  ));
create policy assessments_create_editor on public.commitment_assessments
  for insert to authenticated with check (
    created_by = (select auth.uid()) and exists (
      select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.user_id = (select auth.uid()) and wm.status = 'active' and wm.role in ('owner', 'admin', 'analyst')
    )
  );

create policy approvals_read_member on public.approval_requests
  for select to authenticated using (exists (
    select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.user_id = (select auth.uid()) and wm.status = 'active'
  ));
create policy approvals_create_editor on public.approval_requests
  for insert to authenticated with check (
    requested_by = (select auth.uid()) and exists (
      select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.user_id = (select auth.uid()) and wm.status = 'active' and wm.role in ('owner', 'admin', 'analyst')
    )
  );
create policy action_executions_read_member on public.action_executions
  for select to authenticated using (exists (
    select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.user_id = (select auth.uid()) and wm.status = 'active'
  ));
create policy audit_logs_read_member on public.audit_logs
  for select to authenticated using (exists (
    select 1 from public.workspace_members wm where wm.workspace_id = workspace_id and wm.user_id = (select auth.uid()) and wm.status = 'active'
  ));

-- Start from no browser access, then grant only the operations each RLS policy allows.
revoke all on public.workspaces, public.workspace_members, public.integrations,
  public.webhook_events, public.financial_events, public.payments,
  public.commitments, public.commitment_cashflows, public.commitment_assessments,
  public.approval_requests, public.action_executions, public.audit_logs
  from anon, authenticated;
grant usage on schema public to authenticated;
grant select, insert on public.workspaces to authenticated;
grant select, insert on public.workspace_members to authenticated;
grant update (name, base_currency, timezone, updated_at) on public.workspaces to authenticated;
grant select on public.integrations to authenticated;
grant select on public.financial_events, public.payments to authenticated;
grant select, insert on public.commitments to authenticated;
grant update (title, status, required_reserve, updated_at) on public.commitments to authenticated;
grant select, insert on public.commitment_cashflows to authenticated;
grant update (direction, amount, currency, due_date, confidence, label) on public.commitment_cashflows to authenticated;
grant select, insert on public.commitment_assessments to authenticated;
grant select, insert on public.approval_requests to authenticated;
grant select on public.action_executions to authenticated;
grant select on public.audit_logs to authenticated;
