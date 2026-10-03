# Build dependency security

The cleanup audit found five affected packages: two high severity transitive dependencies and the moderate uuid → xcode → Capacitor CLI chain.

The lockfile upgrades `@xmldom/xmldom` from 0.9.10 to 0.9.12 and `brace-expansion` from 5.0.9 to 5.0.12 within their existing dependency ranges. A scoped `xcode` override selects `uuid` 11.1.1, the patched release that retains the CommonJS `uuid.v4()` API xcode uses. Capacitor platform/plugin versions remain pinned and unchanged. No force upgrade or CLI downgrade is used.

`scripts/test-build-dependencies.cjs` checks that xcode still generates valid, unique PBX identifiers. Revisit the override when xcode updates its own dependency. The clean installation audit currently reports zero vulnerabilities; rerun `npm audit` because advisory status changes over time.

Reference: [uuid advisory and patched versions](https://github.com/advisories/GHSA-w5hq-g745-h8pq).
