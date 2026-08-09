# PlushLife for Zepp OS

The first real Zepp target is **Amazfit Balance 2** (480×480 round display, Zepp OS 5 / API_LEVEL 4.2). Its v3 screen target (`r` / `w480`) covers all three published Balance 2 deviceSource variants: `9568512`, `9568513`, and `9568515`.

Current watch screens:
- My tasks: pairs to a signed-in PlushLife account and syncs today's tasks and check-offs through the Zepp phone app.
- Check-in: mood + energy saved locally on the watch.
- PlushTinyStep: one immediate gentle next action.
- PlushRescue: quick low-friction care actions.
- PlushFocus: start/stop a gentle focus block.
- Calm: short breathing/calm screen.

Check-in, Tiny Step, Rescue, Focus, and Calm remain available without an account. Task sync requires the Zepp phone app to have network access.

## Connect to PlushLife

1. Open **My tasks** on the watch. The watch shows an eight-character code.
2. On the phone, sign in to PlushLife (website or Google Play app).
3. Open **Settings → Connect Watch**, enter the code, and tap **Connect**.
4. Tap **I connected it** on the watch.

The code expires after 15 minutes. PlushLife credentials never go to the watch; it receives a separate revocable device credential. A person without an account is prompted to create one on the phone first.

## Build

Install Node.js, then run from this folder:

```bash
npm ci
npm run build
```

The project pins the verified official Zeus CLI release locally. The `.zab` is written to `dist/`. GitHub Actions also builds and uploads it through `.github/workflows/zepp-balance2-build.yml`.

## Install on a real Balance 2

1. In the Zepp phone app, enable Developer Mode: **Profile → Settings → About → tap the Zepp logo seven times**.
2. On Windows, double-click `preview-balance2.cmd`. On macOS/Linux, run `npm ci`, then `npm run preview` from `wearables/zepp`.
3. Complete the one-time Zepp/Open Platform login when Zeus opens it.
4. Zeus displays a QR code.
5. In Zepp Developer Mode, open **Scan** and scan that QR code while the Balance 2 is connected.

The preview build is installed separately from Google Play; it goes directly to the Balance 2 through the Zepp app.
