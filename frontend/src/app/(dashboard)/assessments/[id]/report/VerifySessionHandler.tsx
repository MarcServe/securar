"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

export function VerifySessionHandler({ sessionId }: { sessionId: string | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<"idle" | "verifying" | "done" | "error">("idle");

  useEffect(() => {
    if (!sessionId || status !== "idle") return;

    setStatus("verifying");
    fetch("/api/stripe/verify-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .then((res) => {
        if (res.ok) {
          setStatus("done");
          router.replace(pathname);
          router.refresh();
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, [sessionId, pathname, router, status]);

  if (status === "verifying") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-8 shadow-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Confirming your purchase…</p>
        </div>
      </div>
    );
  }

  return null;
}
