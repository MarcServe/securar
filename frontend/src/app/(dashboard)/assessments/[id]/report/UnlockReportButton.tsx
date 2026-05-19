"use client";

import { useState } from "react";
import { Loader2, Lock, Zap } from "lucide-react";

export function UnlockReportButton({ assessmentId }: { assessmentId: string }) {
  const [loading, setLoading] = useState<"unlock" | "pro" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(endpoint: string, body?: object) {
    setError(null);
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }
    if (data.url) {
      window.location.href = data.url;
      return;
    }
    setError("No checkout URL returned");
  }

  async function handleUnlock() {
    setLoading("unlock");
    try {
      await startCheckout("/api/stripe/create-checkout-session", { assessmentId });
    } catch {
      setError("Failed to start checkout");
    } finally {
      setLoading(null);
    }
  }

  async function handleUpgradePro() {
    setLoading("pro");
    try {
      await startCheckout("/api/stripe/create-subscription-session");
    } catch {
      setError("Failed to start checkout");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center gap-2 justify-end">
        <button
          type="button"
          onClick={handleUpgradePro}
          disabled={loading !== null}
          className="inline-flex items-center gap-2 rounded-lg border border-primary px-4 py-2 font-medium text-primary transition hover:bg-primary/10 disabled:opacity-70"
        >
          {loading === "pro" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Zap className="h-4 w-4" />
          )}
          {loading === "pro" ? "Redirecting…" : "Start Pro trial"}
        </button>
        <button
          type="button"
          onClick={handleUnlock}
          disabled={loading !== null}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground shadow-lg transition hover:bg-primary/90 disabled:opacity-70"
        >
          {loading === "unlock" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Lock className="h-4 w-4" />
          )}
          {loading === "unlock" ? "Redirecting…" : "Unlock this report"}
        </button>
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
