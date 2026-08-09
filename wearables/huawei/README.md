# Huawei / HarmonyOS Wearable

Target: Huawei watches that support third-party HarmonyOS wearable apps.

Implementation direction: ArkTS + ArkUI in DevEco Studio for supported HarmonyOS wearable targets. Keep the feature set aligned with the shared PlushLife watch contract and use wearable-first layouts with crown/gesture support where available.

V1 screens: Check-in, Today, PlushTinyStep, PlushRescue, PlushFocus, Calm.

Glance surface: use the platform's wearable card/widget equivalent where available on the target HarmonyOS generation.

Sync: use the same PlushLife service contract, with offline queueing and phone/wearable communication where supported.
