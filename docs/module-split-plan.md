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
6. Extract other self-contained components (`PlushMascot`, `NurseryNook`,
   `BabyArrivalRitual`, `MamasCorner`, `BabyModeCareSuite`,
   `AppLoadingScreen`, `LandingPage`, `GlowUpTracker`'s smaller
   subcomponents)
7. Split the root `App` component itself — the hardest part, likely more
   than one phase on its own once its actual state-sharing shape is clear

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

## Candidate component phases (phase 6+)

- Fairly self-contained components: `PlushMascot`, `NurseryNook`,
  `BabyArrivalRitual`, `MamasCorner`, `BabyModeCareSuite`,
  `AppLoadingScreen`, `LandingPage`.
- The root `App` component (`GlowUpTracker`) — holds nearly all state;
  splitting it safely needs a real decision on how state gets shared
  across the split pieces (context, prop drilling, or something else)
  before it's attempted.

After each phase: `npm test` must pass, `npm run web:sync` must succeed,
and the compiled bundle should be spot-checked with `node --check`.
