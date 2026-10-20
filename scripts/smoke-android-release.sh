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
if grep -q 'FATAL EXCEPTION' <<< "$logs"; then
  grep -A 35 'FATAL EXCEPTION' <<< "$logs"
  exit 1
fi
# Runtime plugin initialization proves the reflected bridge survived R8.
grep -q 'Registering plugin instance: SystemBars' <<< "$logs"
grep -q 'Registering plugin instance: WidgetBridge' <<< "$logs"
if grep -q 'Registering plugin instance: StatusBar' <<< "$logs"; then
  echo 'Legacy StatusBar plugin unexpectedly packaged'
  exit 1
fi
echo 'Optimized Android launch and native bridge registration passed.'
