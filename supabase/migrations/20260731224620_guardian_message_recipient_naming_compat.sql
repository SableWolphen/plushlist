-- Adds spec-named sender/recipient/message-type columns as generated aliases over
-- the existing, already-correctly-scoped columns (owner_user_id/caregiver_user_id),
-- rather than duplicate stored columns that could drift out of sync. RLS already
-- enforces recipient scoping via owner_user_id/caregiver_user_id; these are purely
-- for readability/compatibility with the sender_user_id/recipient_user_id naming.

alter table public.support_notes
  add column if not exists recipient_user_id uuid generated always as (owner_user_id) stored,
  add column if not exists sender_user_id uuid generated always as (caregiver_user_id) stored,
  add column if not exists message_type text generated always as (
    case when suggested_tool_id is not null then 'comfort_tool_suggestion' else 'encouraging_note' end
  ) stored;

alter table public.support_rewards
  add column if not exists recipient_user_id uuid generated always as (owner_user_id) stored,
  add column if not exists sender_user_id uuid generated always as (caregiver_user_id) stored,
  add column if not exists message_type text generated always as ('reward') stored;

alter table public.task_suggestions
  add column if not exists recipient_user_id uuid generated always as (owner_user_id) stored,
  add column if not exists sender_user_id uuid generated always as (caregiver_user_id) stored,
  add column if not exists message_type text generated always as ('task_suggestion') stored;
