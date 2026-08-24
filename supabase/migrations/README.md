# Supabase migration history

These files mirror the full migration history already applied to the live
PlushLife Supabase project (`supabase_migrations.schema_migrations`), pulled
in on 2026-08-23 because most of this history previously existed only in
Supabase itself and was not reviewable from this repo.

`../../database/` remains the actively-maintained set of migrations for new
schema work going forward (see the main README's "Database setup" section).
This folder is the historical record — including the definitions for
`admin_dashboard_stats()`, `admin_onboarding_funnel()`, and
`admin_set_supporter_status()`, which are owner-email-gated server-side
(verified directly against the live database on 2026-08-23) despite being
granted to the `authenticated` role.

Two migrations (`20260728122812_add_private_user_owned_trackers_v2.sql` and
`20260728123640_add_private_editable_weekly_schedules.sql`) had their
original seed-data statements removed before being committed here: the live
versions seeded one real account's personal task list and copied personal
progress data between two real accounts. Only the schema and RLS policies
are preserved for those two files, with a comment marking what was redacted
and why. Every other file in this folder matches the live migration exactly.

Going forward, prefer running new schema changes through the Supabase CLI's
migration workflow (or committing the SQL here before/alongside applying it
in the dashboard) so this folder and the live project don't drift apart
again — the same lesson as `docs/incident-daily-progress-overwrite.md`.
