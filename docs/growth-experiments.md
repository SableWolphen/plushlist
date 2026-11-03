# PlushLife growth experiments: first 100 paying customers

**Status:** Internal launch playbook only. No advertisements, emails, social posts or paid subscriptions have been sent or activated. Owner approval required before public distribution, spending, changing data collection or charging customers.

## Who the product is for
Primary audience hypothesis: adults who struggle with traditional productivity apps and want gentler routines without guilt. Secondary hypothesis: people who coordinate support with a trusted friend, partner or caregiver through consent-based Guardian connections.

**Positioning**: "A gentler way to plan your day. When life feels like too much, start with one small step. Optional support from someone you trust, always on your terms."

No diagnostic or therapeutic outcome claims. Do not advertise using sensitive traits, journal/mood content, or private Guardian activity.

## Offer research
Research-only: Free, Plus ($6.99/mo, $49.99/yr), Together ($11.99/mo, $89.99/yr). Existing beta functionality stays free. Never imply features/checkout are available before delivery.
Questions to distinguish:
- Would people *use* the core daily task and routine product for two weeks?
- Which single recurring paid benefit earns willingness to pay?
- Do users prefer Plus or Together, and why?
- Would annual billing increase renewals or merely improve early cash flow?
- What stops users from returning after day 1?

## Consent-based interviews: 20–30
Invite interested testers without cold-messaging private groups or scraping user data. Present the beta as free and future pricing as hypothetical. Ask:
1. What was the last daily-planning task that felt overwhelming?
2. Show how you currently handle it; where does that system fail?
3. Without explanation, try adding a repeating task to PlushLife. What is confusing?
4. Set a Tiny or Soft day. Does that make the day clearer?
5. What would bring you back tomorrow? What might make you uninstall?
6. If relevant, would you invite a trusted person? Which information must remain private?
7. Which optional premium feature would be worth paying for every month?
8. At the proposed prices, which plan would you consider, or neither? What would need to change?
9. Can we contact you again? Record permission explicitly outside the public repository.

Log only consented research notes in an access-controlled location. Do not commit names, contact details, recordings or sensitive user stories.

## Four acquisition experiments
| Experiment | Implementation | Success signal | Stop/learn rule |
|---|---|---|---|
| Better Google Play listing | Draft before/after title, screenshots and description with truthful features; use official experiments after approval | Qualified listing conversion and new-user activation | Stop if installs rise but first-task creation falls |
| 3 short demonstration clips | Show creating one task, choosing Tiny/Soft/Rest, and optional Guardian boundaries using synthetic accounts | Referred, activated testers | Stop if engagement yields no activated users |
| Community value posts | Publish useful planning guidance where permitted, with plain disclosure of app connection | Organic activated users and meaningful feedback | Stop if posts are removed or poorly received |
| Opt-in tester referrals | Give testers a shareable plain link, optional only; no sharing of task or relationship data | Testers who create one task and return after 7 days | Stop if invitation pressure or privacy complaints emerge |

Do not buy ads, influencer posts, or email lists by default. Initial research budget ceiling from BUSINESS_LAUNCH.md is not an instruction to spend.

## Metrics specification (aggregate, privacy-minimal)
Until approved backend instrumentation exists, collect only verified *aggregate* counts from approved sources. Track source and observation window for each figure. Do not synthesize missing values.

- Exposure: eligible listing visitors, install clicks, installs (denominators are source-specific).
- Activation: **new signups who create their first task in 24 hours / new signups in cohort**.
- D7 retention: **new signups active on their seventh calendar day / eligible new signups**. Report timezone and eligible cohort size.
- Paid conversion: **accounts with an activated paid entitlement by day 35 / eligible installs**. This is not identical to conversion among registered users.
- Churn: **paid accounts lost during period / paid accounts at start**, with monthly vs annual renewal distinctions.
- CAC: **attributable acquisition cost / newly acquired paying customers**, net of refunds if applicable.
- Operating profit: recognized revenue less fees, refunds and operating costs; never treat annual cash prepayments as monthly profit.

Maintain a weekly decision log: experiment, start/end date, sample, cost, qualified installs, activated users, D7 eligible count, D7 retained count, paid users, reported privacy concerns, decision. A result with small samples is directional, not proof.

## Public copy draft (review before publishing)
**Headline:** A softer way through your day.
**Description:** When a big to-do list feels like too much, PlushLife helps you choose one manageable next step. Plan gentle routines, adjust your day to your energy, and celebrate progress without pressure. Invite someone you trust to help only if you want to.
**CTA:** Try the free beta.
**Disclosure:** PlushLife is a self-care and routine companion, not medical treatment. Premium plans are under consideration and are not for sale yet.

## First operating milestones
- 20–30 consented interviews; fix 3 biggest onboarding failures.
- 30–50 *opt-in* expressions of premium interest; do not call them paid customers.
- Reconcile onboarding and retention metrics before advertising.
- Closed-testing sandbox billing end-to-end, privacy and release gates passed.
- First 10 real paying subscribers after authorized launch, followed by 100, 500, 1,000, 2,000 and 3,500.

## Weekly CEO decision rule
Choose one bottleneck at a time: **unreliable product -> unclear activation -> weak retention -> weak willingness to pay -> inefficient acquisition -> renewal churn**. Only optimize the next downstream bottleneck when the upstream issue is understood. Keep all higher-risk changes in reviewable PRs with CI and production release approval.
