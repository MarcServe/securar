"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Shield, LogOut, User, Menu, X, Crown } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { PlanDisplay } from "@/lib/subscription";

interface DashboardHeaderProps {
  user: SupabaseUser;
  plan: PlanDisplay;
}

export function DashboardHeader({ user, plan }: DashboardHeaderProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const planNavLink = plan.showUpgrade ? (
    <Link
      href={plan.upgradeHref}
      className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
    >
      {plan.upgradeLabel}
    </Link>
  ) : (
    <Link
      href="/settings/billing"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
    >
      <Crown className="h-3.5 w-3.5" />
      Pro
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-emerald-500" />
            <span className="text-xl font-bold">Securar</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/assessments"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Assessments
            </Link>
            <Link
              href="/reports"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Reports
            </Link>
            {planNavLink}
            <Link
              href="/settings/billing"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Billing
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span className="max-w-[150px] truncate">{user.email}</span>
            </div>
            <button
              onClick={handleLogout}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              {loading ? "Signing out..." : "Logout"}
            </button>
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden py-4 border-t border-border/40">
            <nav className="flex flex-col gap-2">
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/assessments"
                className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Assessments
              </Link>
              <Link
                href="/reports"
                className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Reports
              </Link>
              <Link
                href={plan.showUpgrade ? plan.upgradeHref : "/settings/billing"}
                className="px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors flex items-center gap-2"
                onClick={() => setMenuOpen(false)}
              >
                {!plan.showUpgrade && <Crown className="h-4 w-4" />}
                {plan.showUpgrade ? plan.upgradeLabel : "Pro"}
              </Link>
              <Link
                href="/settings/billing"
                className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Billing
              </Link>
              <div className="border-t border-border/40 my-2" />
              <div className="px-4 py-2 text-sm text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="truncate">{user.email}</span>
              </div>
              <button
                onClick={handleLogout}
                disabled={loading}
                className="mx-4 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" />
                {loading ? "Signing out..." : "Logout"}
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
