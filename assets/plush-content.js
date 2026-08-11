(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.PlushLifeContent = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  // Static content/data for the app: mascot outfits, appearance themes,
  // day metadata, starter task templates, dashboard tabs, guided paths,
  // sleep tools, soundscapes, affirmations, and quick comfort tools.
  // None of this depends on React or app state — it's pure data, moved
  // out of the main app-source script so it can be read, edited, and
  // tested on its own instead of as part of one 11,000-line file.

  const MASCOT_OUTFITS = [
    { id: "classic", name: "Classic Plush", badge: "💛", accessory: "", unlock: { type: "always", count: 0 }, hint: "Always available" },
    { id: "bow", name: "Cozy Bow", badge: "🎀", accessory: "🎀", unlock: { type: "daily_core", count: 1 }, hint: "Complete your Every Day Core once" },
    { id: "glasses", name: "Star Glasses", badge: "🌟", accessory: "🕶️", unlock: { type: "care_days", count: 2 }, hint: "Complete your essential care on any 2 days" },
    { id: "crown", name: "Dino Crown", badge: "🦖", accessory: "👑", unlock: { type: "care_days", count: 3 }, hint: "Complete your essential care on any 3 days" },
    { id: "cape", name: "Care Hero Cape", badge: "🦸", accessory: "🦸", unlock: { type: "care_days", count: 5 }, hint: "Complete your essential care on any 5 days" },
    { id: "party", name: "Week Wonder", badge: "🏆", accessory: "🎉", unlock: { type: "care_days", count: 7 }, hint: "Complete your essential care on any 7 days" },
    { id: "scarf", name: "Welcome Scarf", badge: "🧣", accessory: "🧣", unlock: { type: "activity_days", count: 3 }, hint: "Check in or care for yourself on any 3 days" },
    { id: "backpack", name: "Explorer Backpack", badge: "🎒", accessory: "🎒", unlock: { type: "activity_days", count: 7 }, hint: "Check in or care for yourself on any 7 days" },
    { id: "cozy-cap", name: "Cozy Cap", badge: "🧢", accessory: "🧢", unlock: { type: "activity_days", count: 14 }, hint: "Check in or care for yourself on any 14 days" },
    { id: "compass", name: "Monthly Explorer", badge: "★", accessory: "★", unlock: { type: "activity_days", count: 30 }, hint: "Check in or care for yourself on any 30 days" },
    { id: "century-gem", name: "Century Gem", badge: "💎", accessory: "💎", unlock: { type: "activity_days", count: 100 }, hint: "Check in or care for yourself on any 100 days" },
    { id: "moon-halo", name: "Moon Halo", badge: "🌙", accessory: "🌙", unlock: { type: "care_days", count: 14 }, hint: "Complete your essential care on any 14 days" },
    { id: "gold-crown", name: "Golden Care Crown", badge: "👑", accessory: "👑", unlock: { type: "care_days", count: 30 }, hint: "Complete your essential care on any 30 days" },
    { id: "rainbow-aura", name: "Rainbow Aura", badge: "🌈", accessory: "🌈", unlock: { type: "care_days", count: 60 }, hint: "Complete your essential care on any 60 days" },
    { id: "sprout", name: "Sprout Hat", badge: "🌱", accessory: "🌱", unlock: { type: "build_checkins", count: 3 }, hint: "Check in with one habit you are building 3 times" },
    { id: "garden", name: "Garden Overalls", badge: "🌼", accessory: "🌼", unlock: { type: "build_checkins", count: 7 }, hint: "Check in with one habit you are building 7 times" },
    { id: "sunflower", name: "Sunflower Crown", badge: "🌻", accessory: "🌻", unlock: { type: "build_checkins", count: 14 }, hint: "Check in with one habit you are building 14 times" },
    { id: "habit-tree", name: "Habit Tree Cape", badge: "🌳", accessory: "🌳", unlock: { type: "build_checkins", count: 30 }, hint: "Check in with one habit you are building 30 times" },
    { id: "garden-glow", name: "Garden Glow", badge: "✨", accessory: "✨", unlock: { type: "build_checkins", count: 60 }, hint: "Check in with one habit you are building 60 times" },
    { id: "shield", name: "Habit Shield", badge: "🛡️", accessory: "🛡️", unlock: { type: "reduce_checkins", count: 3 }, hint: "Check in with one habit you are reducing 3 times" },
    { id: "boots", name: "Brave Boots", badge: "🥾", accessory: "🥾", unlock: { type: "reduce_checkins", count: 7 }, hint: "Check in with one habit you are reducing 7 times" },
    { id: "wings", name: "Fresh Start Wings", badge: "✦", accessory: "✦", unlock: { type: "reduce_checkins", count: 14 }, hint: "Check in with one habit you are reducing 14 times" },
    { id: "change-champion", name: "Change Champion", badge: "⚡", accessory: "⚡", unlock: { type: "reduce_checkins", count: 30 }, hint: "Check in with one habit you are reducing 30 times" },
    { id: "diamond-shield", name: "Diamond Shield", badge: "💠", accessory: "💠", unlock: { type: "reduce_checkins", count: 60 }, hint: "Check in with one habit you are reducing 60 times" },
    { id: "founders-ribbon", name: "Founder's Ribbon", badge: "🎗️", accessory: "🎗️", unlock: { type: "founding", count: 1 }, hint: "Exclusive to accounts from PlushLife's early access period — can never be earned later." },
    { id: "knit-sweater", name: "Knit Sweater", badge: "🧶", accessory: "🧶", unlock: { type: "activity_days", count: 10 }, hint: "Check in or care for yourself on any 10 days" },
    { id: "moon-cap", name: "Moonlit Cap", badge: "🌙", accessory: "🌙", unlock: { type: "care_days", count: 10 }, hint: "Complete your essential care on any 10 days" },
    { id: "book-buddy", name: "Book Buddy", badge: "📚", accessory: "📚", unlock: { type: "activity_days", count: 21 }, hint: "Check in or care for yourself on any 21 days" },
    { id: "raincoat", name: "Rainy-Day Coat", badge: "🧥", accessory: "🧥", unlock: { type: "care_days", count: 21 }, hint: "Complete your essential care on any 21 days" },
    { id: "starlight-pins", name: "Starlight Pins", badge: "🌟", accessory: "🌟", unlock: { type: "activity_days", count: 45 }, hint: "Check in or care for yourself on any 45 days" },
    { id: "cozy-cardigan", name: "Cozy Cardigan", badge: "🧶", accessory: "🧶", unlock: { type: "care_days", count: 45 }, hint: "Complete your essential care on any 45 days" },
    { id: "comet-bow", name: "Comet Bow", badge: "☄️", accessory: "☄️", unlock: { type: "activity_days", count: 75 }, hint: "Check in or care for yourself on any 75 days" },
    { id: "sunrise-cape", name: "Sunrise Cape", badge: "🌅", accessory: "🌅", unlock: { type: "care_days", count: 75 }, hint: "Complete your essential care on any 75 days" },
    { id: "journal-charm", name: "Journal Charm", badge: "📝", accessory: "📝", unlock: { type: "reflection_count", count: 20 }, hint: "Write 20 private reflections" },
    { id: "memory-ribbon", name: "Memory Ribbon", badge: "🎗️", accessory: "🎗️", unlock: { type: "reflection_count", count: 50 }, hint: "Write 50 private reflections" },
    { id: "aurora-crown", name: "Aurora Crown", badge: "👑", accessory: "👑", unlock: { type: "activity_days", count: 150 }, hint: "Check in or care for yourself on any 150 days" },
    { id: "evergreen-halo", name: "Evergreen Halo", badge: "🌲", accessory: "🌲", unlock: { type: "care_days", count: 150 }, hint: "Complete your essential care on any 150 days" },
    { id: "storybook-star", name: "Storybook Star", badge: "📖", accessory: "📖", unlock: { type: "reflection_count", count: 100 }, hint: "Write 100 private reflections" },
    { id: "keepsake-gem", name: "Keepsake Gem", badge: "💎", accessory: "💎", unlock: { type: "activity_days", count: 250 }, hint: "Check in or care for yourself on any 250 days" },
    { id: "yearlight-crown", name: "Yearlight Crown", badge: "🏆", accessory: "🏆", unlock: { type: "care_days", count: 365 }, hint: "Complete your essential care on any 365 days" },
  ];

  const APPEARANCE_THEMES = [
    { id: "soft", label: "Soft Plush Theme", icon: "💜", background: "#FFF6FB", glowA: "#FFD9EC", glowB: "#C9ECFF", glowC: "#FFF3D6", glowD: "#D6F5E3", wash: "#FFF9FCDD", accent: "#C77DD6" },
    { id: "twilight", label: "Twilight Theme", icon: "🌙", background: "#DDD4FF", glowA: "#9784E6", glowB: "#7FADE8", glowC: "#D99BE8", glowD: "#AAB7F2", wash: "#EEE9FFB8", accent: "#6950B6" },
    { id: "meadow", label: "Meadow Theme", icon: "🌿", background: "#D9F2DE", glowA: "#77C98B", glowB: "#75C7C1", glowC: "#E8C95D", glowD: "#9BD17D", wash: "#ECFAEEB8", accent: "#328660" },
  ];

  const MASCOT_GROWTH_STAGES = [
    { minDays: 100, label: "radiant", glow: "0 0 0 14px rgba(255,209,102,0.16), 0 0 0 28px rgba(199,125,214,0.10)", sparkles: ["✨", "💫", "✨", "💫"] },
    { minDays: 60, label: "glowing", glow: "0 0 0 10px rgba(255,209,102,0.15), 0 0 0 20px rgba(199,125,214,0.09)", sparkles: ["✨", "✨"] },
    { minDays: 30, label: "blooming", glow: "0 0 0 8px rgba(199,125,214,0.13)", sparkles: ["✨"] },
    { minDays: 7, label: "growing", glow: "0 0 0 5px rgba(199,125,214,0.10)", sparkles: [] },
    { minDays: 0, label: "new", glow: "none", sparkles: [] },
  ];

  const DAYS = [
    { id: "mon", label: "MON", title: "Monday", accent: "#FFB84D", reflect: "What do I want this week to feel like?" },
    { id: "tue", label: "TUE", title: "Tuesday", accent: "#4DD0B0", reflect: "One thing I'm proud of today:" },
    { id: "wed", label: "WED", title: "Wednesday", accent: "#FF7A94", reflect: "What went well today?" },
    { id: "thu", label: "THU", title: "Thursday", accent: "#4DD0B0", reflect: "What emotion did I notice today?" },
    { id: "fri", label: "FRI", title: "Friday", accent: "#B266E8", reflect: "I celebrated myself by:" },
    { id: "sat", label: "SAT", title: "Saturday", accent: "#5AC8FA", reflect: "What made me happy today?" },
    { id: "sun", label: "SUN", title: "Sunday", accent: "#C77DD6", reflect: "Wins of the week — write down three." },
  ];

  const TEMPLATE_PACKS = [
    { id: "basics", label: "Just the basics", emoji: "🌱", tasks: [
      { task: "Drink water", section: "Every day" },
      { task: "Take a little stretch", section: "Every day" },
      { task: "Get ready for tomorrow", section: "Every day" },
    ] },
    { id: "morning", label: "Gentle morning routine", emoji: "☀️", tasks: [
      { task: "Drink a glass of water", section: "Morning" },
      { task: "Wash my face", section: "Morning" },
      { task: "Eat something", section: "Morning" },
      { task: "Take my medication or vitamins", section: "Morning" },
    ] },
    { id: "selfcare", label: "Basic self-care", emoji: "🧸", tasks: [
      { task: "Brush my teeth", section: "Self-care" },
      { task: "Shower or wash up", section: "Self-care" },
      { task: "Tidy one small space", section: "Self-care" },
      { task: "Do something comforting", section: "Self-care" },
    ] },
    { id: "fitness", label: "Simple fitness", emoji: "🏃", tasks: [
      { task: "Move my body for 10 minutes", section: "Movement" },
      { task: "Stretch", section: "Movement" },
      { task: "Drink water", section: "Movement" },
    ] },
    { id: "workday", label: "Workday survival", emoji: "💼", tasks: [
      { task: "Check messages once", section: "Workday" },
      { task: "Take a real break", section: "Workday" },
      { task: "Eat lunch away from my desk", section: "Workday" },
      { task: "Wrap up for the day", section: "Workday" },
    ] },
    { id: "low_energy", label: "Low-energy day", emoji: "○", tasks: [
      { task: "Drink water", section: "Low-energy" },
      { task: "Take medication if needed", section: "Low-energy" },
      { task: "Rest without guilt", section: "Low-energy" },
      { task: "One tiny task, if I can", section: "Low-energy" },
    ] },
    { id: "bedtime", label: "Bedtime wind-down", emoji: "🌙", tasks: [
      { task: "Brush my teeth", section: "Bedtime" },
      { task: "Put my phone away", section: "Bedtime" },
      { task: "Dim the lights", section: "Bedtime" },
      { task: "Read or relax for a few minutes", section: "Bedtime" },
    ] },
    { id: "medication", label: "Medication", emoji: "💊", tasks: [
      { task: "Take morning medication", section: "Medication" },
      { task: "Take evening medication", section: "Medication" },
      { task: "Check if I need a refill", section: "Medication" },
    ] },
    { id: "cleaning_reset", label: "Cleaning reset", emoji: "🧹", tasks: [
      { task: "Clear one surface", section: "Cleaning reset" },
      { task: "Put away 5 things", section: "Cleaning reset" },
      { task: "Take out the trash", section: "Cleaning reset" },
      { task: "Wipe one counter", section: "Cleaning reset" },
    ] },
    { id: "sunday_reset", label: "Sunday reset", emoji: "🗓️", tasks: [
      { task: "Look ahead at the week", section: "Sunday reset" },
      { task: "Prep one meal or snack", section: "Sunday reset" },
      { task: "Tidy up for the week ahead", section: "Sunday reset" },
      { task: "Rest for a bit", section: "Sunday reset" },
    ] },
    { id: "grounding", label: "Comfort & grounding", emoji: "🧘", tasks: [
      { task: "Take 3 slow breaths", section: "Comfort" },
      { task: "Hold something comforting", section: "Comfort" },
      { task: "Name 3 things I can see", section: "Comfort" },
      { task: "Do one grounding thing", section: "Comfort" },
    ] },
    { id: "blank", label: "Start from scratch", emoji: "📝", tasks: [] },
  ];

  const DASHBOARDS = [
    { id: "today", label: "PlushHome", icon: "☀️", accent: "#C77DD6" },
    { id: "week", label: "PlushCalendar", icon: "📅", accent: "#4C8FE8" },
    { id: "care", label: "PlushCare", icon: "♥", accent: "#318C79" },
    { id: "progress", label: "PlushGrowth", icon: "📈", accent: "#8E4EAA" },
  ];

  const PLUSH_PATHS = [
    { id: "back_on_track", icon: "🌱", title: "Getting Back on Track", description: "Seven forgiving days for returning after routines slipped away.", days: [
      { label: "Open PlushLife and check in", guide: "Just open the app and tap how you're feeling. That's the whole step — no list to finish yet." },
      { label: "Choose three essentials", guide: "Pick the 3 things that matter most today. Everything else can wait without counting against you." },
      { label: "Use one Tiny task", guide: "Swap one task for its smallest version. Partial effort still counts as care." },
      { label: "Make one task easier", guide: "Lower the bar on one thing — shorter, smaller, or simpler than usual." },
      { label: "Take a planned rest", guide: "Schedule real downtime today, on purpose, not as a leftover." },
      { label: "Notice what helped", guide: "Look back at this week and name one thing that made today easier." },
      { label: "Build next week's gentle version", guide: "Use what you noticed to set next week's essentials before you need them." },
    ] },
    { id: "morning_reset", icon: "🌤️", title: "Gentle Morning Reset", description: "A seven-day path toward mornings with less friction.", days: [
      { label: "Drink something", guide: "Water, tea, anything — just get one sip in before you do anything else." },
      { label: "Open the curtains", guide: "Let in real light as soon as you can. It helps your body know the day started." },
      { label: "Choose tomorrow's first step", guide: "Pick the very first thing you'll do tomorrow morning, right now, while it's easy to decide." },
      { label: "Try a Tiny hygiene task", guide: "Do the smallest version of one hygiene habit — it still counts." },
      { label: "Add one pleasant cue", guide: "Put on music, a favorite scent, or something that makes mornings feel less flat." },
      { label: "Remove one morning obstacle", guide: "Notice what slows you down most, and move it out of the way tonight." },
      { label: "Save your new morning routine", guide: "Write down whichever pieces actually worked, so you don't have to reinvent them." },
    ] },
    { id: "sleep_foundations", icon: "🌙", title: "Better Sleep Foundations", description: "Seven practical wind-down experiments without perfection pressure.", days: [
      { label: "Pick a wind-down time", guide: "Choose one consistent time to start slowing down, even if bedtime shifts." },
      { label: "Dim one source of light", guide: "Turn off or dim just one light earlier than usual tonight." },
      { label: "Move the phone farther away", guide: "Put it somewhere that takes a few steps to reach once you're in bed." },
      { label: "Prepare one thing for morning", guide: "Set out or set up one thing tonight so morning-you has less to do." },
      { label: "Try a quiet body reset", guide: "Stretch, breathe, or just lie still for a minute before trying to sleep." },
      { label: "Notice what helped", guide: "Think back over the week — which change actually made falling asleep easier?" },
      { label: "Save your preferred bedtime routine", guide: "Keep whichever pieces worked as your new default, drop the rest." },
    ] },
    { id: "small_sips", icon: "💧", title: "Small Sips, Steady Days", description: "Seven days of noticing water and energy without any tracking pressure.", days: [
      { label: "Keep water somewhere you'll actually see it", guide: "Put a glass or bottle in your eyeline, not tucked away." },
      { label: "Drink one glass before a screen turns on", guide: "Just one, before the phone or laptop — before anything else competes for attention." },
      { label: "Pair a sip with an existing habit", guide: "Drink water right before or after something you already do daily." },
      { label: "Notice one moment you felt foggy", guide: "No need to fix it — just notice when your focus dipped today." },
      { label: "Try water before reaching for caffeine", guide: "Next time you want coffee or soda, try water first and see how you feel." },
      { label: "Take a Tiny check-in on how you feel", guide: "A quick gut-check: thirsty, tired, or steady? No wrong answer." },
      { label: "Keep whatever worked, drop the rest", guide: "Look back and keep only the habit that actually made a difference." },
    ] },
    { id: "gentle_movement", icon: "🚶", title: "Move a Little, Feel a Little Better", description: "Seven days of movement sized to however much energy you actually have.", days: [
      { label: "Stand up and stretch once", guide: "Just once today — reach up, roll your shoulders, whatever your body wants." },
      { label: "Take a two-minute walk, indoors is fine", guide: "Around the room, the hallway, wherever — two minutes is the whole goal." },
      { label: "Move to different music for one song", guide: "Put on one song and let your body move however it wants to." },
      { label: "Try a seated stretch if energy is low", guide: "No need to stand — reach, roll your neck, or stretch your arms from a chair." },
      { label: "Step outside for any length of time", guide: "Even 30 seconds of outside air counts." },
      { label: "Notice how your body feels afterward", guide: "Not before/after talk — just: looser, calmer, or about the same?" },
      { label: "Choose one movement to keep doing", guide: "Pick whichever felt best this week and keep just that one." },
    ] },
    { id: "softer_self_talk", icon: "💬", title: "Softer Self-Talk", description: "Seven days of noticing your inner voice and offering it one kinder option.", days: [
      { label: "Notice one harsh thought without acting on it", guide: "Just catch it. You don't have to argue with it or fix it yet." },
      { label: "Say one thing you did today, plainly", guide: "No judgment attached — just name one thing that happened." },
      { label: "Replace one 'should' with 'could'", guide: "Catch one 'I should have' and rephrase it as 'I could' instead." },
      { label: "Talk to yourself like you would a friend", guide: "If a friend said this about themselves, what would you say back?" },
      { label: "Write down one thing that went okay", guide: "Doesn't need to be big — okay is enough." },
      { label: "Forgive one missed task out loud", guide: "Say, out loud if you can, that missing it doesn't erase the rest of your day." },
      { label: "Keep one phrase that felt kind", guide: "Whichever kinder phrase felt truest this week — hang onto that one." },
    ] },
  ];

  const SLEEP_TOOLS = [
    { id: "racing_thoughts", icon: "💭", title: "My thoughts will not stop", steps: ["Write one sentence about what your mind is holding.", "Tell yourself: I do not have to solve this tonight.", "Take three longer exhales.", "Return attention to the weight of your body on the bed."], breathingPacer: true },
    { id: "night_anxiety", icon: "🌌", title: "I woke up anxious", steps: ["Name where you are and what time it is.", "Notice five neutral things around you.", "Unclench your jaw and hands.", "Take one sip of water if it is nearby."], breathingPacer: true },
    { id: "nightmare", icon: "🕯️", title: "I had a nightmare", steps: ["Remind yourself that the dream has ended.", "Look for three signs that you are in the present.", "Change one sensory detail: light, blanket, temperature, or sound.", "Choose comfort before trying to sleep again."] },
    { id: "phone_pause", icon: "📵", title: "Help me leave my phone", steps: ["Set a two-minute timer.", "Place the phone beyond arm's reach when it ends.", "Choose one quiet replacement: stretch, breathe, or listen.", "You can return tomorrow. Nothing needs your attention tonight."] },
  ];

  const SOUNDSCAPES = [
    { id: "thunderstorm", icon: "⛈️", label: "Thunderstorm" },
    { id: "rain", icon: "🌧️", label: "Gentle Rain" },
    { id: "ocean", icon: "🌊", label: "Ocean Waves" },
    { id: "forest", icon: "🍃", label: "Forest Breeze" },
    { id: "white_noise", icon: "📻", label: "White Noise" },
    { id: "calm_tone", icon: "🎵", label: "Calm Tone" },
  ];

  const GENTLE_AFFIRMATIONS = [
    "You are doing better than you give yourself credit for.",
    "Resting is taking care of yourself, not giving up.",
    "Your productivity does not determine your worth.",
    "Small steps forward are still progress.",
    "It is okay to do things slowly and gently today.",
    "You do not have to finish everything to deserve peace.",
    "Taking a break when overwhelmed is a smart, caring choice.",
    "Be kind to yourself — you are learning as you go.",
    "Partial effort still counts as real care.",
    "Your peace of mind matters more than perfection."
  ];

  const COMFORT_TOOLS = [
    { id: "grounding", icon: "🖐️", name: "Five Senses", steps: ["Name 5 things you can see around you.", "Name 4 things you can touch or feel.", "Name 3 things you can hear right now.", "Name 2 things you can smell.", "Name 1 thing you can taste.", "You're here. You're safe right now."] },
    { id: "water", icon: "💧", name: "Water Reset", steps: ["Get a glass or bottle of water.", "Take a slow sip.", "Notice the temperature and the feeling of swallowing.", "Take another sip if you'd like.", "That's one real thing your body needed."] },
    { id: "breathing", icon: "🫁", name: "One-Minute Breath", steps: ["Breathe in slowly for 4 counts.", "Hold gently for 4 counts.", "Breathe out slowly for 6 counts.", "Repeat this 4 or 5 times, at your own pace.", "No rush. Just breathe."], breathingPacer: true },
    { id: "bedtime", icon: "🌙", name: "Bedtime Wind-Down", steps: ["Put your phone somewhere out of reach.", "Dim the lights, if you can.", "Change into something comfortable to sleep in.", "Do one calm thing — reading, stretching, or just lying still.", "Rest is care too."] },
    { id: "comfort_item", icon: "🧸", name: "Comfort Moment", steps: ["Find your comfort item, or something soft nearby.", "Hold it for a moment.", "Let your shoulders drop.", "Take one slow breath.", "You don't have to do anything else right now."] },
    { id: "change_rooms", icon: "🚶", name: "Change the Scene", steps: ["Stand up, if you're able to.", "Walk to another room, or step outside for a moment.", "Notice one new thing about this space.", "Take a breath here before you go back.", "A change of scenery can be enough of a reset."] },
  ];

  return {
    MASCOT_OUTFITS,
    APPEARANCE_THEMES,
    MASCOT_GROWTH_STAGES,
    DAYS,
    TEMPLATE_PACKS,
    DASHBOARDS,
    PLUSH_PATHS,
    SLEEP_TOOLS,
    SOUNDSCAPES,
    GENTLE_AFFIRMATIONS,
    COMFORT_TOOLS,
  };
});
