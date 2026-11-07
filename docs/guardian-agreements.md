# Optional Guardian Agreements

Supportive Guardian remains the default. Existing relationship acceptance,
sharing permissions, rewards, private tasks, journals and daily mood history
are separate from Guardian Agreements. Existing support notes and relationship
role presets are not evidence of agreement consent. No accounts are opted in
or backfilled.

## Consent and relationship boundaries

- A proposal records the proposer's consent to immutable expectations,
  boundaries, support style, optional rewards and optional consequences.
  The other authenticated participant must explicitly accept the same record.
- Accountability is effective only on an accepted agreement within an active,
  accepted relationship. A pending proposal grants nothing. Supportive proposals
  cannot contain consequences. No endpoint applies consequences, removes earned
  rewards, edits progress or penalizes missed tasks.
- Either participant may revoke a proposal or accepted agreement immediately,
  even while the underlying relationship is paused. Revocation is terminal.
  Revising terms requires a new proposal and new acceptance from both people.
- Relationship pause, acceptance changes or participant changes revoke all live
  agreements. Resuming a relationship never restores consent. Deleting a
  relationship cascades its agreement records, shared tasks and check-ins.
- Each record belongs to one relationship ID and stores both participant UUIDs.
  No global accountability flag or shared cross-relationship workspace exists.
  A new invitee cannot inherit a previous participant's agreement.

## Tasks and check-ins

Shared tasks live in a separate table. They are suggestions until the assignee
accepts them; only that person can decline or mark them complete. A proposer may
withdraw an outstanding suggestion. These statuses never update existing task
completion, statistics, rewards or history.

New check-ins are private by default. An author may explicitly share an entry
with this relationship, make it private again or delete it. Another participant
cannot change its visibility. Sharing is per entry, with no access to existing
daily mood records. After revocation, shared check-ins and tasks disappear from
the other person's view. Authors retain read, unshare and delete access to their
own entries while the relationship records still exist.

## Server enforcement

All three new tables enable RLS and grant authenticated users SELECT only.
Anonymous users have no table or RPC access. Public RPCs are security invokers;
their narrow privileged implementations are in the non-exposed
`guardian_private` schema, with an empty search path and explicit authentication
and participant checks. No user-editable metadata or caller-supplied identity
establishes membership. The invited account is resolved server-side through
`auth.users`; accepted reads additionally verify its current relationship.

Every mutation locks the relationship before the agreement. This serializes
acceptance, revocation, child writes and connection changes, preventing a stale
acceptance from restoring withdrawn consent. There are no direct table writes,
arbitrary patches, automatic consequences, new third-party services or billing
changes. New UI queries fail closed on missing tables/RPCs, permission failures
or offline errors; no consent is cached locally or queued for offline replay.
Account/relationship switches discard drafts and old requests. Refresh and
returning to the foreground reload server consent.

## Verification and release boundary

`scripts/test-guardian-agreements.mjs` runs the actual SQL against a disposable
PGlite PostgreSQL engine using separate anonymous and authenticated roles. It
covers mutual acceptance, denied direct writes, task decisions, mood privacy,
relationship isolation, revocation and relationship changes. CI additionally
runs it against PostgreSQL 17 with separate connections to test an acceptance
queued behind revocation. The optional database URL is restricted to loopback
and the disposable `guardian_agreements_test` database; the test never uses the
app's Supabase URL, account tokens or real user data.

UI tests cover supportive defaults, explicit proposal consent, invalidation of
that consent when terms change, private-by-default check-ins, relationship and
account switches, and unavailable-backend behavior. Full app tests, the critical
journey gate, web bundle budget and CodeQL remain required.

The migration is proposed repository code, not a claim that it is applied to
production. The connected Supabase accounts did not expose PlushLife's project
at implementation time. Existing production RLS, grants, schema history and
advisors therefore remain unverified. No hosted SQL was run. Before activation,
verify the live baseline, exercise these role tests against the actual baseline
in an isolated database, verify PostgREST RPC grants and exposure (keep
`guardian_private` out of exposed schemas), and exercise two real accounts and
Android accessibility/foreground flows. Apply the reviewed additive migration
only after that evidence is available. Do not backfill acceptance or change
existing sharing permissions as part of rollout.

Play publishing is production-only in the separate release safeguard. Uploads
require `PLAY_PRODUCTION_RELEASE_SHA` to equal the exact main revision and all
three CodeQL jobs to pass. Do not set this variable merely because CI passes:
live authorization, migration compatibility and device evidence are still
required. No testing-track publication is an alternative to those safeguards.
