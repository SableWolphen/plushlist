# Building the signed PlushLife Android release

PlushLife builds with Java 21, Capacitor 8, Android compile/target SDK 36, and
Gradle 8.14.3. The same signed bundle can be built locally or by the manual
`.github/workflows/android-release.yml` workflow.

## Upload key

The PlushLife upload key was generated on August 1, 2026 with alias
`plushlife-upload`, RSA 4096, and a 10,000-day validity period.

The keystore and passwords must never be committed. The local copies live at:

- `%LOCALAPPDATA%\PlushLife\signing\plushlife-upload.keystore`
- `%LOCALAPPDATA%\PlushLife\signing\release-secrets.dpapi`

`release-secrets.dpapi` is encrypted to the current Windows account. Back up
both files to secure storage. When Play App Signing is enabled, Google Play
protects the app-signing key and has a separate recovery process for replacing
a lost or compromised upload key.

## GitHub Actions secrets

The repository has these encrypted Actions secrets:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

They are exposed to the manual release workflow and to the
closed-testing-version-43 / closed-testing-version-44 workflows, which also
decode the keystore to sign their builds. The decoded CI keystore
is deleted after every run, including failed runs.

## Run a release build

Open **Actions → Build signed Android App Bundle → Run workflow** and provide:

- `versionCode`: a positive integer higher than every previous Play release.
- `versionName`: the user-visible version, such as `1.0.0`.

The workflow installs Android API 36, builds and signs the AAB, validates it
with Google's `bundletool`, verifies `targetSdkVersion=36`, checks the signing
certificate owner, and uploads the AAB as a workflow artifact.

If the `PLAY_SERVICE_ACCOUNT_JSON` secret is set, it also publishes the AAB
straight to the Google Play track you choose (`internal` by default) — see
[`google-play-auto-publish.md`](./google-play-auto-publish.md) for setup.
Without that secret, the workflow behaves exactly as before: nothing is
published automatically, you just get a downloadable artifact.

## Notifications

The Android app requests the Android 13+ notification permission, creates the
`plushlife-care` channel, registers a Firebase Cloud Messaging token, and saves
that token to the signed-in user's RLS-protected `push_subscriptions` row.

Native delivery also requires a Firebase Android app registered for package
`com.PlushLife`, its `google-services.json` in `android/app/`, and server-side
FCM credentials stored as Supabase Edge Function secrets. Never put a Firebase
service-account private key in this repository or in browser-delivered code.

## Local development

Debug builds use Android's generated debug keystore. Release signing activates
only when the four `PLUSHLIFE_*` environment variables are present.
