-- Report purchases: one-time unlock per assessment (Stripe)
create table if not exists public.report_purchases (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  stripe_session_id text unique,
  created_at timestamptz not null default now()
);

create index if not exists idx_report_purchases_assessment on public.report_purchases(assessment_id);
create unique index if not exists idx_report_purchases_session on public.report_purchases(stripe_session_id) where stripe_session_id is not null;

alter table public.report_purchases enable row level security;

-- Members can read purchases for assessments in their org
create policy report_purchases_read on public.report_purchases
for select using (
  exists (
    select 1 from public.assessments a
    where a.id = report_purchases.assessment_id and public.is_org_member(a.org_id)
  )
);

-- Inserts/updates only via service role (webhook); no anon/authenticated insert policy
