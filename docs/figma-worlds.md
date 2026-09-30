# PlushLife Figma worlds

Design source: https://www.figma.com/design/eBLbFMK9vXYqZr2xbNuL51

The app uses the approved local SVG exports and bundled Nunito/Quicksand fonts. Stable appearance preference IDs preserve existing accounts. Lavender, Dino, Baby, Pink, Mint, Peach, Night, Strawberry, and Cloud each have their own illustrated companion. Baby switches to the nursery night scene after bedtime. The existing Garden option remains available.

Shared theme tokens style Today, Tasks, Calendar, Care, Progress, Plush Corner, Support, Settings, and their editors. Mobile navigation is Home, Tasks, Care, Progress, Plush; the date opens Calendar and the gear opens Settings. Desktop adds a sidebar. Existing task creation, editing, archive, restore, schedule, completion, support permissions, and earned rewards remain wired to their existing handlers.

Tasks opens with the actual scheduled rows, including every-day tasks. View all normalizes a date to a weekday before selecting the editor section. Later evaluates scheduling rules for the coming week and future one-time tasks. Creation and advanced management remain available below the list.

Validation: full `npm test`, web bundle budgets, Capacitor Android sync, and Chromium interaction checks with an isolated account fixture. Browser checks cover completion state across Home/Tasks, View all, Care, Progress, Plush, Calendar, Settings, mobile overflow, theme switching, and desktop navigation. No production account data was used for fixture tests.

## Cozy identity and widget refinement (September 30, 2026)

Editable design collection begins at node `90:2529`. It retains the existing themes and five-tab navigation and adds Cozy Space, Comfort Passport, explicit Guardian card sharing, My Reset, Cozy Corner, widget setup and the Plus plan. Widget variants use the existing Dinosaur, Nursery and Moonlit variable modes.

Implemented in this release: an owner-only comfort passport, current support need/status, up to three saved reset steps and optional sound, text memories and completed-task keepsakes, private feedback on comfort notes, per-Guardian field and memory selection, explicit snapshot publishing and pause, Android widget sizing/theme/readability, and accurate browser-preview/sync behavior. Existing Guardian requests can include a preferred later check-in time; they are sent now and are not automatic scheduled reminders.

PlushLife Plus remains a free preview with billing disabled. The screen distinguishes current smart capabilities from future autopilot, integrations, automations, extended Guardian coordination and reports. Basic comfort, safety, privacy, support, backup/sync and data export remain free in the future entitlement model. Legacy backend plan identifiers are retained for compatibility; no new family subscription is offered.

Cozy data is included in user export and encrypted device backups. Restoring a backup does not restore Guardian permissions or republish shared cards. Guardian snapshots contain only selected fields and memories; the private profile and note feedback are never exposed by their RLS policy. SQL permission tests run in a rolled-back transaction and leave existing account data unchanged.
