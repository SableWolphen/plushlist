# Safe growth and E2E validation — October 20, 2026

## New automated coverage
- `scripts/test-synthetic-cozy-guardian.mjs`: synthetic account-key isolation, revocable Guardian action selection, task completion vs deletion reward logic, one-time reward redemption, fail-closed paid entitlement.
- `scripts/test-business-analytics.mjs`: strict allowlist for aggregate non-sensitive growth metrics. `COLLECTION_ENABLED=false`; nothing is transmitted or stored by this module.
- `scripts/test-android-release-contract.mjs`: inspect Android package, backup preference, notification permission, widget registration, signing/build configuration.
- Existing `scripts/test-subscription-policy.mjs`: checks unavailable checkout and signed-server entitlement policy.

## Explicit gaps; do not market as fully E2E tested
- Real sign-in with `plushlife.app+cozy@gmail.com` and `plushlife.app+guardian@gmail.com` requires authorized interactive sessions and email verification. No credentials or real auth tokens are accessed here.
- Actual Supabase row-level security, Guardian invite/accept/revoke and sync must be tested using staging accounts. Synthetic local key isolation does **not** prove DB isolation.
- Stripe/Google Play sandbox flows, webhook verification, renewal, refund, and cancellation are not implemented/verified. No live charges.
- Android device startup, widget, notification, offline, upgrades require physical test-track install.
- Marketing analytics is deliberately local-only/no collection, and sign-up referrals/customer email lists require consent and a provider-backed system before activation.

## Release policy
Never merge, publish, or collect payment solely because these tests pass. Review all failure logs, run `npm ci && npm test && npm run android:sync`, test real staging users, and confirm release signing and marketplace requirements.
