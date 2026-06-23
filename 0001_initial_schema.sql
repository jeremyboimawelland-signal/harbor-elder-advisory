-- ============================================================
-- Harbor Elder Advisory — Initial Schema
-- Run this as the first migration. Mirrors and extends the schema
-- from the project's MRDs (Section 2 of LOVABLE_BUILD_PLAN.md),
-- plus tables needed to make every dashboard prototype tab durable
-- instead of browser-local mock state.
-- ============================================================

-- ---------- Extensions ----------
create extension if not exists "pgcrypto";

-- ---------- Clients (the consultant's roster) ----------
-- One row per family/engagement. A client has 1+ principals (the aging parent(s)).
create table clients (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) not null, -- the client's own login, once they have one
  consultant_user_id uuid references auth.users(id),     -- assigned consultant, nullable until assigned
  name text not null,
  location text,
  status text not null default 'onboarding' check (status in ('onboarding', 'active', 'paused', 'closed')),
  risk_level text not null default 'Medium' check (risk_level in ('Low', 'Medium', 'High')),
  created_at timestamptz default now(),
  last_activity_at timestamptz default now()
);

-- ---------- Principals (the aging parent(s) within a client's family) ----------
create table principals (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null,
  name text not null,
  role text check (role in ('Mother', 'Father', 'Other')),
  age int,
  conditions jsonb default '[]',              -- e.g. ["dementia", "hospice"]
  social_needs jsonb default '{"hobbies": [], "religious_preference": null, "social_engagement_level": "High"}',
  created_at timestamptz default now()
);

-- ---------- Family network / sibling RBAC ----------
-- Encodes the Sibling Transparency Portal's ADMIN/OBSERVER roles for this client file.
create table client_roles (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null,
  user_id uuid references auth.users(id),     -- nullable until the sibling actually signs up
  name text not null,
  role text not null check (role in ('ADMIN', 'OBSERVER')),
  engagement text check (engagement in ('Low', 'Medium', 'High')),
  location text,
  created_at timestamptz default now()
);

-- ---------- Financial snapshot (feeds the Burn Rate Engine) ----------
create table financial_snapshot (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null unique,
  monthly_income numeric(12,2) default 0,        -- SS + pensions
  monthly_expenses numeric(12,2) default 0,       -- facility cost etc.
  cost_basis_real_estate numeric(15,2) default 0,
  home_market_value_est numeric(15,2) default 0,
  ira_beneficiary_designation text check (ira_beneficiary_designation in ('spouse', 'non_spouse')),
  updated_at timestamptz default now()
);

-- Liquid assets are a separate child table (not jsonb) so the AssetEditor's
-- add/remove/rename row operations map directly to inserts/deletes.
create table liquid_assets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null,
  label text not null,
  value numeric(15,2) not null default 0,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- ---------- Documents (Asset Vault / OCR pipeline) ----------
create table documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null,
  principal_id uuid references principals(id),
  name text not null,
  doc_type text check (doc_type in ('Financial', 'Medical', 'Legal', 'Real Estate', 'Medicare')),
  storage_path text,                          -- Supabase Storage object path, once real file upload is wired in
  status text not null default 'Processing' check (status in ('Processing', 'Processed', 'Needs Review')),
  extracted_fields jsonb default '{}',        -- {policy_number, expiry, amount}
  uploaded_at timestamptz default now()
);

-- ---------- Legal documents (POA / Healthcare Proxy / HIPAA tracking) ----------
create table legal_documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null,
  principal_id uuid references principals(id),
  name text not null,
  form_reference text,                        -- e.g. "WI Ch. 244", "WI Form F-00085", "Federal"
  status text not null default 'Not Started' check (status in ('Not Started', 'Drafted', 'Awaiting Signatures', 'Executed')),
  signers jsonb default '[]',                 -- ["Principal", "Witness 1", "Witness 2", "Agent"]
  pandadoc_document_id text,                  -- populated once PandaDoc integration is wired in
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------- Facilities (CMS Care Compare cache) ----------
-- Populated by a scheduled job pulling from data.cms.gov; the app reads from this table
-- rather than hitting the CMS API directly on every page load.
create table facilities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  zip text,
  care_type text check (care_type in ('memory', 'assisted', 'skilled', 'hospice')),
  overall_rating int check (overall_rating between 1 and 5),
  health_inspection_rating int check (health_inspection_rating between 1 and 5),
  staffing_rating int check (staffing_rating between 1 and 5),
  quality_measures_rating int check (quality_measures_rating between 1 and 5),
  abuse_flag boolean default false,           -- CMS abuse-icon: caps health_inspection_rating at 2
  special_focus_facility boolean default false,
  latitude numeric(9,6),
  longitude numeric(9,6),
  cms_provider_id text,                       -- CCN, for matching against the live CMS API
  last_synced_at timestamptz default now()
);

-- ---------- Tour Huddle checklists ----------
-- Scoped by BOTH client and facility — the original prototype keyed this by facility
-- alone, which leaked checklist state across different clients touring the same facility.
create table tour_checklists (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null,
  facility_id uuid references facilities(id) on delete cascade not null,
  questions jsonb default '[]',               -- generated question list, snapshotted at creation time
  checked_state jsonb default '{}',           -- { "0": true, "1": false, ... }
  created_at timestamptz default now(),
  unique (client_id, facility_id)
);

-- ---------- Real estate: pre-sale condition audit + downsizing roadmap ----------
create table property_condition_flags (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null unique,
  roof boolean default false,
  hvac boolean default false,
  plumbing boolean default false,
  electrical boolean default false,
  kitchen boolean default false,
  updated_at timestamptz default now()
);

create table downsizing_steps (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null,
  step_text text not null,
  done boolean default false,
  sort_order int default 0
);

-- ---------- Decision Log (Sibling Transparency Portal) ----------
create table decision_log (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null,
  actor_name text not null,                   -- denormalized for display even if the user is later removed
  actor_user_id uuid references auth.users(id),
  entry_text text not null,
  created_at timestamptz default now()
);

-- ---------- Consultant-only notes (never exposed to client role) ----------
create table consultant_notes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null,
  author_user_id uuid references auth.users(id) not null,
  author_display_name text not null,
  note_text text not null,
  created_at timestamptz default now()
);

-- ---------- Audit log (every meaningful action, client- and consultant-side) ----------
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null,
  actor_user_id uuid references auth.users(id),
  actor_display_name text not null,
  action text not null,
  created_at timestamptz default now()
);

-- ---------- Chat history (Ask the Agents) ----------
create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null,
  role text not null check (role in ('user', 'agent')),
  agent_key text check (agent_key in ('orchestrator', 'legal', 'healthcare', 'realestate', 'tax', 'socialwork')),
  content text not null,
  is_synthesis boolean default false,
  is_error boolean default false,
  created_at timestamptz default now()
);

-- ---------- Platform-level config (rates that change by jurisdiction/year) ----------
create table platform_config (
  key text primary key,
  value numeric,
  jurisdiction text default 'WI',
  effective_year int,
  notes text
);

insert into platform_config (key, value, jurisdiction, effective_year, notes) values
  ('daily_penalty_rate', 352.06, 'WI', 2026, 'WI Medicaid divestment penalty divisor — verify and update annually');

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table clients enable row level security;
alter table principals enable row level security;
alter table client_roles enable row level security;
alter table financial_snapshot enable row level security;
alter table liquid_assets enable row level security;
alter table documents enable row level security;
alter table legal_documents enable row level security;
alter table tour_checklists enable row level security;
alter table property_condition_flags enable row level security;
alter table downsizing_steps enable row level security;
alter table decision_log enable row level security;
alter table consultant_notes enable row level security;
alter table audit_log enable row level security;
alter table chat_messages enable row level security;

-- Facilities and platform_config are public reference data — readable by any authenticated user.
alter table facilities enable row level security;
create policy "Authenticated users can read facilities" on facilities
  for select using (auth.role() = 'authenticated');

alter table platform_config enable row level security;
create policy "Authenticated users can read platform config" on platform_config
  for select using (auth.role() = 'authenticated');

-- Helper: is this user the client owner OR the assigned consultant OR an ADMIN-role family member?
-- Used consistently across every client-scoped table below.
create or replace function can_access_client(target_client_id uuid)
returns boolean as $$
  select exists (
    select 1 from clients
    where id = target_client_id
      and (owner_user_id = auth.uid() or consultant_user_id = auth.uid())
  )
  or exists (
    select 1 from client_roles
    where client_id = target_client_id and user_id = auth.uid()
  );
$$ language sql security definer stable;

-- Helper: can this user EDIT data on the client file (owner, consultant, or ADMIN family role —
-- explicitly excludes OBSERVER, which is the whole point of the Sibling Transparency Portal).
create or replace function can_edit_client(target_client_id uuid)
returns boolean as $$
  select exists (
    select 1 from clients
    where id = target_client_id
      and (owner_user_id = auth.uid() or consultant_user_id = auth.uid())
  )
  or exists (
    select 1 from client_roles
    where client_id = target_client_id and user_id = auth.uid() and role = 'ADMIN'
  );
$$ language sql security definer stable;

create policy "Access own or assigned clients" on clients
  for select using (owner_user_id = auth.uid() or consultant_user_id = auth.uid());
create policy "Consultants can create clients" on clients
  for insert with check (consultant_user_id = auth.uid() or owner_user_id = auth.uid());
create policy "Owners and consultants can update clients" on clients
  for update using (owner_user_id = auth.uid() or consultant_user_id = auth.uid());

create policy "Read principals if can access client" on principals
  for select using (can_access_client(client_id));
create policy "Edit principals if can edit client" on principals
  for all using (can_edit_client(client_id));

create policy "Read roles if can access client" on client_roles
  for select using (can_access_client(client_id));
create policy "Edit roles if can edit client" on client_roles
  for all using (can_edit_client(client_id));

create policy "Read financials if can access client" on financial_snapshot
  for select using (can_access_client(client_id));
create policy "Edit financials if can edit client" on financial_snapshot
  for all using (can_edit_client(client_id));

create policy "Read assets if can access client" on liquid_assets
  for select using (can_access_client(client_id));
create policy "Edit assets if can edit client" on liquid_assets
  for all using (can_edit_client(client_id));

create policy "Read documents if can access client" on documents
  for select using (can_access_client(client_id));
create policy "Edit documents if can edit client" on documents
  for all using (can_edit_client(client_id));

create policy "Read legal docs if can access client" on legal_documents
  for select using (can_access_client(client_id));
create policy "Edit legal docs if can edit client" on legal_documents
  for all using (can_edit_client(client_id));

create policy "Read tour checklists if can access client" on tour_checklists
  for select using (can_access_client(client_id));
create policy "Edit tour checklists if can edit client" on tour_checklists
  for all using (can_edit_client(client_id));

create policy "Read condition flags if can access client" on property_condition_flags
  for select using (can_access_client(client_id));
create policy "Edit condition flags if can edit client" on property_condition_flags
  for all using (can_edit_client(client_id));

create policy "Read downsizing steps if can access client" on downsizing_steps
  for select using (can_access_client(client_id));
create policy "Edit downsizing steps if can edit client" on downsizing_steps
  for all using (can_edit_client(client_id));

-- Decision Log: OBSERVER can read but NOT write — this is the one place the
-- select/write split matters most, since it's the core RBAC demonstration.
create policy "Read decision log if can access client" on decision_log
  for select using (can_access_client(client_id));
create policy "Write decision log only if can edit client" on decision_log
  for insert with check (can_edit_client(client_id));

-- Consultant notes: NEVER readable by the client owner or OBSERVER family members.
-- Only the assigned consultant (or any consultant-role staff — refine with a staff table
-- if you support multiple consultants per firm) can read or write.
create policy "Only assigned consultant can read notes" on consultant_notes
  for select using (
    exists (select 1 from clients where id = client_id and consultant_user_id = auth.uid())
  );
create policy "Only assigned consultant can write notes" on consultant_notes
  for insert with check (
    exists (select 1 from clients where id = client_id and consultant_user_id = auth.uid())
  );

create policy "Read audit log if can access client" on audit_log
  for select using (can_access_client(client_id));
create policy "Anyone with access can write audit entries" on audit_log
  for insert with check (can_access_client(client_id));

create policy "Read chat if can access client" on chat_messages
  for select using (can_access_client(client_id));
create policy "Write chat if can edit client" on chat_messages
  for insert with check (can_edit_client(client_id));
