"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface BillingSyncProps {
  /** Re-fetch billing state from Stripe when checkout redirect still shows exploration trial. */
  needsSync: boolean;
}

export function BillingSync({ needsSync }: BillingSyncProps) {
  const router = useRouter();
  const attempted = useRef(false);

  useEffect(() => {
    if (!needsSync || attempted.current) return;
    attempted.current = true;

    (async () => {
      try {
        const res = await fetch("/api/stripe/sync-subscription", { method: "POST" });
        const data = await res.json();
        if (res.ok && data.synced) {
          router.replace("/settings/billing?subscribed=true");
          router.refresh();
        }
      } catch {
        // Page still renders; user can refresh manually
      }
    })();
  }, [needsSync, router]);

  if (!needsSync) return null;

  return (
    <p className="text-sm text-muted-foreground animate-pulse">
      Confirming your subscription with Stripe…
    </p>
  );
}
