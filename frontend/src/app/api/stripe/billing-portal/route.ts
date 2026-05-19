import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrProvisionMembership } from "@/lib/provision-org";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }

    const membership = await getOrProvisionMembership(user);
    if (!membership) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
    }

    const orgId = membership.orgId;

    // Look up the Stripe customer ID for this org
    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: sub } = await (admin.from("subscriptions") as any)
      .select("stripe_customer_id")
      .eq("org_id", orgId)
      .maybeSingle();

    if (!sub?.stripe_customer_id) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
    }

    const origin = req.headers.get("origin") || req.nextUrl.origin;
    const stripe = new Stripe(secret);

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${origin}/settings/billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (e) {
    console.error("[billing-portal]", e);
    return NextResponse.json(
      { error: "Failed to open billing portal" },
      { status: 500 }
    );
  }
}
