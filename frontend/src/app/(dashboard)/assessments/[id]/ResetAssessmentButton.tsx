"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Loader2, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ResetAssessmentButtonProps {
  assessmentId: string;
}

export function ResetAssessmentButton({ assessmentId }: ResetAssessmentButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleReset = async () => {
    setLoading(true);

    try {
      const supabase = createClient();

      // Delete control results
      await supabase
        .from("control_results")
        .delete()
        .eq("assessment_id", assessmentId);

      // Delete risks
      await supabase
        .from("risks")
        .delete()
        .eq("assessment_id", assessmentId);

      // Delete reports
      await supabase
        .from("reports")
        .delete()
        .eq("assessment_id", assessmentId);

      // Reset assessment status and score
      await supabase
        .from("assessments")
        .update({
          status: "draft",
          readiness_score: null,
          score_breakdown: {},
        })
        .eq("id", assessmentId);

      // Refresh the page
      router.refresh();
    } catch (error) {
      console.error("Reset error:", error);
      alert("Failed to reset assessment. Please try again.");
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-rose-400">Reset Assessment?</p>
            <p className="text-sm text-muted-foreground mt-1">
              This will delete all control results, risks, and reports. Evidence documents will be kept.
              You can then re-run the analysis with updated documents.
            </p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleReset}
                disabled={loading}
                className="px-4 py-2 text-sm bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  "Yes, Reset"
                )}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                className="px-4 py-2 text-sm bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:border-rose-500/50 hover:text-rose-400 transition-colors"
    >
      <RotateCcw className="h-4 w-4" />
      Reset & Re-analyze
    </button>
  );
}

