import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
    const priceId = process.env.STRIPE_PRO_PRICE_ID;
    if (!secret || !priceId) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }

    // Find the user's org — must be admin to subscribe
    const { data: membershipData } = await supabase
      .from("memberships")
      .select("org_id, role, organisations(name)")
      .eq("user_id", user.id)
      .in("role", ["admin", "owner"])
      .limit(1)
      .maybeSingle();

    const membership = membershipData as {
      org_id: string;
      role: string;
      organisations: { name: string } | null;
    } | null;

    if (!membership) {
      return NextResponse.json(
        { error: "You must be an org admin to manage billing." },
        { status: 403 }
      );
    }

    const orgId = membership.org_id;
    const orgName = membership.organisations?.name ?? "Organisation";

    const admin = createAdminClient();
    const stripe = new Stripe(secret);

    // Look up or create a Stripe customer for this org
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (admin.from("subscriptions") as any)
      .select("stripe_customer_id")
      .eq("org_id", orgId)
      .maybeSingle();

    let customerId: string;
    if (existing?.stripe_customer_id) {
      customerId = existing.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: orgName,
        metadata: { org_id: orgId },
      });
      customerId = customer.id;
    }

    const origin = req.headers.get("origin") || req.nextUrl.origin;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { org_id: orgId },
      success_url: `${origin}/settings/billing?subscribed=true`,
      cancel_url: `${origin}/pricing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[create-subscription-session]", e);
    return NextResponse.json(
      { error: "Failed to create subscription session" },
      { status: 500 }
    );
  }
}
