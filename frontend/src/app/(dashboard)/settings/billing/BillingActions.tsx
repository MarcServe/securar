"use client";

import { useState } from "react";
import { ArrowRight, ExternalLink } from "lucide-react";

interface BillingActionsProps {
  isPro: boolean;
}

export function BillingActions({ isPro }: BillingActionsProps) {
  const [loading, setLoading] = useState<"upgrade" | "portal" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    setLoading("upgrade");
    setError(null);
    try {
      const res = await fetch("/api/stripe/create-subscription-session", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to start checkout");
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(null);
    }
  };

  const handlePortal = async () => {
    setLoading("portal");
    setError(null);
    try {
      const res = await fetch("/api/stripe/billing-portal", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to open billing portal");
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      {isPro ? (
        <button
          onClick={handlePortal}
          disabled={loading !== null}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border hover:bg-muted transition-colors font-medium text-sm disabled:opacity-60"
        >
          {loading === "portal" ? (
            <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <ExternalLink className="h-4 w-4" />
          )}
          {loading === "portal" ? "Opening…" : "Manage billing / cancel"}
        </button>
      ) : (
        <button
          onClick={handleUpgrade}
          disabled={loading !== null}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-primary/90 transition-all hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {loading === "upgrade" ? (
            <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
          {loading === "upgrade" ? "Redirecting…" : "Start 14-day free trial"}
        </button>
      )}
      {error && <p className="text-sm text-rose-400">{error}</p>}
    </div>
  );
}
