# Wear OS

Target: Pixel Watch, Galaxy Watch 4+, and other current Wear OS devices.

Implementation direction: Kotlin + Jetpack Compose for Wear OS, plus a Tile and complication. Keep this module separate until the standalone watch build compiles cleanly, then add it to the Android Gradle settings.

V1 screens: Check-in, Today, PlushTinyStep, PlushRescue, PlushFocus, Calm.

Glance surface: Tile showing next task/progress with one-tap Check-in or Tiny Step; complication for progress/check-in status.

Sync: authenticated PlushLife API/Supabase-backed companion sync with a local action queue for offline use.
