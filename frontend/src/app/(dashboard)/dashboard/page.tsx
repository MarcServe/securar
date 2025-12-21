import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Shield,
  Plus,
  FileText,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";

export default async function DashboardPage() {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }

  // Get user's organisation
  const { data: membershipData } = await supabase
    .from("memberships")
    .select("org_id, role, organisations(*)")
    .eq("user_id", user.id)
    .single();

  const membership = membershipData as {
    org_id: string;
    role: string;
    organisations: { id: string; name: string; industry: string | null; size_band: string | null } | null;
  } | null;

  // Get assessments for this org
  const { data: assessmentsData } = await supabase
    .from("assessments")
    .select("*")
    .eq("org_id", membership?.org_id || "")
    .order("created_at", { ascending: false })
    .limit(5);

  const assessments = assessmentsData as Array<{
    id: string;
    status: string;
    readiness_score: number | null;
    target_frameworks: string[] | null;
    created_at: string;
  }> | null;

  const org = membership?.organisations;

  // Calculate stats
  const completedCount = assessments?.filter(a => a.status === "completed").length || 0;
  const latestScore = assessments?.find(a => a.status === "completed")?.readiness_score;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="font-semibold">{org?.name || "Your Organisation"}</h1>
              <p className="text-sm text-muted-foreground">Security Dashboard</p>
            </div>
          </div>
          <Link
            href="/assessments/new"
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Assessment
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-primary/10 rounded-lg p-2">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Latest Score</span>
            </div>
            <p className="text-3xl font-bold">
              {latestScore !== undefined ? `${latestScore}%` : "—"}
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-emerald-500/10 rounded-lg p-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              </div>
              <span className="text-sm text-muted-foreground">Completed</span>
            </div>
            <p className="text-3xl font-bold">{completedCount}</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-amber-500/10 rounded-lg p-2">
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
              <span className="text-sm text-muted-foreground">In Progress</span>
            </div>
            <p className="text-3xl font-bold">
              {assessments?.filter(a => ["draft", "collecting", "analysing"].includes(a.status)).length || 0}
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-rose-500/10 rounded-lg p-2">
                <AlertTriangle className="h-5 w-5 text-rose-400" />
              </div>
              <span className="text-sm text-muted-foreground">Open Risks</span>
            </div>
            <p className="text-3xl font-bold">—</p>
          </div>
        </div>

        {/* Recent Assessments */}
        <div className="bg-card border border-border rounded-xl">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Assessments</h2>
            <Link
              href="/assessments"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </div>

          {assessments && assessments.length > 0 ? (
            <div className="divide-y divide-border">
              {assessments.map((assessment) => (
                <Link
                  key={assessment.id}
                  href={`/assessments/${assessment.id}`}
                  className="flex items-center justify-between p-6 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 rounded-lg p-3">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {assessment.target_frameworks?.join(", ").toUpperCase() || "ISO 27001"} Assessment
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Created {new Date(assessment.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusBadge status={assessment.status} />
                    {assessment.readiness_score !== null && (
                      <span className="font-semibold">{assessment.readiness_score}%</span>
                    )}
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="bg-primary/10 rounded-full p-4 inline-block mb-4">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No assessments yet</h3>
              <p className="text-muted-foreground mb-6">
                Start your first security assessment to see your compliance readiness.
              </p>
              <Link
                href="/assessments/new"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Start Assessment
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <Link
            href="/assessments/new"
            className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors group"
          >
            <div className="bg-primary/10 rounded-lg p-3 inline-block mb-4 group-hover:bg-primary/20 transition-colors">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-1">New Assessment</h3>
            <p className="text-sm text-muted-foreground">
              Start a new ISO 27001 readiness assessment
            </p>
          </Link>

          <Link
            href={assessments && assessments.length > 0 
              ? `/assessments/${assessments[0].id}/evidence` 
              : "/assessments/new"}
            className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors group"
          >
            <div className="bg-emerald-500/10 rounded-lg p-3 inline-block mb-4 group-hover:bg-emerald-500/20 transition-colors">
              <FileText className="h-6 w-6 text-emerald-400" />
            </div>
            <h3 className="font-semibold mb-1">Upload Evidence</h3>
            <p className="text-sm text-muted-foreground">
              {assessments && assessments.length > 0 
                ? "Add policies, procedures, and documentation"
                : "Create an assessment first to upload evidence"}
            </p>
          </Link>

          <Link
            href="/reports"
            className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors group"
          >
            <div className="bg-amber-500/10 rounded-lg p-3 inline-block mb-4 group-hover:bg-amber-500/20 transition-colors">
              <BarChart3 className="h-6 w-6 text-amber-400" />
            </div>
            <h3 className="font-semibold mb-1">View Reports</h3>
            <p className="text-sm text-muted-foreground">
              Review your assessment reports and roadmaps
            </p>
          </Link>
        </div>
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
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

