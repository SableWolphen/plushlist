# Audit: current PlushLife vs. the product vision

> **ARCHIVED.** This audit is what prompted archiving
> `plushlife-product-vision.md` in the first place — it shows a prior
> session treating that doc as a live spec and beginning to execute
> against it. Kept here as a historical record only, not as a queue of
> approved next steps.

Comparing `docs/plushlife-product-vision.md` against the app as it exists
today (`index.html`, `database/`). This is phase 1 of that document's own
recommended rollout order — read-only, no code changed for this audit.

## Already matches, or close to it

- **PlushPaths** — `PLUSH_PATHS` already exists and is already on-brand
  (guided programs, pause/resume-friendly, no restart-on-miss penalty).
- **PlushCompanion** — the mascot/streak/badge system already follows the
  vision's "must never" rules: missing a day doesn't punish the mascot,
  streaks reset gently, badges are never lost once earned.
- **PlushPlus / entitlements** — the centralized, inert entitlement system
  (`assets/entitlements.js`, `PLUSH_PLANS`, feature flags, dev-only
  preview) matches this doc's "Future PlushPlus" section almost exactly —
  built earlier this session, nothing further needed there for now.
- **No external calendar integration** — matches the "must not" list
  outright; a prior Google Calendar sync feature was built and then
  deliberately reverted in an earlier session, so the app is already
  compliant here.
- **Widgets** — home-screen widget (`WidgetBridgePlugin`) already exists;
  roughly matches PlushWidgets' "today's habits / companion" scope.
- **Naming registry** — `docs/plush-ecosystem-naming.md` already exists
  from this session, but only covers the names raised at the time. It
  needs extending to the fuller name list in this new vision doc
  (PlushCalendar, PlushPause, PlushSync, PlushWear, PlushTogether,
  PlushFamily, etc.) before it can act as the "one central registry" this
  doc asks for.

## Real gaps

- **PlushCalendar now has month, week, day, and agenda views** (all under
  the PlushCalendar tab). Month is the original completion heatmap; week is
  a 7-day grid with a read-only future-day preview; day view is a real
  date-picker that jumps to any date, past or future; agenda is a
  filterable (all/not-done/done/planned/paused) scrollable list spanning
  the last 7 and next 7 days. All four are pure UI reusing existing data —
  no schema changes, no changes to how `daily_progress` or
  `tracker_tasks` are written.
  **Still missing**: an "add an activity from the calendar" flow, and real
  per-occurrence rescheduling ("only this one" vs "this and future"
  occurrences). Both need the vision's data-model separation (activity /
  schedule / occurrence / completion as distinct records) — tasks still
  carry their own schedule directly and `daily_progress` is still a flat
  per-date completed-keys array, not per-occurrence records. That's a real
  schema project, not a UI tweak, and hasn't been started.
- **Bottom navigation doesn't match.** Current tabs: Today, Progress
  (labelled "week"), Care, Guardian, More. Recommended: PlushHome,
  PlushCalendar, PlushCompanion, PlushProgress, PlushProfile. This is a
  live, load-bearing piece of UX for existing real users — changing it
  is a product decision with real disruption risk, not a safe unilateral
  merge.
- **PlushPause now exists for individual habits/routines and Paths** —
  see the naming registry for how it's scoped (a stored date range on the
  task row, not a live boolean, so resuming never rewrites already-elapsed
  paused days). Whole-plan Rest Days / Vacation Mode is still the separate,
  unchanged mechanism for pausing everything at once.
- **PlushMood / PlushJournal naming.** The features exist (daily
  check-in, private reflection) but aren't named or grouped under those
  labels anywhere in the UI yet — flagged in the naming registry as
  safe, display-only renames once prioritized.
- **PlushCalm vs. PlushFocus aren't cleanly split.** `COMFORT_TOOLS`
  currently mixes both; already flagged as "needs care" in the naming
  registry.
- **PlushTogether / PlushFamily / PlushWear** don't exist. The existing
  Guardian/caregiver system covers some of PlushTogether's spirit
  (encouragement, consent-based sharing) but isn't the same feature and
  isn't being proposed for a rename — Guardian is a relationship role, not
  a feature module (see the naming registry).

## Why nothing beyond this audit + registry update happened yet

Per the vision doc's own "Development approach" section: audit first,
implement in safe phases, don't rebuild everything in one uncontrolled
change, and don't start a new phase while the current one is unstable.
The two biggest real items here — a true PlushCalendar and a bottom-nav
restructure — are exactly the kind of thing that doc says to phase
carefully, and both are product-scope decisions (what the calendar data
model should look like, whether real users should see a different bottom
nav) rather than something to decide unilaterally. Flagged back to the
product owner for prioritization rather than guessed at.
