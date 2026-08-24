alter table public.private_notes
  add column if not exists prompt text;

alter table public.private_notes
  drop constraint if exists private_notes_prompt_length;

alter table public.private_notes
  add constraint private_notes_prompt_length
  check (prompt is null or char_length(prompt) <= 500);
