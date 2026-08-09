# Garmin Connect IQ

Target: Garmin watches that support Connect IQ apps/widgets.

Implementation direction: Monkey C Connect IQ app/widget. Keep the first release intentionally lightweight: Check-in, Today, PlushTinyStep, PlushRescue, PlushFocus, Calm, and a glanceable widget.

Garmin devices vary widely in screen shape, input style, memory, and Connect IQ support, so device capability checks and a conservative minimum device set are required before publishing.

Sync: use the same PlushLife service contract as the other watch clients where network/API capabilities allow it, with local queueing for quick actions.
