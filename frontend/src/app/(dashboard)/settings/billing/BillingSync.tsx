"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

interface BillingSyncProps {
  needsSync: boolean;
}

async function callSyncApi(): Promise<{ synced: boolean; reason?: string }> {
  const res = await fetch("/api/stripe/sync-subscription", { method: "POST" });
  const data = await res.json();
  if (res.ok && data.synced) return { synced: true };
  return { synced: false, reason: data.reason || "Could not find your Stripe subscription" };
}

export function BillingSync({ needsSync }: BillingSyncProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "syncing" | "failed">("idle");
  const [reason, setReason] = useState<string | null>(null);
  const autoStarted = useRef(false);

  const runSync = useCallback(async () => {
    setStatus("syncing");
    setReason(null);
    try {
      const result = await callSyncApi();
      if (result.synced) {
        router.replace("/settings/billing?subscribed=true");
        router.refresh();
        return;
      }
      setReason(result.reason ?? null);
      setStatus("failed");
    } catch {
      setReason("Network error — please try again");
      setStatus("failed");
    }
  }, [router]);

  useEffect(() => {
    if (!needsSync || autoStarted.current) return;
    autoStarted.current = true;

    let cancelled = false;

    (async () => {
      setStatus("syncing");
      for (let attempt = 0; attempt < 3 && !cancelled; attempt++) {
        try {
          const result = await callSyncApi();
          if (cancelled) return;
          if (result.synced) {
            router.replace("/settings/billing?subscribed=true");
            router.refresh();
            return;
          }
          if (attempt === 2) {
            setReason(result.reason ?? null);
            setStatus("failed");
          } else {
            await new Promise((r) => setTimeout(r, 2000));
          }
        } catch {
          if (attempt === 2 && !cancelled) {
            setReason("Network error — please try again");
            setStatus("failed");
          } else if (!cancelled) {
            await new Promise((r) => setTimeout(r, 2000));
          }
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [needsSync, router]);

  if (!needsSync || status === "idle") return null;

  if (status === "syncing") {
    return (
      <p className="text-sm text-muted-foreground animate-pulse">
        Confirming your subscription with Stripe…
      </p>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
      <p className="text-sm text-amber-200 flex-1">
        We couldn&apos;t link your payment automatically
        {reason ? `: ${reason}` : ""}. Check that Vercel uses the same Stripe
        mode (test/live) as checkout, then retry.
      </p>
      <button
        type="button"
        onClick={() => void runSync()}
        className="inline-flex items-center gap-2 shrink-0 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
      >
        <RefreshCw className="h-4 w-4" />
        Retry sync
      </button>
    </div>
  );
}
