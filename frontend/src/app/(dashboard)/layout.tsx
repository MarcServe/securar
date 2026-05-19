import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureUserReady } from "@/lib/provision-org";
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

  // Auto-provision org for accounts that signed in without completing signup org setup
  await ensureUserReady(user);

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} />
      <main>{children}</main>
    </div>
  );
}

