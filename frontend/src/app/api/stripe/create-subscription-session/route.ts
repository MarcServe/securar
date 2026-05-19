import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrProvisionMembership } from "@/lib/provision-org";
import { getTrialDays } from "@/lib/trial-config";
import {
  isRealStripeCustomerId,
} from "@/lib/stripe-customer";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Create an account or sign in to subscribe.", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    const secret = process.env.STRIPE_SECRET_KEY;
    const priceId = process.env.STRIPE_PRO_PRICE_ID;
    if (!secret || !priceId) {
      return NextResponse.json(
        { error: "Stripe is not configured. Contact support." },
        { status: 500 }
      );
    }

    const membership = await getOrProvisionMembership(user);
    if (!membership) {
      return NextResponse.json(
        { error: "Could not set up your organisation. Please try again.", code: "NO_ORG" },
        { status: 500 }
      );
    }

    const { orgId, orgName } = membership;
    const admin = createAdminClient();
    const stripe = new Stripe(secret);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingRows } = await (admin.from("subscriptions") as any)
      .select("id, stripe_customer_id, status, stripe_subscription_id, current_period_end, plan")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(1);

    const existing = (existingRows as Array<Record<string, unknown>> | null)?.[0] ?? null;
    const storedCustomerId = existing?.stripe_customer_id as string | undefined;

    const onExplorationTrial =
      existing?.status === "trialing" &&
      !String(existing?.stripe_subscription_id ?? "").startsWith("sub_");

    let customerId: string;

    if (isRealStripeCustomerId(storedCustomerId)) {
      customerId = storedCustomerId!;
    } else {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: orgName,
        metadata: { org_id: orgId },
      });
      customerId = customer.id;

      const patch = {
        stripe_customer_id: customerId,
        updated_at: new Date().toISOString(),
      };

      if (existing?.id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateErr } = await (admin.from("subscriptions") as any)
          .update(patch)
          .eq("id", existing.id);
        if (updateErr) {
          console.error("[create-subscription-session] customer update failed", updateErr);
          throw new Error("Could not save billing profile");
        }
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: insertErr } = await (admin.from("subscriptions") as any).insert({
          org_id: orgId,
          ...patch,
          plan: "free",
          status: "active",
        });
        if (insertErr) {
          console.error("[create-subscription-session] customer insert failed", insertErr);
          throw new Error("Could not save billing profile");
        }
      }
    }

    const origin = req.headers.get("origin") || req.nextUrl.origin;
    const body = await req.json().catch(() => ({}));
    const fromChoosePlan = body?.source === "choose-plan";
    const trialDays = getTrialDays();

    // Honour remaining exploration trial when converting to paid (no double-charge)
    let subscriptionData: Stripe.Checkout.SessionCreateParams.SubscriptionData = {
      metadata: { org_id: orgId },
    };

    if (onExplorationTrial && existing?.current_period_end) {
      const trialEnd = Math.floor(
        new Date(String(existing.current_period_end)).getTime() / 1000
      );
      if (trialEnd > Math.floor(Date.now() / 1000)) {
        subscriptionData = { ...subscriptionData, trial_end: trialEnd };
      }
    } else if (trialDays > 0 && !onExplorationTrial) {
      subscriptionData = { ...subscriptionData, trial_period_days: trialDays };
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { org_id: orgId },
      subscription_data: subscriptionData,
      success_url: `${origin}/settings/billing?subscribed=true${onExplorationTrial || subscriptionData.trial_end || subscriptionData.trial_period_days ? "&trial=true" : ""}`,
      cancel_url: fromChoosePlan ? `${origin}/choose-plan` : `${origin}/settings/billing`,
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL");
    }

    return NextResponse.json({ url: session.url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[create-subscription-session]", e);
    return NextResponse.json(
      {
        error: "Failed to create subscription session",
        detail: message,
      },
      { status: 500 }
    );
  }
}
