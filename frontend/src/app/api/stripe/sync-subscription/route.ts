import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncOrgSubscriptionFromStripe } from "@/lib/sync-stripe-subscription";

export async function POST() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: membership } = await supabase
      .from("memberships")
      .select("org_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    const orgId = (membership as { org_id: string } | null)?.org_id;
    if (!orgId) {
      return NextResponse.json({ error: "No organisation found" }, { status: 404 });
    }

    const synced = await syncOrgSubscriptionFromStripe(orgId, user.email ?? undefined);
    return NextResponse.json({ synced });
  } catch (e) {
    console.error("[sync-subscription]", e);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
