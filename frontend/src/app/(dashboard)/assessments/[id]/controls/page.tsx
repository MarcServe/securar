import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  ArrowLeft,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Clock,
  HelpCircle,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default async function ControlsPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Load assessment
  const { data: assessment, error } = await supabase
    .from("assessments")
    .select("*, organisations(*)")
    .eq("id", params.id)
    .single();

  if (error || !assessment) {
    notFound();
  }

  // Load control results with control details
  const { data: controlResults } = await supabase
    .from("control_results")
    .select("*, controls(*)")
    .eq("assessment_id", params.id)
    .order("controls(control_code)", { ascending: true });

  // Group by domain
  const byDomain = (controlResults || []).reduce((acc, cr) => {
    const control = cr.controls as Control | null;
    const domain = control?.domain || "Other";
    if (!acc[domain]) {
      acc[domain] = [];
    }
    acc[domain].push(cr);
    return acc;
  }, {} as Record<string, ControlResult[]>);

  const domains = Object.keys(byDomain).sort();

  // Calculate stats
  const stats = {
    total: controlResults?.length || 0,
    compliant: controlResults?.filter((r) => r.status === "compliant").length || 0,
    partial: controlResults?.filter((r) => r.status === "partial").length || 0,
    gap: controlResults?.filter((r) => r.status === "gap").length || 0,
    unknown: controlResults?.filter((r) => r.status === "unknown").length || 0,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Link
            href={`/assessments/${params.id}`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Assessment
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Control Assessment</h1>
              <p className="text-muted-foreground">
                {stats.total} controls evaluated
              </p>
            </div>
            <div className="flex items-center gap-4">
              <StatBadge
                icon={CheckCircle2}
                count={stats.compliant}
                label="Compliant"
                color="emerald"
              />
              <StatBadge
                icon={Clock}
                count={stats.partial}
                label="Partial"
                color="amber"
              />
              <StatBadge
                icon={AlertTriangle}
                count={stats.gap}
                label="Gaps"
                color="rose"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {domains.map((domain) => (
          <DomainSection
            key={domain}
            domain={domain}
            controls={byDomain[domain]}
          />
        ))}

        {(!controlResults || controlResults.length === 0) && (
          <div className="text-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No control results yet</h2>
            <p className="text-muted-foreground">
              Run the assessment to generate control evaluations.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

interface Control {
  id: string;
  control_code: string;
  title: string;
  description: string | null;
  domain: string;
}

interface ControlResult {
  id: string;
  status: string;
  reasoning: string | null;
  confidence: string | null;
  evidence_refs: unknown;
  controls: Control | null;
}

function StatBadge({
  icon: Icon,
  count,
  label,
  color,
}: {
  icon: React.ElementType;
  count: number;
  label: string;
  color: "emerald" | "amber" | "rose";
}) {
  const colorClasses = {
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    rose: "text-rose-400",
  };

  return (
    <div className="flex items-center gap-2">
      <Icon className={cn("h-5 w-5", colorClasses[color])} />
      <span className="font-semibold">{count}</span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}

function DomainSection({
  domain,
  controls,
}: {
  domain: string;
  controls: ControlResult[];
}) {
  const compliant = controls.filter((c) => c.status === "compliant").length;
  const total = controls.length;
  const score = Math.round((compliant / total) * 100);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{domain}</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {compliant}/{total} compliant
          </span>
          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl divide-y divide-border">
        {controls.map((cr) => (
          <ControlRow key={cr.id} result={cr} />
        ))}
      </div>
    </div>
  );
}

function ControlRow({ result }: { result: ControlResult }) {
  const control = result.controls;

  return (
    <details className="group">
      <summary className="flex items-center gap-4 p-4 cursor-pointer hover:bg-secondary/50 transition-colors list-none">
        <StatusIcon status={result.status} />
        <div className="flex-1 min-w-0">
          <p className="font-medium">
            <span className="text-primary">{control?.control_code}</span>
            {" - "}
            {control?.title || "Unknown Control"}
          </p>
          {result.reasoning && (
            <p className="text-sm text-muted-foreground truncate">
              {result.reasoning}
            </p>
          )}
        </div>
        <ConfidenceBadge confidence={result.confidence} />
        <ChevronDown className="h-5 w-5 text-muted-foreground group-open:rotate-180 transition-transform" />
      </summary>

      <div className="px-4 pb-4 pt-2 bg-secondary/30">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Control Requirement</h4>
            <p className="text-sm text-muted-foreground">
              {control?.description || "No description available"}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-2">Assessment Reasoning</h4>
            <p className="text-sm text-muted-foreground">
              {result.reasoning || "No reasoning provided"}
            </p>
          </div>
        </div>

        {result.evidence_refs && Array.isArray(result.evidence_refs) && result.evidence_refs.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Evidence References</h4>
            <div className="flex flex-wrap gap-2">
              {(result.evidence_refs as Array<{ reference?: string; type?: string }>).slice(0, 5).map((ref, i) => (
                <span
                  key={i}
                  className="text-xs bg-muted px-2 py-1 rounded"
                >
                  {ref.reference || ref.type || "Evidence"}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </details>
  );
}

function StatusIcon({ status }: { status: string }) {
  const icons: Record<string, { icon: React.ElementType; className: string }> = {
    compliant: { icon: CheckCircle2, className: "text-emerald-400" },
    partial: { icon: Clock, className: "text-amber-400" },
    gap: { icon: AlertTriangle, className: "text-rose-400" },
    unknown: { icon: HelpCircle, className: "text-muted-foreground" },
    not_applicable: { icon: HelpCircle, className: "text-muted-foreground" },
  };

  const config = icons[status] || icons.unknown;
  const Icon = config.icon;

  return <Icon className={cn("h-5 w-5 shrink-0", config.className)} />;
}

function ConfidenceBadge({ confidence }: { confidence: string | null }) {
  if (!confidence) return null;

  const colors: Record<string, string> = {
    high: "bg-emerald-500/10 text-emerald-400",
    medium: "bg-amber-500/10 text-amber-400",
    low: "bg-rose-500/10 text-rose-400",
  };

  return (
    <span className={cn("text-xs px-2 py-1 rounded", colors[confidence] || colors.medium)}>
      {confidence} confidence
    </span>
  );
}

