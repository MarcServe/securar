"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  Edit3,
  ChevronDown,
  Loader2,
  HelpCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface ReviewCardProps {
  controlResult: {
    id: string;
    status: string;
    reasoning: string | null;
    confidence: string | null;
    evidence_refs: unknown;
  };
  control: {
    id: string;
    control_code: string;
    title: string;
    description: string | null;
  } | null;
  assessmentId: string;
}

type ReviewAction = "accept" | "modify" | "override";

export function ReviewCard({ controlResult, control, assessmentId }: ReviewCardProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [action, setAction] = useState<ReviewAction | null>(null);
  const [saving, setSaving] = useState(false);
  const [modifiedStatus, setModifiedStatus] = useState(controlResult.status);
  const [modifiedReasoning, setModifiedReasoning] = useState(controlResult.reasoning || "");
  const [overrideReason, setOverrideReason] = useState("");
  const [saved, setSaved] = useState(false);

  const handleAction = async (selectedAction: ReviewAction) => {
    setAction(selectedAction);
    
    if (selectedAction === "accept") {
      await saveReview(selectedAction, controlResult.status, controlResult.reasoning || "", "");
    }
  };

  const saveReview = async (
    reviewAction: ReviewAction,
    status: string,
    reasoning: string,
    overrideNote: string
  ) => {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    try {
      // Update control result
      await supabase
        .from("control_results")
        .update({
          status,
          reasoning,
          confidence: "high", // Human review = high confidence
          evidence_refs: [
            ...(Array.isArray(controlResult.evidence_refs) ? controlResult.evidence_refs : []),
            {
              type: "human_review",
              reference: `Review by ${user?.email}`,
              action: reviewAction,
              note: overrideNote || undefined,
              timestamp: new Date().toISOString(),
            },
          ],
        })
        .eq("id", controlResult.id);

      // Log the review action
      await supabase.from("audit_logs").insert({
        action: `control_${reviewAction}`,
        entity_type: "control_result",
        entity_id: controlResult.id,
        actor_user_id: user?.id,
        meta: {
          control_code: control?.control_code,
          original_status: controlResult.status,
          new_status: status,
          override_reason: overrideNote || null,
        },
      });

      setSaved(true);
      router.refresh();
    } catch (error) {
      console.error("Failed to save review:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitModification = () => {
    saveReview("modify", modifiedStatus, modifiedReasoning, "");
  };

  const handleSubmitOverride = () => {
    saveReview("override", modifiedStatus, overrideReason, overrideReason);
  };

  if (saved) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-4">
        <CheckCircle2 className="h-6 w-6 text-emerald-400" />
        <div>
          <p className="font-medium text-emerald-400">Review Saved</p>
          <p className="text-sm text-muted-foreground">
            {control?.control_code} - {control?.title}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div
        className="p-4 cursor-pointer hover:bg-secondary/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <StatusIcon status={controlResult.status} />
          <div className="flex-1">
            <p className="font-medium">
              <span className="text-primary">{control?.control_code}</span>
              {" - "}
              {control?.title}
            </p>
            <p className="text-sm text-muted-foreground">
              {controlResult.confidence === "low" && "Low confidence - "}
              {controlResult.reasoning?.substring(0, 100)}...
            </p>
          </div>
          <ConfidenceBadge confidence={controlResult.confidence} />
          <ChevronDown
            className={cn(
              "h-5 w-5 text-muted-foreground transition-transform",
              expanded && "rotate-180"
            )}
          />
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-border p-4 bg-secondary/30">
          {/* Control Details */}
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">Control Requirement</h4>
            <p className="text-sm text-muted-foreground">
              {control?.description || "No description available"}
            </p>
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">AI Assessment</h4>
            <p className="text-sm text-muted-foreground">
              {controlResult.reasoning}
            </p>
          </div>

          {/* Action Buttons */}
          {!action && (
            <div className="flex gap-3 pt-4 border-t border-border">
              <button
                onClick={() => handleAction("accept")}
                disabled={saving}
                className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-lg font-medium hover:bg-emerald-500/20 transition-colors"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Accept
              </button>
              <button
                onClick={() => handleAction("modify")}
                className="flex items-center gap-2 bg-amber-500/10 text-amber-400 border border-amber-500/30 px-4 py-2 rounded-lg font-medium hover:bg-amber-500/20 transition-colors"
              >
                <Edit3 className="h-4 w-4" />
                Modify
              </button>
              <button
                onClick={() => handleAction("override")}
                className="flex items-center gap-2 bg-rose-500/10 text-rose-400 border border-rose-500/30 px-4 py-2 rounded-lg font-medium hover:bg-rose-500/20 transition-colors"
              >
                <XCircle className="h-4 w-4" />
                Override
              </button>
            </div>
          )}

          {/* Modify Form */}
          {action === "modify" && (
            <div className="pt-4 border-t border-border space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <select
                  value={modifiedStatus}
                  onChange={(e) => setModifiedStatus(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2"
                >
                  <option value="compliant">Compliant</option>
                  <option value="partial">Partial</option>
                  <option value="gap">Gap</option>
                  <option value="not_applicable">Not Applicable</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Reasoning</label>
                <textarea
                  value={modifiedReasoning}
                  onChange={(e) => setModifiedReasoning(e.target.value)}
                  rows={3}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSubmitModification}
                  disabled={saving}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Save Changes
                </button>
                <button
                  onClick={() => setAction(null)}
                  className="px-4 py-2 rounded-lg font-medium hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Override Form */}
          {action === "override" && (
            <div className="pt-4 border-t border-border space-y-4">
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4">
                <p className="text-sm text-rose-400">
                  Override will replace the AI assessment with your determination.
                  Please provide a reason for audit purposes.
                </p>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">New Status</label>
                <select
                  value={modifiedStatus}
                  onChange={(e) => setModifiedStatus(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2"
                >
                  <option value="compliant">Compliant</option>
                  <option value="partial">Partial</option>
                  <option value="gap">Gap</option>
                  <option value="not_applicable">Not Applicable</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Override Reason (Required)
                </label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  rows={3}
                  placeholder="Explain why the AI assessment is incorrect..."
                  className="w-full bg-background border border-border rounded-lg px-3 py-2"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSubmitOverride}
                  disabled={saving || !overrideReason}
                  className="flex items-center gap-2 bg-rose-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-rose-600 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Confirm Override
                </button>
                <button
                  onClick={() => setAction(null)}
                  className="px-4 py-2 rounded-lg font-medium hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  const icons: Record<string, { icon: React.ElementType; className: string }> = {
    compliant: { icon: CheckCircle2, className: "text-emerald-400" },
    partial: { icon: Clock, className: "text-amber-400" },
    gap: { icon: AlertTriangle, className: "text-rose-400" },
    unknown: { icon: HelpCircle, className: "text-muted-foreground" },
  };

  const config = icons[status] || icons.unknown;
  const Icon = config.icon;

  return <Icon className={cn("h-5 w-5", config.className)} />;
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
      {confidence}
    </span>
  );
}

