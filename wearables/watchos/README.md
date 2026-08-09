# Apple Watch / watchOS

Target: modern Apple Watch models supported by the chosen watchOS deployment target.

Implementation direction: SwiftUI watchOS app with WidgetKit complications/Smart Stack widgets. Build and signing require Xcode on macOS, so this target lives alongside the existing repository but is not added to the Android CI pipeline.

V1 screens: Check-in, Today, PlushTinyStep, PlushRescue, PlushFocus, Calm.

Glance surface: WidgetKit complication for progress/check-in and Smart Stack access to the next task.

Sync: use the same PlushLife service contract as the other watch clients; cache pending actions locally when offline.
