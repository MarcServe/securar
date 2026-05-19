import { createAdminClient } from "@/lib/supabase/admin";
import type { User } from "@supabase/supabase-js";
import { getTrialDays } from "@/lib/trial-config";
import { isRealStripeCustomerId } from "@/lib/stripe-customer";
import { syncOrgSubscriptionFromStripe } from "@/lib/sync-stripe-subscription";

export function defaultOrgName(user: User): string {
  const fromMeta = user.user_metadata?.org_name as string | undefined;
  if (fromMeta?.trim()) return fromMeta.trim();
  const emailPrefix = user.email?.split("@")[0]?.replace(/[.+]/g, " ");
  if (emailPrefix?.trim()) return emailPrefix.trim();
  return "My Organisation";
}

/**
 * Ensures the user belongs to an org (admin role). Uses service role so it
 * works even when the user has no membership yet (RLS chicken-and-egg).
 */
export async function ensureUserHasOrgForUser(user: User): Promise<string | null> {
  const admin = createAdminClient();
  const orgName = defaultOrgName(user);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (admin.from("memberships") as any)
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (existing?.org_id) return existing.org_id as string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: org, error: orgError } = await (admin.from("organisations") as any)
    .insert({ name: orgName })
    .select("id")
    .single();

  if (orgError || !org) {
    console.error("[ensureUserHasOrgForUser] org insert failed", orgError);
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: memberError } = await (admin.from("memberships") as any).insert({
    org_id: org.id,
    user_id: user.id,
    role: "admin",
  });

  if (memberError) {
    console.error("[ensureUserHasOrgForUser] membership insert failed", memberError);
    return null;
  }

  return org.id as string;
}

/**
 * Starts a no-card exploration trial for new orgs (full Pro access).
 * Skips if the org already has or had a paid Stripe subscription.
 */
export async function ensureExplorationTrial(orgId: string): Promise<void> {
  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (admin.from("subscriptions") as any)
    .select("*")
    .eq("org_id", orgId)
    .maybeSingle();

  // Paid Stripe subscription — do not overwrite
  if (existing?.stripe_subscription_id?.startsWith("sub_")) return;

  // Real Stripe customer already linked (checkout started) — do not reset trial row
  if (isRealStripeCustomerId(existing?.stripe_customer_id as string | undefined)) return;

  // Active exploration trial still running
  if (existing?.status === "trialing" && existing.current_period_end) {
    if (new Date(existing.current_period_end) > new Date()) return;
  }

  // Active paid Pro
  if (existing?.status === "active" && existing.plan === "pro") return;

  // Trial already used (expired or canceled) — one exploration trial per org
  if (existing?.status === "canceled" || existing?.status === "past_due") return;
  if (
    existing?.status === "trialing" &&
    existing.current_period_end &&
    new Date(existing.current_period_end) <= new Date()
  ) {
    return;
  }

  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + getTrialDays());

  const row: Record<string, unknown> = {
    org_id: orgId,
    stripe_subscription_id: existing?.stripe_subscription_id ?? null,
    plan: "pro",
    status: "trialing",
    current_period_end: trialEnd.toISOString(),
    cancel_at_period_end: false,
    updated_at: new Date().toISOString(),
  };

  // Only set a placeholder when DB still requires NOT NULL (pre-migration).
  // After 0007 migration, stripe_customer_id stays null until checkout.
  const keepCustomerId = existing?.stripe_customer_id as string | undefined;
  if (keepCustomerId && !isRealStripeCustomerId(keepCustomerId)) {
    row.stripe_customer_id = keepCustomerId;
  } else if (!existing) {
    // Legacy NOT NULL fallback — replaced with real cus_ at checkout
    row.stripe_customer_id = `explore_${orgId}`;
  }

  if (existing) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from("subscriptions") as any).update(row).eq("org_id", orgId);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from("subscriptions") as any).insert(row);
  }
}

/** Provision org + sync Stripe + start exploration trial for a signed-in user. */
export async function ensureUserReady(user: User): Promise<string | null> {
  const orgId = await ensureUserHasOrgForUser(user);
  if (!orgId) return null;

  try {
    await syncOrgSubscriptionFromStripe(orgId, user.email ?? undefined);
  } catch (e) {
    console.error("[ensureUserReady] stripe sync failed", e);
  }

  await ensureExplorationTrial(orgId);
  return orgId;
}

/** Load org_id + name for billing; provisions org if missing. */
export async function getOrProvisionMembership(user: User): Promise<{
  orgId: string;
  orgName: string;
} | null> {
  const orgId = await ensureUserHasOrgForUser(user);
  if (!orgId) return null;

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: org } = await (admin.from("organisations") as any)
    .select("name")
    .eq("id", orgId)
    .single();

  return {
    orgId,
    orgName: (org?.name as string | undefined) ?? defaultOrgName(user),
  };
}
