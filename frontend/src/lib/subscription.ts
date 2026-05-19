import type { SupabaseClient } from "@supabase/supabase-js";

export type Subscription = {
  id: string;
  org_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string | null;
  plan: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
};

/** Returns the subscription row for an org, or null if none exists. */
export async function getOrgSubscription(
  supabase: SupabaseClient,
  orgId: string
): Promise<Subscription | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from("subscriptions") as any)
    .select("*")
    .eq("org_id", orgId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

/** Returns true if the subscription is an active/trialing Pro plan. */
export function isPro(subscription: Subscription | null): boolean {
  if (!subscription) return false;
  if (subscription.plan !== "pro") return false;
  if (subscription.status === "active") return true;
  if (subscription.status === "trialing") {
    if (!subscription.current_period_end) return true;
    return new Date(subscription.current_period_end) > new Date();
  }
  return false;
}

export function isTrialing(subscription: Subscription | null): boolean {
  return subscription?.status === "trialing";
}

/** No-card in-app trial — not yet linked to a Stripe subscription. */
export function isExplorationTrial(subscription: Subscription | null): boolean {
  if (!subscription || subscription.status !== "trialing") return false;
  const subId = subscription.stripe_subscription_id ?? "";
  return !subId.startsWith("sub_");
}

/** Checkout completed — Stripe subscription exists (may still be in trial period). */
export function hasStripeSubscription(subscription: Subscription | null): boolean {
  return !!subscription?.stripe_subscription_id?.startsWith("sub_");
}

/** Full report access via Pro subscription or a one-time report purchase. */
export async function hasFullReportAccess(
  supabase: SupabaseClient,
  orgId: string,
  assessmentId: string
): Promise<boolean> {
  const subscription = await getOrgSubscription(supabase, orgId);
  if (isPro(subscription)) return true;

  const { data: purchase } = await supabase
    .from("report_purchases")
    .select("id")
    .eq("assessment_id", assessmentId)
    .limit(1)
    .maybeSingle();

  return !!purchase;
}
