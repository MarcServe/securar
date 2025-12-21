import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, AlertTriangle, Clock, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function RisksPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Load assessment
  const { data: assessment, error: assessmentError } = await supabase
    .from("assessments")
    .select("*, organisations(*)")
    .eq("id", params.id)
    .single();

  if (assessmentError || !assessment) {
    notFound();
  }

  // Type the assessment
  const typedAssessment = assessment as {
    id: string;
    organisations: { name: string } | null;
  };

  // Load all risks
  const { data: risksData } = await supabase
    .from("risks")
    .select("*")
    .eq("assessment_id", params.id)
    .order("created_at", { ascending: true });

  const risks = risksData as Array<{
    id: string;
    title: string;
    description: string | null;
    severity: string;
    likelihood: string | null;
    impact: string | null;
    recommendation: string | null;
    remediation_timeframe: string | null;
    risk_references: unknown;
    recommendation_actions?: string[];
    recommendation_resources?: string[];
  }> | null;

  const org = typedAssessment.organisations;

  // Group risks by severity
  const criticalRisks = risks?.filter(r => r.severity === "critical") || [];
  const highRisks = risks?.filter(r => r.severity === "high") || [];
  const mediumRisks = risks?.filter(r => r.severity === "medium") || [];
  const lowRisks = risks?.filter(r => r.severity === "low") || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <Link
            href={`/assessments/${params.id}`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Assessment
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Risk Analysis</h1>
              <p className="text-muted-foreground">{org?.name}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-2xl font-bold">{risks?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Total Risks</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Risk Summary */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-card border border-rose-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-rose-500/20 rounded-lg p-2">
                <AlertTriangle className="h-4 w-4 text-rose-400" />
              </div>
              <span className="text-sm text-muted-foreground">Critical</span>
            </div>
            <p className="text-2xl font-bold text-rose-400">{criticalRisks.length}</p>
          </div>

          <div className="bg-card border border-orange-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-orange-500/20 rounded-lg p-2">
                <AlertTriangle className="h-4 w-4 text-orange-400" />
              </div>
              <span className="text-sm text-muted-foreground">High</span>
            </div>
            <p className="text-2xl font-bold text-orange-400">{highRisks.length}</p>
          </div>

          <div className="bg-card border border-amber-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-amber-500/20 rounded-lg p-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
              </div>
              <span className="text-sm text-muted-foreground">Medium</span>
            </div>
            <p className="text-2xl font-bold text-amber-400">{mediumRisks.length}</p>
          </div>

          <div className="bg-card border border-blue-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-blue-500/20 rounded-lg p-2">
                <Shield className="h-4 w-4 text-blue-400" />
              </div>
              <span className="text-sm text-muted-foreground">Low</span>
            </div>
            <p className="text-2xl font-bold text-blue-400">{lowRisks.length}</p>
          </div>
        </div>

        {/* Risk List */}
        {risks && risks.length > 0 ? (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-semibold">All Identified Risks</h2>
              <p className="text-sm text-muted-foreground">
                Prioritized by severity and business impact
              </p>
            </div>
            <div className="divide-y divide-border">
              {risks.map((risk) => (
                <div key={risk.id} className="p-6">
                  <div className="flex items-start gap-4">
                    <SeverityBadge severity={risk.severity} />
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{risk.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {risk.description}
                      </p>
                      
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Likelihood:</span>
                          <LikelihoodBadge likelihood={risk.likelihood} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Impact:</span>
                          <ImpactBadge impact={risk.impact} />
                        </div>
                      </div>

                      {(risk.recommendation || risk.recommendation_actions) && (
                        <div className="mt-4 bg-muted/50 rounded-lg p-4 space-y-3">
                          <div>
                            <p className="text-sm font-medium mb-1">Recommendation</p>
                            <p className="text-sm text-muted-foreground">
                              {risk.recommendation}
                            </p>
                          </div>
                          
                          {risk.recommendation_actions && risk.recommendation_actions.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-2">Action Steps:</p>
                              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                                {(risk.recommendation_actions as string[]).map((action, idx) => (
                                  <li key={idx} className="pl-1">{action}</li>
                                ))}
                              </ol>
                            </div>
                          )}
                          
                          {risk.recommendation_resources && (
                            <div className="pt-2 border-t border-border">
                              <p className="text-xs text-muted-foreground">
                                <span className="font-medium">Resources:</span> {risk.recommendation_resources}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm bg-muted px-3 py-1 rounded-full">
                      <Clock className="h-3 w-3" />
                      30-day
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <div className="bg-emerald-500/10 rounded-full p-4 inline-block mb-4">
              <Shield className="h-8 w-8 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No risks identified</h3>
            <p className="text-muted-foreground">
              Great news! No significant risks were identified in this assessment.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4">
          <Link
            href={`/assessments/${params.id}`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Assessment
          </Link>
          <Link
            href={`/assessments/${params.id}/controls`}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            View Controls
            <Shield className="h-4 w-4" />
          </Link>
        </div>
      </main>
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
    <span className={cn(
      "px-3 py-1 rounded-full text-xs font-medium uppercase border",
      config[severity] || config.medium
    )}>
      {severity}
    </span>
  );
}

function LikelihoodBadge({ likelihood }: { likelihood: string | null }) {
  if (!likelihood) return <span className="text-muted-foreground">Unknown</span>;
  
  const config: Record<string, string> = {
    high: "text-rose-400",
    medium: "text-amber-400",
    low: "text-emerald-400",
  };

  return (
    <span className={cn("font-medium capitalize", config[likelihood] || "text-muted-foreground")}>
      {likelihood}
    </span>
  );
}

function ImpactBadge({ impact }: { impact: string | null }) {
  if (!impact) return <span className="text-muted-foreground">Unknown</span>;
  
  const config: Record<string, string> = {
    high: "text-rose-400",
    medium: "text-amber-400",
    low: "text-emerald-400",
  };

  return (
    <span className={cn("font-medium capitalize", config[impact] || "text-muted-foreground")}>
      {impact}
    </span>
  );
}

