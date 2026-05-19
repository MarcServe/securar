import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrProvisionMembership } from "@/lib/provision-org";
import { getTrialDays } from "@/lib/trial-config";

function isPlaceholderStripeCustomer(id: string): boolean {
  return id.startsWith("explore_");
}

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
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
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
    const { data: existing } = await (admin.from("subscriptions") as any)
      .select("stripe_customer_id, status, stripe_subscription_id, current_period_end")
      .eq("org_id", orgId)
      .maybeSingle();

    const onExplorationTrial =
      existing?.status === "trialing" &&
      !existing?.stripe_subscription_id?.startsWith("sub_");

    let customerId: string;
    const storedCustomerId = existing?.stripe_customer_id as string | undefined;

    if (storedCustomerId && !isPlaceholderStripeCustomer(storedCustomerId)) {
      customerId = storedCustomerId;
    } else {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: orgName,
        metadata: { org_id: orgId },
      });
      customerId = customer.id;

      // Replace exploration placeholder with a real Stripe customer
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin.from("subscriptions") as any)
        .update({
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString(),
        })
        .eq("org_id", orgId);
    }

    const origin = req.headers.get("origin") || req.nextUrl.origin;
    const body = await req.json().catch(() => ({}));
    const fromChoosePlan = body?.source === "choose-plan";
    const trialDays = getTrialDays();

    // Don't stack a Stripe trial on top of the in-app exploration trial
    const stripeTrialDays =
      trialDays > 0 && !onExplorationTrial ? trialDays : undefined;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { org_id: orgId },
      subscription_data: {
        metadata: { org_id: orgId },
        ...(stripeTrialDays ? { trial_period_days: stripeTrialDays } : {}),
      },
      success_url: `${origin}/settings/billing?subscribed=true${onExplorationTrial || stripeTrialDays ? "&trial=true" : ""}`,
      cancel_url: fromChoosePlan ? `${origin}/choose-plan` : `${origin}/settings/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[create-subscription-session]", e);
    return NextResponse.json(
      { error: "Failed to create subscription session", detail: message },
      { status: 500 }
    );
  }
}
