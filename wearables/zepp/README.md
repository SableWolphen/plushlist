# PlushLife for Zepp OS

The first real Zepp target is **Amazfit Balance 2** (480×480 round display, Zepp OS 5 / API_LEVEL 4.2). The app targets all three published Balance 2 deviceSource variants: `9568512`, `9568513`, and `9568515`.

Current watch screens:
- Check-in: mood + energy saved locally on the watch.
- PlushTinyStep: one immediate gentle next action.
- PlushRescue: quick low-friction care actions.
- PlushFocus: start/stop a gentle focus block.
- Calm: short breathing/calm screen.

The initial build is intentionally offline-first. It does not modify the phone app or Supabase data yet. Phone/cloud sync will be added after the real-watch preview is proven stable.

## Build

Install Node.js and the official Zeus CLI, then run from this folder:

```bash
npm install
npm install -g @zeppos/zeus-cli
zeus build
```

GitHub Actions also builds a `.zab` artifact through `.github/workflows/zepp-balance2-build.yml`.

## Install on a real Balance 2

1. In the Zepp phone app, enable Developer Mode: **Profile → Settings → About → tap the Zepp logo seven times**.
2. Install the Zeus CLI on a computer and run `zeus login` once with the Zepp/Open Platform account used for development.
3. From `wearables/zepp`, run `zeus preview`.
4. Zeus displays a QR code.
5. In Zepp Developer Mode, open **Scan** and scan that QR code while the Balance 2 is connected.

The preview build is installed separately from Google Play; it goes directly to the Balance 2 through the Zepp app.
