-- Claiming now goes through the watch-sync Edge Function, which validates the
-- signed-in user's access token before using server-only table access.
drop function if exists public.claim_watch_pairing(text);
