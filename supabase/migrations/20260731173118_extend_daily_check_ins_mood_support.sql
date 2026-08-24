-- Extend the existing daily_check_ins table (do not create a new mood table)
-- capacity already serves as the energy field (very_low/low/usual/high).
-- Add mood, support preference, and an optional private note.

alter table public.daily_check_ins
  add column if not exists mood text,
  add column if not exists support_preference text,
  add column if not exists note text;

alter table public.daily_check_ins
  add constraint daily_check_ins_mood_check
  check (mood is null or mood = any (array[
    'happy','calm','okay','tired','stressed','anxious','sad','angry',
    'lonely','overwhelmed','numb','sick','custom'
  ]));

alter table public.daily_check_ins
  add constraint daily_check_ins_support_preference_check
  check (support_preference is null or support_preference = any (array[
    'comfort','encouragement','structure','practical_help','quiet_company','space','not_sure'
  ]));

alter table public.daily_check_ins
  add constraint daily_check_ins_note_length_check
  check (note is null or length(note) <= 1000);

comment on column public.daily_check_ins.mood is 'Private by default. Only surfaced to a caregiver if can_view_mood is granted on caregiver_links.';
comment on column public.daily_check_ins.support_preference is 'What kind of support the user wants right now.';
