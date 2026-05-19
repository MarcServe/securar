"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface BillingSyncProps {
  /** Attempt Stripe sync while the page still shows an exploration trial. */
  needsSync: boolean;
}

export function BillingSync({ needsSync }: BillingSyncProps) {
  const router = useRouter();
  const attempts = useRef(0);

  useEffect(() => {
    if (!needsSync) return;

    let cancelled = false;

    const run = async () => {
      while (attempts.current < 3 && !cancelled) {
        attempts.current += 1;
        try {
          const res = await fetch("/api/stripe/sync-subscription", { method: "POST" });
          const data = await res.json();
          if (!cancelled && res.ok && data.synced) {
            router.replace("/settings/billing?subscribed=true");
            router.refresh();
            return;
          }
        } catch {
          // retry
        }
        if (attempts.current < 3 && !cancelled) {
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [needsSync, router]);

  if (!needsSync) return null;

  return (
    <p className="text-sm text-muted-foreground animate-pulse">
      Confirming your subscription with Stripe…
    </p>
  );
}
