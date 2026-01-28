import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (!webhookSecret) {
  console.warn("[Stripe webhook] STRIPE_WEBHOOK_SECRET not set");
}

export async function POST(req: NextRequest) {
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 }
    );
  }

  const raw = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    event = stripe.webhooks.constructEvent(raw, sig, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const assessmentId =
      (session.metadata?.assessment_id as string) ||
      (session.client_reference_id as string);
    const userId = session.metadata?.user_id as string | undefined;

    if (!assessmentId) {
      console.error("[Stripe webhook] No assessment_id in session", session.id);
      return NextResponse.json({ received: true });
    }

    const supabase = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("report_purchases") as any).insert({
      assessment_id: assessmentId,
      user_id: userId ?? null,
      stripe_session_id: session.id,
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ received: true });
      }
      console.error("[Stripe webhook] Insert report_purchases failed", error);
      return NextResponse.json(
        { error: "Failed to record purchase" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}
