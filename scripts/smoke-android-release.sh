#!/usr/bin/env bash
set -euo pipefail
apk=android/app/build/outputs/apk/release/app-release.apk
test -s "$apk"
test -s android/app/build/outputs/mapping/release/mapping.txt
adb install -r "$apk"
adb logcat -c
adb shell am start -W -n com.PlushLife/.MainActivity
sleep 12
adb shell pidof com.PlushLife
logs=$(adb logcat -d)
if printf '%s' "$logs" | grep -q 'FATAL EXCEPTION'; then
  printf '%s\n' "$logs" | grep -A 35 'FATAL EXCEPTION'
  exit 1
fi
# Runtime plugin initialization proves the reflected bridge survived R8.
printf '%s' "$logs" | grep -q 'Registering plugin instance: SystemBars'
printf '%s' "$logs" | grep -q 'Registering plugin instance: WidgetBridge'
if printf '%s' "$logs" | grep -q 'Registering plugin instance: StatusBar'; then
  echo 'Legacy StatusBar plugin unexpectedly packaged'
  exit 1
fi
echo 'Optimized Android launch and native bridge registration passed.'
