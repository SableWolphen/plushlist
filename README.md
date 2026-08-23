# PlushLife

PlushLife is a gentle, private routine, habit, self-care, workout, and progress companion with optional Guardian support. PlushList is the adaptive daily checklist inside the app.

## Current status

PlushLife is independently owned and is currently in Google Play closed testing. The current Android testing line has reached build 30. Version 31 is a stability release focused on dependable hosting, cache updates, static deployment checks, and safer release preparation.

All current care, routine, Guardian, accessibility, and personalization features remain free, with no feature paywalls.

## Hosting

PlushLife currently keeps two web hosts available:

- Cloudflare Workers Static Assets: primary test deployment, built from the generated `www/` directory.
- GitHub Pages: existing production/backup web address while Cloudflare is fully tested.

Cloudflare builds run `npm run web:sync`, which validates the required static files, rebuilds `www/`, copies all app assets, replaces public CDN scripts with locally vendored copies, and deploys only `www/` through `wrangler.jsonc`.

Do not remove GitHub Pages or change the Android `server.url` until Cloudflare login, existing profiles, Supabase requests, notifications, navigation, refresh behavior, service worker, icons, and mobile layout have been tested successfully.

## Required checks

Run these before merging a release:

```bash
npm ci
npm test
npm run web:sync
```

The generated deployment must contain the homepage, authentication pages, legal/support/account-deletion pages, manifest, service worker, icons, application assets, and locally vendored browser dependencies.

## Database setup

Before deploying the adaptive care system for the first time, run `database/plushlife-care-system.sql` in the Supabase SQL editor. It adds adaptive habit labels, mood and energy fields, private care-session outcomes, PlushPath progress, consent-based Guardian support requests, and row-level security policies.

Do not rerun migrations blindly against production. Review the SQL and current migration state first.

## Android releases

Android uses the package name `com.PlushLife`. Closed-testing workflows build signed Android App Bundles using repository secrets and publish them to the Google Play closed-testing track. Do not change the package name, signing identity, production database, or Google Play production release as part of routine web-hosting work.

Historical one-off release workflows remain in `.github/workflows/` for auditability. They should not be reused without checking the target version code and release track.

## Ownership and permitted use

Copyright © 2026 Sable Johnston. All rights reserved.

PlushList™ and its original source code, mascot, artwork, interface, written content, and branding are proprietary. This public repository is available for viewing, but no permission is granted to copy, modify, redistribute, host, sell, or create derivative works from it.

See [LICENSE](./LICENSE) for the complete proprietary rights notice. Third-party components remain subject to their respective licenses.
