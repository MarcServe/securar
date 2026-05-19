import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

function subscriptionRowFromStripe(
  orgId: string,
  sub: Stripe.Subscription
): Record<string, unknown> {
  const periodEnd = (sub as Stripe.Subscription & { current_period_end: number })
    .current_period_end;
  return {
    org_id: orgId,
    stripe_customer_id: sub.customer as string,
    stripe_subscription_id: sub.id,
    plan: "pro",
    status: sub.status,
    current_period_end: new Date(periodEnd * 1000).toISOString(),
    cancel_at_period_end: sub.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  };
}

/** Update existing org row or insert — works without a unique index on org_id. */
async function saveOrgSubscription(
  orgId: string,
  row: Record<string, unknown>
): Promise<void> {
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (admin.from("subscriptions") as any)
    .select("id")
    .eq("org_id", orgId)
    .maybeSingle();

  if (existing?.id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin.from("subscriptions") as any)
      .update(row)
      .eq("org_id", orgId);
    if (error) throw new Error(error.message);
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.from("subscriptions") as any).insert({
    org_id: orgId,
    ...row,
  });
  if (error) throw new Error(error.message);
}

/** Upsert org subscription from a Stripe subscription object. */
export async function upsertOrgSubscriptionFromStripe(
  orgId: string,
  sub: Stripe.Subscription
): Promise<void> {
  await saveOrgSubscription(orgId, subscriptionRowFromStripe(orgId, sub));
}

async function findStripeCustomerId(
  stripe: Stripe,
  orgId: string,
  userEmail?: string
): Promise<string | null> {
  if (!userEmail) return null;

  const { data: customers } = await stripe.customers.list({
    email: userEmail,
    limit: 10,
  });

  const byOrg = customers.find((c) => c.metadata?.org_id === orgId);
  if (byOrg) return byOrg.id;

  return customers[0]?.id ?? null;
}

async function findActiveStripeSubscription(
  stripe: Stripe,
  customerId: string
): Promise<Stripe.Subscription | null> {
  const { data: subs } = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 10,
  });

  return subs.find((s) => s.status === "active" || s.status === "trialing") ?? null;
}

/**
 * Pull subscription state from Stripe into the DB. Looks up by stored customer id
 * or account email when checkout/webhook did not update the exploration-trial row.
 */
export async function syncOrgSubscriptionFromStripe(
  orgId: string,
  userEmail?: string
): Promise<boolean> {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return false;

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: row } = await (admin.from("subscriptions") as any)
    .select("stripe_customer_id, stripe_subscription_id")
    .eq("org_id", orgId)
    .maybeSingle();

  if (row?.stripe_subscription_id?.startsWith("sub_")) return false;

  const stripe = new Stripe(secret);
  let customerId = row?.stripe_customer_id?.startsWith("cus_")
    ? (row.stripe_customer_id as string)
    : null;

  if (!customerId) {
    customerId = await findStripeCustomerId(stripe, orgId, userEmail);
  }
  if (!customerId) return false;

  const sub = await findActiveStripeSubscription(stripe, customerId);
  if (!sub) return false;

  await saveOrgSubscription(orgId, subscriptionRowFromStripe(orgId, sub));
  return true;
}

/**
 * Sync subscription row after checkout — fallback when webhooks are delayed or
 * upserted on the wrong conflict key left the exploration-trial row stale.
 */
export async function syncSubscriptionFromCheckoutSession(
  sessionId: string
): Promise<boolean> {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return false;

  const stripe = new Stripe(secret);
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.mode !== "subscription" || session.status !== "complete") {
    return false;
  }

  const orgId = session.metadata?.org_id as string | undefined;
  const subscriptionId = session.subscription as string | undefined;
  if (!orgId || !subscriptionId) return false;

  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  await saveOrgSubscription(orgId, subscriptionRowFromStripe(orgId, sub));
  return true;
}
