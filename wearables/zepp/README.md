# Zepp OS

Target: Amazfit / Zepp devices that support Zepp OS Mini Programs.

Implementation direction: JavaScript Mini Program with device pages, Shortcut Cards/SecondaryWidget where supported, and API-level compatibility checks because older Zepp OS generations expose different capabilities.

V1 screens: Check-in, Today, PlushTinyStep, PlushRescue, PlushFocus, Calm.

Glance surface: Shortcut Card or SecondaryWidget depending on the watch/API level.

Testing: use Zeus CLI preview plus Zepp App Developer Mode on a real compatible watch.

Sync: use a lightweight side-service/device bridge when available and keep an offline action queue on the watch.
