# Module split — plan and progress

`index.html` used to be ~795KB / 11,000 lines, almost all of it inside one
`<script id="app-source" type="text/plain">` block that got transpiled at
runtime (GitHub Pages) or precompiled by `scripts/sync-www.js` (Android,
Cloudflare). As of phase 4 step 2, that inline block is gone: the app
source lives at `src/app-source.jsx`, and `scripts/sync-www.js` bundles it
with esbuild (real `import`/`export` resolution, not a single-file
transform) into `assets/app.bundle.js` for all three deploy targets —
Android, Cloudflare, and GitHub Pages alike. `index.html` now just loads
that bundle via `<script src="./assets/app.bundle.js"></script>`, same as
the other precompiled UMD modules in `assets/`. That monolithic file is
the thing being incrementally split up. See the "Checkpoints" section of
`CLAUDE.md` — this is deliberately being done in small,
separately-verified phases, not as one pass.

## The pattern

Follow the convention `assets/entitlements.js` already established:

- A UMD-style wrapper: `module.exports` for Node (so it's testable with
  plain `require()`), `window.PlushLifeXxx` for the browser.
- Loaded via a `<script src="./assets/xxx.js"></script>` tag in
  `index.html`, **before** the `app-source` block, so its
  `window.PlushLifeXxx` global exists by the time the app script runs.
- Consumed from `app-source` with a single destructuring line —
  `const { A, B, C } = window.PlushLifeXxx;` — so call sites elsewhere in
  the file don't need to change at all.
- A matching `scripts/test-xxx.js` that `require()`s the module directly,
  wired into the `test` script in `package.json`.
- `scripts/sync-www.js` already copies the whole `assets/` directory
  (`SITE_DIRECTORIES = ["assets"]`), so new files there need no build
  changes to reach Android/Cloudflare.

**Important limitation:** the `assets/xxx.js` UMD pattern above only works
for plain JS — data, constants, pure functions. It does **not** work for
React components, because files loaded this way run as-is in the browser
with no JSX transform. Splitting out actual components needs a real
bundler — esbuild, adopted in phase 4 — and a different pattern: an ES
module under `src/` (JSX allowed) that `src/app-source.jsx` `import`s
directly, resolved and bundled at build time rather than loaded as a
separate `<script>` tag. See `src/components/shared.jsx` (phase 5) for the
first example.

## Phase count

Roughly 6-7 phases total, decided when phase 1 shipped:

1. **Done** — static content/data (`assets/plush-content.js`)
2. **Done** — small pure helpers (`assets/plush-helpers.js`)
3. **Done** — date/schedule/task utilities and the billing-provider
   placeholder (`assets/plush-schedule.js`, `assets/plush-billing.js`)
4. **Done** — adopted esbuild as the bundler in `scripts/sync-www.js`
   (step 1), then unified GitHub Pages onto the same precompiled bundle
   (step 2), retiring the runtime Babel-in-browser compile entirely.
5. **Done** — first real component extraction: `ToolPanel` and
   `HabitTypeIcon` (`src/components/shared.jsx`).
6. **Done** — extracted the other self-contained components:
   `PlushMascot`, `NurseryNook`, `AppLoadingScreen`
   (`src/components/mascot.jsx`); `BabyArrivalRitual`, `MamasCorner`,
   `BabyModeCareSuite` (`src/components/baby-mode.jsx`); `LandingPage`
   (`src/components/landing.jsx`).
7. **In progress** — splitting the root `App` component (`GlowUpTracker`)
   itself, which still holds nearly all state. State-sharing decision:
   **explicit prop drilling**, not context — each extracted piece takes
   exactly the state values/setters/handlers its body reads as named
   props, the same pattern already proven by `MamasCorner`'s `supabase`
   prop in phase 6. No reducer rewrite, no context providers; `GlowUpTracker`
   remains the single owner of all state. First slice done: the four
   smallest, most clearly-bounded `ToolPanel` modals
   (`src/components/info-panels.jsx`). This is the hardest, highest-risk
   phase — see the dedicated section below for what's done and what's
   deliberately still deferred.

## Done

- **`assets/plush-content.js`** — `MASCOT_OUTFITS`, `APPEARANCE_THEMES`,
  `MASCOT_GROWTH_STAGES`, `DAYS`, `TEMPLATE_PACKS`, `DASHBOARDS`,
  `PLUSH_PATHS`, `SLEEP_TOOLS`, `SOUNDSCAPES`, `GENTLE_AFFIRMATIONS`,
  `COMFORT_TOOLS`. ~225 lines moved out of `index.html`.
  - Two of `scripts/validate-app-source.js`'s regression markers
    (`const APPEARANCE_THEMES = [`, `Rainy-Day Coat`, `yearlight-crown`)
    referenced content that moved — the check now searches the
    concatenation of the app-source block and `plush-content.js` instead
    of only the former.
- **`assets/plush-helpers.js`** — `formatRelativeTime`,
  `MOTHERLY_NICKNAMES`, `OPTIONAL_SECTION_MARKERS`,
  `urlBase64ToUint8Array`, `mascotGrowthStageForDays`. The last of these
  depends on `MASCOT_GROWTH_STAGES` from `plush-content.js`; the module
  `require()`s it directly in Node and reads `window.PlushLifeContent` in
  the browser (safe because `plush-content.js` always loads first).
  - One more regression marker (`const MOTHERLY_NICKNAMES = [`) moved
    with it — `validate-app-source.js` now checks all three files
    together.
- **`assets/plush-schedule.js`** — 23 pure date/schedule/task-shape
  functions (`isQuietTime`, `taskIsOptional`, `scheduleLabelForTask`,
  `reflectionPromptForDay`, `trackerPeriod`, `dayIdForDate`,
  `pathOfTheWeekId`, `dateForDayId`, `formatTime12`, `parseTime24`,
  `splitScheduleField`, `legacyScheduleToEntries`, `habitTypeForTask`,
  `cleanTaskDetail`, `encodeTaskDetail`, `offsetDate`, `monthKeyOffset`,
  `daysInCalendarMonth`, `datesInMonthThrough`, `daysBetweenDates`,
  `taskOccursOn`, `taskIsScheduledForDate`, `datesThroughToday`) plus
  their supporting constants (`WEEKDAY_PRESET_IDS`, `WEEKEND_PRESET_IDS`,
  `WEEKDAY_IDS`, `HABIT_META_PATTERN`, `REFLECTION_PROMPT_ROTATIONS`).
  Depends on `plush-content.js` (`DAYS`, `PLUSH_PATHS`),
  `plush-helpers.js` (`OPTIONAL_SECTION_MARKERS`), and the existing
  `care-upgrades.js` (`taskTargetsDate`).
  - Caught a real bug during extraction: `OPTIONAL_SECTION_MARKERS`
    actually lives in `plush-helpers.js` (phase 2), not
    `plush-content.js` — the first draft of this module destructured it
    from the wrong dependency, which `npm test` caught immediately as a
    `Cannot read properties of undefined` crash in `taskIsOptional`.
- **`assets/plush-billing.js`** — `getBillingProvider` and
  `GooglePlayBillingProvider` (the inert Play Billing architecture
  placeholder — every method still just throws).
- **`src/components/shared.jsx`** (phase 5) — `ToolPanel` (the
  modal/dialog wrapper used throughout the app) and `HabitTypeIcon`.
  First real component extraction — an ES module with JSX that
  `src/app-source.jsx` `import`s and esbuild bundles in, not a
  `window.PlushLifeXxx` global. `HabitTypeIcon` still reads
  `habitTypeForTask` off `window.PlushLifeSchedule` at call time rather
  than importing `plush-schedule.js` directly, so esbuild doesn't bundle
  that module's content a second time on top of the separate `<script>`
  tag that already loads it.
- **`src/components/mascot.jsx`** (phase 6) — `PlushMascot`,
  `NurseryNook`, `AppLoadingScreen` (the two latter both render
  `PlushMascot`). Reads `MASCOT_OUTFITS` (`window.PlushLifeContent`) and
  `mascotGrowthStageForDays` (`window.PlushLifeHelpers`) at module scope,
  same pattern as `app-source.jsx` itself.
- **`src/components/baby-mode.jsx`** (phase 6) — `BabyArrivalRitual`,
  `MamasCorner`, `BabyModeCareSuite` (plus the unexported helper
  `littleSpaceTaskLabel`, used only by `BabyModeCareSuite`). `MamasCorner`
  needed one real code change to extract cleanly: it used to close over
  the module-level `supabase` client declared at the top of the old
  monolithic `app-source` block; now that it lives in its own file, it
  takes `supabase` as a prop instead, passed down from
  `src/app-source.jsx`'s `GlowUpTracker` (which still owns the one
  `supabase` client instance) at its call site. Same client, same auth
  session — just threaded explicitly instead of implicitly via closure.
- **`src/components/landing.jsx`** (phase 6) — `LandingPage`, the
  signed-out marketing page. Fully self-contained aside from the
  sign-in-form props `GlowUpTracker` already passed it.

Verified phase 6 the same way as phase 5: `npm test` (including
`validate-app-source.js`'s regression markers, updated for the two
components whose call sites changed), `npm run web:sync`, `node --check`
on the output, plus a tokenized diff between the pre- and post-phase-6
bundle. The only real differences were the intentional `supabase` prop on
`MamasCorner` and esbuild automatically renaming a handful of duplicate
top-level `const` bindings (e.g. `MASCOT_OUTFITS` → `MASCOT_OUTFITS2`)
where both `app-source.jsx` and a new component file independently
destructure the same `window.PlushLifeXxx` global — both bindings read
the identical underlying value, so this is a safe, automatic
disambiguation, not a behavior change.
- **`src/components/info-panels.jsx`** (phase 7, first slice) —
  `ProfilePanel`, `SafetyPanel`, `HelpPanel`, `CalmPanel`: the four
  smallest, most clearly-bounded `ToolPanel` modals that used to be
  inline `{xOpen && (<ToolPanel ...>...)}` blocks directly in
  `GlowUpTracker`'s render body. Each now takes `open`/`onClose` as
  explicit props (replacing the inline `{xOpen && (...)}` guard and the
  closed-over `setXOpen` calls, respectively) plus whatever other
  state/handlers its body reads, passed by name from `GlowUpTracker`'s
  call site — pure prop drilling, no new state indirection.
  `GlowUpTracker` still owns `profileOpen`/`safetyOpen`/`helpOpen`/
  `calmQuickOpen` and every other piece of state; only the JSX moved.
  Verified with the same tokenized bundle diff technique as phase 6: the
  only real differences were the `setXOpen(false)` → `onClose()`
  substitutions and the new explicit prop lists at each call site — no
  missing or extra logic.

## Candidate remaining pure-logic (not scoped)

A deeper audit could still find other standalone pure functions further
into the file — this phase covered everything reachable from the top
third of `app-source`, not a full sweep. Worth another pass later, but
not blocking anything else.

## Phase 4 — bundler decision

**Step 1, done:** `scripts/sync-www.js`'s `compileAppSource()` now uses
`esbuild.transformSync()` (loader `jsx`, classic runtime — `React`
stays a global, not an ES import — `minifyWhitespace` only, `charset:
"utf8"`) instead of `@babel/standalone`'s `Babel.transform()`. This
only replaces the *compiler*, not the pipeline shape — it still
transforms the same single monolithic `app-source` block into
`assets/app.bundle.js`, same as before. No component has moved to a
separate file yet, so GitHub Pages' raw `index.html` (still served
as-is, still doing its own runtime Babel-in-browser compile of the same
unmodified block) needed no changes and remains completely untouched by
this step.

Verified equivalence rigorously, not just "tests still pass": built the
same source with both the old Babel path and the new esbuild path,
tokenized and diffed the two compiled outputs. Every single difference
across the entire ~650KB file fell into three known-safe categories —
`/*#__PURE__*/` annotation comments (dev/tooling hints, inert at
runtime, which esbuild doesn't emit), leading-zero numeric literal
formatting (`0.23` vs `.23`, identical values), and Unicode escape
representation (`💤` vs literal `💤`, identical string
values, resolved by setting esbuild's `charset: "utf8"` to match
Babel's literal-character output). No other differences existed
anywhere in the file.

**Step 2, done:** unified GitHub Pages onto the same precompiled bundle
Android/Cloudflare use. This became *necessary*, not optional, once phase
5 moved real component JSX (`ToolPanel`, `HabitTypeIcon`) into a separate
file — GitHub Pages' raw `index.html` would otherwise be missing that
code entirely, since it no longer ran through a build step. Concretely:
the inline `<script id="app-source">` block and the runtime
`Babel.transform()` call were removed from `index.html` entirely, replaced
with `<script src="./assets/app.bundle.js"></script>` (same as the other
precompiled UMD modules); `scripts/sync-www.js`'s `compileAppSource()`
switched from `esbuild.transformSync()` on inline HTML text to
`esbuild.buildSync()` with a real entry point (`src/app-source.jsx`),
resolving `import`s instead of transforming a single blob; and
`.github/workflows/deploy-pages.yml` now runs `npm run web:sync` and
publishes the resulting `www/` directory (bundle + vendored
React/ReactDOM/Supabase + everything else) instead of hand-assembling
`_site/` with `cp`.

This is a real, deliberate tradeoff worth naming: GitHub Pages'
`index.html` was previously "an independently deployable backup" that
worked with zero build step, pure insurance if the Android/Cloudflare
build pipeline ever broke. That property is gone now that all three
targets share one precompiled bundle — a broken build breaks all three
the same way. Accepted as the cost of being able to split out real
components at all; `@babel/standalone` (no longer used anywhere) was
removed as a dependency in the same phase.

`scripts/validate-app-source.js` changed accordingly: it used to extract
and Babel-compile the inline `<script id="app-source">` block from
`index.html`; it now `esbuild.buildSync()`s `src/app-source.jsx` directly
(catching import/resolution errors, not just JSX syntax errors) and
checks its regression markers against `src/app-source.jsx` +
`src/components/shared.jsx` + the `assets/plush-*.js` modules combined.

## Phase 7 remaining work

`GlowUpTracker` is a `<ToolPanel>`-heavy component: roughly 15 modal
sections gated by their own `xOpen` boolean, plus one large
always-in-tree "today" view. Done so far: the four smallest modals
(`src/components/info-panels.jsx`) and the five smallish viewers with
local derived state (`src/components/viewer-panels.jsx` — `MoodViewer`,
`CarePathViewer`, `SleepToolViewer`, `JournalReflectionViewer`,
`DailyJournalPanel`). The viewer-panels extraction kept each panel's
inline IIFE-computed locals (`entry`/`mood`/`energy` lookups, path
progress math) inside the new component rather than trying to hoist them
out — only the panel's inputs became props, not its internal shape.
`PLUSH_PATHS`/`SLEEP_TOOLS`/`reflectionPromptForDay`/`dayIdForDate`
weren't passed as props at all — they're read from
`window.PlushLifeContent`/`window.PlushLifeSchedule` directly inside the
new file, the same globals `app-source.jsx` itself already reads, so
esbuild renames the duplicate top-level bindings automatically (same
safe pattern as `MASCOT_OUTFITS` → `MASCOT_OUTFITS2` in phase 6).
Verified the same way: `npm test`, `npm run web:sync`, `node --check`,
and a tokenized bundle diff confirming the only differences were the
intentional `setXOpen(false)` → `onClose()` substitutions and each new
call site's explicit prop list.

Also done: `Change my schedule`
(`src/components/schedule-editor-panel.jsx` — `ScheduleEditorPanel`).
~20 props (schedule-editing state and handlers), no local-derived-state
complications, `DAYS` read from `window.PlushLifeContent` the same way
as the previous slice's globals. One naming wrinkle worth documenting:
the panel reads a derived value `scheduleEditingDayId` (`=
scheduleEditDayId || scheduleDayId`, defined once in `GlowUpTracker`),
not the raw `scheduleEditDayId` state — passed through by its derived
name, unchanged.

Also done: `Rewards` (`src/components/rewards-panel.jsx` —
`RewardsPanel`). Confirmed the plan above: `FeatureTip` and `BADGE_DEFS`
passed through as plain props, unmodified, since both are just
references to whatever `GlowUpTracker` computed that render — extracting
this didn't require touching either closure. `PlushMascot` is imported
directly from `./mascot.jsx` (it's already its own module since phase
6) rather than passed as a prop; `MASCOT_OUTFITS` read from
`window.PlushLifeContent` inside the new file, same as everywhere else.

Also done: `Admin` (`src/components/admin-panel.jsx` — `AdminPanel`),
the first of the "big four" and the largest extraction to date (~250
lines, ~26 props). Owner-only tooling: site stats, feature usage,
onboarding funnel, Supporter status grant/revoke, Google Play review
account management, feedback inbox, error logs, and the dev-only
PlushPlus entitlement preview. `SUPPORTER_FEATURES_ENABLED` — a plain
`false` literal in `app-source.jsx`, not a window global — is passed as
a prop rather than duplicated, so there stays exactly one source of
truth for that billing gate (see `CLAUDE.md`'s Checkpoints).
`window.PlushLifeEntitlements` is read directly since it's already a
global. The tokenized bundle diff surfaced a new variant of esbuild's
auto-renaming this size finally triggered: a nested local `const pct`
inside one of `AdminPanel`'s `.map()` callbacks got renamed to `pct2`,
not because of any real collision (it's function-scoped, genuinely
independent of the several other `const pct` declarations still elsewhere
in `GlowUpTracker`) but because esbuild's bundler renames defensively
across file boundaries at any scope depth, not just top-level `const`s
like the earlier `MASCOT_OUTFITS` → `MASCOT_OUTFITS2` cases. Confirmed
safe: both the declaration and every reference within that one callback
were renamed together and consistently, with zero leakage into other
scopes.

Remaining, roughly in order of increasing size/risk:

- The remaining three of the "big four": `Settings`, `Change my tasks`,
  and the inline Guardian/support panel (250-320 lines each, touching
  large swaths of state).
- The always-in-tree "today" dashboard view itself (not a `ToolPanel`) —
  the biggest remaining piece, and the one most likely to need something
  beyond pure prop drilling (it's arguably `GlowUpTracker`'s actual
  irreducible core, not a candidate for further extraction).

After each phase: `npm test` must pass, `npm run web:sync` must succeed,
and the compiled bundle should be spot-checked with `node --check`. Phase
7 additionally gets a tokenized diff between the pre/post bundle each
time, since prop-drilling extractions are easy to get subtly wrong
(missing a prop, a stale closure) in ways `npm test`'s regression markers
won't catch.
