import { createAdminClient } from "@/lib/supabase/admin";

export type ReportData = {
  meta: {
    generated_at: string;
    assessment_id: string;
    framework: string;
    version: string;
  };
  organisation: {
    name: string;
    industry: string;
    size: string;
    country: string;
  };
  executive_summary: {
    headline: string;
    summary: string;
    key_findings: string[];
  };
  scores: {
    overall: number;
    breakdown: Record<string, number>;
    readiness: { status: string; message: string };
    domains: Record<string, unknown>;
  };
  controls: {
    total: number;
    by_status: Record<string, number>;
    by_domain: Record<string, { compliant: number; partial: number; gap: number; total: number }>;
    details: Array<{
      code: string;
      title: string;
      domain: string;
      status: string;
      confidence: string | null;
      reasoning: string | null;
    }>;
  };
  risks: {
    total: number;
    by_severity: Record<string, number>;
    remediation_roadmap: Record<string, Array<{ title: string; recommendation: string | null }>>;
    details: Array<{
      title: string;
      description: string | null;
      severity: string;
      recommendation: string | null;
      timeframe: string | null;
    }>;
  };
  evidence: {
    total: number;
    analyzed: number;
    documents: Array<{ name: string; type: string | null; status: string }>;
  };
  disclaimer: string;
};

function groupRisksByTimeframe(
  risks: Array<{ remediation_timeframe?: string | null; title: string; recommendation?: string | null }>
) {
  return {
    "30-day": risks.filter((r) => r.remediation_timeframe === "30-day"),
    "60-day": risks.filter((r) => r.remediation_timeframe === "60-day"),
    "90-day": risks.filter((r) => r.remediation_timeframe === "90-day"),
  };
}

function getCertificationReadiness(score: number, breakdown: Record<string, number>) {
  const gap = breakdown.gap ?? 0;
  const total = breakdown.total_assessed ?? 1;
  const gapPct = (gap / total) * 100;

  if (score >= 80 && gapPct < 10) {
    return { status: "ready", message: "Organisation appears ready for certification audit" };
  }
  if (score >= 50 && gapPct < 30) {
    return { status: "needs_work", message: "Foundation in place — address gaps before audit" };
  }
  return { status: "not_ready", message: "Significant remediation required before certification" };
}

function buildFallbackSummary(
  score: number,
  breakdown: Record<string, number>,
  riskCount: number
) {
  const gapCount = breakdown.gap ?? 0;
  let headline = "Significant Work Required";
  if (score >= 80) headline = "Organisation Appears Ready for Audit";
  else if (score >= 50) headline = "Remediation Needed Before Audit";

  return {
    headline,
    summary: `This assessment evaluated the organisation against ISO 27001 Annex A controls. The overall readiness score is ${score}%, with ${gapCount} control gaps and ${riskCount} risks identified.`,
    key_findings: [
      `Overall readiness score: ${score}%`,
      `${breakdown.compliant ?? 0} controls appear compliant`,
      `${gapCount} control gaps require attention`,
      `${riskCount} risks identified for remediation`,
    ],
  };
}

function groupControlsByDomain(
  controlResults: Array<{
    status: string;
    controls?: { domain?: string } | null;
  }>
) {
  const byDomain: Record<string, { compliant: number; partial: number; gap: number; total: number }> =
    {};
  for (const cr of controlResults) {
    const domain = cr.controls?.domain || "Other";
    if (!byDomain[domain]) {
      byDomain[domain] = { compliant: 0, partial: 0, gap: 0, total: 0 };
    }
    const key = cr.status as "compliant" | "partial" | "gap";
    if (key in byDomain[domain]) {
      byDomain[domain][key] += 1;
    }
    byDomain[domain].total += 1;
  }
  return byDomain;
}

function groupBySeverity(risks: Array<{ severity: string }>) {
  return {
    critical: risks.filter((r) => r.severity === "critical").length,
    high: risks.filter((r) => r.severity === "high").length,
    medium: risks.filter((r) => r.severity === "medium").length,
    low: risks.filter((r) => r.severity === "low").length,
  };
}

const DISCLAIMER =
  "This report is decision-support documentation only. It does not constitute certification, legal advice, or a guarantee of audit outcome. Organisations should validate findings with qualified auditors.";

export async function generateAssessmentReport(assessmentId: string): Promise<ReportData> {
  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: assessment, error: aErr } = await (admin.from("assessments") as any)
    .select("*, organisations(*)")
    .eq("id", assessmentId)
    .single();

  if (aErr || !assessment) {
    throw new Error("Assessment not found");
  }

  const org = assessment.organisations as {
    id?: string;
    name?: string;
    industry?: string;
    size_band?: string;
    country?: string;
  } | null;

  const breakdown = (assessment.score_breakdown as Record<string, number>) || {};
  const score = (assessment.readiness_score as number) ?? 0;

  const [
    { data: controlResults },
    { data: risks },
    { data: evidence },
  ] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin.from("control_results") as any).select("*, controls(*)").eq("assessment_id", assessmentId),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin.from("risks") as any).select("*").eq("assessment_id", assessmentId),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin.from("evidence") as any).select("*").eq("assessment_id", assessmentId),
  ]);

  const riskList = (risks || []) as Array<{
    title: string;
    description: string | null;
    severity: string;
    recommendation: string | null;
    remediation_timeframe: string | null;
  }>;

  const controlList = (controlResults || []) as Array<{
    status: string;
    confidence: string | null;
    reasoning: string | null;
    controls?: { control_code?: string; title?: string; domain?: string } | null;
  }>;

  const evidenceList = (evidence || []) as Array<{
    file_name: string;
    file_type: string | null;
    status: string;
  }>;

  const executive_summary = buildFallbackSummary(score, breakdown, riskList.length);
  const readiness = getCertificationReadiness(score, breakdown);
  const grouped = groupRisksByTimeframe(riskList);
  const risksByTimeframe = {
    "30-day": grouped["30-day"].map((r) => ({
      title: r.title,
      recommendation: r.recommendation ?? null,
    })),
    "60-day": grouped["60-day"].map((r) => ({
      title: r.title,
      recommendation: r.recommendation ?? null,
    })),
    "90-day": grouped["90-day"].map((r) => ({
      title: r.title,
      recommendation: r.recommendation ?? null,
    })),
  };

  const report: ReportData = {
    meta: {
      generated_at: new Date().toISOString(),
      assessment_id: assessmentId,
      framework: (assessment.target_frameworks as string[] | null)?.[0] || "iso27001",
      version: "1.0",
    },
    organisation: {
      name: org?.name || "Unknown",
      industry: org?.industry || "Not specified",
      size: org?.size_band || "Not specified",
      country: org?.country || "Not specified",
    },
    executive_summary,
    scores: {
      overall: score,
      breakdown,
      readiness,
      domains: ((breakdown as Record<string, unknown>).domains as Record<string, unknown>) || {},
    },
    controls: {
      total: controlList.length,
      by_status: breakdown,
      by_domain: groupControlsByDomain(controlList),
      details: controlList.map((cr) => ({
        code: cr.controls?.control_code || "—",
        title: cr.controls?.title || "Unknown",
        domain: cr.controls?.domain || "Unknown",
        status: cr.status,
        confidence: cr.confidence,
        reasoning: cr.reasoning,
      })),
    },
    risks: {
      total: riskList.length,
      by_severity: groupBySeverity(riskList),
      remediation_roadmap: risksByTimeframe,
      details: riskList.slice(0, 20).map((r) => ({
        title: r.title,
        description: r.description,
        severity: r.severity,
        recommendation: r.recommendation,
        timeframe: r.remediation_timeframe,
      })),
    },
    evidence: {
      total: evidenceList.length,
      analyzed: evidenceList.filter((e) => e.status === "parsed").length,
      documents: evidenceList.map((e) => ({
        name: e.file_name,
        type: e.file_type,
        status: e.status,
      })),
    },
    disclaimer: DISCLAIMER,
  };

  // Persist for future views (non-fatal if insert fails)
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from("reports") as any).insert({
      assessment_id: assessmentId,
      org_id: org?.id,
      summary: report,
      generated_at: report.meta.generated_at,
    });
  } catch {
    // ignore duplicate or RLS on insert
  }

  return report;
}
