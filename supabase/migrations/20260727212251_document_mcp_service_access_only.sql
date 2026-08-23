create policy "Service role only" on public.glow_mcp_oauth_codes
  for all to service_role
  using (true)
  with check (true);

create policy "Service role only" on public.glow_mcp_tokens
  for all to service_role
  using (true)
  with check (true);
