# PlushLife Figma worlds

Design source: https://www.figma.com/design/eBLbFMK9vXYqZr2xbNuL51

The app uses the approved local SVG exports and bundled Nunito/Quicksand fonts. Stable appearance preference IDs preserve existing accounts. Lavender, Dino, Baby, Pink, Mint, Peach, Night, Strawberry, and Cloud each have their own illustrated companion. Baby switches to the nursery night scene after bedtime. The existing Garden option remains available.

Shared theme tokens style Today, Tasks, Calendar, Care, Progress, Plush Corner, Support, Settings, and their editors. Mobile navigation is Home, Tasks, Care, Progress, Plush; the date opens Calendar and the gear opens Settings. Desktop adds a sidebar. Existing task creation, editing, archive, restore, schedule, completion, support permissions, and earned rewards remain wired to their existing handlers.

Tasks opens with the actual scheduled rows, including every-day tasks. View all normalizes a date to a weekday before selecting the editor section. Later evaluates scheduling rules for the coming week and future one-time tasks. Creation and advanced management remain available below the list.

Validation: full `npm test`, web bundle budgets, Capacitor Android sync, and Chromium interaction checks with an isolated account fixture. Browser checks cover completion state across Home/Tasks, View all, Care, Progress, Plush, Calendar, Settings, mobile overflow, theme switching, and desktop navigation. No production account data was used for fixture tests.
