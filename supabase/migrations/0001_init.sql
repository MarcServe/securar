-- 0001_init.sql
-- Core schema for Automated Security Readiness AI
-- Requires: pgcrypto for UUIDs

create extension if not exists pgcrypto;

-- =========================
-- Enums
-- =========================
do $$ begin
  create type public.org_role as enum ('admin','contributor','viewer','consultant');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.assessment_status as enum ('draft','collecting','analysing','completed','archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.control_status as enum ('compliant','partial','gap','not_applicable','unknown');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.evidence_status as enum ('uploaded','parsing','parsed','failed');
exception when duplicate_object then null; end $$;

-- =========================
-- Organisations
-- =========================
create table if not exists public.organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text,
  country text,
  size_band text, -- e.g. "1-10", "11-50", etc
  created_at timestamptz not null default now()
);

-- =========================
-- Memberships (users ↔ orgs + role)
-- =========================
create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.org_role not null default 'viewer',
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);

-- =========================
-- Assessments
-- =========================
create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  target_frameworks text[] not null default array['iso27001'],
  status public.assessment_status not null default 'draft',
  readiness_score int,
  score_breakdown jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_assessments_org on public.assessments(org_id);

-- =========================
-- Questionnaire: questions + responses
-- =========================
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  framework_tag text,            -- "iso27001", "cyber_essentials"
  domain text not null,          -- "access", "backup", "policies" etc
  question_text text not null,
  help_text text,
  answer_type text not null default 'text', -- text|boolean|single|multi|number
  choices jsonb not null default '[]'::jsonb,
  control_refs text[] not null default '{}', -- linked control codes e.g. ["A.5.1.1", "A.5.1.2"]
  role_target text, -- "management", "it", "security", "operations"
  org_size_relevance text[], -- ["micro", "small", "medium", "large"]
  is_active boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.responses (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  answered_by uuid references auth.users(id),
  answer jsonb not null,
  confidence text,               -- "high|medium|low"
  created_at timestamptz not null default now(),
  unique (assessment_id, question_id)
);

create index if not exists idx_responses_assessment on public.responses(assessment_id);

-- =========================
-- Evidence (uploads to Storage)
-- =========================
create table if not exists public.evidence (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  org_id uuid not null references public.organisations(id) on delete cascade,
  file_path text not null,        -- storage path
  file_name text not null,
  file_type text,                 -- pdf|png|csv|docx etc
  status public.evidence_status not null default 'uploaded',
  parsed_text text,               -- extracted text content
  ai_summary text,                -- AI-generated summary
  ai_analysis jsonb not null default '{}'::jsonb, -- structured AI analysis
  meta jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_evidence_assessment on public.evidence(assessment_id);

-- =========================
-- Controls + Results
-- =========================
create table if not exists public.controls (
  id uuid primary key default gen_random_uuid(),
  framework text not null,        -- "iso27001", "cyber_essentials"
  control_code text not null,     -- "A.5.1.1" etc
  domain text not null,           -- "Information Security Policies"
  title text not null,
  description text,
  guidance text,                  -- implementation guidance
  evidence_types text[],          -- what evidence satisfies this
  created_at timestamptz not null default now(),
  unique (framework, control_code)
);

create table if not exists public.control_results (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  control_id uuid not null references public.controls(id) on delete cascade,
  status public.control_status not null default 'unknown',
  reasoning text,
  evidence_refs jsonb not null default '[]'::jsonb, -- array of evidence IDs / snippets
  confidence text, -- high|medium|low
  source_inputs jsonb not null default '[]'::jsonb, -- what data was used
  human_override boolean not null default false,
  override_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assessment_id, control_id)
);

create index if not exists idx_control_results_assessment on public.control_results(assessment_id);

-- =========================
-- Risks
-- =========================
create table if not exists public.risks (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  title text not null,
  description text,
  severity text not null,         -- critical|high|medium|low
  likelihood text,               -- high|medium|low
  impact text,                   -- high|medium|low
  recommendation text,
  remediation_timeframe text,    -- "30-day", "60-day", "90-day"
  risk_references jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_risks_assessment on public.risks(assessment_id);

-- =========================
-- Reports
-- =========================
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  org_id uuid not null references public.organisations(id) on delete cascade,
  version int not null default 1,
  pdf_path text,                  -- stored in storage
  summary jsonb not null default '{}'::jsonb,
  executive_summary text,
  generated_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

-- =========================
-- Audit logs (important for trust)
-- =========================
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organisations(id) on delete cascade,
  actor_user_id uuid references auth.users(id),
  action text not null,
  entity_type text,
  entity_id uuid,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_org on public.audit_logs(org_id);

-- =========================
-- updated_at triggers
-- =========================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_assessments_updated on public.assessments;
create trigger trg_assessments_updated
before update on public.assessments
for each row execute function public.set_updated_at();

drop trigger if exists trg_control_results_updated on public.control_results;
create trigger trg_control_results_updated
before update on public.control_results
for each row execute function public.set_updated_at();

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
alter table public.organisations enable row level security;
alter table public.memberships enable row level security;
alter table public.assessments enable row level security;
alter table public.responses enable row level security;
alter table public.evidence enable row level security;
alter table public.control_results enable row level security;
alter table public.risks enable row level security;
alter table public.reports enable row level security;
alter table public.audit_logs enable row level security;

-- Helper function: is_member(org_id)
create or replace function public.is_org_member(p_org uuid)
returns boolean
language sql stable as $$
  select exists (
    select 1 from public.memberships m
    where m.org_id = p_org and m.user_id = auth.uid()
  );
$$;

-- Helper: role check
create or replace function public.has_org_role(p_org uuid, p_roles public.org_role[])
returns boolean
language sql stable as $$
  select exists (
    select 1 from public.memberships m
    where m.org_id = p_org and m.user_id = auth.uid() and m.role = any(p_roles)
  );
$$;

-- Organisations: members can read their org
drop policy if exists org_read on public.organisations;
create policy org_read on public.organisations
for select using (public.is_org_member(id));

-- Organisations: admins can update their org
drop policy if exists org_update on public.organisations;
create policy org_update on public.organisations
for update using (public.has_org_role(id, array['admin']::public.org_role[]))
with check (public.has_org_role(id, array['admin']::public.org_role[]));

-- Memberships: members can read memberships in their org
drop policy if exists membership_read on public.memberships;
create policy membership_read on public.memberships
for select using (public.is_org_member(org_id));

-- Memberships: only admins can manage
drop policy if exists membership_write on public.memberships;
create policy membership_write on public.memberships
for all using (public.has_org_role(org_id, array['admin']::public.org_role[]))
with check (public.has_org_role(org_id, array['admin']::public.org_role[]));

-- Assessments: members can CRUD assessments in their org
drop policy if exists assessment_rw on public.assessments;
create policy assessment_rw on public.assessments
for all using (public.is_org_member(org_id))
with check (public.is_org_member(org_id));

-- Responses: members can CRUD within org via assessment
drop policy if exists responses_rw on public.responses;
create policy responses_rw on public.responses
for all using (
  exists (
    select 1 from public.assessments a
    where a.id = responses.assessment_id and public.is_org_member(a.org_id)
  )
)
with check (
  exists (
    select 1 from public.assessments a
    where a.id = responses.assessment_id and public.is_org_member(a.org_id)
  )
);

-- Evidence: members can CRUD within org via assessment
drop policy if exists evidence_rw on public.evidence;
create policy evidence_rw on public.evidence
for all using (public.is_org_member(org_id))
with check (public.is_org_member(org_id));

-- Control results: members can read, contributors+ can write
drop policy if exists control_results_read on public.control_results;
create policy control_results_read on public.control_results
for select using (
  exists (
    select 1 from public.assessments a
    where a.id = control_results.assessment_id and public.is_org_member(a.org_id)
  )
);

drop policy if exists control_results_write on public.control_results;
create policy control_results_write on public.control_results
for all using (
  exists (
    select 1 from public.assessments a
    where a.id = control_results.assessment_id and public.has_org_role(a.org_id, array['admin','contributor']::public.org_role[])
  )
)
with check (
  exists (
    select 1 from public.assessments a
    where a.id = control_results.assessment_id and public.has_org_role(a.org_id, array['admin','contributor']::public.org_role[])
  )
);

-- Risks: contributors+ can manage
drop policy if exists risks_rw on public.risks;
create policy risks_rw on public.risks
for all using (
  exists (
    select 1 from public.assessments a
    where a.id = risks.assessment_id and public.has_org_role(a.org_id, array['admin','contributor']::public.org_role[])
  )
)
with check (
  exists (
    select 1 from public.assessments a
    where a.id = risks.assessment_id and public.has_org_role(a.org_id, array['admin','contributor']::public.org_role[])
  )
);

-- Reports: members can read; contributors+ can write
drop policy if exists reports_read on public.reports;
create policy reports_read on public.reports
for select using (public.is_org_member(org_id));

drop policy if exists reports_write on public.reports;
create policy reports_write on public.reports
for all using (public.has_org_role(org_id, array['admin','contributor']::public.org_role[]))
with check (public.has_org_role(org_id, array['admin','contributor']::public.org_role[]));

-- Audit logs: members can read their org logs; only server writes
drop policy if exists audit_read on public.audit_logs;
create policy audit_read on public.audit_logs
for select using (public.is_org_member(org_id));

-- Controls table: public read (no RLS needed for framework controls)
-- This allows anyone to read the control definitions

