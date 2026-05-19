"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight, Zap, Shield } from "lucide-react";

const FREE_FEATURES = [
  "Unlimited assessments",
  "Evidence upload",
  "Questionnaire-based scoring",
  "ISO 27001 control mapping",
  "Report summary only",
];

const PRO_FEATURES = [
  "Everything in Free",
  "AI-powered Claude analysis",
  "Full report unlock on all assessments",
  "PDF download",
  "30/60/90-day remediation roadmap",
  "Priority support",
];

interface PlanChooserProps {
  trialDays?: number;
  /** Where to send the user after choosing free */
  freeRedirect?: string;
  showTestHint?: boolean;
}

export function PlanChooser({
  trialDays = 14,
  freeRedirect = "/dashboard",
  showTestHint = true,
}: PlanChooserProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"trial" | "free" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStartTrial = async () => {
    setLoading("trial");
    setError(null);
    try {
      // Ensure org exists before Stripe checkout
      const setup = await fetch("/api/subscription/setup-org", { method: "POST" });
      if (!setup.ok) {
        const setupData = await setup.json();
        setError(setupData.error || "Could not set up your account");
        return;
      }

      const res = await fetch("/api/stripe/create-subscription-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "choose-plan" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to start checkout");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(null);
    }
  };

  const handleContinueFree = async () => {
    setLoading("free");
    setError(null);
    try {
      await fetch("/api/subscription/continue-free", { method: "POST" });
      router.push(freeRedirect);
      router.refresh();
    } catch {
      setError("Something went wrong — please try again");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-4">
          <Shield className="h-4 w-4" />
          Choose your plan
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-3">
          Start with a free trial or continue on Free
        </h1>
        <p className="text-muted-foreground text-lg">
          Try Pro free for {trialDays} days — no charge until the trial ends. Or stay on
          Free and upgrade anytime.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Free */}
        <div className="glass border border-border/50 rounded-2xl p-8 flex flex-col">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-1">Free</h2>
            <div className="flex items-end gap-1">
              <span className="text-4xl font-bold">£0</span>
              <span className="text-muted-foreground mb-1">/ month</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Full assessment workflow with summary reports.
            </p>
          </div>

          <ul className="space-y-3 flex-1 mb-8">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <span className="text-muted-foreground">{f}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={handleContinueFree}
            disabled={loading !== null}
            className="w-full flex items-center justify-center gap-2 border border-border rounded-lg px-6 py-3 font-semibold hover:bg-muted transition-colors disabled:opacity-60"
          >
            {loading === "free" ? (
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : null}
            {loading === "free" ? "Continuing…" : "Continue with Free"}
          </button>
        </div>

        {/* Pro trial */}
        <div className="relative glass border-2 border-primary rounded-2xl p-8 flex flex-col shadow-lg shadow-primary/10">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold px-4 py-1.5 rounded-full">
              <Zap className="h-3.5 w-3.5" />
              {trialDays}-day free trial
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-1">Pro</h2>
            <div className="flex items-end gap-1">
              <span className="text-4xl font-bold">£49</span>
              <span className="text-muted-foreground mb-1">/ month</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Free for {trialDays} days, then £49/mo. Cancel anytime.
            </p>
          </div>

          <ul className="space-y-3 flex-1 mb-8">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={handleStartTrial}
            disabled={loading !== null}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-all hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
          >
            {loading === "trial" ? (
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            {loading === "trial" ? "Redirecting to checkout…" : `Start ${trialDays}-day free trial`}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-rose-400 text-center" role="alert">
          {error}
        </p>
      )}

      {showTestHint && (
        <div className="max-w-2xl mx-auto glass border border-border/50 rounded-xl px-5 py-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Testing subscriptions</p>
          <p>
            Use Stripe test card{" "}
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">4242 4242 4242 4242</code>{" "}
            with any future expiry and CVC. Your Pro trial activates immediately after checkout.
          </p>
        </div>
      )}
    </div>
  );
}
