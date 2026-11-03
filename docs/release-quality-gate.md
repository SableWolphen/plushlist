# PlushLife release quality gate

The quality gate groups existing deterministic regression tests into seven critical product journeys: onboarding, task creation/completion, calendar/save reliability, Guardian permission and account boundaries, progress/rewards, mobile usability, and billing/free-beta safeguards.

## Run it

```sh
npm ci
npm test
npm run qa:release
npm run qa:release -- --json
npm run qa:release -- --output /tmp/plushlife-release-check.md
npm run web:sync
```

`npm test` checks the gate's manifest, reporting logic and fail-closed behavior in CI. The separate `npm run qa:release` command **actually executes** its selected critical checks and emits an inspectable result. The full `npm test` suite remains authoritative for other regressions.

The release gate exits nonzero for failures, writes Markdown by default, and can write JSON for a machine-readable result. It records the Git SHA from `GITHUB_SHA` when present. It does **not** create test accounts, change permissions, touch databases, activate billing, access live customer data, or deploy anything.

## Shipping criteria

Automated critical journeys passing is a necessary condition, **not** sufficient approval for every production release. In addition to this gate:

- Review all full-suite test and CodeQL jobs for **the exact candidate SHA**. Do not ignore a pending or failed Android job.
- Verify web output integrity and the real GitHub Pages deployment outcome after a safe merge.
- Validate the approved five destinations Today, Plan, Care, Progress, Guardian and the current reference layout with visual/mobile review.
- For Android or releases touching account/Guardian behavior, document physical device and backend authorization/role-isolation tests using controlled test accounts.
- Verify screen-reader/large text/keyboard behavior on real devices or supported emulators; a JSX source check is not the same evidence.
- For paid subscriptions, require Google Play sandbox purchase, restore, renew, refund, cancel, grace/hold, account switching and server entitlement verification before any activation.
- Never automatically move a public Google Play release track or charge users based only on this gate.

## Interpreting the report

The result intentionally separates **automated_code_checks_passed_external_verification_required** from **code_checks_failed** and marks external evidence `not_verified`. Neither case pretends to validate production customer data or live billing.

If a check fails, the report includes its check name, exit status and a bounded error-output tail for debugging. Save internal reports outside the public repo if command output contains non-public details.

## Roadmap after the gate

1. Run this gate on candidate releases and address repeated failures.
2. Extend deterministic React interaction tests around actual first-run/onboarding, offline saves and task editing.
3. Add a separate sandbox end-to-end fixture using *synthetic* Cozy and Guardian accounts. Test revocation and cross-account data boundaries; never run destructive tests against production users.
4. Automate visual screenshots and accessible interaction testing in Android emulator with consistent reference data.
5. Establish an evidence-based release scorecard reporting crash-free usage, user retention and verified server sync, with safe rollbacks.

The gate is deliberately additive: it uses already-maintained tests instead of replacing CI or changing production release workflows.
