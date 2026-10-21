# PlushLife production readiness — October 2026

## Product contract
- PlushLife provides automatic daily guidance, task and habit help, reminders, care suggestions and activity rewards without requiring any Guardian.
- Guardian means an *optional trusted person*: invitation, sharing permissions, messages, and human-sent gifts. A human Guardian never silently modifies a Cozy's plan.
- Home shows a check-in and one useful next action; Tasks contains task, habit, and schedule editing; Care is immediate support; Progress contains journal and rewards.
- Child-simple UI requires large targets, readable labels, screen-reader announcements, offline-safe navigation and no unrequested popups.
- Rewards are optional treats. Essential care and rest never depend on accomplishments; gift redemptions must be idempotent. Deleting tasks must not earn rewards.

## Production blockers
- PR #364 is currently reported unmergeable against main, which received Android edge-to-edge PR #368.
- Branch is diverged (59 ahead, 4 behind as checked 2026-10-21). Reconcile overlapping changes, especially src/app-source.jsx, index.html and package.json, without dropping Android fixes or user data.
- No confirmed green full CI run on latest business-launch branch head. Run npm ci, npm test, npm run android:sync, Android emulator suites and signed release build.
- Test Cozy and Guardian *real* login/account-isolation, schedule saving/copying/editing, offline completion/sync recovery, rewards earned/used-once, push reminders, Android back navigation and small screens.
- Test the older automatic Guardian preferences/rewards migration before removing legacy storage or keys. No data wipe.
- Verify Android signing credentials, Play service-account permissions, unique version code, and actual target track. Verify release contents and Play policy compliance.
- Billing remains disabled until server-side purchase verification, Play policy review and separate testing. Production rollout of these unrelated payments is not authorized by this checklist.

## Deploy order
1. Reconcile branch against current main; preserve all merged Android fixes.
2. Run complete tests and fix any failures. Inspect the generated APK/AAB and signed release.
3. Verify real-device user journeys and privacy/notification behavior.
4. Obtain confirmed green CI and merge PR into main.
5. Explicitly request production Play publishing using the existing trusted production marker / workflow only after gates pass. Track Play Console rollout status and monitor crashes.
6. Do not claim live or published until Play Console confirms the release.

This document records gates, not a claim that any gate has passed.
