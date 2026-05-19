import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrgSubscription, isPro as checkIsPro } from "@/lib/subscription";
import { BillingActions } from "./BillingActions";
import { CheckCircle2, AlertTriangle, Crown } from "lucide-react";

interface PageProps {
  searchParams: { subscribed?: string };
}

export default async function BillingPage({ searchParams }: PageProps) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Find the user's org
  const { data: membershipData } = await supabase
    .from("memberships")
    .select("org_id, role, organisations(name)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  const membership = membershipData as {
    org_id: string;
    role: string;
    organisations: { name: string } | null;
  } | null;

  const orgId = membership?.org_id;
  const orgName = membership?.organisations?.name ?? "Your Organisation";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subscription = orgId ? await getOrgSubscription(supabase as any, orgId) : null;
  const pro = checkIsPro(subscription);

  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const justSubscribed = searchParams.subscribed === "true";

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      {/* Success banner */}
      {justSubscribed && (
        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-5 py-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <div>
            <p className="font-semibold text-emerald-400">Welcome to Pro!</p>
            <p className="text-sm text-muted-foreground">
              Your subscription is now active. All Pro features are unlocked.
            </p>
          </div>
        </div>
      )}

      {/* Current plan card */}
      <div className="glass border border-border/50 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Billing</h1>
          <span className="text-sm text-muted-foreground">{orgName}</span>
        </div>

        <div className="flex items-center gap-3">
          {pro ? (
            <>
              <Crown className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">Pro Plan</span>
              <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded-full">
                Active
              </span>
            </>
          ) : (
            <>
              <span className="text-lg font-semibold">Free Plan</span>
              <span className="bg-muted text-muted-foreground text-xs font-medium px-2 py-0.5 rounded-full">
                Current
              </span>
            </>
          )}
        </div>

        {pro && periodEnd && (
          <p className="text-sm text-muted-foreground">
            Next billing date:{" "}
            <span className="text-foreground font-medium">{periodEnd}</span>
          </p>
        )}

        {subscription?.cancel_at_period_end && (
          <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-300">
              Your subscription will cancel at the end of the current billing period
              {periodEnd ? ` (${periodEnd})` : ""}. You&apos;ll keep Pro access until then.
            </p>
          </div>
        )}

        {subscription?.status === "past_due" && (
          <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/30 rounded-lg px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-rose-400 mt-0.5 shrink-0" />
            <p className="text-sm text-rose-300">
              Your last payment failed. Please update your payment method to keep Pro access.
            </p>
          </div>
        )}

        <BillingActions isPro={pro} />
      </div>

      {/* Plan comparison — only show on Free */}
      {!pro && (
        <div className="glass border border-border/50 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-5">What you get with Pro</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Free
              </h3>
              {[
                "Unlimited assessments",
                "Evidence upload",
                "Questionnaire-based scoring",
                "ISO 27001 control mapping",
                "Report summary only",
              ].map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  {f}
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-primary uppercase tracking-wide">
                Pro — £49/mo
              </h3>
              {[
                "Everything in Free",
                "AI-powered Claude analysis",
                "Full report unlock",
                "PDF download",
                "30/60/90-day roadmap",
                "Priority support",
              ].map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
