import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Marks that the user chose the free tier (skips future plan prompts). */
export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase.auth.updateUser({
    data: { plan_choice: "free" },
  });

  if (error) {
    console.error("[continue-free]", error);
    return NextResponse.json({ error: "Failed to save preference" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
