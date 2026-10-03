# GitHub Actions guide

The filenames of historical workflows are retained so existing run links remain useful.

| Workflow | When it runs | Purpose |
| --- | --- | --- |
| `closed-testing-version-44.yml` | Every main push or manual retry | Current automatic production Play release, despite the historical filename. Runs tests, builds, signs, and publishes only when credentials are available. |
| `android-release.yml` | Manual dispatch | Signed bundle with user-supplied version and optional Play publication to the selected track. |
| `closed-testing.yml` | Dispatch or main commit containing `[release-45]` | Historical version 45 closed-testing retry. Ordinary main pushes skip the job intentionally. |
| `deploy-pages.yml` | Main push or dispatch | Tests and builds the shared artifact, then publishes GitHub Pages. |
| `deploy-cloudflare.yml` | Main push or dispatch | Requires credentials, tests and builds the shared artifact, then publishes Cloudflare. |
| `codeql.yml` | Configured pushes, PRs and schedule | Java/Kotlin, JavaScript/TypeScript and Actions security analysis. |
| `premium-smart-check.yml` | Original personalization branch or dispatch | Historical feature validation; full tests also run in release/deploy workflows. |
| `export-upload-cert.yml` | Dispatch | Export upload certificate for release administration. |
| `zepp-balance2-build.yml` | Configured wearable changes or dispatch | Companion wearable validation/build. |

Do not rerun a historical publishing workflow to repair a general app failure. Inspect the failed run and its publishing track first. This cleanup changes display names only; triggers, signing, versioning, deployment targets, and publication guards are preserved.
