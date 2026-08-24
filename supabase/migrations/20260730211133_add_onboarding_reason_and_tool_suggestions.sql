alter table public.app_preferences add column if not exists onboarding_reason text;
alter table public.support_notes add column if not exists suggested_tool_id text;
