-- Exploration trials don't need a Stripe customer until the user subscribes.
alter table subscriptions alter column stripe_customer_id drop not null;

-- One subscription row per org (safe to run — fails silently if duplicates exist).
create unique index if not exists subscriptions_org_id_unique on subscriptions(org_id);
