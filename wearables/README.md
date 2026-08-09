# PlushLife Wearables

PlushLife's watch strategy is a companion experience, not a tiny copy of the phone app. Every watch build should keep the same core jobs: quick check-in, next task, PlushTinyStep, PlushRescue, PlushFocus, breathing/calm, and glanceable progress.

## Platforms

- Wear OS — Pixel Watch, Galaxy Watch 4+ and other modern Wear OS devices.
- watchOS — Apple Watch.
- Zepp OS — Amazfit / Zepp watches.
- Garmin Connect IQ — Garmin watches that support Connect IQ apps/widgets.
- HarmonyOS Wearable — Huawei watches that support third-party wearable apps.

Samsung Galaxy Watch 4 and later are covered by the Wear OS build, so PlushLife does not need a separate modern Samsung watch app.

## Shared v1 feature contract

1. Mood + energy check-in.
2. Today's next 1–3 tasks.
3. PlushTinyStep.
4. PlushRescue.
5. PlushFocus timer.
6. Breathing / calming tool.
7. Glanceable progress surface (Tile, complication, widget, shortcut card, or equivalent).
8. Offline-first action queue with sync to PlushLife when connectivity returns.

Long-form journal writing, account management, Guardian setup, backup/restore, and detailed schedule editing stay on the phone.

## Repository layout

- `wearables/shared/` — platform-neutral product/data contract.
- `wearables/wear-os/` — Wear OS foundation and integration notes.
- `wearables/watchos/` — Apple Watch foundation and Xcode implementation notes.
- `wearables/zepp/` — Zepp OS Mini Program foundation.
- `wearables/garmin/` — Connect IQ foundation.
- `wearables/huawei/` — HarmonyOS wearable foundation.

The watch code is intentionally isolated from the current Android phone build until each target can compile independently. That keeps existing phone releases safe while the wearable clients are built and tested.
