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
    .maybeSingle();
  return data ?? null;
}

/** Returns true if the subscription is an active/trialing Pro plan. */
export function isPro(subscription: Subscription | null): boolean {
  if (!subscription) return false;
  return (
    subscription.plan === "pro" &&
    (subscription.status === "active" || subscription.status === "trialing")
  );
}
