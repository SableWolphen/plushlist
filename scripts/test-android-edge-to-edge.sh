#!/usr/bin/env bash
set -euo pipefail
# The optimized app and its test APK share only CI's debug signing key.
# Real system overlays exercise navigation modes and display-cutout insets.
adb shell settings put secure show_ime_with_hard_keyboard 1
for mode in gestural threebutton; do
  adb shell cmd overlay enable-exclusive --category "com.android.internal.systemui.navbar.$mode"
  if ! adb shell cmd overlay list | grep -F "[x] com.android.internal.systemui.navbar.$mode"; then
    echo "Navigation overlay was not applied: $mode"
    exit 1
  fi
  adb shell cmd overlay enable-exclusive --category com.android.internal.display.cutout.emulation.tall
  adb shell cmd overlay list | grep -F '[x] com.android.internal.display.cutout.emulation.tall'
  (cd android && ./gradlew --no-daemon :app:connectedReleaseAndroidTest -PplushlifeSmokeTest -Pandroid.testInstrumentationRunnerArguments.class=com.PlushLife.EdgeToEdgeTest --rerun)
  mkdir -p "android/app/build/outputs/smoke/api-$1-$mode"
  cp -R android/app/build/outputs/androidTest-results/connected/. "android/app/build/outputs/smoke/api-$1-$mode/"
  adb logcat -d -s PlushLifeEdgeTest:I '*:S' > "android/app/build/outputs/smoke/api-$1-$mode/layout.txt"
done
