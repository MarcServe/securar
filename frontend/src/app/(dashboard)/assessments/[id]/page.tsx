import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Shield,
  FileText,
  Upload,
  Play,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  BarChart3,
  FileQuestion,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RunAssessmentButton } from "./RunAssessmentButton";
import { ResetAssessmentButton } from "./ResetAssessmentButton";

export default async function AssessmentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Load assessment with org info
  const { data: assessment, error } = await supabase
    .from("assessments")
    .select("*, organisations(*)")
    .eq("id", params.id)
    .single();

  if (error || !assessment) {
    notFound();
  }

  // Load related data
  const [
    { data: responses, count: responseCount },
    { data: evidence, count: evidenceCount },
    { data: controlResults },
    { data: risks },
  ] = await Promise.all([
    supabase
      .from("responses")
      .select("*", { count: "exact" })
      .eq("assessment_id", params.id),
    supabase
      .from("evidence")
      .select("*", { count: "exact" })
      .eq("assessment_id", params.id),
    supabase
      .from("control_results")
      .select("*, controls(*)")
      .eq("assessment_id", params.id),
    supabase
      .from("risks")
      .select("*")
      .eq("assessment_id", params.id)
      .order("severity", { ascending: true })
      .limit(5),
  ]);

  const org = assessment.organisations as { name: string } | null;

  // Calculate progress
  const totalSteps = 3;
  let completedSteps = 0;
  if ((responseCount || 0) > 0) completedSteps++;
  if ((evidenceCount || 0) > 0) completedSteps++;
  if (assessment.status === "completed") completedSteps++;

  const progressPercent = Math.round((completedSteps / totalSteps) * 100);

  // Group control results by status
  const statusCounts = {
    compliant: controlResults?.filter((r) => r.status === "compliant").length || 0,
    partial: controlResults?.filter((r) => r.status === "partial").length || 0,
    gap: controlResults?.filter((r) => r.status === "gap").length || 0,
    unknown: controlResults?.filter((r) => r.status === "unknown").length || 0,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                {assessment.target_frameworks?.join(", ").toUpperCase() || "ISO 27001"} Assessment
              </h1>
              <p className="text-muted-foreground">{org?.name}</p>
            </div>
            <div className="flex items-center gap-4">
              <StatusBadge status={assessment.status} />
              {assessment.readiness_score !== null && (
                <div className="text-right">
                  <p className="text-3xl font-bold">{assessment.readiness_score}%</p>
                  <p className="text-sm text-muted-foreground">Readiness Score</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Progress Overview */}
        {assessment.status !== "completed" && (
          <div className="bg-card border border-border rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Assessment Progress</h2>
              <span className="text-sm text-muted-foreground">
                {completedSteps} of {totalSteps} steps
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 mb-6">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <StepCard
                step={1}
                title="Answer Questions"
                description="Complete the security questionnaire"
                icon={FileQuestion}
                completed={(responseCount || 0) > 0}
                href={`/assessments/${params.id}/questionnaire`}
                count={responseCount || 0}
                countLabel="responses"
              />
              <StepCard
                step={2}
                title="Upload Evidence"
                description="Add policies and documentation"
                icon={Upload}
                completed={(evidenceCount || 0) > 0}
                href={`/assessments/${params.id}/evidence`}
                count={evidenceCount || 0}
                countLabel="files"
              />
              <StepCard
                step={3}
                title="Run Analysis"
                description="Generate your readiness report"
                icon={Play}
                completed={assessment.status === "completed"}
                disabled={(responseCount || 0) === 0}
                isAction
                assessmentId={params.id}
              />
            </div>
          </div>
        )}

        {/* Results (if completed) */}
        {assessment.status === "completed" && (
          <>
            {/* Score Summary - Clickable Cards */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <Link
                href={`/assessments/${params.id}/report`}
                className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-primary/10 rounded-lg p-2 group-hover:bg-primary/20 transition-colors">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">Readiness Score</span>
                </div>
                <p className="text-3xl font-bold">{assessment.readiness_score}%</p>
                <p className="text-xs text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  View Report →
                </p>
              </Link>

              <Link
                href={`/assessments/${params.id}/controls?status=compliant`}
                className="bg-card border border-border rounded-xl p-6 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-emerald-500/10 rounded-lg p-2 group-hover:bg-emerald-500/20 transition-colors">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  </div>
                  <span className="text-sm text-muted-foreground">Compliant</span>
                </div>
                <p className="text-3xl font-bold">{statusCounts.compliant}</p>
                <p className="text-xs text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  View Controls →
                </p>
              </Link>

              <Link
                href={`/assessments/${params.id}/controls?status=partial`}
                className="bg-card border border-border rounded-xl p-6 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-amber-500/10 rounded-lg p-2 group-hover:bg-amber-500/20 transition-colors">
                    <Clock className="h-5 w-5 text-amber-400" />
                  </div>
                  <span className="text-sm text-muted-foreground">Partial</span>
                </div>
                <p className="text-3xl font-bold">{statusCounts.partial}</p>
                <p className="text-xs text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  View Controls →
                </p>
              </Link>

              <Link
                href={`/assessments/${params.id}/controls?status=gap`}
                className="bg-card border border-border rounded-xl p-6 hover:border-rose-500/50 hover:bg-rose-500/5 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-rose-500/10 rounded-lg p-2 group-hover:bg-rose-500/20 transition-colors">
                    <AlertTriangle className="h-5 w-5 text-rose-400" />
                  </div>
                  <span className="text-sm text-muted-foreground">Gaps</span>
                </div>
                <p className="text-3xl font-bold">{statusCounts.gap}</p>
                <p className="text-xs text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  View Controls →
                </p>
              </Link>
            </div>

            {/* Top Risks */}
            {risks && risks.length > 0 && (
              <div className="bg-card border border-border rounded-xl mb-8">
                <div className="p-6 border-b border-border flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Top Risks</h2>
                  <Link
                    href={`/assessments/${params.id}/risks`}
                    className="text-sm text-primary hover:underline"
                  >
                    View all
                  </Link>
                </div>
                <div className="divide-y divide-border">
                  {risks.map((risk) => (
                    <div key={risk.id} className="p-4 flex items-start gap-4">
                      <SeverityBadge severity={risk.severity} />
                      <div className="flex-1">
                        <p className="font-medium">{risk.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {risk.description}
                        </p>
                      </div>
                      {risk.remediation_timeframe && (
                        <span className="text-xs bg-muted px-2 py-1 rounded">
                          {risk.remediation_timeframe}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="grid md:grid-cols-3 gap-6">
              <Link
                href={`/assessments/${params.id}/controls`}
                className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors"
              >
                <div className="bg-primary/10 rounded-lg p-3 inline-block mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">View Controls</h3>
                <p className="text-sm text-muted-foreground">
                  See detailed status for all {controlResults?.length || 0} controls
                </p>
              </Link>

              <Link
                href={`/assessments/${params.id}/report`}
                className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors"
              >
                <div className="bg-emerald-500/10 rounded-lg p-3 inline-block mb-4">
                  <FileText className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="font-semibold mb-1">Download Report</h3>
                <p className="text-sm text-muted-foreground">
                  Get PDF report with remediation roadmap
                </p>
              </Link>

              <Link
                href={`/assessments/${params.id}/evidence`}
                className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors"
              >
                <div className="bg-amber-500/10 rounded-lg p-3 inline-block mb-4">
                  <Upload className="h-6 w-6 text-amber-400" />
                </div>
                <h3 className="font-semibold mb-1">Manage Evidence</h3>
                <p className="text-sm text-muted-foreground">
                  Upload or delete documents ({evidenceCount || 0} files)
                </p>
              </Link>
            </div>

            {/* Re-analyze Actions */}
            <div className="mt-6 pt-6 border-t border-border flex items-center justify-between">
              <div>
                <h3 className="font-medium">Need to update your assessment?</h3>
                <p className="text-sm text-muted-foreground">
                  Upload new documents, then re-run analysis or reset completely
                </p>
              </div>
              <div className="flex items-center gap-3">
                <ResetAssessmentButton assessmentId={params.id} />
                <RunAssessmentButton
                  assessmentId={params.id}
                  variant="button"
                  label="Re-run Analysis"
                />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    draft: { label: "Draft", className: "bg-gray-500/20 text-gray-400" },
    collecting: { label: "In Progress", className: "bg-amber-500/20 text-amber-400" },
    analysing: { label: "Analysing", className: "bg-blue-500/20 text-blue-400" },
    completed: { label: "Completed", className: "bg-emerald-500/20 text-emerald-400" },
    archived: { label: "Archived", className: "bg-gray-500/20 text-gray-400" },
  };

  const { label, className } = config[status] || config.draft;

  return (
    <span className={cn("px-3 py-1 rounded-full text-sm font-medium", className)}>
      {label}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const config: Record<string, string> = {
    critical: "bg-rose-500/20 text-rose-400",
    high: "bg-orange-500/20 text-orange-400",
    medium: "bg-amber-500/20 text-amber-400",
    low: "bg-blue-500/20 text-blue-400",
  };

  return (
    <span className={cn("px-2 py-1 rounded text-xs font-medium uppercase", config[severity] || config.medium)}>
      {severity}
    </span>
  );
}

function StepCard({
  step,
  title,
  description,
  icon: Icon,
  completed,
  href,
  count,
  countLabel,
  disabled,
  isAction,
  assessmentId,
}: {
  step: number;
  title: string;
  description: string;
  icon: React.ElementType;
  completed: boolean;
  href?: string;
  count?: number;
  countLabel?: string;
  disabled?: boolean;
  isAction?: boolean;
  assessmentId?: string;
}) {
  if (isAction && assessmentId) {
    return (
      <RunAssessmentButton
        assessmentId={assessmentId}
        variant="step"
        step={step}
        title={title}
        description={description}
        disabled={disabled}
        completed={completed}
      />
    );
  }

  const content = (
    <div
      className={cn(
        "flex items-start gap-4 p-4 rounded-xl border transition-all",
        completed
          ? "border-emerald-500/30 bg-emerald-500/5"
          : disabled
          ? "border-border opacity-50 cursor-not-allowed"
          : "border-border hover:border-primary/50"
      )}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold",
          completed ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
        )}
      >
        {completed ? "✓" : step}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
        {count !== undefined && count > 0 && (
          <p className="text-sm text-primary mt-1">
            {count} {countLabel}
          </p>
        )}
      </div>
      <Icon className={cn("h-5 w-5", completed ? "text-emerald-400" : "text-muted-foreground")} />
    </div>
  );

  if (href && !disabled) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

