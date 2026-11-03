# PlushLife business launch plan (draft)

Updated: November 3, 2026. **Planning only — payments and subscriptions are not active.**

## Positioning
**PlushLife — Care that fits today.** An approachable routine, habits, progress and self-care companion with optional consent-based Guardian support. The Cozy controls their schedule, data, and Guardian permissions. Not medical treatment or a crisis service.

## Pricing hypothesis (validate with real customer interviews)
| Plan | Proposed US price | Value |
| --- | --- | --- |
| Free | $0 | Tasks, routines, essential habits, grounding/care, check-ins, basic progress, account export/deletion, core Guardian consent and safety |
| Plus | $6.99/month or $49.99/year | Opt-in advanced trends and patterns, expanded personal planning insights, optional enhanced companion experiences |
| Together | $11.99/month or $89.99/year | Plus and optional additional Guardian/family coordination features |

These are **proposed** prices, not an active offer. Preserve existing beta access until a clearly communicated transition and consent to paid service. No lifetime purchases, loot boxes, or creator marketplace in the launch scope. Do not charge for basic safety/care, privacy/export/deletion, or basic accessibility.

## Launch gates — all must be true before accepting payments
- [ ] Complete product audit of core workflows (onboarding, schedule edit/copy/save, delete task, habit tracking, reward redemption, Guardian visibility and consent, multi-user isolation).
- [ ] Run `npm ci && npm test && npm run web:sync`; review automated test results. Check real devices too.
- [ ] Decide web checkout vs native billing compliant with current platform rules and markets; seek professional legal/tax guidance where appropriate. Do not assume Stripe checkout is allowed inside Google Play-distributed apps.
- [ ] Implement server-verified subscriptions and entitlements; no client-side purchase flags as the authority.
- [ ] Implement webhook signature verification, idempotency, grace periods, cancellations, payment failures and subscription restoration.
- [ ] Keep payment provider secrets server-side, never in repository, static app, or browser.
- [ ] Update Terms, Privacy, refund/cancellation rules, and support pages with accurate product/price details.
- [ ] Test live/sandbox purchase, restore, cancel, refund, expired plan, and non-subscriber flows. Never show success before server verification.
- [ ] Verify Cloudflare deployment before redirecting Android traffic; do not replace the Android server URL during this business planning change.
- [ ] Publish clear beta-to-paid communication without surprising or coercing existing users.

## First 30 days — validation before software billing complexity
**Week 1:** Interview 10–15 prospective users to learn what they value; baseline activation and seven-day retention in privacy-preserving aggregate form. Audit crash and schedule-save problems.

**Week 2:** Build an opt-in email interest form or provider-backed waitlist (with consent, verification, unsubscribe and privacy notice); do not commit email addresses in GitHub. Interview 10 more prospects.

**Week 3:** Test an *informational* pricing page and gather plan preference. Aim for 30–50 waitlist signups; do not claim these are customers.

**Week 4:** Choose one narrow premium differentiator based on feedback. Write acceptance criteria and billing architecture, then ship tested features and a compliant payment flow only after gates pass.

## Initial customer acquisition: $100 pilot ceiling (separate from long-term model)
- Free: existing Github Pages/Cloudflare hosting, product demos, social communities where self-promotion is allowed, organic educational content, honest founder updates.
- Optional domain: allocate at most $15 if needed.
- Research/recruitment: allocate at most $15; don't buy followers, scraped mailing lists or paid ads.
- Reserve: retain $70 for unforeseen expenses.
- Don't promise clinical outcomes; avoid mental-health targeting claims and protect user privacy.

## Metrics and unit economics
**Operating goal:** $10,000/month operating profit, not revenue. See [profitability model](docs/profitability-program.md), calculator `node scripts/profit-model.cjs`, and [growth experiments](docs/growth-experiments.md). The modeled $2,500 monthly acquisition line is an illustrative future scenario, not authorization to spend it.
Track: landing visitors, opt-in interest, onboarding completion, seven-day active retention, conversion to paid, cancellations, churn, support response time and refund rate. Use aggregate privacy-respecting data, not sensitive check-ins for advertising.

Revenue scenarios (gross, **before** processor fees, taxes, support and operating costs):
- 100 Plus monthly subscribers at $6.99 = $699/month.
- 500 Plus monthly subscribers at $6.99 = $3,495/month.
- 1,000 Plus monthly subscribers at $6.99 = $6,990/month.
- 1,000 Together monthly subscribers at $11.99 = $11,990/month.

## Non-goals
No unreviewed production releases, no live payment collection yet, no hidden paywall, no claims that subscriptions already work. Progress toward wealth is uncertain; gross monthly recurring revenue is not business profit or founder net worth.
