import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureUserHasOrgForUser } from "@/lib/provision-org";

/** Creates org + admin membership for the current user if missing. */
export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = await ensureUserHasOrgForUser(user);
  if (!orgId) {
    return NextResponse.json({ error: "Could not set up organisation" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, orgId });
}
