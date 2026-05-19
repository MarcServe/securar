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

/** Upsert org subscription from a Stripe subscription object. */
export async function upsertOrgSubscriptionFromStripe(
  orgId: string,
  sub: Stripe.Subscription
): Promise<void> {
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.from("subscriptions") as any).upsert(
    subscriptionRowFromStripe(orgId, sub),
    { onConflict: "org_id" }
  );
  if (error) {
    throw new Error(error.message);
  }
}

/**
 * If the org has a Stripe customer but no subscription id in DB, pull the
 * latest subscription from Stripe (repairs missed webhooks).
 */
export async function syncOrgSubscriptionFromStripe(orgId: string): Promise<boolean> {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return false;

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: row } = await (admin.from("subscriptions") as any)
    .select("stripe_customer_id, stripe_subscription_id")
    .eq("org_id", orgId)
    .maybeSingle();

  if (!row?.stripe_customer_id?.startsWith("cus_")) return false;
  if (row.stripe_subscription_id?.startsWith("sub_")) return false;

  const stripe = new Stripe(secret);
  const { data: subs } = await stripe.subscriptions.list({
    customer: row.stripe_customer_id,
    limit: 1,
    status: "all",
  });

  const sub = subs.find((s) => s.status === "active" || s.status === "trialing");
  if (!sub) return false;

  await upsertOrgSubscriptionFromStripe(orgId, sub);
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
  await upsertOrgSubscriptionFromStripe(orgId, sub);
  return true;
}
