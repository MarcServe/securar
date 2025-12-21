import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  FileText,
  Download,
  ArrowRight,
  Calendar,
  BarChart3,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default async function ReportsPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get user's organisation
  const { data: membershipData } = await supabase
    .from("memberships")
    .select("org_id, organisations(*)")
    .eq("user_id", user.id)
    .single();

  const membership = membershipData as {
    org_id: string;
    organisations: { name: string } | null;
  } | null;

  const orgId = membership?.org_id;

  // Get all reports for this org
  const { data: reportsData } = await supabase
    .from("reports")
    .select("*, assessments(*)")
    .eq("org_id", orgId || "")
    .order("generated_at", { ascending: false });

  const reports = reportsData as Array<{
    id: string;
    generated_at: string;
    summary: Record<string, unknown> | null;
    assessments: { target_frameworks: string[] | null; readiness_score: number | null; id: string; status: string } | null;
  }> | null;

  const org = membership?.organisations;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Reports</h1>
              <p className="text-sm text-muted-foreground">{org?.name}</p>
            </div>
          </div>
          <Link
            href="/assessments/new"
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            New Assessment
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Reports List */}
        <div className="bg-card border border-border rounded-xl">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold">Generated Reports</h2>
            <p className="text-sm text-muted-foreground">
              All security assessment reports for your organisation
            </p>
          </div>

          {reports && reports.length > 0 ? (
            <div className="divide-y divide-border">
              {reports.map((report) => {
                const assessment = report.assessments as {
                  id: string;
                  target_frameworks: string[];
                  readiness_score: number | null;
                  status: string;
                } | null;
                const summary = report.summary as {
                  scores?: { overall?: number };
                  organisation?: { name?: string };
                } | null;

                return (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-6 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 rounded-lg p-3">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {assessment?.target_frameworks?.join(", ").toUpperCase() || "ISO 27001"} Assessment Report
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(report.generated_at).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          {summary?.scores?.overall !== undefined && (
                            <span className="flex items-center gap-1">
                              <BarChart3 className="h-3 w-3" />
                              Score: {summary.scores.overall}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {assessment?.readiness_score !== null && (
                        <div className="text-right mr-4">
                          <span className="text-lg font-semibold">
                            {assessment?.readiness_score}%
                          </span>
                          <p className="text-xs text-muted-foreground">Readiness</p>
                        </div>
                      )}
                      <Link
                        href={`/assessments/${assessment?.id}/report`}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors"
                      >
                        View
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                      <a
                        href={`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"}/assessments/${assessment?.id}/report/html`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        PDF
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="bg-primary/10 rounded-full p-4 inline-block mb-4">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No reports yet</h3>
              <p className="text-muted-foreground mb-6">
                Complete an assessment to generate your first security report.
              </p>
              <Link
                href="/assessments"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                <Shield className="h-4 w-4" />
                View Assessments
              </Link>
            </div>
          )}
        </div>

        {/* Back to Dashboard */}
        <div className="mt-8">
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}

