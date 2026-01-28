import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const bodySchema = z.object({ sessionId: z.string().min(1) });

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

    const body = await req.json();
    const { sessionId } = bodySchema.parse(body);

    const stripe = new Stripe(secret);
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: [],
    });

    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Session not paid" }, { status: 400 });
    }

    const assessmentId =
      (session.metadata?.assessment_id as string) ||
      (session.client_reference_id as string);
    if (!assessmentId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 400 });
    }

    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertErr } = await (admin.from("report_purchases") as any).upsert(
      {
        assessment_id: assessmentId,
        user_id: user.id,
        stripe_session_id: session.id,
      },
      { onConflict: "stripe_session_id" }
    );

    if (insertErr && insertErr.code !== "23505") {
      console.error("[verify-session] Insert failed", insertErr);
      return NextResponse.json(
        { error: "Failed to record purchase" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    console.error("[verify-session]", e);
    return NextResponse.json(
      { error: "Failed to verify session" },
      { status: 500 }
    );
  }
}
