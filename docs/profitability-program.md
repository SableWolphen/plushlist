# PlushLife $10,000/month operating-profit program

Status: **implementation in progress / prices are research-only**. Owner decision: target $10,000/month operating profit, not merely gross subscription sales. See issue #387.

## Definition and dashboard contract
Normalized monthly recognized subscription revenue (annual plans divided by service months, monthly plans recognized in their service month), net of refunds and sales tax, minus store fees, variable costs and fixed operating expense = operating profit. Track **cash collected**, **deferred annual revenue**, **payouts**, **recognized revenue**, **fees**, **refunds**, **marketing spend**, and **owner compensation** separately to avoid confusing cash with profit. Owner salary, income taxes and startup expenses are not part of the current base case and must be budgeted separately before interpreting the target as personal take-home.

## Research pricing (not active)
| Tier | Proposed monthly | Proposed annual | Free safeguards |
| --- | ---: | ---: | --- |
| Free | $0 | $0 | core daily tasks, schedules, check-ins, privacy, account deletion, basic Guardian consent |
| Plus | $6.99 | $49.99 | enhanced routines, optional advanced insights and customization |
| Together | $11.99 | $89.99 | Plus and proposed expanded permission-based Guardian coordination |

Preserve existing beta access until an explicit, informed transition. Do not enable charges, toggle entitlement enforcement, or automatically release to production from this document.

## Reproducible unit economics
Run `node scripts/profit-model.cjs` to emit JSON for the base case and a fee/expense sensitivity matrix. For other inputs:
```bash
node scripts/profit-model.cjs '{"subscribers":2000,"fixedMonthlyCents":300000}'
node scripts/test-profit-model.cjs
```
Base case: 70% annual Plus, 30% annual Together, 15% store/billing fees, $0.35 variable cost per paid customer per month, $4,000 fixed monthly costs (including $2,500 acquisition test budget). At 3,500 payers, model yields around $18,080 monthly gross revenue and $10,143 operating profit. **All numbers are assumptions**, not app analytics, invoices, Google Play payout data, or a forecast. Revenue from monthly plans, mixed offers, country-specific taxes, failed payments, refunds and churn will change reality.

## Acquisition decision gates
1. Get reliable aggregate counts of installs, first task creation, onboarding, D1/D7/D30 retention, pricing interest, subscribed users by plan and cancellations, with no diary/mood/task contents in analytics.
2. Measure organic/referral vs paid acquisition by channel and cohort. Test at least 20–30 prospective users; record paid willingness-to-pay and why.
3. Build actual cohort gross margin, refunds, monthly equivalent churn, CAC, renewal rate, LTV bounds, and CAC payback **before paid-channel scaling**.
4. Hold marketing at a small owner-approved cap initially. $2,500/mo in the model is a scenario allowance, not authorized spend.
5. Gate public launch on verified server-side billing entitlements, restore, refund, renewals, grace, cancellations, account deletion, and Android QA; protect existing beta users.

## Engineering work order
- **Gate 0:** fix #118, #119, #120, #126 and review PR #386 against main; test Guardian permissions and onboarding, Android screens, restart/offline flows.
- **Gate 1:** reconcile Google Play console subscription/payout facts to operations invoices and event-aggregated metrics. Add access-controlled admin reporting. No new SDK or sensitive third-party data flow without permission.
- **Gate 2:** test Google Play Billing in closed testing; never trust client entitlement state. Handle purchase tokens and service notifications on a protected backend; deduplicate events and provision only after verification.
- **Gate 3:** limited launch, retention experiments, transparent pricing and non-coercive onboarding.
- **Gate 4:** optimize churn, organic distribution, costs and renewals with monthly reviews, measuring progress toward 100, 500, 1,000, 2,000 and 3,500 active paid customers.

## Outstanding implementation dependencies
Google Play Console product/account setup and real billing sandbox, secure backend credentials and approved entitlement migration, legal/tax review, verified production costs, real user cohorts, rollout QA. This document and the pricing pages **do not implement those connections**.

## Failure conditions
No production rollout if Guardian can access unpermitted content, sign-up can't resume safely, billing is client-authoritative, purchase/refund test coverage is incomplete, or analytics transmit sensitive care/journal contents. No revenue claims from page views or hypothetical financial model outputs.
