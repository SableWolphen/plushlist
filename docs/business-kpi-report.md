# Verified PlushLife business KPI reports

This feature calculates a **local, aggregate-only** monthly performance snapshot from independently verified numbers. It does not install analytics, collect user data, connect billing accounts, or change anyone's entitlements. Do **not** populate reports from simulated model outputs and present them as actual revenue.

## Running a report
Save a local JSON object like the template below outside the Git repository (numbers intentionally **omitted**; never commit user data or financial reports). Required: `period` and `source`. Other fields may be omitted, resulting in **unknown** rather than zero.

```json
{
  "period": "2026-11",
  "source": "Play Console and bookkeeping aggregates",
  "paidAccounts": null,
  "signups": null,
  "firstTaskIn24h": null,
  "d7Eligible": null,
  "d7Retained": null,
  "recognizedRevenueCents": null,
  "refundsCents": null,
  "storeFeesCents": null,
  "variableCostsCents": null,
  "fixedCostsCents": null,
  "marketingCents": null
}
```

Run `node scripts/business-kpi-report.cjs /path/to/local-aggregate.json` and `npm test -- business-kpi-report`. The CLI prints activation rate, D7 retention, recognized revenue, operating profit when costs are complete, and explicit missing fields. It does not save the input or output.

## Source reconciliation
- `paidAccounts`: paid active entitlements at month-end, verified by the subscription backend and reconciled to Play; never inferred from checkout clicks.
- `signups` and `firstTaskIn24h`: same signup cohort, no duplicated accounts, first task within 24 hours.
- `d7Eligible` and `d7Retained`: same signup cohort eligible for a full D7 measurement window; specify timezone and cohort in the accounting workpaper.
- `recognizedRevenueCents`: dollars recognized for that service month in cents, excluding sales taxes; allocate annual-plan prepayments to covered service months.
- `refundsCents`: refunded recognized amounts not already deducted from recognized revenue (avoid double counting).
- `storeFeesCents`: actual applicable payment/marketplace fees.
- `variableCostsCents`: usage-linked infrastructure/support expenses.
- `fixedCostsCents`: fixed hosting, tools, staff and operating overhead **excluding marketing**.
- `marketingCents`: actual attributable paid marketing expense; record $0 only if verified no spend.
- Owner compensation and income tax must be reconciled separately unless explicitly included in costs. This report is operating profit, not owner take-home.

## Privacy
Use only approved and reconciled aggregates. No names, emails, user IDs, journal entries, moods, task descriptions, Guardian links, purchase tokens or device identifiers. An unsupported input key is rejected. Store any non-public workpapers in access-controlled systems, not the public repository. Never infer a missing cost as zero.

## Next phase
Replace manual aggregate inputs with source-verified, access-controlled reports from Google Play Console and approved infrastructure/expense providers, **only after** consent, data-flow review, billing security review and dashboard permissions tests. See issue #387 and `docs/profitability-program.md`.
