import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { upsertOrgSubscriptionFromStripe } from "@/lib/sync-stripe-subscription";

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

  const supabase = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.mode === "subscription") {
        const orgId = session.metadata?.org_id as string | undefined;
        const subscriptionId = session.subscription as string | undefined;
        const customerId = session.customer as string | undefined;

        if (!orgId || !subscriptionId || !customerId) {
          console.error("[Stripe webhook] Missing subscription checkout fields", session.id);
          break;
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
        const sub = await stripe.subscriptions.retrieve(subscriptionId);

        try {
          await upsertOrgSubscriptionFromStripe(orgId, sub);
        } catch (error) {
          console.error("[Stripe webhook] Subscription checkout upsert failed", error);
        }
        break;
      }

      // One-time payment sessions (report unlocks)
      if (session.mode !== "payment") break;

      const assessmentId =
        (session.metadata?.assessment_id as string) ||
        (session.client_reference_id as string);
      const userId = session.metadata?.user_id as string | undefined;

      if (!assessmentId) {
        console.error("[Stripe webhook] No assessment_id in session", session.id);
        break;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("report_purchases") as any).insert({
        assessment_id: assessmentId,
        user_id: userId ?? null,
        stripe_session_id: session.id,
      });

      if (error) {
        if (error.code === "23505") break; // duplicate — already recorded
        console.error("[Stripe webhook] Insert report_purchases failed", error);
        return NextResponse.json(
          { error: "Failed to record purchase" },
          { status: 500 }
        );
      }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const orgId = sub.metadata?.org_id as string | undefined;

      if (!orgId) {
        console.error("[Stripe webhook] No org_id in subscription metadata", sub.id);
        break;
      }

      try {
        await upsertOrgSubscriptionFromStripe(orgId, sub);
      } catch (error) {
        console.error("[Stripe webhook] Upsert subscription failed", error);
        return NextResponse.json(
          { error: "Failed to record subscription" },
          { status: 500 }
        );
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("subscriptions") as any)
        .update({ status: "canceled", updated_at: new Date().toISOString() })
        .eq("stripe_subscription_id", sub.id);

      if (error) {
        console.error("[Stripe webhook] Cancel subscription failed", error);
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("subscriptions") as any)
        .update({ status: "past_due", updated_at: new Date().toISOString() })
        .eq("stripe_customer_id", invoice.customer as string);

      if (error) {
        console.error("[Stripe webhook] past_due update failed", error);
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
