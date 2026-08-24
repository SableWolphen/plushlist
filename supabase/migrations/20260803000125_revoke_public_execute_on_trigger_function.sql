-- The prior revoke targeted anon/authenticated directly, but PostgreSQL
-- grants EXECUTE to PUBLIC by default on function creation, and anon/
-- authenticated inherit through that — so the earlier revoke was a no-op.
-- Revoking from PUBLIC actually closes it. postgres/service_role (which
-- the trigger mechanism itself runs under, and which don't inherit via
-- PUBLIC in the way client roles do) keep their own explicit grants.
revoke execute on function public.protect_caregiver_link_columns() from public;
