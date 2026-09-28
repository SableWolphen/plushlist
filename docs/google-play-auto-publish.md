# Auto-publishing Android releases to Google Play

By default, the release workflow only builds a signed `.aab` and hands it to
you as a downloadable artifact — you still upload it to Play Console
yourself. Adding one GitHub secret turns on direct publishing, so a workflow
run ends with the release already live on the track you choose, no manual
upload step.

This is entirely optional. Skip this doc if you'd rather keep uploading by
hand — nothing else about the release workflow changes either way.

## What you're trading off

A Play Console service account key is a real credential: whoever holds it can
publish releases to your app without going through the Play Console UI.
Treat it like the signing keystore secrets already in this repo — it only
belongs in GitHub Actions secrets, never committed, never logged.

Note: `capacitor.config.json` currently sets no `server.url`, so the Android
app serves its bundled `www/` build rather than loading live from GitHub
Pages. Web-content changes therefore only reach the installed app through a
new Android release (the GitHub Pages and Cloudflare web deployments update
on their own). A new release is always needed for native-level changes
(permissions, app icon, splash screen, push notification plumbing, the
widget) — and, with the current config, for web changes too. If native-level
changes are infrequent for you, doing that occasional upload by hand may be
simpler than maintaining this credential. If you'd rather not set this up,
just keep using the workflow as-is.

## Setup steps (one-time)

1. **Google Cloud Console** — create (or reuse) a project, then create a
   *service account* under IAM & Admin → Service Accounts. Give it a
   descriptive name like `plushlife-play-publisher`.
2. On that service account, create a new **JSON key** (Keys → Add key → JSON)
   and download it. This file is the credential — keep it out of the repo.
3. **Google Play Console** — go to Users and permissions → Invite new user,
   and invite the service account's email address (it looks like
   `plushlife-play-publisher@your-project.iam.gserviceaccount.com`).
4. Grant it at minimum: **Releases** → "Create and edit draft releases" and
   "Release to production, alpha, beta, internal testing tracks" for the
   PlushLife app specifically (not organization-wide access).
5. Google Play requires at least one manual release to already exist on the
   app before the API can publish to it — you've already done this if
   PlushLife is live on Play.
6. **GitHub** — in this repo's Settings → Secrets and variables → Actions,
   add a new secret named `PLAY_SERVICE_ACCOUNT_JSON` and paste the entire
   contents of the JSON key file as its value.

That's it. The next time you run **Actions → Build signed Android App
Bundle → Run workflow**, pick a `track` (defaults to `internal`, the safest
choice — nothing reaches real users until you promote it in Play Console),
and the workflow will publish there automatically after building and
validating the AAB.

## Reverting

Delete the `PLAY_SERVICE_ACCOUNT_JSON` secret from GitHub at any time to turn
this back off — the workflow falls back to the original download-and-upload
behavior automatically, since the publish step only runs when that secret is
present.
