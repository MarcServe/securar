import Link from "next/link";
import { User, Crown, Building2, Mail, Calendar } from "lucide-react";
import type { PlanDisplay } from "@/lib/subscription";

interface UserProfileCardProps {
  email: string;
  displayName?: string | null;
  orgName: string;
  role: string;
  plan: PlanDisplay;
}

export function UserProfileCard({
  email,
  displayName,
  orgName,
  role,
  plan,
}: UserProfileCardProps) {
  const isProPlan = plan.name !== "Free";

  return (
    <div className="bg-card border border-border rounded-xl p-6 mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="bg-primary/10 rounded-full p-3 shrink-0">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-1 min-w-0">
            <h2 className="text-lg font-semibold truncate">
              {displayName?.trim() || email.split("@")[0]}
            </h2>
            <p className="text-sm text-muted-foreground flex items-center gap-2 truncate">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              {email}
            </p>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              {orgName}
              <span className="text-muted-foreground/60">·</span>
              <span className="capitalize">{role}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6">
          <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3 min-w-[200px]">
            <div className="flex items-center gap-2 mb-1">
              {isProPlan ? (
                <Crown className="h-4 w-4 text-primary" />
              ) : null}
              <span className="font-semibold">{plan.name}</span>
              <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded-full">
                {plan.badge}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{plan.description}</p>
            {plan.periodEnd && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                {plan.badge === "Subscribed" || plan.badge === "Exploration"
                  ? "Until"
                  : "Renews"}{" "}
                {plan.periodEnd}
              </p>
            )}
          </div>

          <Link
            href={plan.upgradeHref}
            className={
              plan.showUpgrade
                ? "inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors shrink-0"
                : "inline-flex items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors shrink-0"
            }
          >
            {plan.showUpgrade ? plan.upgradeLabel : "Manage billing"}
          </Link>
        </div>
      </div>
    </div>
  );
}
