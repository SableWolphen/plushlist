# PlushLife — Complete Product Vision and App Behavior

> **ARCHIVED — not an active spec.** Moved out of `docs/` on 2026-08-11
> because a prior session read this as live instructions and started
> building against it (see `plushlife-vision-audit.md` in this folder).
> Nothing in this document should be built without the product owner
> explicitly asking for that specific item first. See `CLAUDE.md` for the
> current non-goals list.

This is the master product specification for PlushLife, provided in full
by the product owner. It describes the target Plush Ecosystem naming,
navigation, feature behavior, data-model principles, and rollout approach
for the whole app — most of it aspirational/future work, not a to-do list
to execute in one pass.

Per its own "Development approach" section: audit first, implement in
safe phases, confirm production behavior stays intact after each phase,
and do not continue into a new phase while the current one is unstable.
See `docs/plushlife-vision-audit.md` for how the current codebase compares
to this spec and what a first real phase would look like.

---

What PlushLife is

PlushLife is a gentle wellness, habit, routine, mood, journaling, and personal-growth app built around a user's personal PlushCompanion.

It should feel like a comforting little world that helps users care for themselves through small, manageable actions.

PlushLife is not meant to feel like a strict productivity app. It should never shame users, punish missed days, create unhealthy pressure, or make people feel as though they have failed.

The experience should be:

- Cute
- Calm
- Supportive
- Private
- Simple
- Accessible
- Forgiving
- Encouraging
- Easy to understand
- Easy to return to

The main question PlushLife should help answer is:

"What is one small, caring step I can take today?"

Everything in the app should feel connected as part of one unified Plush Ecosystem.

---

The Plush Ecosystem

All major user-facing features, sections, tools, and systems should use names beginning with "Plush."

Core names include:

- PlushHome
- PlushToday
- PlushCalendar
- PlushHabits
- PlushRoutines
- PlushMood
- PlushJournal
- PlushPaths
- PlushCalm
- PlushFocus
- PlushSleep
- PlushPause
- PlushProgress
- PlushInsights
- PlushReminders
- PlushWidgets
- PlushSync
- PlushWear
- PlushTogether
- PlushFamily
- PlushCompanion
- PlushProfile
- PlushPrivacy
- PlushSafety
- PlushPlus

Create one central Plush Ecosystem naming registry so names remain consistent across:

- Screens
- Navigation
- Buttons
- Settings
- Notifications
- Onboarding
- Help content
- Analytics
- Documentation
- Feature permissions
- Code identifiers where practical

Do not introduce unrelated branded names that make features feel separate from PlushLife.

Technical services may keep clear internal engineering names when necessary, especially when renaming them could break the app. Everything visible to users should follow the Plush naming system.

---

Core app experience

When a user opens PlushLife, they should quickly understand:

1. How they are feeling today
2. What they planned for today
3. What small action they can take next
4. What they have already completed
5. How their PlushCompanion is growing with them

The app should focus on today without overwhelming users with every available feature.

Most common actions should take only one or two taps.

A basic daily check-in should be possible in less than one minute.

PlushLife should encourage meaningful progress without making the user feel pressured to spend a long time inside the app.

---

Recommended navigation

The main navigation should remain simple.

Recommended bottom navigation:

- PlushHome
- PlushCalendar
- PlushCompanion
- PlushProgress
- PlushProfile

Do not place every Plush feature directly in the bottom navigation.

PlushHome should provide quick access to daily tools.

PlushCalendar should organize plans, schedules, and historical dates.

PlushCompanion should focus on the user's plush character and growth.

PlushProgress should show long-term history and change.

PlushProfile should contain account settings, privacy, reminders, syncing, accessibility, and other preferences.

---

PlushHome

PlushHome is the main daily dashboard.

It should show:

- The user's PlushCompanion
- A friendly greeting
- The current date
- Today's overall progress
- Today's PlushHabits
- Today's PlushRoutines
- A quick PlushMood check-in
- Current PlushPath activity
- Upcoming scheduled activities
- A quick PlushJournal button
- Optional PlushCalm suggestions
- Optional PlushFocus suggestions
- A link to PlushCalendar
- A gentle daily summary when appropriate

Users should be able to complete common actions directly from PlushHome.

They should not need to open several screens just to complete one habit or routine step.

PlushHome should make the next useful action easy to understand.

New day behavior

At the beginning of a new day, PlushHome may show:

- A greeting from PlushCompanion
- Today's plan
- A quick mood check-in
- One suggested first step
- The user's current PlushPath activity

No scheduled activities

When nothing is scheduled, show something gentle such as:

"Your day is open. Add something small or enjoy the space."

An empty day should not look like an error.

Everything completed

Celebrate without pressuring the user to do extra work.

Example:

"You cared for today's plan. Anything else is optional."

Returning after time away

When a user returns after several missed days, say something welcoming such as:

"Welcome back. We can start small today."

Offer options such as:

- Resume the normal plan
- Simplify today's plan
- Choose one small activity
- Activate PlushPause
- Review reminders

Do not show a giant list of everything the user missed.

---

PlushToday

PlushToday is the focused view of everything happening on one selected date.

It may appear inside PlushHome, PlushCalendar, or both.

It should show:

- PlushHabits
- PlushRoutines
- PlushPath activities
- PlushFocus sessions
- PlushCalm activities
- PlushSleep activities
- PlushMood check-ins
- PlushJournal reminders
- Personal one-time activities
- PlushPause or rest-day status

Users should be able to:

- Complete an activity
- Partially complete it
- Skip it
- Pause it
- Reschedule it
- Snooze its reminder
- Add a note
- Open its details
- Add a new activity

Every scheduled occurrence should support an appropriate status:

- Planned
- Completed
- Partially completed
- Skipped
- Missed
- Paused
- Rescheduled
- Canceled
- Rest day

Use gentle visual differences.

Do not use harsh red warnings or language that makes missed items feel like emergencies.

---

PlushCalendar

PlushCalendar is the internal planning and historical calendar for PlushLife.

It should answer:

"What did I plan, what happened, and what is coming next?"

PlushCalendar must remain completely inside PlushLife.

Do not add, prepare, recommend, or implement:

- Google Calendar integration
- Apple Calendar integration
- Outlook Calendar integration
- External calendar syncing
- Calendar importing
- Calendar exporting
- External calendar permissions
- External provider APIs
- External calendar access tokens
- Busy-time scanning
- Two-way calendar synchronization

PlushLife should never request access to a user's external calendars.

PlushCalendar should manage all scheduling internally through PlushLife and PlushSync.

PlushCalendar views

PlushCalendar should include:

- Day view
- Week view
- Month view
- Agenda view
- Historical activity view

Users should be able to move backward and forward through dates.

Include a clear Today button.

Day view

The day view should show:

- Timed activities in chronological order
- Untimed activities under "Anytime Today"
- Completed activities
- Partially completed activities
- Skipped activities
- Paused activities
- Rest-day status
- Mood check-ins
- Personal one-time activities

Completed activities should remain visible so the day reflects what actually happened.

Week view

The week view should show seven days at a glance.

It may include:

- Daily completion indicators
- Planned routines
- Habit activity
- PlushPath progress
- Mood check-in indicators
- PlushPause days
- Rest days
- Milestones
- The currently selected date

Users should be able to tap any day to open its complete details.

The view should reveal patterns without becoming visually crowded.

Month view

The month view should use simple indicators instead of showing every activity name.

Indicators may represent:

- Daily activity
- Mood check-in
- PlushPath progress
- PlushPause
- Journal activity
- PlushFocus activity
- PlushCalm activity
- Milestone reached

Tapping a date should open that date's details.

Low-activity days must not be styled as failures.

Agenda view

The agenda view should show a scrollable chronological list of:

- Upcoming activities
- Today's activities
- Recently completed activities
- Rescheduled activities

Allow filters for:

- PlushHabits
- PlushRoutines
- PlushPaths
- PlushFocus
- PlushCalm
- PlushSleep
- Personal activities
- Completed activities
- Paused activities

Creating activities

PlushCalendar should include a clear add button.

Users should be able to create:

- A PlushHabit
- A PlushRoutine
- A one-time personal activity
- A PlushFocus session
- A PlushCalm session
- A PlushSleep activity
- A PlushMood reminder
- A PlushJournal reminder
- A PlushPause period

Do not force every one-time task to become a recurring habit.

Rescheduling activities

Users should be able to move an occurrence to another date or time.

When modifying a recurring activity, ask whether the user wants to change:

- Only this occurrence
- This and future occurrences
- The future schedule as a whole

Do not rewrite historical occurrences.

Past and future dates

Past dates should show what actually happened.

They must not be regenerated based on an activity's current schedule.

Future dates should show planned occurrences based on the latest schedule.

When a schedule changes, only the selected future range should update.

Week boundaries

Users should be able to choose the first day of the week where practical:

- Sunday
- Monday
- Device or regional default

PlushCalendar and PlushProgress must use the same week settings.

Time zones

Most wellness schedules should follow the user's local time.

The app must handle travel and timezone changes carefully.

Do not duplicate, lose, or shift activities incorrectly when the timezone changes.

Store reliable timestamps and timezone information where necessary.

---

PlushHabits

PlushHabits allows users to create and track recurring actions.

Examples include:

- Drink water
- Brush teeth
- Take medication
- Stretch
- Go outside
- Practice a hobby
- Clean for five minutes
- Prepare for bed

Each PlushHabit may include:

- Name
- Description
- Icon
- Category
- Schedule
- Preferred time
- Reminder
- Goal
- Notes
- Start date
- Optional end date
- Pause status

Users should be able to:

- Complete it
- Undo completion
- Skip it
- Pause it
- Reschedule one occurrence
- Edit it
- Archive it
- Restore it
- View its history
- View its PlushProgress trends

Schedule options

Support:

- Every day
- Selected weekdays
- A certain number of times per week
- Every set number of days
- Specific dates
- Monthly schedules where practical
- Custom schedules
- Multiple times per day where practical

Completion behavior

Completing a habit should update:

- PlushHome
- PlushToday
- PlushCalendar
- PlushProgress
- PlushCompanion
- Relevant PlushInsights

The action should save immediately.

Provide a brief undo option for accidental completion.

Editing habits

Editing a PlushHabit must not erase its previous history.

When changing its schedule, ask when the new schedule should begin.

Historical records may preserve:

- The name used at the time
- The icon used at the time
- The old schedule
- Completion details

Medication habits

PlushLife may help users remember medication, but it must not:

- Recommend medication
- Change prescribed instructions
- Diagnose conditions
- Tell users to double a missed dose
- Present itself as medical care

---

PlushRoutines

PlushRoutines groups multiple steps into one organized routine.

Examples include:

- Morning routine
- Evening routine
- Work preparation
- School preparation
- Cleaning routine
- Self-care routine
- Leaving-home routine

Each routine may include:

- Name
- Description
- Icon
- Ordered steps
- Schedule
- Preferred time
- Reminder
- Optional total duration
- Pause status

Users should be able to:

- Add steps
- Reorder steps
- Complete individual steps
- Partially complete the routine
- Complete the entire routine
- Skip one step
- Skip one occurrence
- Add timers
- Pause and resume
- Duplicate
- Edit
- Archive
- View history

Editing a routine must not erase previous completion history.

Past records should preserve which steps existed at that time.

Routine progress

Show:

- Steps completed
- Steps remaining
- Partial-completion status
- Estimated time remaining where available

Users should be able to leave and return without losing progress.

---

PlushPause

PlushPause allows users to take breaks without being punished.

Users may pause:

- One PlushHabit
- One PlushRoutine
- One PlushPath
- A category of activities
- Their entire daily plan

Possible reasons include:

- Vacation
- Illness
- Rest
- Schedule changes
- Difficult periods
- Personal reasons

A reason should always be optional.

PlushPause behavior

A paused activity should:

- Stop normal reminders
- Remain visible in history
- Not count as an ordinary failure
- Resume on the selected date when configured
- Allow early return

PlushPause should support:

- One day
- A date range
- Until manually resumed

Paused days must appear separately from missed days in PlushProgress.

PlushPause should not unfairly destroy streaks.

---

PlushMood

PlushMood provides quick, optional emotional check-ins.

Users may record:

- General mood
- Energy level
- Stress level
- Optional emotion labels
- Optional contributing factors
- Optional private notes

The app must never force a user to explain how they feel.

Mood entries should save:

- Date
- Time
- Relevant timezone
- Selected mood information

Multiple check-ins

Allow multiple mood check-ins in one day where practical.

PlushProgress may create daily or weekly summaries while preserving individual entries.

Explain how averages or summaries are calculated.

Mood history

Users should be able to view:

- Daily mood entries
- Weekly summaries
- Monthly patterns
- Changes over time

PlushMood must not diagnose mental-health or medical conditions.

---

PlushJournal

PlushJournal is the user's private space for reflection.

It may include:

- Free writing
- Guided prompts
- Custom prompts
- Prompt collections
- Tags
- Favorites
- Search
- Filters
- Voice entries
- Attachments
- Autosave
- Export
- Delete
- Privacy controls

Journal entries must save reliably.

Journal privacy

Never include private journal text in ordinary analytics.

Do not use journal content for advertising.

Do not send journal content to third-party AI or other external services without clear user permission.

Any future AI reflection feature must be optional and explain exactly what content is processed.

Journal activity in PlushProgress

PlushProgress may record:

- Number of journal entries
- Days on which the user journaled
- Prompt collection used
- General journaling frequency

It must not include:

- Journal text
- Voice-entry contents
- Attachment contents
- Private notes

---

PlushPaths

PlushPaths are guided step-by-step programs that help users work toward a goal.

Possible PlushPaths include:

- Better sleep
- Morning routine
- Evening reset
- Burnout recovery
- Self-care basics
- Returning after a difficult week
- Confidence building
- Cleaning in small steps
- Preparing for work
- Preparing for school
- Building consistency
- Digital wellbeing
- Gentle movement

Each PlushPath should include:

- A clear purpose
- Small activities
- Flexible pacing
- Progress tracking
- PlushCalendar scheduling
- Optional reminders
- Pause and resume
- A completion celebration

Missing a day must not restart or erase a PlushPath.

Users should be able to reschedule individual PlushPath activities.

PlushPaths are wellness tools, not medical treatment.

---

PlushCalm

PlushCalm provides quick calming and grounding activities.

It may include:

- Breathing exercises
- Grounding exercises
- Sensory check-ins
- Short calming sessions
- Silent mode
- Adjustable session lengths
- Favorite exercises
- Sound controls
- Vibration controls
- An easy emergency-calm shortcut

Users should be able to start a basic session in only a few taps.

PlushCalm activity may appear in PlushProgress as:

- Number of sessions
- Total time
- Days used

Essential PlushCalm tools must remain available without payment.

---

PlushFocus

PlushFocus helps users start and complete focused activities.

It may include:

- Focus timers
- Break timers
- Custom durations
- Saved focus routines
- Pause and resume
- Optional links to PlushHabits
- Optional links to PlushRoutines
- PlushCalendar scheduling
- Completion history

A scheduled focus session should appear in PlushCalendar.

Completing a linked focus session may optionally contribute to a connected habit or routine.

Do not automatically assume the session was successful because the timer ended.

Allow the user to confirm the outcome.

---

PlushSleep

PlushSleep supports bedtime preparation and gentle sleep routines.

It may include:

- Bedtime checklists
- Wind-down routines
- Gentle reminders
- PlushCalm activities
- Optional sleep notes
- Morning reflection
- User-entered sleep trends
- PlushCalendar scheduling

PlushSleep must not diagnose or claim to treat sleep disorders.

---

PlushReminders

PlushReminders should be customizable, calm, and useful.

Users should control:

- Which activities send reminders
- Reminder times
- Multiple reminders where appropriate
- Quiet hours
- Snooze duration
- Notification categories
- Sound
- Vibration
- Timezone behavior

Reminder actions

Notifications may support:

- Complete
- Snooze
- Skip today
- Open activity
- Start routine
- Start PlushFocus
- Start PlushCalm

Reminder actions must update PlushCalendar and PlushProgress correctly.

Reminder tone

Good:

"Your evening PlushRoutine is ready whenever you are."

Bad:

"You are losing your streak. Open PlushLife now."

Do not use:

- Shame
- Fear
- Fake urgency
- Manipulation
- Excessive notifications

Ignoring a notification must not automatically mark an activity as failed.

---

PlushProgress

PlushProgress preserves the user's history so they can see how they have changed over time.

It should answer:

"How have I changed over days, weeks, months, and years?"

PlushProgress must not show only the current week.

It should preserve reliable records across:

- Days
- Weeks
- Months
- Years

PlushProgress views

Include:

- Today
- This Week
- Past Weeks
- Monthly Trends
- Year in Review
- Milestones
- PlushCompanion Growth
- Custom date ranges where practical

Weekly history

Every week should preserve an accurate historical summary.

A weekly summary may include:

- PlushHabits completed
- PlushHabits skipped
- PlushHabits missed
- PlushHabits paused
- PlushRoutines completed
- PlushRoutines partially completed
- PlushMood summaries
- Energy averages
- Stress averages
- PlushPath progress
- PlushFocus sessions
- Total focus time
- PlushCalm sessions
- PlushSleep activity
- PlushPause days
- Journal activity count
- Milestones
- PlushCompanion growth
- Return-after-break events

It must not include:

- Journal text
- Mood notes
- Voice recordings
- Attachments
- Sensitive private content

Weekly navigation

Users should be able to:

- Move backward and forward by week
- Open any recorded week
- Browse a chronological weekly timeline
- Compare this week with last week
- Compare any two recorded weeks
- View monthly and yearly trends built from weekly history

Historical accuracy

Past weeks must remain accurate snapshots.

If a user later edits, renames, archives, or deletes a PlushHabit or PlushRoutine, previous weeks must not be recalculated in a way that changes what occurred.

Historical records may preserve:

- The activity name used at the time
- The icon used at the time
- The schedule used at the time
- Completion counts
- Archived activity identifiers

Avoid storing unnecessary sensitive content.

Finalizing weeks

A week may be summarized after it ends, but the underlying activity records should remain available.

Late syncing from another device must be reconciled safely.

Do not silently discard valid late activity.

When a summary changes because valid late activity arrived, update it accurately.

Monthly trends

Monthly views may show:

- Consistency over time
- Most active routines
- Mood patterns
- Rest patterns
- PlushPath progress
- Focus time
- Calm sessions
- Returning after breaks

Year in Review

A yearly summary may include:

- Total active days
- PlushHabits completed
- PlushRoutines completed
- PlushPaths completed
- Total focus time
- PlushCalm sessions
- Journal activity count
- Rest days
- Major milestones
- PlushCompanion growth stages

Low totals must never be framed as failure.

PlushProgress language

Use supportive wording such as:

- "You completed more morning routines than last week."
- "You took more planned rest days this month."
- "Your consistency gradually increased over six weeks."
- "This week was quieter, and you still checked in twice."
- "You returned after a break and completed three small activities."

Do not use:

- Bad week
- Failed week
- Lazy
- Wasted
- Unproductive
- Broken

---

PlushInsights

PlushInsights turns user activity into gentle observations.

It should answer:

"What patterns might help me understand my journey?"

Possible insights include:

- Best-performing time of day
- Habit consistency
- Changes in routine completion
- Mood patterns
- Activities commonly completed together
- Common routine stopping points
- Rest patterns
- Progress after returning from a break

Use cautious language such as:

- "You may have noticed…"
- "Your recent activity suggests…"
- "This pattern could be worth exploring…"
- "You tend to complete this more often in the morning…"

Do not claim:

- That an activity caused a mood
- That the user has a medical condition
- That the app understands the user with certainty
- That the user needs treatment

Users should be able to hide individual insights or disable personalized insights.

---

PlushCompanion

PlushCompanion is the user's personal plush character that grows alongside them.

It may:

- Celebrate completed activities
- Encourage the user
- React to milestones
- Join PlushPaths
- Appear during PlushFocus
- Guide PlushCalm
- Welcome users back
- Reflect long-term progress
- Appear in PlushWidgets

It must never:

- Become sick because a user missed a habit
- Cry because the user stopped opening the app
- Lose health as punishment
- Shame the user
- Demand attention
- Pressure the user to pay
- Suggest the user harmed it by resting

PlushCompanion should model patience, care, and emotional safety.

---

PlushWidgets

Possible PlushWidgets include:

- Today's PlushHabits
- PlushRoutine progress
- Quick PlushMood check-in
- PlushCompanion
- PlushFocus timer
- PlushPath progress
- Quick PlushJournal entry
- PlushCalendar agenda

Widgets should handle:

- Signed-out state
- Loading
- Stale data
- Offline state
- Permission changes
- Account switching

Widgets must not expose sensitive journal or mood information unless the user explicitly chooses to show it.

---

PlushSync

PlushSync keeps the user's PlushLife data available safely across their devices.

It should support:

- Secure cloud backup
- Cross-device synchronization
- Offline changes
- Retry behavior
- Conflict handling
- Sync status
- Restoration
- Account transitions

PlushSync should only synchronize PlushLife data.

It should not connect PlushCalendar to external calendar providers.

Offline behavior

Users should be able to complete activities offline.

Offline actions should:

- Save locally
- Appear immediately
- Sync later
- Avoid duplicate records

Conflict handling

Do not silently overwrite newer data.

Use stable record identifiers and reliable timestamps.

Treat completion records as individual events where practical instead of replacing large historical objects.

When two edits cannot be merged safely, use a clear conflict strategy or ask the user.

Sync status

Use understandable labels such as:

- Synced
- Syncing
- Offline changes saved
- Needs attention

Avoid frightening technical messages.

---

PlushWear

PlushWear may eventually provide limited wearable support.

Possible features include:

- Completing a PlushHabit
- Viewing today's plan
- Recording a PlushMood check-in
- Running a PlushFocus timer
- Following PlushCalm breathing guidance
- Acting on reminders
- Viewing PlushCompanion status

Do not prioritize a full wearable app before the core mobile app is stable.

---

PlushTogether

PlushTogether may eventually support private encouragement between trusted users.

Possible features include:

- Sending encouragement
- Celebrating milestones
- Sharing selected goals
- Joining private challenges
- Optional accountability

Do not create:

- Public feeds
- Open direct messaging
- Public location sharing
- Unsafe discovery
- Unmoderated communities

Sharing must remain optional and consent-based.

---

PlushFamily

PlushFamily may eventually support:

- Multiple private profiles
- Household routines
- Shared goals
- Optional encouragement
- Carefully controlled caregiver features

Private journals, mood entries, and sensitive information must remain private unless the user explicitly chooses to share them.

One profile must never silently access another profile's private data.

---

PlushProfile

PlushProfile should contain:

- Profile details
- PlushCompanion preferences
- Accessibility settings
- PlushReminders
- PlushSync
- PlushPrivacy
- PlushSafety
- Notification settings
- Data export
- Account deletion
- Future PlushPlus management

Do not include external calendar connection settings.

Settings should be grouped into understandable categories.

---

Onboarding

New-user onboarding should remain short and gentle.

Recommended flow:

1. Welcome to PlushLife
2. Explain the gentle approach
3. Choose or create a PlushCompanion
4. Select one or two goals
5. Create the first PlushHabit or PlushRoutine
6. Choose optional reminders
7. Complete an optional PlushMood check-in
8. Introduce PlushCalendar
9. Arrive at PlushHome

Do not force users to:

- Create many habits
- Enable notifications
- Share private information
- Connect an outside service
- Start a trial
- Buy anything

Optional steps must be skippable.

---

Daily user flow

A normal daily visit should work like this:

1. The user opens PlushLife.
2. PlushHome welcomes them.
3. They see PlushCompanion and today's plan.
4. They optionally record PlushMood.
5. They complete PlushHabits or PlushRoutine steps.
6. PlushToday and PlushCalendar update immediately.
7. PlushProgress records the activity.
8. PlushCompanion responds positively.
9. The user may continue a PlushPath, use PlushFocus, open PlushCalm, use PlushSleep, or write in PlushJournal.
10. The visit ends with gentle encouragement.

The user should never feel required to use every feature every day.

---

PlushPrivacy

PlushPrivacy should be treated as a core feature.

PlushLife must:

- Collect only necessary information
- Protect mood and journal data
- Avoid sensitive analytics
- Clearly explain permissions
- Allow data export
- Allow account deletion
- Explain data retention
- Protect access tokens and credentials
- Never sell private wellness content

Do not place secrets or credentials in the client app or public repository.

Account deletion, data export, and privacy controls must never require payment.

---

PlushSafety

PlushSafety should remain easy to access.

It should include:

- A clear statement that PlushLife is not emergency care
- Crisis-support access where appropriate
- Emergency guidance
- Region-aware resources where supported
- Safe handling of concerning content

PlushSafety must always remain available for free.

---

Future PlushPlus

PlushLife may later support:

- Free
- PlushPlus
- PlushFamily

Do not activate these restrictions yet.

For now:

- Every feature remains unlocked
- No paywall appears
- No pricing appears
- No locked icons appear
- No trial is active
- No upgrade prompt appears
- No user can be charged
- Google Play Billing remains inactive

Future access rules should be handled through one centralized entitlement system.

Do not scatter premium checks throughout the app.

Users should eventually pay for advanced depth, expanded programs, convenience, personalization, and richer insights.

They should not have to pay for basic care, privacy, safety, or the core PlushCompanion experience.

Features that should always remain available in some meaningful form include:

- Core PlushHabits
- Basic PlushMood
- Basic PlushJournal
- Essential PlushCalm
- PlushSafety
- PlushPrivacy
- Data export
- Account deletion
- Core PlushCompanion

Do not add or recommend:

- Lifetime plans
- Lifetime purchases
- Cosmetic shops
- Paid plushie bundles
- Paid outfits
- Paid room themes
- Paid seasonal packs
- Paid app icons
- Paid sound packs
- Loot boxes
- Gacha systems
- Creator marketplaces
- Third-party revenue-sharing systems

---

Analytics

Use privacy-conscious analytics to understand feature usage.

Allowed examples include:

- Feature opened
- PlushHabit completed
- PlushRoutine completed
- PlushPath started
- PlushPath completed
- PlushFocus session completed
- PlushCalm session completed
- PlushProgress viewed
- PlushCalendar view opened
- PlushReminder created
- PlushWidget used

Do not record:

- Journal text
- Mood notes
- Voice recordings
- Attachment contents
- Sensitive activity descriptions
- Unnecessary identifying information

---

Data structure principles

Use stable identifiers for:

- Users
- PlushHabits
- PlushRoutines
- Routine steps
- Schedules
- Scheduled occurrences
- Completion events
- Mood entries
- Journal entries
- PlushPath activities
- Weekly summaries
- PlushCompanion milestones

Keep these concepts separate:

1. The activity definition
2. The schedule
3. Each generated calendar occurrence
4. The completion or status history

This separation is essential.

Changing a schedule must not rewrite the past.

Historical records should reflect actual occurrences and events, not merely the current version of an activity.

---

Existing-user protection

Preserve all existing:

- Accounts
- Profiles
- PlushHabits
- PlushRoutines
- Mood history
- Journal entries
- PlushProgress
- Streaks
- PlushCompanions
- Settings
- PlushReminders
- Notifications
- Authentication records
- Database records

Do not reset, overwrite, or delete production data.

Any necessary migration must be:

- Backward-compatible
- Tested
- Reversible
- Documented
- Safe for existing users

---

Accessibility

Support:

- Screen readers
- Large text
- Clear labels
- Sufficient contrast
- Reduced motion
- Proper touch-target sizes
- Alternatives to sound and vibration
- Keyboard navigation on web
- Clear focus states
- Status indicators that do not depend only on color

The app should remain usable for people with different physical, visual, cognitive, and sensory needs.

---

Performance

PlushLife should:

- Open quickly
- Save actions immediately
- Avoid unnecessary loading screens
- Cache today's plan safely
- Work reasonably offline
- Avoid excessive animations
- Avoid repeated network requests
- Handle long-term history efficiently

PlushCalendar and PlushProgress should use efficient date-window queries, pagination, or similar methods.

Do not load the user's entire history every time a screen opens.

---

Testing requirements

Test:

- New account creation
- Existing-user sign-in
- Password recovery
- Profile persistence
- PlushHabit creation and completion
- PlushRoutine partial completion
- Schedule editing
- PlushCalendar day view
- PlushCalendar week view
- PlushCalendar month view
- Rescheduling
- Recurring occurrence changes
- Past-history preservation
- PlushProgress weekly history
- Month and year summaries
- Timezone changes
- Week-start settings
- Offline completion
- Cross-device sync
- Late synchronization
- Duplicate prevention
- PlushReminder actions
- PlushPause
- PlushMood privacy
- PlushJournal privacy
- Data export
- Account deletion
- PlushCompanion behavior
- PlushWidgets
- Accessibility
- Absence of external calendar integration
- Absence of billing and paywalls

---

Development approach

Treat this document as the master product specification.

Do not try to rebuild the entire application in one uncontrolled change.

First audit the existing project and identify:

- What already exists
- What currently works
- What is unfinished
- What can be reused
- How activities are stored
- How schedules are stored
- How occurrences are generated
- How completion history is stored
- How the existing calendar works
- How PlushProgress is calculated
- What could affect production users

Then implement changes in safe phases.

Recommended order:

1. Audit and protect production behavior.
2. Create the Plush Ecosystem naming registry.
3. Stabilize activity, schedule, occurrence, and history data models.
4. Build or repair PlushCalendar day and week views.
5. Preserve accurate historical activity.
6. Build PlushProgress weekly history.
7. Add monthly and yearly trend views.
8. Improve PlushHabits and PlushRoutines.
9. Add reliable rescheduling and PlushPause.
10. Improve PlushMood and PlushJournal.
11. Connect PlushPaths, PlushFocus, PlushCalm, and PlushSleep to PlushCalendar.
12. Improve PlushReminders.
13. Strengthen PlushSync and offline behavior.
14. Improve PlushWidgets and PlushCompanion reactions.
15. Prepare future entitlement architecture while keeping everything unlocked.
16. Run complete regression testing.

After every phase:

- Run relevant tests
- Confirm existing data remains intact
- Confirm the app still builds
- Confirm unrelated features still work
- Document changed files
- Document database changes
- Report remaining risks

Do not continue into another major phase while the current phase is unstable.

---

Final product meaning

PlushCalendar should answer:

"What did I plan, what happened, and what comes next?"

PlushProgress should answer:

"How have I changed over time?"

PlushInsights should answer:

"What gentle patterns may help me understand my journey?"

PlushCompanion should answer:

"Who is growing beside me without judging me?"

PlushLife as a whole should answer:

"What is one small, caring step I can take today?"
