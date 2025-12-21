"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface DeleteEvidenceButtonProps {
  evidenceId: string;
  filePath: string;
  fileName: string;
}

export function DeleteEvidenceButton({
  evidenceId,
  filePath,
  fileName,
}: DeleteEvidenceButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setLoading(true);

    try {
      const supabase = createClient();

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("evidence")
        .remove([filePath]);

      if (storageError) {
        console.error("Storage delete error:", storageError);
        // Continue anyway - the record should still be deleted
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from("evidence")
        .delete()
        .eq("id", evidenceId);

      if (dbError) {
        throw dbError;
      }

      // Refresh the page
      router.refresh();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete document. Please try again.");
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Delete?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-2 py-1 text-xs bg-rose-500/20 text-rose-400 rounded hover:bg-rose-500/30 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Yes"}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={loading}
          className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded hover:bg-muted/80 transition-colors"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="p-2 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
      title={`Delete ${fileName}`}
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

