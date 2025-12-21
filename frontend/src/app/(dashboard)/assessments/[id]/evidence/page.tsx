import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, ArrowRight, FileText, Image, FileSpreadsheet, File } from "lucide-react";
import { EvidenceUploader } from "./EvidenceUploader";
import { DeleteEvidenceButton } from "./DeleteEvidenceButton";
import { ClearAllEvidenceButton } from "./ClearAllEvidenceButton";
import { formatDate } from "@/lib/utils";

export default async function EvidencePage({
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

  // Load existing evidence
  const { data: evidence } = await supabase
    .from("evidence")
    .select("*")
    .eq("assessment_id", params.id)
    .order("created_at", { ascending: false });

  const org = assessment.organisations as { id: string } | null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link
            href={`/assessments/${params.id}`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Assessment
          </Link>
          <h1 className="text-xl font-bold">Evidence & Documents</h1>
          <p className="text-muted-foreground">
            Upload policies, procedures, and other documentation
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Upload Zone */}
        <EvidenceUploader
          assessmentId={params.id}
          orgId={org?.id || ""}
        />

        {/* Evidence List */}
        <div className="bg-card border border-border rounded-xl">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Uploaded Documents</h2>
              <p className="text-sm text-muted-foreground">
                {evidence?.length || 0} file(s) uploaded
              </p>
            </div>
            <ClearAllEvidenceButton 
              assessmentId={params.id} 
              evidenceCount={evidence?.length || 0} 
            />
          </div>

          {evidence && evidence.length > 0 ? (
            <div className="divide-y divide-border">
              {evidence.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors"
                >
                  <div className="bg-muted rounded-lg p-3">
                    <FileIcon type={file.file_type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.file_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Uploaded {formatDate(file.created_at)}
                    </p>
                  </div>
                  <StatusBadge status={file.status} />
                  <DeleteEvidenceButton
                    evidenceId={file.id}
                    filePath={file.file_path}
                    fileName={file.file_name}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="bg-muted rounded-full p-4 inline-block mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
              <p className="text-muted-foreground">
                Upload your security policies and procedures to improve assessment accuracy.
              </p>
            </div>
          )}
        </div>

        {/* Guidance */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4">What to upload</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p className="font-medium text-primary">Recommended documents:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Information Security Policy</li>
                <li>• Acceptable Use Policy</li>
                <li>• Access Control Policy</li>
                <li>• Incident Response Plan</li>
                <li>• Business Continuity Plan</li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-primary">Also helpful:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Network diagrams</li>
                <li>• Asset inventories</li>
                <li>• Training records</li>
                <li>• Risk assessments</li>
                <li>• Audit reports</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4">
          <Link
            href={`/assessments/${params.id}/questionnaire`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Questionnaire
          </Link>
          <Link
            href={`/assessments/${params.id}`}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Continue to Assessment
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}

function FileIcon({ type }: { type: string | null }) {
  switch (type?.toLowerCase()) {
    case "pdf":
      return <FileText className="h-5 w-5 text-rose-400" />;
    case "png":
    case "jpg":
    case "jpeg":
      return <Image className="h-5 w-5 text-blue-400" />;
    case "csv":
    case "xlsx":
      return <FileSpreadsheet className="h-5 w-5 text-emerald-400" />;
    default:
      return <File className="h-5 w-5 text-muted-foreground" />;
  }
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    uploaded: { label: "Uploaded", className: "bg-gray-500/20 text-gray-400" },
    parsing: { label: "Processing", className: "bg-blue-500/20 text-blue-400" },
    parsed: { label: "Analyzed", className: "bg-emerald-500/20 text-emerald-400" },
    failed: { label: "Failed", className: "bg-rose-500/20 text-rose-400" },
  };

  const { label, className } = config[status] || config.uploaded;

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

