-- Add author-only mood editing without widening direct table permissions.
-- Uses the existing relationship-first lock to serialize revocation and writes.
create or replace function guardian_private.mood_action(p_agreement_id uuid,p_action text,p_id uuid,p_body text,p_shared boolean)
returns public.guardian_agreement_moods language plpgsql security definer set search_path = '' as $$
declare a public.guardian_agreements; m public.guardian_agreement_moods;
begin
  a := guardian_private.lock_agreement(p_agreement_id, p_action not in ('unshare','delete'));
  if p_action='create' and a.status='accepted' then
    insert into public.guardian_agreement_moods(agreement_id,author_user_id,body,shared)
      values(a.id,auth.uid(),p_body,coalesce(p_shared,false)) returning * into m;
  else
    select * into m from public.guardian_agreement_moods where id=p_id and agreement_id=a.id and author_user_id=auth.uid() for update;
    if m.id is null then raise exception 'Not allowed'; end if;
    if p_action='delete' then
      delete from public.guardian_agreement_moods where id=m.id;
    elsif p_action='unshare' or (p_action='share' and a.status='accepted') then
      update public.guardian_agreement_moods set shared=(p_action='share') where id=m.id returning * into m;
    elsif p_action='edit' and a.status='accepted' then
      if p_body is null or char_length(btrim(p_body)) not between 1 and 500 then raise exception 'Invalid mood text'; end if;
      update public.guardian_agreement_moods set body=p_body where id=m.id returning * into m;
    else raise exception 'Mood action not allowed'; end if;
  end if;
  return m;
end;
$$;
revoke all on function guardian_private.mood_action(uuid,text,uuid,text,boolean) from public,anon,authenticated;
grant execute on function guardian_private.mood_action(uuid,text,uuid,text,boolean) to authenticated;
