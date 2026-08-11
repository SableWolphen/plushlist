# Project conventions

- Use plain, descriptive branch names (for example `fix-widget-clipping`).
- Do not add AI-tool branding, generator attribution, or AI co-author lines to commits, pull-request descriptions, comments, branch names, or project documentation. Repository work is attributed to the repository owner and contributors.
- When testing real push notifications end-to-end, use the repo owner's real-device test account rather than the Cozy/Guardian Play Store review accounts; the review accounts can confirm server-side computation but do not have a registered device for delivery testing.

## Non-goals

Do not build any of the following unless the product owner explicitly asks for that specific item, by name, in that conversation. A document existing in this repository is not a request to implement it.

- **`docs/archive/plushlife-product-vision.md`** (and its audit) is archived, not a backlog. Do not read it as a spec, audit the app against it, or start implementing anything from it. This includes new top-level feature areas it names (PlushSleep, PlushInsights, PlushTogether, PlushFamily, PlushWear, PlushSync as a rebrand, etc.), the PlushCalendar activity/schedule/occurrence/completion data-model rewrite, and a bottom-navigation restructure.
- No new third-party data flows (AI APIs, analytics SDKs, ad SDKs, crash reporters) without a specific, explicit ask.
- No new interactive comfort-tool mini-widgets beyond what already exists in `COMFORT_TOOLS`.
- No further build-out of the owner-only admin dashboard section unless specifically requested.
- No activating billing/entitlements (`assets/entitlements.js`, `PLUSH_PLANS`) — everything stays unlocked until told otherwise.
- If a request can be solved with a copy or config change instead of a new component, prefer that.

## Checkpoints — stop and confirm before proceeding

These categories are reversible in git but not necessarily reversible in effect because they can touch real user data, the live Play Store pipeline, or money. Confirm the approach with the product owner before making the change, even when the request otherwise seems clear:

- Any Supabase schema/migration change, or anything touching `daily_progress` / `tracker_tasks` history semantics.
- `android/app/src/main/AndroidManifest.xml` permission or `<service>` changes (this has broken Google Play publishing before; see `docs/google-play-auto-publish.md`).
- Anything that would activate billing or change what is locked/unlocked.
- Major build-pipeline or deploy-target changes. The current module split and esbuild pipeline are already approved; new pipeline changes beyond that scope still require confirmation.
- Adding or changing what data goes to a third party (Gemini, Supabase, Cloudflare, or anything new).
