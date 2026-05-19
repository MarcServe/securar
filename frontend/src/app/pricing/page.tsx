"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Shield, CheckCircle2, ArrowRight, Zap, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_TRIAL_DAYS } from "@/lib/trial-config";

function UpgradeButton() {
  const [authState, setAuthState] = useState<"loading" | "guest" | "user">("loading");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthState(user ? "user" : "guest");
    });
  }, []);

  if (authState === "loading") {
    return (
      <button
        disabled
        className="w-full flex items-center justify-center gap-2 bg-primary/60 text-primary-foreground px-6 py-3 rounded-lg font-semibold"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading…
      </button>
    );
  }

  if (authState === "guest") {
    return (
      <div className="space-y-2">
        <Link
          href="/signup?next=/choose-plan"
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-all hover:scale-105"
        >
          Create account to start trial
          <ArrowRight className="h-4 w-4" />
        </Link>
        <p className="text-xs text-muted-foreground text-center">
          Already have an account?{" "}
          <Link href="/login?next=/choose-plan" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <Link
      href="/choose-plan"
      className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-all hover:scale-105"
    >
      Start {DEFAULT_TRIAL_DAYS}-day free trial
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

const FREE_FEATURES = [
  "Unlimited assessments",
  "Evidence document upload",
  "Questionnaire-based scoring",
  "ISO 27001 control mapping",
  "Report summary (metrics only)",
  "Gap identification",
];

const PRO_FEATURES = [
  "Everything in Free",
  "AI-powered analysis (Claude)",
  "Full report unlock included",
  "PDF download",
  "30/60/90-day remediation roadmap",
  "Priority support",
];

export default function PricingPage() {
  return (
    <div className="min-h-screen animated-gradient">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Securar</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/pricing"
              className="text-foreground font-medium transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-12 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-muted-foreground text-lg">
            Start free. Upgrade when you need AI-powered analysis and full reports.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="pb-24 px-6">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">

          {/* Free Plan */}
          <div className="glass border border-border/50 rounded-2xl p-8 flex flex-col">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-1">Free</h2>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-bold">£0</span>
                <span className="text-muted-foreground mb-1">/ month</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Great for teams getting started with compliance readiness.
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

            <Link
              href="/signup"
              className="w-full flex items-center justify-center gap-2 border border-border rounded-lg px-6 py-3 font-semibold hover:bg-muted transition-colors"
            >
              Get started free
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="relative glass border-2 border-primary rounded-2xl p-8 flex flex-col shadow-lg shadow-primary/10">
            {/* Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold px-4 py-1.5 rounded-full">
                <Zap className="h-3.5 w-3.5" />
                Most Popular
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-1">Pro</h2>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-bold">£49</span>
                <span className="text-muted-foreground mb-1">/ month</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Full AI analysis, complete reports, and audit-ready output.
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

            <UpgradeButton />
          </div>
        </div>

        {/* Reassurance */}
        <div className="max-w-2xl mx-auto mt-12 text-center text-sm text-muted-foreground space-y-2">
          <p>All plans include unlimited assessments and evidence uploads.</p>
          <p>
            Cancel anytime from your billing dashboard — no questions asked.
            Payments processed securely by{" "}
            <span className="text-foreground font-medium">Stripe</span>.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">Securar</span>
          </div>
          <p className="text-xs text-muted-foreground">
            AI-assisted security readiness. Not certification.
          </p>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
