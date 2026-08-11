# Module split — plan and current state

The PlushLife web app used to keep almost all application code in one very large inline script in `index.html`. The module split moved that code into testable modules and React component files while keeping the existing product behavior and state ownership intact.

See `PROJECT_GUIDELINES.md` for the current collaboration rules and checkpoints. The module split described here is already approved; any new database, billing, Android permission/service, third-party-data, or major deploy-pipeline change still requires a separate product-owner decision.

## Current architecture

- `src/app-source.jsx` is the application entry point.
- `scripts/sync-www.js` bundles the app with esbuild into `assets/app.bundle.js`.
- Android, Cloudflare, and GitHub Pages all use the same precompiled bundle.
- Plain data and pure helpers that do not need JSX remain in `assets/` modules exposed through `window.PlushLife*` globals.
- React components live under `src/components/` and are imported normally by `src/app-source.jsx`.
- `GlowUpTracker` remains the owner of application state. Extracted components receive the state values, setters, and handlers they need through explicit props; the refactor did not introduce a reducer/context rewrite.

## Completed phases

1. **Static content/data** — `assets/plush-content.js`
2. **Pure helpers** — `assets/plush-helpers.js`
3. **Date/schedule/task helpers and billing placeholder** — `assets/plush-schedule.js`, `assets/plush-billing.js`
4. **Build pipeline** — moved compilation to esbuild and unified all deploy targets on the same generated bundle
5. **Shared components** — `src/components/shared.jsx` (`ToolPanel`, `HabitTypeIcon`)
6. **Self-contained app components** — mascot, baby-mode, loading, and landing components
7. **Root-component decomposition** — extracted all modal/tool panels plus all four main dashboard views from `GlowUpTracker`

## Phase 7 result

Phase 7 is complete. The large UI sections that previously lived inline inside `GlowUpTracker` are now separated into component modules, including:

- `src/components/info-panels.jsx`
- `src/components/viewer-panels.jsx`
- `src/components/schedule-editor-panel.jsx`
- `src/components/rewards-panel.jsx`
- `src/components/admin-panel.jsx`
- `src/components/settings-panel.jsx`
- `src/components/tasks-panel.jsx`
- `src/components/guardian-panel.jsx`
- `src/components/care-panel.jsx`
- `src/components/progress-panel.jsx`
- `src/components/week-panel.jsx`
- `src/components/today-panel.jsx`

The Today extraction was the final large dashboard slice. One small today-only check-in shortcut remains inline in `app-source.jsx` because it is separate from the main Today fragment and is too small to justify another component by itself.

## Extraction pattern

For plain JavaScript modules in `assets/`:

- Use the existing UMD-style pattern (`module.exports` in Node/tests, `window.PlushLifeXxx` in the browser).
- Keep modules focused on data, constants, or pure functions.
- Add/update direct Node tests where appropriate.

For React components under `src/components/`:

- Import them from `src/app-source.jsx` so esbuild resolves and bundles them.
- Keep `GlowUpTracker` as the state owner unless there is a separate, explicit reason to change state architecture.
- Pass existing state/handlers as named props rather than duplicating state or introducing a context provider solely for extraction.
- Read existing `window.PlushLifeContent`, `window.PlushLifeSchedule`, and related globals inside a component when that matches the established module pattern.

## Verification standard

Each extraction slice was checked with the same basic safety bar:

- `npm test`
- `npm run web:sync`
- `node --check www/assets/app.bundle.js`
- build/import smoke checks when needed
- tokenized bundle-diff review for behavior-preserving moves, including expected esbuild identifier renaming across bundled files

Several refactor slices also exposed real pre-existing bugs (for example missing schedule-helper imports). Those fixes were isolated and verified rather than hidden inside unrelated moves.

## What remains

The planned module split itself is finished. Future work should now be driven by product needs, bugs, performance, maintainability, or clearly demonstrated component boundaries — not by a goal of splitting files for its own sake.

Before any additional structural refactor, prefer the smallest change that solves the concrete problem and keep the current build/deploy behavior stable unless a new pipeline change is explicitly approved.
