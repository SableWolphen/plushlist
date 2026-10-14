# Plush Guardian

Plush Guardian opens from Care, the optional Home card, or task options. It extends existing task, journal, Focus, and Guardian flows without changing the five primary tabs or task history semantics.

## Delivered tools

- **Bot Mommy (or Bot Daddy, Gentle Guardian, or Playful Guardian)**: an opt-in **rule-based** substitute for daily Guardian support when a Cozy has no human Guardian. It shows real task progress, the next small task, routines and locally scheduled nudges. **There is no AI chat.**
- Offline support choices, energy-based task selection, editable tiny steps, partial effort records, Tiny/Rest day preview, and existing task edit/completion controls.
- Brain dump with reviewed one-time task creation and reflection conversion.
- Reviewed morning, after-work, bedtime, and tomorrow routines; custom routines; separate step checkmarks; pause/skip/resume after reload. Together mode shares the current screen. Guardian invitations open the existing recipient and message review UI; nothing sends automatically.
- Device-only reflections, re-encoded photo attachments, feeling search, literal user-entered “what helped” counts, future letters, personal effort rewards, and habit experiments.
- Home card visibility/order, visible save status, Focus resume, voice/boundary preferences, explicit memory editing/deletion, text size, motion/sound/haptic controls, in-app check-in prompts with quiet hours.

## Data boundaries

The `guardian-companion:v1` record is scoped by authenticated account ID and stays device-only. Old locally saved chat from earlier versions is retained solely for explicit deletion or export, not used for generation. All legacy AI permissions and sharing toggles are switched off on load without silently deleting memories or saved chat. Each private item can be deleted in its tool, and a downloadable companion copy is available. Account deletion clears the companion and Focus keys on that device. Device-only data does not automatically move to another phone.

The old public `POST /api/plush-guardian` chat route is retired in the Worker source: it returns HTTP 410 instead of calling AI. This takes effect when that Worker build is deployed; editing the repository alone does not update the running Cloudflare Worker. The distinct historical owner-only `/api/mamas-corner` code was not expanded or repurposed into Bot Mommy. The new bot's task previews and notification copy are generated entirely on-device from existing data.

## Verification

`npm test` includes behavior tests for account isolation, failed local writes, default-off context sharing, task selection, explicit excerpts, API authentication, consent, CORS, input size and rate limits. Browser verification covers Brain dump conversion, paused routine reload/resume, editable voice, Home visibility, Bot Mommy opt-in, personal rewards, and 320/393/412/740px layouts in both appearances.

Real-device notification scheduling and simultaneous remote routine synchronization are not added by this change. Existing notifications and permission-controlled Guardian features remain available. Together routines here are intentionally on one device, with reviewed invitations through the existing Guardian flow.

## Reminder-first Virtual Guardian

The separate, **default-off** `automaticReminders` setting makes the Virtual Guardian a rule-based reminder helper first, rather than an AI chatbot. It reuses the existing Android local notification scheduler and the user's configured notification permission, reminder times, quiet hours, rest days and discreet lock-screen settings. No extra permission, network service, AI chat consent or remote automation is created.

When on, the chosen neutral/Mommy/Daddy/playful voice changes scheduled reminder wording. When app notifications are off, the feature does not independently notify. Switching Guardian preferences reschedules the existing daily reminders. Signing out cancels scheduled task reminders on that device, and completing a repeating task today no longer mutes tomorrow's reminder.

This phase does not yet support remote synchronization of active together-routines, guaranteed Android delivery despite OS restrictions, unattended task edits, or cloud restoration of Guardian device-only photos/reflections.

## Opt-in proactive reminders and portable backup

- Virtual Guardian now has two independently enabled reminders: one for an **unfinished, unpaused routine** and one for tomorrow preparation if tasks are scheduled. Neither uses AI chat, creates a new notification channel, or sends data to a third party. Both use the existing Android local scheduler, quiet hours, rest-day suppression, discreet wording, and time-window deduplication. These rules schedule only today's relevant nudge during normal app scheduling; a background service is **not** installed.
- A signed-in Cozy can export a versioned, SHA-256-verified portable JSON backup containing their device-only companion state. It includes private memories, photos, and any saved chat, and is **not encrypted**. Keep the file in private storage.
- Restoring requires the same authenticated owner account, verifies integrity, checks size, presents a summary, and requires explicit replace confirmation. AI access, personal context sharing, and automatic reminders remain off after restore. Legacy unauthenticated backup copies cannot be imported automatically because ownership cannot be proven.
- Android widget visual themes now include their own backgrounds for Mint, Peach, Strawberry, Cloud, and Garden. The original mascot art is unchanged.

### Unchanged security and product boundaries
No Supabase schema or cloud-sync payload edits, billing changes, new analytics SDK, third-party flows, new Android permissions, or `daily_progress`/task-history semantics have been changed. Multi-device Guardian routine collaboration and Cloud backup are not part of this change. Follow #346/#347 and the project checkpoints before undertaking those changes.

## Bot Mommy is not a chatbot

On the Guardians page, a Cozy with **no active, accepted human Guardian** gets a Bot Mommy entry point without having to invite anyone. Inside the Bot Guardian, the user explicitly chooses **Turn on Bot Mommy**. That sets a caring Mommy voice and enables existing automatic task/reminder style plus unfinished-routine and tomorrow-preparation nudges. It does not grant Android notification permission, send a human invite, edit task history, or change database schemas. Other Guardian voices can be selected later.

The dashboard uses the real completion state to show tasks done, tasks left, and a start-with-one button. Existing routines provide step-by-step, pause, skip and resume controls; real tasks remain manually checked. Rest days suppress extra notifications and the day's task pressure. Quiet hours, discreet lock-screen copy and platform delivery restrictions remain in force. No promises of guaranteed delivery while closed are made. In-app prompts and private Guardian memories are not AI conversations.

The old chatbot UI, consent controls and network request code were removed from the Guardian client. Legacy local conversation records are not automatically destroyed, but can be deleted in Bot Guardian settings. The server route is intentionally retired to protect existing old app builds.


## One Guardian, two ways to receive help

The user-facing destination and feature are simply **Guardian**. The card displays the chosen name and a short status, **Connected person** or **Automatic · On this device**, rather than presenting two unrelated products.

An **active, accepted person** takes priority. The automatic panel and its notification delivery are disabled while a person is connected. When the person first connects, previously enabled automatic reminders are switched off on this device. Removing the person later does not reactivate those reminders: the Cozy must explicitly opt back in. Pending invitations and paused access do not count as active human relationships. If the app cannot verify relationships yet, it cannot activate the automatic Guardian and offers retry.

Both modes expose the same **Tasks, Routines, Encouragement and Rewards** choices. People work through the existing shared Guardian permissions, progress rewards, notes and Together screen; automatic support uses existing private on-device routines, task suggestions and rewards. The automatic Guardian can offer a locally stored, user-chosen reward based on 25/50/75/100% of today's *real* scheduled tasks, or the earlier manual effort-count method. It does not grant human approvals, edit task completion history or transmit new data.

The automatic Guardian's display name is editable on its device. A human Guardian is shown by their existing label or connected account address; no sharing permissions are silently broadened. This is feature-level consistency, **not** an assertion that an unattended local helper can make decisions or send personal messages from a human account. The Cozy controls their tasks and claimed rewards.
