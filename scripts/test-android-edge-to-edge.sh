#!/usr/bin/env bash
set -euo pipefail
# The optimized app and test APK share only CI's debug signing key.
adb install -r android/app/build/outputs/apk/release/app-release.apk
adb install -r android/app/build/outputs/apk/androidTest/release/app-release-androidTest.apk
adb shell settings put secure show_ime_with_hard_keyboard 1
for mode in gestural threebutton; do
  evidence="android/app/build/outputs/smoke/api-$1-$mode"
  mkdir -p "$evidence"
  adb logcat -c
  adb shell cmd overlay enable-exclusive --category "com.android.internal.systemui.navbar.$mode"
  overlays=$(adb shell cmd overlay list)
  grep -F "[x] com.android.internal.systemui.navbar.$mode" <<< "$overlays"
  adb shell cmd overlay enable-exclusive --category com.android.internal.display.cutout.emulation.tall
  overlays=$(adb shell cmd overlay list)
  grep -F '[x] com.android.internal.display.cutout.emulation.tall' <<< "$overlays"
  adb shell am instrument -w -e class com.PlushLife.EdgeToEdgeTest com.PlushLife.test/androidx.test.runner.AndroidJUnitRunner | tee "$evidence/instrumentation.txt"
  adb logcat -d -s PlushLifeEdgeTest:I AndroidRuntime:E '*:S' | tee "$evidence/layout.txt"
  grep -F 'OK (1 test)' "$evidence/instrumentation.txt"
done
