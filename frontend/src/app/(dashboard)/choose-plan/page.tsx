import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrgSubscription, isPro } from "@/lib/subscription";
import { ensureUserReady } from "@/lib/provision-org";
import { PlanChooser } from "@/components/PlanChooser";

import { getTrialDays } from "@/lib/trial-config";

export default async function ChoosePlanPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/choose-plan");

  await ensureUserReady(user);

  // Already on Pro — skip plan selection
  const { data: membershipData } = await supabase
    .from("memberships")
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  const membership = membershipData as { org_id: string } | null;

  if (membership?.org_id) {
    const subscription = await getOrgSubscription(supabase as never, membership.org_id);
    if (isPro(subscription)) {
      redirect("/dashboard");
    }
  }

  // Already chose free tier
  if (user.user_metadata?.plan_choice === "free") {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <PlanChooser trialDays={getTrialDays()} />
    </div>
  );
}
