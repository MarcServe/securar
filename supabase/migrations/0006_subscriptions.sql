create table subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  org_id                  uuid references organisations(id) on delete cascade not null,
  stripe_customer_id      text unique not null,
  stripe_subscription_id  text unique,
  plan                    text not null default 'free',
  status                  text not null default 'active',
  current_period_end      timestamptz,
  cancel_at_period_end    boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

alter table subscriptions enable row level security;

create policy "Members can view org subscription" on subscriptions
  for select using (
    exists (
      select 1 from memberships
      where memberships.org_id = subscriptions.org_id
        and memberships.user_id = auth.uid()
    )
  );

create index subscriptions_org_id_idx on subscriptions(org_id);
create index subscriptions_stripe_customer_id_idx on subscriptions(stripe_customer_id);
