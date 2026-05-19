import { createAdminClient } from "@/lib/supabase/admin";
import type { User } from "@supabase/supabase-js";

export function defaultOrgName(user: User): string {
  const fromMeta = user.user_metadata?.org_name as string | undefined;
  if (fromMeta?.trim()) return fromMeta.trim();
  const emailPrefix = user.email?.split("@")[0]?.replace(/[.+]/g, " ");
  if (emailPrefix?.trim()) return emailPrefix.trim();
  return "My Organisation";
}

/**
 * Ensures the user belongs to an org (admin role). Uses service role so it
 * works even when the user has no membership yet (RLS chicken-and-egg).
 */
export async function ensureUserHasOrgForUser(user: User): Promise<string | null> {
  const admin = createAdminClient();
  const orgName = defaultOrgName(user);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (admin.from("memberships") as any)
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (existing?.org_id) return existing.org_id as string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: org, error: orgError } = await (admin.from("organisations") as any)
    .insert({ name: orgName })
    .select("id")
    .single();

  if (orgError || !org) {
    console.error("[ensureUserHasOrgForUser] org insert failed", orgError);
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: memberError } = await (admin.from("memberships") as any).insert({
    org_id: org.id,
    user_id: user.id,
    role: "admin",
  });

  if (memberError) {
    console.error("[ensureUserHasOrgForUser] membership insert failed", memberError);
    return null;
  }

  return org.id as string;
}

/** Load org_id + name for billing; provisions org if missing. */
export async function getOrProvisionMembership(user: User): Promise<{
  orgId: string;
  orgName: string;
} | null> {
  const orgId = await ensureUserHasOrgForUser(user);
  if (!orgId) return null;

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: org } = await (admin.from("organisations") as any)
    .select("name")
    .eq("id", orgId)
    .single();

  return {
    orgId,
    orgName: (org?.name as string | undefined) ?? defaultOrgName(user),
  };
}
