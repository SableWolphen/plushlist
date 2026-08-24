-- Switching change-detection from pure timestamp comparison to content
-- hashes: a schedule day's updated_at ticks whenever ANY of its entries
-- change, not just the one being considered, and an unrelated tracker_tasks
-- field edit (detail, why_note, sort_order) would otherwise look like a
-- "the calendar-relevant fields changed" false positive. Hashing the
-- canonical calendar-relevant shape (title/time/recurrence) tells us
-- definitively whether a push/pull is actually needed; updated_at is kept
-- only as the tie-breaker when both sides genuinely changed.
alter table public.calendar_sync_links
  add column local_content_hash text not null default '',
  add column google_content_hash text not null default '';
