"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface RunAssessmentButtonProps {
  assessmentId: string;
  variant?: "step" | "card" | "button";
  step?: number;
  title?: string;
  description?: string;
  label?: string;
  disabled?: boolean;
  completed?: boolean;
}

export function RunAssessmentButton({
  assessmentId,
  variant = "button",
  step,
  title,
  description,
  label,
  disabled,
  completed,
}: RunAssessmentButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    setLoading(true);
    setError(null);

    try {
      // Call the Node.js backend directly
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
      
      const response = await fetch(`${backendUrl}/assessments/${assessmentId}/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "Analysis failed");
      }

      // Refresh the page to show results
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run analysis");
    } finally {
      setLoading(false);
    }
  };

  if (variant === "step") {
    return (
      <button
        onClick={handleRun}
        disabled={disabled || loading}
        className={cn(
          "flex items-start gap-4 p-4 rounded-xl border transition-all text-left w-full",
          completed
            ? "border-emerald-500/30 bg-emerald-500/5"
            : disabled || loading
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
          {error && <p className="text-sm text-destructive mt-1">{error}</p>}
        </div>
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : (
          <Play className={cn("h-5 w-5", completed ? "text-emerald-400" : "text-muted-foreground")} />
        )}
      </button>
    );
  }

  if (variant === "card") {
    return (
      <button
        onClick={handleRun}
        disabled={loading}
        className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors text-left w-full"
      >
        <div className="bg-amber-500/10 rounded-lg p-3 inline-block mb-4">
          {loading ? (
            <Loader2 className="h-6 w-6 text-amber-400 animate-spin" />
          ) : (
            <RefreshCw className="h-6 w-6 text-amber-400" />
          )}
        </div>
        <h3 className="font-semibold mb-1">{label || "Run Analysis"}</h3>
        <p className="text-sm text-muted-foreground">
          {description || "Process questionnaire and evidence"}
        </p>
        {error && <p className="text-sm text-destructive mt-2">{error}</p>}
      </button>
    );
  }

  return (
    <button
      onClick={handleRun}
      disabled={disabled || loading}
      className={cn(
        "flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors",
        (disabled || loading) && "opacity-50 cursor-not-allowed"
      )}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Running...
        </>
      ) : (
        <>
          <Play className="h-4 w-4" />
          {label || "Run Analysis"}
        </>
      )}
    </button>
  );
}

