import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureUserReady } from "@/lib/provision-org";
import { getOrgSubscriptionAdmin, getPlanDisplay } from "@/lib/subscription";
import { DashboardHeader } from "@/components/DashboardHeader";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await ensureUserReady(user);

  const { data: membershipData } = await supabase
    .from("memberships")
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  const orgId = (membershipData as { org_id: string } | null)?.org_id;
  const subscription = orgId ? await getOrgSubscriptionAdmin(orgId) : null;
  const plan = getPlanDisplay(subscription);

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} plan={plan} />
      <main>{children}</main>
    </div>
  );
}

