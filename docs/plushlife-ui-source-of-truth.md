# PlushLife UI Source of Truth

The approved reference screenshots are the visual target for the product. UI work should preserve this hierarchy and feeling instead of inventing a separate design language per screen.

**Current editable design reference:** [PlushLife Figma](https://www.figma.com/design/eBLbFMK9vXYqZr2xbNuL51), page **PlushLife • Reference source of truth** (node `189:44`). Older explorations and dated refinement concepts are not alternative navigation specifications. Compare a change against the running app and this reference rather than combining several historic layouts.

## Screens

Home, Progress, Care, Calendar, Add / Edit Task, Plush / Rewards, Tasks, Habits, My Story, Settings, Schedule Editor, Themes, and Guardians / PlushSupport must look like one PlushLife app. "Little Jobs" is Baby Mode’s themed label for Tasks, not a separate screen or data type. Dino Mode may label Tasks as "Dino Missions"; both modes use the same underlying task data.

## Shared visual system

- Script-like PlushLife wordmark with pink heart.
- Compact mobile-first hierarchy and dense-but-breathable card spacing.
- Soft rounded cards, pale translucent surfaces, low-contrast borders, warm shadows.
- Theme-aware rounded bottom navigation: **Home · Tasks · Care · Progress · Plush**. The header date opens Calendar and the gear opens Settings. Task creation lives in Tasks and contextual Add actions; do not introduce a duplicate fixed Add button.
- Date pill and circular settings control in the header.
- Illustrated/cozy hero treatment before utility content.
- Pastel gradients, tiny hearts/stars/plants, plush imagery, and friendly iconography.
- Controls stay readable and accessible; decoration never blocks interaction, text, dialogs or Android keyboard controls.
- Keep the mobile navigation and safe-area clearance consistent rather than layering extra blank padding across multiple nested containers.
- The app should feel encouraging and collectible without adding pressure.

## Theme rule

All themes use the same layout. A theme may change only color, ambient artwork, small decorative motifs, and mood styling. **The original mascot artwork, outline, colors and proportions remain unchanged**; costumes may add accessories but do not redraw the character.

Approved theme family:

1. Dino
2. Baby Mode
3. Lavender
4. Pink
5. Mint
6. Peach
7. Night
8. Strawberry
9. Cloud / Blue

Dino and Baby Mode are product modes/treatments layered on the shared architecture; the seven appearance palettes remain persistent theme choices.

## PlushSupport / Guardians

PlushSupport uses the same rounded cards, header treatment, tabs, soft buttons, spacing, and active theme. It includes My Support / People I Support style navigation, check-ins, supportive messages, invitations, and permission controls. Privacy rules and existing sharing boundaries must never be weakened for visual reasons.

## Non-negotiables

Do not redesign or reorder the approved hierarchy without an explicit product request. Do not make utility screens look clinical, corporate, or like a separate admin app. Do not make cards or menus oversized. Do not hide existing functionality to achieve the visual treatment. Keep behavior stable while upgrading presentation.
