-- Background mail administration is not a browser API. These functions can
-- read contact data / change auth app metadata and must remain service-only.
revoke all on function public.plushlife_gmail_comeback_candidates() from public, anon, authenticated;
revoke all on function public.plushlife_mark_gmail_comeback_sent(uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.plushlife_gmail_comeback_candidates() to service_role;
grant execute on function public.plushlife_mark_gmail_comeback_sent(uuid,text,text,text) to service_role;

-- Together actions always require an authenticated participant. In particular,
-- SQL NULL comparisons must never allow an unsigned caller to start a timer.
revoke all on function public.set_together_item_completion(uuid,boolean) from public, anon;
revoke all on function public.set_together_participation(uuid,date,boolean,boolean) from public, anon;
revoke all on function public.start_together_timer(uuid,integer) from public, anon;
grant execute on function public.set_together_item_completion(uuid,boolean) to authenticated;
grant execute on function public.set_together_participation(uuid,date,boolean,boolean) to authenticated;
grant execute on function public.start_together_timer(uuid,integer) to authenticated;
