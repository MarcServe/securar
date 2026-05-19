import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateAssessmentReport, type ReportData } from "@/lib/report/generate-report";
import { generateReportHTML } from "@/lib/report/report-html";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const assessmentId = params.id;
  if (!assessmentId) {
    return new NextResponse("Bad request", { status: 400 });
  }

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { data: assessmentData } = await supabase
      .from("assessments")
      .select("org_id, status")
      .eq("id", assessmentId)
      .single();

    const assessment = assessmentData as { org_id: string; status: string } | null;
    if (!assessment) {
      return new NextResponse("Assessment not found", { status: 404 });
    }

    if (assessment.status !== "completed") {
      return new NextResponse("Complete the assessment before downloading the report", {
        status: 400,
      });
    }

    const { data: membership } = await supabase
      .from("memberships")
      .select("org_id")
      .eq("user_id", user.id)
      .eq("org_id", assessment.org_id)
      .maybeSingle();

    if (!membership) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const admin = createAdminClient();

    // Prefer cached report; regenerate if missing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (admin.from("reports") as any)
      .select("summary")
      .eq("assessment_id", assessmentId)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const report: ReportData =
      (existing?.summary as ReportData | undefined) ??
      (await generateAssessmentReport(assessmentId));

    const html = generateReportHTML(report);

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="securar-report-${assessmentId.slice(0, 8)}.html"`,
      },
    });
  } catch (err) {
    console.error("[report/html]", err);
    const message = err instanceof Error ? err.message : "Report generation failed";
    return new NextResponse(message, { status: 500 });
  }
}
