import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

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

/** Load subscription via service role (billing sync — bypasses stale RLS reads). */
export async function getOrgSubscriptionAdmin(orgId: string): Promise<Subscription | null> {
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin.from("subscriptions") as any)
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

export type PlanDisplay = {
  name: string;
  badge: string;
  description: string;
  showUpgrade: boolean;
  upgradeHref: string;
  upgradeLabel: string;
  periodEnd: string | null;
};

/** User-facing plan label for nav and profile. */
export function getPlanDisplay(subscription: Subscription | null): PlanDisplay {
  const exploration = isExplorationTrial(subscription);
  const subscribed = hasStripeSubscription(subscription);
  const pro = isPro(subscription);

  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  if (subscribed) {
    const trialing = subscription?.status === "trialing";
    return {
      name: "Pro",
      badge: trialing ? "Subscribed" : "Active",
      description: trialing
        ? "Your card is on file. Billing starts after your trial."
        : "Full Pro access — reports, AI analysis, and PDF export.",
      showUpgrade: false,
      upgradeHref: "/settings/billing",
      upgradeLabel: "Billing",
      periodEnd,
    };
  }

  if (exploration) {
    return {
      name: "Pro Trial",
      badge: "Exploration",
      description: "All Pro features unlocked during your free trial.",
      showUpgrade: true,
      upgradeHref: "/settings/billing",
      upgradeLabel: "Subscribe",
      periodEnd,
    };
  }

  if (pro) {
    return {
      name: "Pro",
      badge: "Active",
      description: "Full Pro access enabled.",
      showUpgrade: false,
      upgradeHref: "/settings/billing",
      upgradeLabel: "Billing",
      periodEnd,
    };
  }

  return {
    name: "Free",
    badge: "Current",
    description: "Upgrade for full reports, AI analysis, and PDF export.",
    showUpgrade: true,
    upgradeHref: "/choose-plan",
    upgradeLabel: "Upgrade",
    periodEnd: null,
  };
}

/** Full report access — open for all org members (paywall removed). */
export async function hasFullReportAccess(
  _supabase: SupabaseClient,
  _orgId: string,
  _assessmentId: string
): Promise<boolean> {
  return true;
}
