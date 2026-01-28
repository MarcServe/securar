import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const assessmentId = params.id;
  if (!assessmentId) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { data: purchase } = await supabase
    .from("report_purchases")
    .select("id")
    .eq("assessment_id", assessmentId)
    .limit(1)
    .maybeSingle();

  if (!purchase) {
    return new NextResponse("Purchase required to download the report", {
      status: 402,
    });
  }

  const base = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
  const url = `${base}/assessments/${assessmentId}/report/html`;

  const res = await fetch(url);
  if (!res.ok) {
    return new NextResponse("Report generation failed", { status: 502 });
  }

  const html = await res.text();
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
