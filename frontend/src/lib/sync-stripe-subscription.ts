import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/** Stripe flexible-billing subs often omit top-level current_period_end — use item/trial fields. */
export function getSubscriptionPeriodEndUnix(sub: Stripe.Subscription): number | null {
  const legacy = (sub as Stripe.Subscription & { current_period_end?: number })
    .current_period_end;
  if (typeof legacy === "number") return legacy;
  if (typeof sub.trial_end === "number") return sub.trial_end;
  const itemEnd = sub.items?.data?.[0]?.current_period_end;
  if (typeof itemEnd === "number") return itemEnd;
  if (typeof sub.cancel_at === "number") return sub.cancel_at;
  return null;
}

function subscriptionRowFromStripe(
  orgId: string,
  sub: Stripe.Subscription
): Record<string, unknown> {
  const periodEndUnix = getSubscriptionPeriodEndUnix(sub);
  return {
    org_id: orgId,
    stripe_customer_id:
      typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
    stripe_subscription_id: sub.id,
    plan: "pro",
    status: sub.status,
    current_period_end: periodEndUnix
      ? new Date(periodEndUnix * 1000).toISOString()
      : null,
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
  const { data: rows, error: selectErr } = await (admin.from("subscriptions") as any)
    .select("id")
    .eq("org_id", orgId)
    .order("updated_at", { ascending: false });

  if (selectErr) throw new Error(selectErr.message);

  const existing = (rows as Array<{ id: string }> | null) ?? [];

  if (existing.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin.from("subscriptions") as any)
      .update(row)
      .eq("org_id", orgId);
    if (error) throw new Error(error.message);

    // Collapse duplicate rows for the same org
    if (existing.length > 1) {
      const keepId = existing[0].id;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin.from("subscriptions") as any)
        .delete()
        .eq("org_id", orgId)
        .neq("id", keepId);
    }
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

function isLiveSubscription(sub: Stripe.Subscription): boolean {
  return sub.status === "active" || sub.status === "trialing";
}

async function searchSubscriptionByOrgMetadata(
  stripe: Stripe,
  orgId: string
): Promise<Stripe.Subscription | null> {
  try {
    const { data } = await stripe.subscriptions.search({
      query: `metadata['org_id']:'${orgId}'`,
      limit: 5,
    });
    return data.find(isLiveSubscription) ?? null;
  } catch (err) {
    console.warn("[sync-stripe] subscription metadata search failed:", err);
    return null;
  }
}

async function searchCustomerByOrgMetadata(
  stripe: Stripe,
  orgId: string
): Promise<string | null> {
  try {
    const { data } = await stripe.customers.search({
      query: `metadata['org_id']:'${orgId}'`,
      limit: 5,
    });
    return data[0]?.id ?? null;
  } catch (err) {
    console.warn("[sync-stripe] customer metadata search failed:", err);
    return null;
  }
}

async function getOrgMemberEmails(orgId: string): Promise<string[]> {
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: memberships } = await (admin.from("memberships") as any)
    .select("user_id")
    .eq("org_id", orgId);

  const userIds = ((memberships as Array<{ user_id: string }> | null) ?? []).map(
    (m) => m.user_id
  );

  const emails = new Set<string>();
  for (const userId of userIds) {
    const { data: authUser } = await admin.auth.admin.getUserById(userId);
    const email = authUser.user?.email?.trim().toLowerCase();
    if (email) emails.add(email);
  }
  return [...emails];
}

async function findStripeCustomerId(
  stripe: Stripe,
  orgId: string,
  userEmails: string[]
): Promise<string | null> {
  const byOrg = await searchCustomerByOrgMetadata(stripe, orgId);
  if (byOrg) return byOrg;

  if (userEmails.length === 0) return null;

  for (const userEmail of userEmails) {
    const { data: customers } = await stripe.customers.list({
      email: userEmail,
      limit: 20,
    });

    const byOrgMeta = customers.find((c) => c.metadata?.org_id === orgId);
    if (byOrgMeta) return byOrgMeta.id;

    for (const customer of customers) {
      const sub = await findActiveStripeSubscription(stripe, customer.id);
      if (sub) return customer.id;
    }

    if (customers[0]?.id) return customers[0].id;
  }

  return null;
}

async function findActiveStripeSubscription(
  stripe: Stripe,
  customerId: string
): Promise<Stripe.Subscription | null> {
  const { data: subs } = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 20,
  });

  return (
    subs.find(isLiveSubscription) ??
    subs.find((s) => s.status === "past_due") ??
    null
  );
}

async function findSubscriptionViaCheckoutSessions(
  stripe: Stripe,
  orgId: string,
  userEmails: string[]
): Promise<Stripe.Subscription | null> {
  const emailSet = new Set(userEmails.map((e) => e.toLowerCase()));
  let startingAfter: string | undefined;

  for (let page = 0; page < 5; page++) {
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
      starting_after: startingAfter,
      status: "complete",
    });

    for (const session of sessions.data) {
      if (session.mode !== "subscription") continue;

      const sessionEmail = (
        session.customer_email ||
        session.customer_details?.email ||
        ""
      ).toLowerCase();

      const sessionOrgId = session.metadata?.org_id as string | undefined;
      const emailMatch = emailSet.size > 0 && emailSet.has(sessionEmail);
      const orgMatch = sessionOrgId === orgId;

      if (!emailMatch && !orgMatch) continue;

      const subscriptionId = session.subscription;
      if (!subscriptionId || typeof subscriptionId !== "string") continue;

      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      if (isLiveSubscription(sub) || sub.status === "past_due") {
        return sub;
      }
    }

    if (!sessions.has_more || sessions.data.length === 0) break;
    startingAfter = sessions.data[sessions.data.length - 1]?.id;
  }

  return null;
}

async function findSubscriptionForOrg(
  stripe: Stripe,
  orgId: string,
  userEmails: string[],
  storedCustomerId?: string | null
): Promise<Stripe.Subscription | null> {
  // 1) Direct lookup by subscription metadata (most reliable after checkout)
  const byMeta = await searchSubscriptionByOrgMetadata(stripe, orgId);
  if (byMeta) return byMeta;

  // 2) Customer id already in DB
  if (storedCustomerId?.startsWith("cus_")) {
    const sub = await findActiveStripeSubscription(stripe, storedCustomerId);
    if (sub) return sub;
  }

  // 3) Find customer by org metadata or any org member email, then list subscriptions
  const customerId = await findStripeCustomerId(stripe, orgId, userEmails);
  if (customerId) {
    const sub = await findActiveStripeSubscription(stripe, customerId);
    if (sub) return sub;
  }

  // 4) Scan recent completed checkout sessions (handles missing metadata / wrong customer row)
  return findSubscriptionViaCheckoutSessions(stripe, orgId, userEmails);
}

export type SyncResult = {
  synced: boolean;
  reason?: string;
};

/**
 * Pull subscription state from Stripe into the DB. Looks up by org metadata,
 * stored customer id, or account email when webhooks did not update the row.
 */
export async function syncOrgSubscriptionFromStripe(
  orgId: string,
  userEmail?: string
): Promise<SyncResult> {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return { synced: false, reason: "STRIPE_SECRET_KEY not configured" };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "admin client failed";
    return { synced: false, reason: msg };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: row, error: rowErr } = await (admin.from("subscriptions") as any)
    .select("stripe_customer_id, stripe_subscription_id")
    .eq("org_id", orgId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (rowErr) {
    return { synced: false, reason: rowErr.message };
  }

  if (row?.stripe_subscription_id?.startsWith("sub_")) {
    return { synced: false, reason: "already synced" };
  }

  const stripe = new Stripe(secret);

  const memberEmails = await getOrgMemberEmails(orgId);
  const emails = [
    ...new Set(
      [userEmail?.trim().toLowerCase(), ...memberEmails].filter(Boolean) as string[]
    ),
  ];

  const sub = await findSubscriptionForOrg(
    stripe,
    orgId,
    emails,
    row?.stripe_customer_id as string | undefined
  );

  if (!sub) {
    const mode = secret.startsWith("sk_live") ? "live" : "test";
    const emailHint = emails.length > 0 ? emails.join(", ") : orgId;
    return {
      synced: false,
      reason: `no subscription found in Stripe ${mode} mode for ${emailHint}`,
    };
  }

  await saveOrgSubscription(orgId, subscriptionRowFromStripe(orgId, sub));
  console.log(`[sync-stripe] synced org ${orgId} → ${sub.id} (${sub.status})`);
  return { synced: true };
}

/**
 * Sync subscription row after checkout — fallback when webhooks are delayed.
 */
export async function syncSubscriptionFromCheckoutSession(
  sessionId: string
): Promise<SyncResult> {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return { synced: false, reason: "STRIPE_SECRET_KEY not configured" };
  }

  const stripe = new Stripe(secret);
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.mode !== "subscription" || session.status !== "complete") {
    return { synced: false, reason: "checkout session not a completed subscription" };
  }

  const orgId = session.metadata?.org_id as string | undefined;
  const subscriptionId = session.subscription as string | undefined;
  if (!orgId || !subscriptionId) {
    return { synced: false, reason: "checkout session missing org_id or subscription" };
  }

  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  await saveOrgSubscription(orgId, subscriptionRowFromStripe(orgId, sub));
  return { synced: true };
}
