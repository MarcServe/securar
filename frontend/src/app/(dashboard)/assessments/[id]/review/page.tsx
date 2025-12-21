import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Edit3,
  AlertTriangle,
  Shield,
  MessageSquare,
} from "lucide-react";
import { ReviewCard } from "./ReviewCard";

export default async function ReviewPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Load assessment
  const { data: assessmentData, error } = await supabase
    .from("assessments")
    .select("*, organisations(*)")
    .eq("id", params.id)
    .single();

  if (error || !assessmentData) {
    notFound();
  }

  const assessment = assessmentData as { id: string };

  // Load control results that need review (low confidence or gaps)
  const { data: controlResultsData } = await supabase
    .from("control_results")
    .select("*, controls(*)")
    .eq("assessment_id", params.id)
    .or("confidence.eq.low,status.eq.gap,status.eq.partial")
    .order("confidence", { ascending: true });

  interface ReviewControlResult {
    id: string;
    status: string;
    reasoning: string | null;
    confidence: string | null;
    evidence_refs: unknown;
    controls: {
      id: string;
      control_code: string;
      title: string;
      description: string | null;
      domain: string;
    } | null;
  }

  const controlResults = controlResultsData as ReviewControlResult[] | null;

  // Load high severity risks
  const { data: risksData } = await supabase
    .from("risks")
    .select("*")
    .eq("assessment_id", params.id)
    .in("severity", ["critical", "high"])
    .limit(10);

  interface ReviewRisk {
    id: string;
    title: string;
    description: string | null;
    severity: string;
    recommendation: string | null;
  }

  const risks = risksData as ReviewRisk[] | null;

  const itemsForReview = [
    ...(controlResults || []).slice(0, 15),
  ];

  const riskItems = (risks || []).slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link
            href={`/assessments/${params.id}`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Assessment
          </Link>
          <h1 className="text-xl font-bold">Human Review Required</h1>
          <p className="text-muted-foreground">
            Review and confirm AI assessments before finalizing
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Instructions */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-amber-400 shrink-0" />
            <div>
              <h2 className="font-semibold text-amber-400 mb-2">
                Review Guidelines
              </h2>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Items below have low confidence scores or represent significant gaps</li>
                <li>• Review the AI reasoning and supporting evidence</li>
                <li>• Accept, modify, or override each assessment as appropriate</li>
                <li>• Your decisions are logged for audit purposes</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-amber-400">{itemsForReview.length}</p>
            <p className="text-sm text-muted-foreground">Controls to Review</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-rose-400">{riskItems.length}</p>
            <p className="text-sm text-muted-foreground">High-Risk Items</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">0</p>
            <p className="text-sm text-muted-foreground">Reviewed</p>
          </div>
        </div>

        {/* Control Reviews */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Control Assessments
          </h2>
          
          {itemsForReview.length > 0 ? (
            <div className="space-y-4">
              {itemsForReview.map((cr) => (
                <ReviewCard
                  key={cr.id}
                  controlResult={cr}
                  control={cr.controls}
                  assessmentId={params.id}
                />
              ))}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">All Clear</h3>
              <p className="text-muted-foreground">
                No control assessments require manual review at this time.
              </p>
            </div>
          )}
        </div>

        {/* Risk Reviews */}
        {riskItems.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-400" />
              High-Priority Risks
            </h2>
            <div className="bg-card border border-border rounded-xl divide-y divide-border">
              {riskItems.map((risk) => (
                <div key={risk.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${
                          risk.severity === "critical" 
                            ? "bg-rose-500/20 text-rose-400" 
                            : "bg-orange-500/20 text-orange-400"
                        }`}>
                          {risk.severity}
                        </span>
                        <span className="font-medium">{risk.title}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {risk.description}
                      </p>
                    </div>
                    <button className="text-muted-foreground hover:text-foreground">
                      <MessageSquare className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Complete Review Button */}
        <div className="flex justify-end">
          <Link
            href={`/assessments/${params.id}/report`}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Complete Review & View Report
          </Link>
        </div>
      </main>
    </div>
  );
}

