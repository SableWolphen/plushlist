# GitHub Actions guide

The filenames of historical workflows are retained so existing run links remain useful.

| Workflow | When it runs | Purpose |
| --- | --- | --- |
| `closed-testing-version-44.yml` | Manual dispatch only | Historical production release retained for audit/recovery. It no longer runs on every main push. |
| `auto-play-release.yml` | After a successful `CodeQL` run on `main` | The single automatic Google Play publisher. Runs the full tests/build again, resolves an unused Play version, signs, validates, and normally publishes to `PLAY_AUTO_TRACK` or `alpha`. A trusted main commit containing `[play-production]` opts that one release into the public `production` track. |
| `android-release.yml` | Manual dispatch | Signed bundle with user-supplied version and optional Play publication to the selected track. Shares the same Play concurrency lock as automatic publishing. |
| `closed-testing.yml` | Manual dispatch only | Historical version 45 closed-testing retry. It never runs on ordinary main pushes. |
| `deploy-pages.yml` | Main push or dispatch | Tests and builds the shared artifact, then publishes GitHub Pages. |
| `deploy-cloudflare.yml` | Manual dispatch | Verification/fallback publisher for Cloudflare. The connected Cloudflare Git integration owns normal web production deploys. |
| `codeql.yml` | Configured pushes, PRs and schedule | Java/Kotlin, JavaScript/TypeScript and Actions security analysis. |
| `premium-smart-check.yml` | Original personalization branch or dispatch | Historical feature validation; full tests also run in release/deploy workflows. |
| `export-upload-cert.yml` | Dispatch | Export upload certificate for release administration. |
| `zepp-balance2-build.yml` | Configured wearable changes or dispatch | Companion wearable validation/build. |

Do not rerun a historical publishing workflow to repair a general app failure. Inspect the failed run and its publishing track first. Only `auto-play-release.yml` should own automatic Play publishing. Historical release files remain for auditability, but must stay manual-only so two pipelines cannot race the same Google Play release.

For public Android releases, use the `[play-production]` marker only on the exact trusted main commit that should go to the Google Play production track. The next ordinary main push automatically returns to the configured testing track.
