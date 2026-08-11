# Module split — plan and progress

`index.html` is ~795KB / 11,000 lines, almost all of it inside one
`<script id="app-source" type="text/plain">` block that gets transpiled at
runtime (GitHub Pages) or precompiled by `scripts/sync-www.js` (Android,
Cloudflare). That's the thing being incrementally split up. See the
"Checkpoints" section of `CLAUDE.md` — this is deliberately being done in
small, separately-verified phases, not as one pass.

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

**Important limitation:** this pattern only works for plain JS — data,
constants, pure functions. It does **not** work for React components,
because files loaded this way run as-is in the browser with no JSX
transform. Splitting out actual components (`PlushMascot`,
`BubbleWrapInteractive`, etc.) needs a real bundler (esbuild is the
likely choice — it does JSX + ESM in one step) and is a bigger, separate
decision per the Checkpoints list. Not started.

## Phase count

Roughly 6-7 phases total, decided when phase 1 shipped:

1. **Done** — static content/data (`assets/plush-content.js`)
2. **Done** — small pure helpers (`assets/plush-helpers.js`)
3. **Done** — date/schedule/task utilities and the billing-provider
   placeholder (`assets/plush-schedule.js`, `assets/plush-billing.js`)
4. **Partly done** — adopted esbuild as the bundler in
   `scripts/sync-www.js` (Android/Cloudflare build path). GitHub Pages
   unification and actual component extraction are still pending — see
   below.
5. Extract the self-contained comfort-tool interactive widgets
6. Extract other self-contained components (`PlushMascot`, `NurseryNook`,
   `MamasCorner`, `BabyModeCareSuite`, `LandingPage`, `ToolPanel`)
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

**Step 2, not started:** unify GitHub Pages onto the same precompiled
bundle Android/Cloudflare use. This becomes *necessary*, not optional,
the moment phase 5 moves any real component's JSX into a separate file
— GitHub Pages' raw `index.html` would otherwise be missing that
component's code entirely, since it no longer runs through a build
step. Needs `.github/workflows/deploy-pages.yml` to build via
`sync-www.js`/esbuild before publishing, instead of its current plain
file copy. This is the part that actually changes live, user-facing
deploy behavior (see Checkpoints in `CLAUDE.md`) and deserves its own
careful pass with its own verification, ideally exercised alongside the
first real component extraction (phase 5) rather than done blind ahead
of it.

## Candidate component phases (blocked on phase 4 step 2)

- Comfort-tool interactive widgets: `BubbleWrapInteractive`,
  `WorryJarInteractive`, `SensoryTapInteractive`, `DoodlePadInteractive`,
  `PerspectiveFlipCardsInteractive`, `BoundaryScriptsInteractive`,
  `DecompressionBufferInteractive`, `SensoryComfortInteractive` — already
  self-contained (props in, no reach into outer app state), best next
  real components to extract.
- Other fairly self-contained components: `PlushMascot`, `NurseryNook`,
  `MamasCorner`, `BabyModeCareSuite`, `LandingPage`, `ToolPanel`.
- The root `App` component — holds nearly all state; splitting it safely
  needs a real decision on how state gets shared across the split pieces
  (context, prop drilling, or something else) before it's attempted.

After each phase: `npm test` must pass, `npm run web:sync` must succeed,
and the compiled bundle should be spot-checked with `node --check`.
