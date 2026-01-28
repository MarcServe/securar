import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const bodySchema = z.object({ assessmentId: z.string().uuid() });

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
    const priceId = process.env.STRIPE_REPORT_PRICE_ID;
    if (!secret || !priceId) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { assessmentId } = bodySchema.parse(body);

    const { data: assessmentData, error: aErr } = await supabase
      .from("assessments")
      .select("id, org_id")
      .eq("id", assessmentId)
      .single();

    const assessment = assessmentData as { id: string; org_id: string } | null;
    if (aErr || !assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    const { data: membership } = await supabase
      .from("memberships")
      .select("id")
      .eq("org_id", assessment.org_id)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const origin = req.headers.get("origin") || req.nextUrl.origin;
    const stripe = new Stripe(secret);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      client_reference_id: assessmentId,
      metadata: { assessment_id: assessmentId, user_id: user.id },
      success_url: `${origin}/assessments/${assessmentId}/report?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/assessments/${assessmentId}/report`,
      customer_email: user.email ?? undefined,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    console.error("[create-checkout-session]", e);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
