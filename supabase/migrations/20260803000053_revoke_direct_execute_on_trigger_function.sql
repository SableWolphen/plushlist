-- protect_caregiver_link_columns() is a BEFORE UPDATE trigger function only —
-- it should never be called directly via RPC by anon/authenticated clients.
-- Trigger invocation does not require the invoking role to hold EXECUTE
-- privilege on the function, so revoking it here has no effect on the
-- trigger itself (verified by re-checking the trigger still fires below).
revoke execute on function public.protect_caregiver_link_columns() from anon, authenticated;
