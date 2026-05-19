import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getOrgSubscriptionAdmin, isPro as checkIsPro, isExplorationTrial, hasStripeSubscription } from "@/lib/subscription";
import { getTrialDays } from "@/lib/trial-config";
import { syncSubscriptionFromCheckoutSession, syncOrgSubscriptionFromStripe } from "@/lib/sync-stripe-subscription";
import { BillingActions } from "./BillingActions";
import { BillingSync } from "./BillingSync";
import { CheckCircle2, AlertTriangle, Crown } from "lucide-react";

interface PageProps {
  searchParams: { subscribed?: string; session_id?: string };
}

export const dynamic = "force-dynamic";

export default async function BillingPage({ searchParams }: PageProps) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  if (searchParams.session_id) {
    try {
      const result = await syncSubscriptionFromCheckoutSession(searchParams.session_id);
      if (!result.synced) {
        console.warn("[billing] checkout sync:", result.reason);
      }
    } catch (e) {
      console.error("[billing] checkout sync failed", e);
    }
  }

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

  if (orgId) {
    try {
      const result = await syncOrgSubscriptionFromStripe(orgId, user.email ?? undefined);
      if (!result.synced && result.reason && result.reason !== "already synced") {
        console.warn("[billing] stripe sync:", result.reason);
      }
    } catch (e) {
      console.error("[billing] stripe sync failed", e);
    }
  }

  const subscription = orgId ? await getOrgSubscriptionAdmin(orgId) : null;
  const pro = checkIsPro(subscription);
  const explorationTrial = isExplorationTrial(subscription);
  const subscribed = hasStripeSubscription(subscription);
  const stripeTrialing = subscribed && subscription?.status === "trialing";

  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const justSubscribed = searchParams.subscribed === "true";
  const needsStripeSync = explorationTrial;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <BillingSync needsSync={needsStripeSync} />

      {justSubscribed && (
        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-5 py-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <div>
            <p className="font-semibold text-emerald-400">
              {needsStripeSync
                ? "Payment received — activating Pro…"
                : subscribed
                  ? "You're subscribed to Pro!"
                  : "Your Pro trial is active!"}
            </p>
            <p className="text-sm text-muted-foreground">
              {needsStripeSync
                ? "We're linking your Stripe subscription. This usually takes a few seconds."
                : subscribed
                  ? stripeTrialing
                    ? "Your payment method is on file. Billing starts after your trial period."
                    : "Your subscription is active. All Pro features are unlocked."
                  : "All Pro features are unlocked during your trial. Subscribe before it ends to keep access."}
            </p>
          </div>
        </div>
      )}

      <div className="glass border border-border/50 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Billing</h1>
          <p className="text-sm text-muted-foreground">
            Organisation:{" "}
            <span className="text-foreground font-medium">{orgName}</span>
          </p>
        </div>

        {subscribed && stripeTrialing && !justSubscribed && (
          <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-5 py-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-semibold text-emerald-400">Pro subscription active</p>
              <p className="text-sm text-muted-foreground">
                Your card is on file. You won&apos;t be charged until{" "}
                {periodEnd ?? "your trial ends"}.
              </p>
            </div>
          </div>
        )}

        {explorationTrial && !justSubscribed && (
          <div className="flex items-center gap-3 bg-primary/10 border border-primary/30 rounded-xl px-5 py-4">
            <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="font-semibold text-primary">Exploration trial active</p>
              <p className="text-sm text-muted-foreground">
                All Pro features are unlocked until{" "}
                {periodEnd ?? `your ${getTrialDays()}-day trial ends`}. Subscribe before then to
                keep access.
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          {pro ? (
            <>
              <Crown className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">Pro Plan</span>
              <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded-full">
                {explorationTrial ? "Trial" : stripeTrialing ? "Subscribed" : "Active"}
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
            {explorationTrial
              ? "Trial ends"
              : stripeTrialing
                ? "First charge on"
                : "Next billing date"}
            :{" "}
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

        <BillingActions
          isPro={pro}
          explorationTrial={explorationTrial}
          trialDays={getTrialDays()}
        />

        {!pro && (
          <Link
            href="/choose-plan"
            className="inline-block text-sm text-primary hover:underline"
          >
            Compare plans →
          </Link>
        )}
      </div>

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
