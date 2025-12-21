"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ClearAllEvidenceButtonProps {
  assessmentId: string;
  evidenceCount: number;
}

export function ClearAllEvidenceButton({
  assessmentId,
  evidenceCount,
}: ClearAllEvidenceButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (evidenceCount === 0) {
    return null;
  }

  const handleClearAll = async () => {
    setLoading(true);

    try {
      const supabase = createClient();

      // Get all evidence for this assessment
      const { data: evidence, error: fetchError } = await supabase
        .from("evidence")
        .select("id, file_path")
        .eq("assessment_id", assessmentId);

      if (fetchError) throw fetchError;

      if (evidence && evidence.length > 0) {
        // Delete from storage
        const filePaths = evidence.map((e) => e.file_path);
        await supabase.storage.from("evidence").remove(filePaths);

        // Delete from database
        const ids = evidence.map((e) => e.id);
        await supabase.from("evidence").delete().in("id", ids);
      }

      // Refresh the page
      router.refresh();
    } catch (error) {
      console.error("Clear all error:", error);
      alert("Failed to delete documents. Please try again.");
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/30 rounded-lg px-4 py-3">
        <AlertTriangle className="h-4 w-4 text-rose-400" />
        <span className="text-sm">Delete all {evidenceCount} files?</span>
        <button
          onClick={handleClearAll}
          disabled={loading}
          className="px-3 py-1 text-sm bg-rose-500 text-white rounded hover:bg-rose-600 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Yes, Delete All"}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={loading}
          className="px-3 py-1 text-sm bg-muted rounded hover:bg-muted/80 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="flex items-center gap-2 px-3 py-1.5 text-sm text-rose-400 hover:text-rose-300 border border-rose-500/30 rounded-lg hover:bg-rose-500/10 transition-colors"
    >
      <Trash2 className="h-4 w-4" />
      Clear All ({evidenceCount})
    </button>
  );
}

