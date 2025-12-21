-- Fix: Allow authenticated users to create organisations
-- The existing policy only allows SELECT for members, but we need INSERT for new orgs

-- Allow any authenticated user to create an organisation
drop policy if exists org_insert on public.organisations;
create policy org_insert on public.organisations
for insert
to authenticated
with check (true);

-- Allow org admins to update their organisation
drop policy if exists org_update on public.organisations;
create policy org_update on public.organisations
for update
using (public.has_org_role(id, array['admin']::public.org_role[]))
with check (public.has_org_role(id, array['admin']::public.org_role[]));

-- Allow any authenticated user to create their first membership (as admin of a new org)
-- This is needed because when creating an org, the user needs to also create their membership
drop policy if exists membership_insert on public.memberships;
create policy membership_insert on public.memberships
for insert
to authenticated
with check (
  -- User can only create membership for themselves
  user_id = auth.uid()
  -- And only if no membership exists yet for this org/user combo (handled by unique constraint)
);

