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

## Candidate next phases (not started, smallest first)

- `formatRelativeTime`, `MOTHERLY_NICKNAMES`, `OPTIONAL_SECTION_MARKERS`
  near the top of `app-source` — same pure-data/pure-function shape as
  what's already moved.
- Other standalone helper functions with no JSX and no closure over
  component state (audit needed — likely candidates near date/schedule
  math, e.g. anything used the same way `mascotGrowthStageForDays` is).
- The comfort-tool interactive widgets
  (`BubbleWrapInteractive`, `WorryJarInteractive`, `SensoryTapInteractive`,
  `DoodlePadInteractive`, `PerspectiveFlipCardsInteractive`,
  `BoundaryScriptsInteractive`, `DecompressionBufferInteractive`,
  `SensoryComfortInteractive`) are the best next real components to
  extract once a bundler decision is made — they're already
  self-contained (props in, no reach into outer app state).

After each phase: `npm test` must pass, `npm run web:sync` must succeed,
and the compiled bundle should be spot-checked with `node --check`.
