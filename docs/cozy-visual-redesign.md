# PlushLife — cohesive cozy visual redesign

## Guardrails
Keep the original mascot's purple outline, green spikes, orange tail, face and proportions. Keep existing Today / Plan / Care / Progress / Guardian bottom navigation, existing consent and sharing rules, accessible motion preferences, dark appearance, current free-beta access, and user history. Do not add database migrations, new SDKs, release-pipeline changes or notifications.

## 1. Shared visual system — first implementation
- The new `assets/cozy-visual-polish.css` adds consistent card radii, spacing, headline wrapping, focus states, subtle shadows and restrained tactile feedback.
- Colors continue to resolve from the existing per-world `--pl-theme-*` variables. Do not hard-code one palette across all existing custom themes.
- Existing Nunito and Quicksand font files are reused; nothing is fetched from a third party.
- The original theme-scene SVG only receives an optional, short entrance animation; `prefers-reduced-motion` disables it.
- Mobile 390px and smaller retains compact padding and 44px+ interactive control sizes.

## 2. Today + Plan / Tasks — interaction follow-on
- Today remains the one-glance home: mascot greeting, one next step, up to two next tasks, progress, then an explicitly expanded More for Today.
- Make a single primary “Add task” action visible. Preserve recurring tasks, schedule details, completion, retry and offline behavior.
- In Plan, group calendar, tasks, and recurring routines clearly without duplicating today's completed items. Keep stored values and completion semantics untouched.
- Test 320px, 390px, 768px, and 1440px; keyboard, screen reader and Android Back.

## 3. Guardian — interaction follow-on
- Preserve the existing calmer Guardian workspace and Overview / Tasks / Check-ins / Reference / Agreement within it.
- Avoid additional nested tabs and unsolicited modal prompts. Surface empty and revoked-sharing states without revealing private mood or journal entries.
- Check guardian/cozy consent isolation, revocation, focus and Android Back on a real build.

## 4. Mascot expressions and motion — follow-on
- Reuse existing happy and default mascot SVG variants in `assets/figma/`; never recolor/redraw mascot.
- Display context-appropriate happiness only after confirmed completion, not on failed saves; neutral for rest and difficult moods.
- Keep motion optional, brief, silent, nonblocking and disabled by reduced-motion.

## 5. Theme customization — follow-on
- Keep existing world selector and dark/light preference independent. Show a real miniature preview and a selected state per theme.
- Persist chosen world and appearance through sign-in, sign-out, app restart and Android update; do not reset personal themes.
- Verify text contrast, form visibility, background treatment and accessibility for every existing world.

## 6. Onboarding and empty states — follow-on
- Reuse the small existing onboarding (name + optional support question), first task and welcome mascot.
- Empty task, progress and Guardian screens each need one calm sentence and a single actionable next step.
- Never fabricate history or Guardian consent. Avoid guilt, streak pressure or forced account setup.

## Release acceptance
1. CI passes full `npm test`, `npm run web:sync`, bundle budgets and Android packaging checks.
2. Review 320/390/768/1440 widths, light/dark, every theme and reduced-motion.
3. Validate tasks, recurring schedules, all five tabs, onboarding, save failure, authentication, privacy/revocation and offline recovery.
4. Test Android on device and review the exact release commit before publishing. Cosmetic polish is not proof that Google Play production has been updated.

The first PR ships only the low-risk shared CSS pass. Later interaction and content changes stay separate so they can be reviewed and tested without touching backend data.
