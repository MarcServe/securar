import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  ArrowLeft,
  Download,
  FileText,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BarChart3,
  TrendingUp,
  Target,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

export default async function ReportPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Load assessment
  const { data: assessmentData, error: assessmentError } = await supabase
    .from("assessments")
    .select("*, organisations(*)")
    .eq("id", params.id)
    .single();

  if (assessmentError || !assessmentData) {
    notFound();
  }

  // Type the assessment
  const assessment = assessmentData as {
    id: string;
    status: string;
    readiness_score: number | null;
    score_breakdown: Record<string, unknown>;
    organisations: { name: string } | null;
  };

  // Redirect if not completed
  if (assessment.status !== "completed") {
    redirect(`/assessments/${params.id}`);
  }

  // Load report
  const { data: reportData } = await supabase
    .from("reports")
    .select("*")
    .eq("assessment_id", params.id)
    .order("generated_at", { ascending: false })
    .limit(1)
    .single();

  const report = reportData as { summary: Record<string, unknown> } | null;

  // Load risks
  const { data: risksData } = await supabase
    .from("risks")
    .select("*")
    .eq("assessment_id", params.id)
    .order("severity", { ascending: true });

  const risks = risksData as Array<{
    id: string;
    title: string;
    description: string | null;
    severity: string;
    recommendation: string | null;
    remediation_timeframe: string | null;
  }> | null;

  // Load control results
  const { data: controlResultsData } = await supabase
    .from("control_results")
    .select("*, controls(*)")
    .eq("assessment_id", params.id);

  const controlResults = controlResultsData as Array<{
    id: string;
    status: string;
    controls: { domain: string } | null;
  }> | null;

  const org = assessment.organisations;
  const summary = report?.summary as ReportSummary | null;
  const breakdown = assessment.score_breakdown as ScoreBreakdown | null;

  // Group controls by domain
  const controlsByDomain = (controlResults || []).reduce((acc, cr) => {
    const domain = (cr.controls as { domain: string } | null)?.domain || "Other";
    if (!acc[domain]) {
      acc[domain] = { compliant: 0, partial: 0, gap: 0, total: 0 };
    }
    acc[domain][cr.status as keyof typeof acc[typeof domain]] = 
      (acc[domain][cr.status as keyof typeof acc[typeof domain]] || 0) + 1;
    acc[domain].total++;
    return acc;
  }, {} as Record<string, { compliant: number; partial: number; gap: number; total: number }>);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href={`/assessments/${params.id}`}
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Assessment
              </Link>
              <h1 className="text-xl font-bold">Security Assessment Report</h1>
              <p className="text-muted-foreground">{org?.name}</p>
            </div>
            <a
              href={`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"}/assessments/${params.id}/report/html`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Score Overview */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-gradient-to-br from-primary to-purple-600 rounded-2xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 mb-2">Overall Readiness Score</p>
                <p className="text-6xl font-bold">{assessment.readiness_score ?? 0}%</p>
                <p className="text-white/70 mt-2">
                  {(assessment.readiness_score ?? 0) >= 80
                    ? "Ready for certification audit"
                    : (assessment.readiness_score ?? 0) >= 50
                    ? "Remediation needed before audit"
                    : "Significant work required"}
                </p>
              </div>
              <div className="bg-white/10 rounded-full p-6">
                <Shield className="h-16 w-16" />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Status Breakdown
            </h3>
            <div className="space-y-3">
              <StatusRow
                label="Compliant"
                count={breakdown?.compliant || 0}
                total={breakdown?.total_controls || 0}
                color="emerald"
              />
              <StatusRow
                label="Partial"
                count={breakdown?.partial || 0}
                total={breakdown?.total_controls || 0}
                color="amber"
              />
              <StatusRow
                label="Gaps"
                count={breakdown?.gap || 0}
                total={breakdown?.total_controls || 0}
                color="rose"
              />
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        {summary?.executive_summary && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Executive Summary
            </h2>
            <p className="text-lg font-medium mb-3">
              {summary.executive_summary.headline}
            </p>
            <p className="text-muted-foreground mb-4">
              {summary.executive_summary.summary}
            </p>
            {summary.executive_summary.key_findings && (
              <div>
                <h3 className="font-medium mb-2">Key Findings</h3>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  {summary.executive_summary.key_findings.map((finding: string, i: number) => (
                    <li key={i}>{finding}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Top Risks */}
        <div className="bg-card border border-border rounded-xl">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              Priority Risks
            </h2>
          </div>
          <div className="divide-y divide-border">
            {(risks || []).slice(0, 10).map((risk) => (
              <div key={risk.id} className="p-4">
                <div className="flex items-start gap-4">
                  <SeverityBadge severity={risk.severity} />
                  <div className="flex-1">
                    <p className="font-medium">{risk.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {risk.description}
                    </p>
                    {risk.recommendation && (
                      <p className="text-sm mt-2">
                        <span className="font-medium text-primary">Recommendation:</span>{" "}
                        {risk.recommendation}
                      </p>
                    )}
                  </div>
                  <TimeframeBadge timeframe={risk.remediation_timeframe} />
                </div>
              </div>
            ))}
            {(!risks || risks.length === 0) && (
              <div className="p-8 text-center text-muted-foreground">
                No risks identified
              </div>
            )}
          </div>
        </div>

        {/* Domain Breakdown */}
        <div className="bg-card border border-border rounded-xl">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Control Status by Domain
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {Object.entries(controlsByDomain).map(([domain, stats]) => {
                const score = Math.round(
                  ((stats.compliant + stats.partial * 0.5) / stats.total) * 100
                );
                return (
                  <div key={domain}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{domain}</span>
                      <span className="text-sm text-muted-foreground">
                        {stats.compliant}/{stats.total} compliant • {score}%
                      </span>
                    </div>
                    <div className="flex h-3 rounded-full overflow-hidden bg-muted">
                      <div
                        className="bg-emerald-500"
                        style={{ width: `${(stats.compliant / stats.total) * 100}%` }}
                      />
                      <div
                        className="bg-amber-500"
                        style={{ width: `${(stats.partial / stats.total) * 100}%` }}
                      />
                      <div
                        className="bg-rose-500"
                        style={{ width: `${(stats.gap / stats.total) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Remediation Roadmap */}
        <div className="bg-card border border-border rounded-xl">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Remediation Roadmap
            </h2>
          </div>
          <div className="p-6 grid md:grid-cols-3 gap-6">
            <TimeframeSection
              title="30-Day Priority"
              description="Critical actions"
              risks={(risks || []).filter((r) => r.remediation_timeframe === "30-day")}
            />
            <TimeframeSection
              title="60-Day Actions"
              description="High-priority items"
              risks={(risks || []).filter((r) => r.remediation_timeframe === "60-day")}
            />
            <TimeframeSection
              title="90-Day Actions"
              description="Foundation strengthening"
              risks={(risks || []).filter((r) => r.remediation_timeframe === "90-day")}
            />
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-muted/50 rounded-xl p-6 text-sm text-muted-foreground">
          <h3 className="font-medium text-foreground mb-2">Important Disclaimer</h3>
          <p>
            This report is provided for decision-support purposes only and does not
            constitute certification, legal advice, or a guarantee of compliance. The
            assessments contained herein are based on information provided during the
            assessment period and may not reflect all aspects of the organisation&apos;s
            security posture.
          </p>
        </div>
      </main>
    </div>
  );
}

interface ReportSummary {
  executive_summary?: {
    headline?: string;
    summary?: string;
    key_findings?: string[];
  };
}

interface ScoreBreakdown {
  compliant?: number;
  partial?: number;
  gap?: number;
  not_applicable?: number;
  total_controls?: number;
}

function StatusRow({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: "emerald" | "amber" | "rose";
}) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  const colorClasses = {
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
  };

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {count} ({percentage}%)
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full", colorClasses[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const config: Record<string, string> = {
    critical: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };

  return (
    <span
      className={cn(
        "px-2 py-1 rounded border text-xs font-medium uppercase",
        config[severity] || config.medium
      )}
    >
      {severity}
    </span>
  );
}

function TimeframeBadge({ timeframe }: { timeframe: string | null }) {
  if (!timeframe) return null;
  return (
    <span className="text-xs bg-muted px-2 py-1 rounded">{timeframe}</span>
  );
}

function TimeframeSection({
  title,
  description,
  risks,
}: {
  title: string;
  description: string;
  risks: Array<{ id: string; title: string; recommendation: string | null }>;
}) {
  return (
    <div className="bg-muted/30 rounded-lg p-4">
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground mb-3">{description}</p>
      {risks.length > 0 ? (
        <ul className="space-y-2">
          {risks.slice(0, 5).map((risk) => (
            <li key={risk.id} className="text-sm flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <span>{risk.recommendation || risk.title}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No items in this timeframe</p>
      )}
    </div>
  );
}

