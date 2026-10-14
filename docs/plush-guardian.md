# Plush Guardian

Plush Guardian opens from Care, the optional Home card, or task options. It extends existing task, journal, Focus, and Guardian flows without changing the five primary tabs or task history semantics.

## Delivered tools

- Guided AI chat with neutral, Mommy, Daddy, or playful voice; optional task/mood/explicit-memory context; each send has a preview; manually selected journal excerpts only.
- Offline support choices, energy-based task selection, editable tiny steps, partial effort records, Tiny/Rest day preview, and existing task edit/completion controls.
- Brain dump with reviewed one-time task creation and reflection conversion.
- Reviewed morning, after-work, bedtime, and tomorrow routines; custom routines; separate step checkmarks; pause/skip/resume after reload. Together mode shares the current screen. Guardian invitations open the existing recipient and message review UI; nothing sends automatically.
- Device-only reflections, re-encoded photo attachments, feeling search, literal user-entered “what helped” counts, future letters, personal effort rewards, and habit experiments.
- Home card visibility/order, visible save status, Focus resume, voice/boundary preferences, explicit memory editing/deletion, text size, motion/sound/haptic controls, in-app check-in prompts with quiet hours.

## Data boundaries

The new `guardian-companion:v1` record is scoped by authenticated account ID. It is device-only and is not added to the existing companion cloud-sync payload. Optional saved chat is off by default. Each private item can be deleted in its tool, memories/chat can be forgotten, and a downloadable companion copy is available. Account deletion clears the new companion and Focus keys on that device. Device-only data does not automatically move to another phone.

`POST /api/plush-guardian` uses the existing Cloudflare Workers AI binding and model. It verifies the bearer token through Supabase Auth, requires explicit consent, accepts only bounded user/assistant messages, allowlists origins, and returns no-store responses. It has no tool execution or database writes. System instructions treat all user context as data, maintain human/AI distinctions, avoid dependency and medical claims, and preserve user choice. The old owner-only `/api/mamas-corner` gate remains intact.

The endpoint limits requests to 20 per account per 10-minute window per Worker isolate. This limits accidental bursts, not a global billing cap. Requests are limited to 24 KB and inference has a 20-second response deadline. Conversations and context are not logged by this handler. Provider processing remains subject to Cloudflare's terms; local deletion cannot retract a previous request.

## Verification

`npm test` includes behavior tests for account isolation, failed local writes, default-off context sharing, task selection, explicit excerpts, API authentication, consent, CORS, input size and rate limits. Browser verification covers Brain dump conversion, paused routine reload/resume, editable voice, Home visibility, AI send preview and excluded context, personal rewards, and 320/393/412/740px layouts in both appearances.

Real-device notification scheduling and simultaneous remote routine synchronization are not added by this change. Existing notifications and permission-controlled Guardian features remain available. Together routines here are intentionally on one device, with reviewed invitations through the existing Guardian flow.
