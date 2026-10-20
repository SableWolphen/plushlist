# PlushLife end-to-end acceptance matrix
Date: 2026-10-20
Branch: business-launch-2026; PR #364
Evidence: GitHub Actions CodeQL run 39420280964 succeeded, including `npm test`, `npm run android:sync`, and `./gradlew clean assembleDebug`. This is **automated build and regression evidence**, not live end-to-end certification.

## Required environments and proof
Use staging Supabase with exactly two non-production test accounts (Cozy A and Cozy B), one third Guardian account, an Android physical device installed via a test track, and payment-provider sandbox/test transactions after billing exists. Record build SHA, environment, timestamp, screenshots, sanitized logs, expected/actual result. Never use personal journal contents or payment secrets in logs. Automated PR CI must not use live payment credentials or production data.

Statuses: AUTOMATED = unit/regression coverage, MANUAL REQUIRED = not executed, BLOCKED = missing infrastructure. No row is labeled PASS until expected outcome and retained evidence exist.

| Domain | Minimum live acceptance scenario | Expected result | State |
|---|---|---|---|
| Cozy identity | Register A, verify email, login/logout, attempt expired recovery link, recover, reopen session | Correct owner/session, expired tokens rejected, user explicitly signed out | MANUAL REQUIRED |
| Tasks | Add/edit/complete/delete; refresh; offline edits then reconnect; switch dates | Saved once, correct date/account, no zombie tasks, no reward for deletion | MANUAL REQUIRED |
| Schedule | Edit and copy Mon→all days; save; refresh/relaunch; edit target date | All 7 days persist with correct times and no unexpected overwrite | MANUAL REQUIRED |
| Habit and progress | Complete a habit; save, refresh, reopen yesterday, verify history | History preserved without duplicates; correct timezone/day boundaries | MANUAL REQUIRED |
| Guardian | Invite A's Guardian; accept; share only progress; revoke while Guardian is viewing | Immediately lose revoked access, never expose private reflections or B | MANUAL REQUIRED |
| Rewards | Earn task reward, see in Cozy wallet, redeem, reopen, delete completed task | Only one reward earned/redeemed; redemption persists; no delete-based award | MANUAL REQUIRED |
| Bot Guardian | No human Guardian; enable care; advance time/day; disable; check rewards | Respect all care settings, award once when eligible, never auto-edit tasks | MANUAL REQUIRED |
| Themes and Baby Mode | Change every theme and mode, force-close/relaunch, rotate, increase font scale | Correct unique theme assets, persisted choice, no clipped controls, screen reader labels | MANUAL REQUIRED |
| Account isolation | A saves private reflection/task/reward; sign out and into B on same device; direct authenticated API attempts for A resource using B token | B cannot see or mutate A; RLS denies cross-account reads/writes; local caches cleared/scoped | MANUAL REQUIRED |
| Payments | Test mode checkout, rejected/duplicate webhooks, renew, failed charge, grace, cancel, refund, restore | Signed verified events, idempotent, correct server entitlement, no silent charges | BLOCKED: checkout/webhooks not implemented |
| Android | Install test-track signed AAB; cold/warm/restore startup, widget checks, notification permissions, background/Doze, app upgrade | No crashes, task actions sync, notifications appropriate, updates preserve data | MANUAL REQUIRED |
| Security and privacy | Verify DB RLS on every personal table including Guardian grants, test delete/export, inspect account switching | Least privilege and complete owner isolation | MANUAL REQUIRED |

## Automated baseline actually observed
- CodeQL JavaScript/TypeScript: success
- CodeQL GitHub Actions: success
- CodeQL Java/Kotlin: success
- Complete app tests step: success
- Capacitor Android sync step: success
- Gradle `clean assembleDebug`: success
- Play Store publication job: skipped (pull request, not production)
- Live web host browser interaction: not verified
- Signed release bundle/Google Play installation: not verified
- Payment provider configuration, verified subscriptions, live entitlements: not implemented

## Release-blocking sign-off
Do not activate paid checkout, make production claims, or promote Android production until: all MANUAL REQUIRED cases pass with retained evidence; the payment BLOCKED case is implemented and tested in sandbox; the current database migrations and RLS are reviewed in staging; current legal, privacy and refund policy match actual behavior; and a production candidate signed AAB is tested through Play. No automatic approval based on unit tests alone.
