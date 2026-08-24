-- Called only by the Stripe webhook edge function (using the service role key)
-- when a real payment completes. Not callable by any regular user or even
-- an admin's own browser session - only a genuine server-to-server call.
create or replace function public.grant_supporter_from_payment(target_user_id uuid, new_value boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' then
    raise exception 'not authorized';
  end if;
  perform set_config('app.admin_override', 'true', true);
  insert into public.app_preferences (user_id, is_supporter, updated_at)
  values (target_user_id, new_value, now())
  on conflict (user_id) do update set is_supporter = excluded.is_supporter, updated_at = excluded.updated_at;
end;
$$;
revoke all on function public.grant_supporter_from_payment(uuid, boolean) from anon, authenticated, public;
grant execute on function public.grant_supporter_from_payment(uuid, boolean) to service_role;

-- Track payment records for admin visibility / support / refund lookups
create table if not exists public.supporter_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_session_id text unique,
  stripe_customer_id text,
  amount_cents integer,
  currency text,
  status text not null default 'completed',
  created_at timestamptz not null default now()
);
alter table public.supporter_payments enable row level security;

create policy "Admins read supporter payments" on public.supporter_payments
  for select to authenticated
  using (lower(coalesce((auth.jwt() ->> 'email'), '')) in ('johnston.alexander.k@gmail.com', 'johnston.alexander.k+plushlisttest@gmail.com'));
