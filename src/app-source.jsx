import { ToolPanel, HabitTypeIcon } from "./components/shared.jsx";
import { PlushMascot, NurseryNook, AppLoadingScreen } from "./components/mascot.jsx";
import { BabyArrivalRitual, MamasCorner, BabyModeCareSuite } from "./components/baby-mode.jsx";
import { LandingPage } from "./components/landing.jsx";
import { ProfilePanel, SafetyPanel, HelpPanel, CalmPanel } from "./components/info-panels.jsx";
import { MoodViewer, CarePathViewer, SleepToolViewer, JournalReflectionViewer, DailyJournalPanel } from "./components/viewer-panels.jsx";
import { ScheduleEditorPanel } from "./components/schedule-editor-panel.jsx";
import { RewardsPanel } from "./components/rewards-panel.jsx";
import { AdminPanel } from "./components/admin-panel.jsx";
import { SettingsPanel } from "./components/settings-panel.jsx";
import { TasksPanel } from "./components/tasks-panel.jsx";
import { GuardianPanel } from "./components/guardian-panel.jsx";
import { CarePanel } from "./components/care-panel.jsx";
import { ProgressPanel } from "./components/progress-panel.jsx";
import { WeekPanel } from "./components/week-panel.jsx";
import { TodayPanel } from "./components/today-panel.jsx";
import { createDeviceBackup, getDeviceBackupStatus, scheduleAutomaticDeviceBackup, verifyDeviceBackup } from "./device-backup.js";

const { useState, useEffect } = React;
const supabase = window.supabase.createClient(
  "https://pvitdhixycegmcovapyh.supabase.co",
  "sb_publishable_SScDCEHovc68ITiEUu6lCg_mHPe2oaI",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
const SUPABASE_AUTH_STORAGE_KEY = "sb-pvitdhixycegmcovapyh-auth-token";
const WARM_START_CACHE_VERSION = 1;
const WARM_START_CACHE_MAX_AGE_MS = 2 * 60 * 60 * 1000;

function warmStartCacheKey(userId, date) {
  return `plushlife:warm-start:v1:${userId}:${date}`;
}

function readWarmStartCache(userId, date) {
  if (!userId || !date) return null;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(warmStartCacheKey(userId, date)) || "null");
    if (!parsed || parsed.version !== WARM_START_CACHE_VERSION || parsed.date !== date) return null;
    if (!Number.isFinite(parsed.savedAt) || Date.now() - parsed.savedAt > WARM_START_CACHE_MAX_AGE_MS) return null;
    if (!Array.isArray(parsed.tasks) || !Array.isArray(parsed.schedules) || !Array.isArray(parsed.exceptions) || !Array.isArray(parsed.snoozes)) return null;
    if (!parsed.done || typeof parsed.done !== "object" || Array.isArray(parsed.done)) return null;
    return parsed;
  } catch (_error) {
    return null;
  }
}

function writeWarmStartCache(userId, date, value) {
  if (!userId || !date) return;
  try {
    window.localStorage.setItem(warmStartCacheKey(userId, date), JSON.stringify({
      version: WARM_START_CACHE_VERSION, date, savedAt: Date.now(), ...value,
    }));
  } catch (_error) {}
}
const VAPID_PUBLIC_KEY = "BMJMbr9mvNVbmo7X8YNKHxOL0Wb62RNvfti9jMn8lwlCFaYqJpZqxam_GDE5RRU-p9RRFscP1mIetfa404Em7Dw";
const {
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
} = window.PlushLifeContent;
const {
  MOTHERLY_NICKNAMES,
  OPTIONAL_SECTION_MARKERS,
  formatRelativeTime,
  urlBase64ToUint8Array,
  mascotGrowthStageForDays,
} = window.PlushLifeHelpers;
const {
  isQuietTime,
  taskIsOptional,
  scheduleLabelForTask,
  reflectionPromptForDay,
  trackerPeriod,
  dayIdForDate,
  pathOfTheWeekId,
  dateForDayId,
  formatTime12,
  parseTime24,
  splitScheduleField,
  legacyScheduleToEntries,
  habitTypeForTask,
  cleanTaskDetail,
  encodeTaskDetail,
  offsetDate,
  monthKeyOffset,
  daysInCalendarMonth,
  datesInMonthThrough,
  daysBetweenDates,
  taskOccursOn,
  taskIsScheduledForDate,
  datesThroughToday,
  WEEKDAY_PRESET_IDS,
  WEEKEND_PRESET_IDS,
} = window.PlushLifeSchedule;
const { getBillingProvider } = window.PlushLifeBilling;




function playCelebrationChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const context = new AudioContext();
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.75);
    gain.connect(context.destination);
    [523.25, 659.25, 783.99].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      oscillator.connect(gain);
      oscillator.start(context.currentTime + index * 0.12);
      oscillator.stop(context.currentTime + 0.5 + index * 0.12);
    });
    window.setTimeout(() => context.close(), 1200);
  } catch (_error) {
    // The visual celebration still works if a browser blocks audio.
  }
}


// ————— Sable's Weekly Glow-Up & Self-Care Tracker —————
// Structure + care + progress, not perfection. 💜

// Day metadata only (id/label/title/accent/reflect). Actual checklist content
// lives privately per-account in Supabase (`tracker_tasks`), never in this file.
const DAILY = { id: "daily", label: "DAILY", title: "Every Day Core", accent: "#C77DD6" };


// Quick-select presets for a task's schedule_days — distinct from a task's
// day_id === "daily" (which has no schedule_days at all). Both make a task
// occur every day, but before this they were indistinguishable anywhere in
// the UI; scheduleLabelForTask below is what actually tells them apart.



const ALL = [DAILY, ...DAYS];

const CHECKIN_MOODS = [
  ["happy", "😊", "Happy"], ["calm", "😌", "Calm"], ["okay", "🙂", "Okay"],
  ["tired", "😴", "Tired"], ["stressed", "😣", "Stressed"], ["anxious", "😟", "Anxious"],
  ["sad", "😢", "Sad"], ["angry", "😠", "Angry"], ["lonely", "🥺", "Lonely"],
  ["overwhelmed", "😵‍💫", "Overwhelmed"], ["numb", "😶", "Numb"], ["sick", "🤒", "Sick"],
];

const PRIMARY_CHECKIN_MOODS = ["happy", "okay", "tired", "anxious", "sad", "overwhelmed"];

const MOOD_DAY_GUESSES = {
  happy: { capacity: "high", energy: "high", day_type: "full" },
  calm: { capacity: "usual", energy: "steady", day_type: "full" },
  okay: { capacity: "usual", energy: "steady", day_type: "full" },
  tired: { capacity: "low", energy: "low", day_type: "soft" },
  stressed: { capacity: "low", energy: "steady", day_type: "soft" },
  anxious: { capacity: "low", energy: "steady", day_type: "soft" },
  sad: { capacity: "very_low", energy: "low", day_type: "tiny" },
  angry: { capacity: "low", energy: "high", day_type: "soft" },
  lonely: { capacity: "low", energy: "low", day_type: "soft" },
  overwhelmed: { capacity: "very_low", energy: "empty", day_type: "tiny" },
  numb: { capacity: "very_low", energy: "empty", day_type: "tiny" },
  sick: { capacity: "very_low", energy: "empty", day_type: "tiny" },
};

const CAPACITY_LABELS = { very_low: "Very low", low: "Low", usual: "Usual", high: "High" };

const ENERGY_LEVELS = [
  ["empty", "○", "Empty"], ["low", "🌙", "Low"], ["steady", "🌤️", "Steady"], ["high", "⚡", "High"],
];

const DAY_TYPES = [
  ["full", "☀️", "Full", "Your complete routine"],
  ["soft", "🌤️", "Soft", "Gentler task versions"],
  ["tiny", "🌱", "Tiny", "Smallest meaningful steps"],
  ["recovery", "↺", "Recovery", "A few gentle rebuilding steps"],
  ["rest", "🌴", "Rest", "Protected rest without guilt"],
];

const SUPPORT_PREFERENCES = [
  ["comfort", "🧸", "Comfort"], ["encouragement", "💛", "Encouragement"],
  ["structure", "≡", "Structure"], ["practical", "🧰", "Practical help"],
  ["company", "☕", "Quiet company"], ["space", "🌙", "Space"],
];

const ONBOARDING_REASON_PROFILES = {
  general: {
    description: "Keeps the full cozy experience, nurturing check-ins, and private pattern suggestions on.",
    preferences: { focus_mode: false, simple_mode: false, nurturing_checkins: true, pattern_insights_enabled: true, reduced_motion: false },
  },
  focus: {
    description: "Turns on Focus Mode and the quieter layout so you see fewer decisions at once.",
    preferences: { focus_mode: true, simple_mode: true, nurturing_checkins: true, pattern_insights_enabled: true },
  },
  burnout: {
    description: "Starts with a quieter, lower-motion layout and makes today a gentle Recovery Day.",
    preferences: { focus_mode: false, simple_mode: true, nurturing_checkins: true, pattern_insights_enabled: true, reduced_motion: true },
  },
  plain: {
    description: "Uses a quieter tracker layout with straightforward task language and fewer nurturing prompts.",
    preferences: { focus_mode: false, simple_mode: true, nurturing_checkins: false, pattern_insights_enabled: false, reduced_motion: false },
  },
};

const SUPPORT_GUIDANCE = {
  comfort: { text: "Open a short Comfort Moment when you are ready.", action: "Open Comfort Moment" },
  encouragement: { text: "You do not have to do today perfectly. One caring step is enough." },
  structure: { text: "PlushLife will keep One Next Step at the top so you can begin without sorting the whole list." },
  practical: { text: "Choose the few tasks that truly need to count today.", action: "Choose what counts" },
  company: { text: "Use Help Me Say It to ask a trusted Guardian for quiet company.", action: "Open Guardian support" },
  space: { text: "No extra prompt is needed. Close this check-in and take the space you asked for." },
};

const HELP_ME_NOW_OPTIONS = [
  { id: "anxious", icon: "🌬️", label: "I feel anxious", tool: "breathing", next: "Afterward, choose one thing your body needs." },
  { id: "overwhelmed", icon: "☁️", label: "Everything feels like too much", tool: "grounding", next: "Then switch today to Tiny if that would feel kinder." },
  { id: "cannot_start", icon: "🌱", label: "I cannot start", tool: "change_rooms", next: "When you return, do only the first two-minute piece." },
  { id: "need_food", icon: "🍞", label: "I need to eat", tool: "water", next: "Pick the easiest available food. It does not need to be a proper meal." },
  { id: "need_hygiene", icon: "✦", label: "Hygiene feels hard", tool: "comfort_item", next: "Choose the Tiny version. Partial care is still care." },
  { id: "cannot_sleep", icon: "🌙", label: "I cannot sleep", tool: "bedtime", next: "Resting quietly still helps, even if sleep does not arrive immediately." },
  { id: "lonely", icon: "☕", label: "I feel lonely", tool: "comfort_item", next: "You can also send a prepared support request to a Guardian." },
  { id: "not_sure", icon: "?", label: "I do not know what I need", tool: "grounding", next: "Notice what feels most urgent: body, environment, task, or connection." },
];




// Ambient sound is generated on the fly with the Web Audio API rather than
// shipping recorded audio files — no licensing to track, nothing to
// download, and it still works offline once the page has loaded.
let soundscapeAudioCtx = null;
let soundscapeNodes = null;

function ensureSoundscapeAudioContext() {
  if (!soundscapeAudioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    soundscapeAudioCtx = new Ctx();
  }
  if (soundscapeAudioCtx.state === "suspended") soundscapeAudioCtx.resume();
  return soundscapeAudioCtx;
}

function makeSoundscapeNoiseBuffer(ctx) {
  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

// Plain filtered white noise reads as exactly that - noise - no matter which
// single filter shapes it, which is why "Rain" and "White Noise" sounded
// like near-identical hiss with a different tint. Real rain has a steady
// hiss bed *plus* irregular droplet transients layered on top; an 8-second
// buffer (vs. the 2-second shared noise buffer) keeps that randomness from
// reading as an obviously repeating pattern.
function makeRainNoiseBuffer(ctx) {
  const bufferSize = 8 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.35;
  let cursor = 0;
  while (cursor < bufferSize) {
    cursor += Math.floor((0.01 + Math.random() * 0.05) * ctx.sampleRate);
    const burstLength = Math.floor((0.01 + Math.random() * 0.02) * ctx.sampleRate);
    const amplitude = 0.4 + Math.random() * 0.5;
    for (let j = 0; j < burstLength && cursor + j < bufferSize; j++) {
      const decay = Math.exp(-j / (burstLength * 0.3));
      data[cursor + j] += (Math.random() * 2 - 1) * amplitude * decay;
    }
  }
  let peak = 0;
  for (let i = 0; i < bufferSize; i++) peak = Math.max(peak, Math.abs(data[i]));
  if (peak > 1) for (let i = 0; i < bufferSize; i++) data[i] /= peak;
  return buffer;
}

function stopSoundscape() {
  if (!soundscapeNodes) return;
  const { source, filter, gain, extraOscillators, audio } = soundscapeNodes;
  if (audio) {
    try { audio.pause(); } catch (_error) {}
    try { audio.currentTime = 0; } catch (_error) {}
    soundscapeNodes = null;
    return;
  }
  try { source.stop(); } catch (_error) {}
  source.disconnect();
  if (filter) filter.disconnect();
  gain.disconnect();
  (extraOscillators || []).forEach((osc) => {
    try { osc.stop(); } catch (_error) {}
    osc.disconnect();
  });
  soundscapeNodes = null;
}

function startSoundscape(id, volume) {
  stopSoundscape();
  if (id === "thunderstorm") {
    const audio = new Audio("./assets/thunderstorm.mp3?v=2");
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = volume;
    soundscapeNodes = { audio };
    audio.play().catch(() => {
      if (soundscapeNodes?.audio === audio) soundscapeNodes = null;
    });
    return;
  }
  const ctx = ensureSoundscapeAudioContext();
  const gain = ctx.createGain();
  gain.gain.value = volume;
  gain.connect(ctx.destination);

  if (id === "calm_tone") {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 174;
    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.value = 220;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.1;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.03;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    osc.connect(gain);
    osc2.connect(gain);
    osc.start();
    osc2.start();
    lfo.start();
    soundscapeNodes = { source: osc, gain, extraOscillators: [osc2, lfo] };
    return;
  }

  const source = ctx.createBufferSource();
  source.buffer = id === "rain" ? makeRainNoiseBuffer(ctx) : makeSoundscapeNoiseBuffer(ctx);
  source.loop = true;
  const filter = ctx.createBiquadFilter();
  const extraOscillators = [];
  if (id === "rain") {
    filter.type = "highpass";
    filter.frequency.value = 900;
  } else if (id === "forest") {
    filter.type = "bandpass";
    filter.frequency.value = 650;
    filter.Q.value = 1.8;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 220;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();
    extraOscillators.push(lfo);
  } else if (id === "ocean") {
    filter.type = "lowpass";
    filter.frequency.value = 400;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.15;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 150;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();
    extraOscillators.push(lfo);
  } else {
    filter.type = "lowpass";
    filter.frequency.value = 9000;
  }
  source.connect(filter);
  filter.connect(gain);
  source.start();
  soundscapeNodes = { source, filter, gain, extraOscillators };
}

function setSoundscapeVolume(volume) {
  if (soundscapeNodes?.audio) soundscapeNodes.audio.volume = volume;
  else if (soundscapeNodes?.gain) soundscapeNodes.gain.gain.value = volume;
}

const TREND_WEEKS = 8;
const TREND_MONTHS = 6;









// A little honest variety in how a badge unlock gets announced, so the same
// milestone doesn't read as a rote, identical toast every single time. The
// badge itself and when it's earned are never randomized - only which of
// these equally-true phrasings introduces it.
const BADGE_CELEBRATION_INTROS = [
  "🎉 New badge earned:",
  "✨ You just unlocked:",
  "🌟 Nice work — you earned:",
  "🎊 Look at that:",
];
const THEME_VOICE = {
  warm: {
    dayComplete: "Day complete — nice work today.",
    celebrationTitles: ["100% complete! ✨", "Every required task, done. 🌟", "You showed up for yourself today. ✨"],
    nurturingSome: (count) => `You've already finished ${count} ${count === 1 ? "thing" : "things"} today — good progress.`,
    nurturingNone: "A soft start still counts. Pick one small thing when you're ready.",
    welcomeBack: (days) => `It's been ${days} days — no pressure. Just pick one small thing to restart with, whenever you're ready.`,
    testNotifTitle: "Just checking in",
    testNotifBody: "How are you doing today? Come check in when you're ready.",
    testNotifBodyDiscreet: "A check-in is ready for you.",
  },
  baby_motherly: {
    dayComplete: "All your little jobs are done, sweet baby. Mommy is so, so proud of you! 🧸✨",
    celebrationTitles: ["Look at my clever little one go! Mommy's so proud! 🎉", "All the little jobs are done—Mommy's beaming! 🍼", "Such a good try, sweetheart. You did it! ✨"],
    nurturingSome: (count) => `You already did ${count} ${count === 1 ? "little thing" : "little things"} today, little one. Mommy noticed, and she's proud of you. 🧸`,
    nurturingNone: "No rush, little one. We can make today very small—just one tiny thing when you're ready. Mommy's right here. 🍼",
    welcomeBack: (days) => `It's been ${days} sleeps, little one. You don't need to explain a thing—Mommy's just happy to see you. We can start with one tiny step. 🧸`,
    testNotifTitle: "A little hello from Mommy 🍼",
    testNotifBody: "Just a gentle check-in, sweetheart. Come back whenever you feel ready. 🧸",
    testNotifBodyDiscreet: "A gentle check-in is waiting for you.",
  },
  baby_fatherly: {
    dayComplete: "All done, kiddo — Daddy's proud of you! 🍼✨",
    celebrationTitles: ["Atta kid! You did it! Daddy's so proud! 🎉", "Every task, all done! Daddy's beaming! 🍼", "Look at you go, kiddo! Daddy's so happy! ✨"],
    nurturingSome: (count) => `You already did ${count} ${count === 1 ? "thing" : "things"} today, kiddo! Daddy's proud of you! 🧸`,
    nurturingNone: "It's okay to go slow, buddy. Just one little thing when you're ready — Daddy's right here. 🍼",
    welcomeBack: (days) => `It's been ${days} sleeps, kiddo. No worries at all — Daddy's just glad you're back. Come do one little thing whenever you want. 🧸`,
    testNotifTitle: "Hi kiddo, it's Daddy 🍼",
    testNotifBody: "Just checking on you, buddy. Come say hi whenever you're ready. 🧸",
    testNotifBodyDiscreet: "A gentle check-in is waiting for you.",
  },
  dino: {
    dayComplete: "RAWR! Day complete — you're dino-mite! 🦕",
    celebrationTitles: ["Stomp! 100% complete! 🦖✨", "RAWR! Every task, done! 🦕", "You're dino-mite today! 🦖✨"],
    nurturingSome: (count) => `You already stomped through ${count} ${count === 1 ? "thing" : "things"} today! Roar-some! 🦕`,
    nurturingNone: "Even a tiny dino takes small steps. Pick one thing when you're ready. 🦖",
    welcomeBack: (days) => `It's been ${days} days since your last stomp! No pressure, just pick one thing to get back on track. 🦕`,
    testNotifTitle: "Rawr! Just checking on you 🦕",
    testNotifBody: "Ready to stomp through your day? Come check in when you're ready.",
    testNotifBodyDiscreet: "A gentle check-in is ready for you.",
  },
};

// ————— Supporter unlock (groundwork only) —————
// This is the single switch that turns any free-tier limit on or off, everywhere.
// While false, every account behaves exactly as it does today — nobody sees a
// limit, an upsell, or any different behavior. Flip only when explicitly asked to.
const SUPPORTER_FEATURES_ENABLED = false;
const FREE_TASK_LIMIT_PER_DAY = 5;
const FREE_GUARDIAN_LIMIT = 1;

// ————— Internal access-tier architecture (groundwork only, beta today) —————
// Never surfaced in the UI — no tier name, price, or lock icon anywhere while
// ACCESS_STATE is "beta". This just gives future billing code one place to
// check instead of scattering feature flags through the app. See the
// entitlements table (database/entitlements.sql) for the provider-neutral
// purchase-record shape this will eventually read from, and
// assets/entitlements.js for the actual plan/feature-flag definitions —
// PLUSH_ENFORCE_ENTITLEMENTS below is the one switch that would ever pass
// enforced: true to hasPlushFeature(); it stays false in every real build.
const ACCESS_STATE = "beta"; // "beta" | "free" | "plus"
const ALL_FEATURES_UNLOCKED = true;
const BILLING_ENABLED = false;
const PAYWALLS_ENABLED = false;
const PLUSH_ENFORCE_ENTITLEMENTS = false;

// ————— Provider-neutral billing architecture (groundwork only, inert) —————
// Never called from any UI while BILLING_ENABLED is false. Both product IDs
// below are placeholders pending your approval (see original project spec,
// section 33) - do not invent real ones or wire this to a purchase screen.
const BILLING_PRODUCT_IDS = { monthly: "plushplus_monthly", yearly: "plushplus_yearly" };

// A BillingProvider is any object implementing this shape. The central app
// code should only ever call through this interface, never a
// platform-specific API directly, so adding Apple later doesn't touch
// anything else. All methods are async because every real implementation
// crosses a native bridge or network call.
//   getProducts(): Promise<{ id, price, period }[]>
//   purchase(productId): Promise<{ success, transactionRef }>
//   restorePurchases(): Promise<{ success, restoredCount }>
//   getSubscriptionStatus(): Promise<{ status, expiresAt, autoRenewing } | null>
//   manageSubscription(): Promise<void>  // opens the platform's own subscription-management UI


const CURRENT_CHANGELOG_VERSION = "2026-08-02-progress-insights";
const CHANGELOG_ITEMS = [
  "📊 New multi-week trend chart on Progress — see your last 8 weeks at a glance, not just this week vs. last",
  "⚡ New Energy insight compares how much you complete on higher- vs. lower-energy days",
  "🔥 Habit streaks are now shown right on your Habit Garden tasks, with your all-time best",
  "🎧 New Soundscapes on PlushSleep — Rain, Ocean, White Noise, and Calm Tone, generated live so they work offline",
  "🎭 The Guardian role picker now explains exactly what each role can and can't do",
  "🧸 New \"Feeling stuck? Pick one thing for me\" helper gently chooses one required task when your list feels like too much",
  "🚀 Faster, smoother app launch — no more flash of the sign-in screen before your list appears",
];


const NOTIFICATION_NUDGE_REASONS = [
  "A gentle nudge at the right time can be the difference between remembering and forgetting — you choose exactly when.",
  "You don't have to rely on remembering by yourself. A quiet reminder can carry some of that for you.",
  "Notifications here are quiet check-ins, not pressure — and you can turn them off just as easily.",
  "A lot of people find it easier to build a rhythm with a small reminder, rather than trying to just remember.",
];

const MAKE_IT_EASIER_SUGGESTIONS = [
  "Just do the very first tiny part — that's enough for now.",
  "Set a timer for 2 minutes. When it rings, you're allowed to stop.",
  "Pick the single easiest piece of this and only do that piece.",
  "Do about 10% of it. A small piece still counts as real care.",
  "Try it sitting down, or from bed, if that makes it easier to start.",
  "Ask yourself: what's the smallest version of this I could still call done?",
];

const GUARDIAN_ROLE_PRESETS = [
  { id: "view_only", label: "Just keep an eye on things", icon: "👀", description: "Can see your progress and tasks. Can't message you, add rewards, or suggest tasks.", permissions: { can_view_progress: true, can_send_notes: false, can_add_rewards: false, can_suggest_tasks: false } },
  { id: "accountability", label: "Accountability partner", icon: "🎯", description: "Can see your progress and suggest tasks for you to add. Can't send notes or add rewards.", permissions: { can_view_progress: true, can_send_notes: false, can_add_rewards: false, can_suggest_tasks: true } },
  { id: "encouragement", label: "Encouragement only", icon: "💛", description: "Can send you encouraging notes and set up rewards. Can't see your progress or tasks at all.", permissions: { can_view_progress: false, can_send_notes: true, can_add_rewards: true, can_suggest_tasks: false } },
  { id: "full", label: "Full support", icon: "🌟", description: "Can see your progress, send notes, add rewards, and suggest tasks — everything.", permissions: { can_view_progress: true, can_send_notes: true, can_add_rewards: true, can_suggest_tasks: true } },
];

// Tables restorable from a "Download my data" export. Guardian-relationship
// tables (caregiver_links, support_notes, support_rewards, task_suggestions,
// guardian_support_requests) are deliberately excluded — they reference
// another person's account, which a solo restore can't safely reconstruct.
// They're still included in the export itself for transparency.
const RESTORABLE_DATA_TABLES = [
  { payloadKey: "tasks", table: "tracker_tasks", onConflict: "user_id,task_key" },
  { payloadKey: "schedules", table: "tracker_schedules", onConflict: "user_id,day_id" },
  { payloadKey: "private_reflections", table: "private_notes", onConflict: "user_id,note_date" },
  { payloadKey: "daily_progress", table: "daily_progress", onConflict: "user_id,progress_date" },
  { payloadKey: "mood_and_energy_check_ins", table: "daily_check_ins", onConflict: "user_id,check_date" },
  { payloadKey: "plush_path_progress", table: "plush_path_progress", onConflict: "user_id,path_id" },
  { payloadKey: "rest_days", table: "rest_days", onConflict: "user_id,rest_date" },
  { payloadKey: "weekly_intention_checkins", table: "weekly_intention_checkins", onConflict: "user_id,week_start", stripId: true },
  { payloadKey: "weekly_intentions", table: "weekly_intentions", onConflict: "user_id,week_start" },
  { payloadKey: "task_completion_history", table: "tracker_progress", onConflict: "user_id,task_key" },
  { payloadKey: "care_session_history", table: "care_session_logs", stripId: true },
  { payloadKey: "private_mommy_chats", table: "mommy_chat_threads", onConflict: "id" },
  { payloadKey: "profile", table: "tracker_profiles", onConflict: "user_id", single: true },
  { payloadKey: "preferences", table: "app_preferences", onConflict: "user_id", single: true },
  { payloadKey: "achievements", table: "user_achievements", onConflict: "user_id", single: true },
];

const HABIT_REWARDS = [
  { count: 1, badge: "🌱", label: "First sprout" },
  { count: 3, badge: "✨", label: "Three caring check-ins" },
  { count: 7, badge: "🏅", label: "Seven caring check-ins" },
  { count: 14, badge: "🌟", label: "Fourteen-check-in glow" },
  { count: 30, badge: "👑", label: "Thirty-check-in crown" },
];
















function GlowUpTracker() {
  const [active, setActive] = useState(() => dayIdForDate(trackerPeriod().date));
  const [dashboard, setDashboard] = useState("today");
  const [appearanceTheme, setAppearanceTheme] = useState("soft");
  const [deviceBackupStatus, setDeviceBackupStatus] = useState({ exists: false, savedAt: null });
  const [deviceBackupBusy, setDeviceBackupBusy] = useState(false);
  const [deviceBackupVerifyBusy, setDeviceBackupVerifyBusy] = useState(false);
  const [progressView, setProgressView] = useState("overview");
  const swipeStartX = React.useRef(null);
  const swipeStartY = React.useRef(null);
  const todaySwipeStartX = React.useRef(null);
  const todaySwipeStartY = React.useRef(null);
  const weekSwipeStartX = React.useRef(null);
  const weekSwipeStartY = React.useRef(null);
  const newTaskNameInputRef = React.useRef(null);
  const restoreFileInputRef = React.useRef(null);
  const [todayCardIndex, setTodayCardIndex] = useState(0);
  const [todayExtrasOpen, setTodayExtrasOpen] = useState(false);
  const [taskListCollapsed, setTaskListCollapsed] = useState(true);
  const [weekCardIndex, setWeekCardIndex] = useState(() => {
    try {
      const stored = Number(window.localStorage.getItem("plushlist-calendar-view"));
      return Number.isInteger(stored) && stored >= 0 && stored <= 2 ? stored : 1;
    } catch (_error) { return 1; }
  });
  useEffect(() => {
    try { window.localStorage.setItem("plushlist-calendar-view", String(weekCardIndex)); } catch (_error) {}
  }, [weekCardIndex]);
  const [upcomingPreviewDate, setUpcomingPreviewDate] = useState(null);
  const [calendarWeekOffset, setCalendarWeekOffset] = useState(0);
  const [calendarWeekPreviewDate, setCalendarWeekPreviewDate] = useState(null);
  const [dayViewDate, setDayViewDate] = useState(() => trackerPeriod().date);
  const [dayViewExpanded, setDayViewExpanded] = useState(false);
  const [done, setDone] = useState({});
  const [openRow, setOpenRow] = useState(null);
  const [focusModeShowAll, setFocusModeShowAll] = useState(false);
  const [user, setUser] = useState(null);
  const [syncStatus, setSyncStatus] = useState("loading");
  const pendingQueueRef = React.useRef([]);
  const latestSupportOwnerRequestRef = React.useRef(null);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [online, setOnline] = useState(() => navigator.onLine);
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [showSignIn, setShowSignIn] = useState(false);
  const [signInMessage, setSignInMessage] = useState("");
  const [codeCooldown, setCodeCooldown] = useState(0);
  const [password, setPassword] = useState("");
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [emailChangeDraft, setEmailChangeDraft] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [period, setPeriod] = useState(() => trackerPeriod());

  useEffect(() => {
    if (!user?.id) return;
    const savedTheme = window.localStorage.getItem(`plushlist-appearance-${user.id}`);
    if (APPEARANCE_THEMES.some((theme) => theme.id === savedTheme)) setAppearanceTheme(savedTheme);
  }, [user?.id]);
  const [weeklyHistory, setWeeklyHistory] = useState([]);
  const [longHistory, setLongHistory] = useState([]);
  const [previousWeekHistory, setPreviousWeekHistory] = useState([]);
  const [tappedTrendWeek, setTappedTrendWeek] = useState(null);
  const [tappedTrendMonth, setTappedTrendMonth] = useState(null);
  const [habitHistory, setHabitHistory] = useState([]);
  const [selectedProgressDate, setSelectedProgressDate] = useState(() => trackerPeriod().date);
  const [reflectionDates, setReflectionDates] = useState([]);
  const [reflectionHistory, setReflectionHistory] = useState([]);
  const [journalHistoryExpanded, setJournalHistoryExpanded] = useState(false);
  const [reflectionCalendarMonth, setReflectionCalendarMonth] = useState(() => trackerPeriod().date.slice(0, 7));
  const [reflectionViewerDate, setReflectionViewerDate] = useState(null);
  const [checkInViewerDate, setCheckInViewerDate] = useState(null);
  const [reflectionViewerNote, setReflectionViewerNote] = useState("");
  const [reflectionViewerPrompt, setReflectionViewerPrompt] = useState("");
  const [reflectionViewerLoading, setReflectionViewerLoading] = useState(false);
  const [supportViewMode, setSupportViewMode] = useState("mine");
  const [supportLinks, setSupportLinks] = useState([]);
  const [supportNotes, setSupportNotes] = useState([]);
  const [unreadNoteCount, setUnreadNoteCount] = useState(0);
  useEffect(() => {
    if (!user) { setUnreadNoteCount(0); return; }
    let alive = true;
    supabase.from("support_notes").select("id", { count: "exact", head: true }).eq("owner_user_id", user.id).eq("is_read", false).then(({ count }) => {
      if (alive) setUnreadNoteCount(count || 0);
    });
    return () => { alive = false; };
  }, [user?.id]);
  const [supportRewards, setSupportRewards] = useState([]);
  const [supportProgress, setSupportProgress] = useState([]);
  const [supportWeeklyHistory, setSupportWeeklyHistory] = useState([]);
  const [supportOwnerId, setSupportOwnerId] = useState(null);
  const [supportPeople, setSupportPeople] = useState([]);
  const [supportRelationships, setSupportRelationships] = useState([]);
  const [guardianSupportRequests, setGuardianSupportRequests] = useState([]);
  const [taskSuggestions, setTaskSuggestions] = useState([]);
  const [suggestionSectionsById, setSuggestionSectionsById] = useState({});
  const [suggestedTask, setSuggestedTask] = useState("");
  const [suggestedTaskDay, setSuggestedTaskDay] = useState("daily");
  const [inviteEmail, setInviteEmail] = useState("");
  const [guardianRolePreset, setGuardianRolePreset] = useState("view_only");
  const [supportRequestType, setSupportRequestType] = useState("encouragement");
  const [supportRequestGuardian, setSupportRequestGuardian] = useState("");
  const [supportRequestText, setSupportRequestText] = useState("");
  const [newNote, setNewNote] = useState("");
  const [rewardTitle, setRewardTitle] = useState("");
  const [rewardDetails, setRewardDetails] = useState("");
  const [rewardTarget, setRewardTarget] = useState("75");
  const [rewardTargetPeriod, setRewardTargetPeriod] = useState("daily");
  const [rewardApprovalRequired, setRewardApprovalRequired] = useState(false);
  const [supportProgressView, setSupportProgressView] = useState("daily");
  const [supportMessage, setSupportMessage] = useState("");
  const [pendingInviteAutoOpenedFor, setPendingInviteAutoOpenedFor] = useState(null);
  const [trackerTasks, setTrackerTasks] = useState([]);
  const [taskSnoozes, setTaskSnoozes] = useState([]);
  const [snoozeMenuTaskKey, setSnoozeMenuTaskKey] = useState(null);
  const [showArchivedTasks, setShowArchivedTasks] = useState(false);
  const [trackerProfile, setTrackerProfile] = useState(null);
  const [displayNameDraft, setDisplayNameDraft] = useState("");
  const [comfortItemDraft, setComfortItemDraft] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("basics");
  const [starterPackId, setStarterPackId] = useState("basics");
  const [starterPackMessage, setStarterPackMessage] = useState("");
  const [onboardingReason, setOnboardingReason] = useState(null);
  const [onboardingIntentionDraft, setOnboardingIntentionDraft] = useState("");
  const [onboardingMode, setOnboardingMode] = useState(null);
  const [onboardingMessage, setOnboardingMessage] = useState("");
  const [privateNote, setPrivateNote] = useState("");
  const [privateNotePrompt, setPrivateNotePrompt] = useState("");
  const [privateNoteLoaded, setPrivateNoteLoaded] = useState(false);
  const [privateNoteEditing, setPrivateNoteEditing] = useState(false);
  const [journalQuickOpen, setJournalQuickOpen] = useState(false);
  const [dailyJournalPromptOpen, setDailyJournalPromptOpen] = useState(false);
  const [journalQuickOpenDate, setJournalQuickOpenDate] = useState(() => trackerPeriod().date);
  const [calmQuickOpen, setCalmQuickOpen] = useState(false);
  const [privateNoteDraft, setPrivateNoteDraft] = useState("");
  const [lastWeekReflection, setLastWeekReflection] = useState("");
  const [weeklyIntentionText, setWeeklyIntentionText] = useState("");
  const [weeklyIntentionHistory, setWeeklyIntentionHistory] = useState([]);
  const [weeklyIntentionHistoryExpanded, setWeeklyIntentionHistoryExpanded] = useState(false);
  const [weeklyIntentionEditing, setWeeklyIntentionEditing] = useState(false);
  const [weeklyIntentionDraft, setWeeklyIntentionDraft] = useState("");
  const [weeklyIntentionMessage, setWeeklyIntentionMessage] = useState("");
  const [weeklyKickoffOpen, setWeeklyKickoffOpen] = useState(false);
  const [weeklyKickoffNote, setWeeklyKickoffNote] = useState("");
  const [weeklyKickoffMessage, setWeeklyKickoffMessage] = useState("");
  const [introIntentionOpen, setIntroIntentionOpen] = useState(false);
  const [introIntentionDraft, setIntroIntentionDraft] = useState("");
  const [introIntentionMessage, setIntroIntentionMessage] = useState("");
  const [privateNoteMessage, setPrivateNoteMessage] = useState("");
  const [supportTrackerTasks, setSupportTrackerTasks] = useState([]);
  const [manageTasks, setManageTasks] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importMessage, setImportMessage] = useState("");
  const [taskSearchQuery, setTaskSearchQuery] = useState("");
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskDay, setNewTaskDay] = useState("daily");
  const [newTaskSection, setNewTaskSection] = useState("");
  const [newTaskCustomSection, setNewTaskCustomSection] = useState("");
  const [newTaskKind, setNewTaskKind] = useState("regular");
  const [newTaskWhy, setNewTaskWhy] = useState("");
  const [newTaskSoftLabel, setNewTaskSoftLabel] = useState("");
  const [newTaskTinyLabel, setNewTaskTinyLabel] = useState("");
  const [newTaskEstimatedMinutes, setNewTaskEstimatedMinutes] = useState("");
  const [newTaskEssentialOnLow, setNewTaskEssentialOnLow] = useState(false);
  const [newTaskScheduleType, setNewTaskScheduleType] = useState("weekly");
  const [newTaskStartDate, setNewTaskStartDate] = useState("");
  const [newTaskEndDate, setNewTaskEndDate] = useState("");
  const [newTaskOneTimeDate, setNewTaskOneTimeDate] = useState("");
  const [newTaskScheduleDays, setNewTaskScheduleDays] = useState([]);
  const [newTaskReminderTime, setNewTaskReminderTime] = useState("");
  const [naturalScheduleText, setNaturalScheduleText] = useState("");
  const [naturalSchedulePreview, setNaturalSchedulePreview] = useState(null);
  const [taskAdvancedOpen, setTaskAdvancedOpen] = useState(false);
  const [taskMessage, setTaskMessage] = useState("");
  const [editingTaskKey, setEditingTaskKey] = useState(null);
  const [dragTaskKey, setDragTaskKey] = useState(null);
  const [dragOverTaskKey, setDragOverTaskKey] = useState(null);
  const [editTaskDraft, setEditTaskDraft] = useState(null);
  const [pendingTaskDelete, setPendingTaskDelete] = useState(null);
  const [taskHelpDraft, setTaskHelpDraft] = useState(null);
  const [personalSchedules, setPersonalSchedules] = useState([]);
  const [scheduleExceptions, setScheduleExceptions] = useState([]);
  const [manageSchedule, setManageSchedule] = useState(false);
  const [scheduleEditDayId, setScheduleEditDayId] = useState(null);
  const [copyToDayIds, setCopyToDayIds] = useState([]);
  const [scheduleDraft, setScheduleDraft] = useState({ entries: [] });
  const [scheduleExceptionDraft, setScheduleExceptionDraft] = useState({ start_date: "", end_date: "", entries: [] });
  const [scheduleMessage, setScheduleMessage] = useState("");
  const [scheduleExceptionMessage, setScheduleExceptionMessage] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [arrivalRitualVisible, setArrivalRitualVisible] = useState(true);
  const [careExtraSupportOpen, setCareExtraSupportOpen] = useState(false);
  const [habitGardenOpen, setHabitGardenOpen] = useState(false);
  const [progressDetailsOpen, setProgressDetailsOpen] = useState(false);
  const [preferences, setPreferences] = useState({
    notifications_enabled: false,
    reminder_times: ["08:00", "12:30", "17:30", "20:30"],
    quiet_start: "21:30",
    quiet_end: "04:30",
    discreet_notifications: true,
    nurturing_checkins: true,
    nickname_style: "warm",
    large_text: false,
    reduced_motion: false,
    high_contrast: false,
    simple_mode: false,
    pattern_insights_enabled: true,
    gentle_streaks: true,
    dino_theme: false,
    weekly_intention_intro_seen: false,
    focus_mode: false,
    baby_voice: "motherly",
    beta_banner_dismissed: false,
    last_seen_changelog: "",
    task_group_order: [],
    is_supporter: false,
    onboarding_reason: null,
    colorblind_mode: false,
    notification_nudge_dismissed_at: null,
    dark_mode: false,
    seen_features: [],
    smart_reminder_hint_dismissed_at: null,
  });
  const [settingsMessage, setSettingsMessage] = useState("");
  const [watchPairingCode, setWatchPairingCode] = useState("");
  const [watchPairingMessage, setWatchPairingMessage] = useState("");
  const [watchPairingBusy, setWatchPairingBusy] = useState(false);
  const [localWatchSyncBusy, setLocalWatchSyncBusy] = useState(false);
  const [localWatchSyncMessage, setLocalWatchSyncMessage] = useState("");
  const [widgetSyncMsg, setWidgetSyncMsg] = useState("");
  const [nativeBuildInfo, setNativeBuildInfo] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [focusHelperOpen, setFocusHelperOpen] = useState(false);
  const [insightCardIndex, setInsightCardIndex] = useState(0);
  const [focusSuggestionKey, setFocusSuggestionKey] = useState(null);
  useEffect(() => {
    setFocusHelperOpen(false);
    setFocusSuggestionKey(null);
  }, [selectedProgressDate]);

  useEffect(() => {
    // Rotate which insight leads each day (by days-since-epoch, reduced to
    // range at render time via `% patternInsightCards.length`) instead of
    // always resetting to the first card — otherwise whichever insight
    // happens to compute first (usually the weekday pattern) crowds out the
    // others indefinitely unless someone manually clicks "Next insight."
    const daysSinceEpoch = Math.floor(new Date(`${period.date}T12:00:00Z`).getTime() / 86400000);
    setInsightCardIndex(daysSinceEpoch);
  }, [period.date]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get("view");
    if (!view) return;
    if (view === "today") setDashboard("today");
    else if (view === "week") setDashboard("week");
    else if (view === "tasks") { setDashboard("today"); setActive(dayIdForDate(period.date)); setNewTaskDay(dayIdForDate(period.date)); setTodayCardIndex(1); setManageTasks(true); }
    else if (view === "care") setDashboard("care");
    else if (view === "progress") setDashboard("progress");
    window.history.replaceState(null, "", window.location.pathname);
  }, []);
  const [onboardingStep, setOnboardingStep] = useState(0);

  useEffect(() => {
    if (!user || onboardingStep < 1) return;
    supabase.from("onboarding_events").insert({
      user_id: user.id,
      step: onboardingStep,
      onboarding_mode: onboardingMode || "undecided",
      event: "step_viewed",
    }).then(() => {});
  }, [user?.id, onboardingStep, onboardingMode]);

  const [collectionOpen, setCollectionOpen] = useState(false);
  const [shareCardOpen, setShareCardOpen] = useState(false);
  const [dailyCheckIn, setDailyCheckIn] = useState({ capacity: null, mood: null, energy: null, day_type: "full", support_preference: null, soft_day: false, custom_essentials: null });
  const [dailyCheckInHistory, setDailyCheckInHistory] = useState([]);
  const [careSessionHistory, setCareSessionHistory] = useState([]);
  const [careOutcomeTool, setCareOutcomeTool] = useState(null);
  const [careOutcomeKind, setCareOutcomeKind] = useState("care");
  const [pathProgress, setPathProgress] = useState([]);
  const [selectedCarePath, setSelectedCarePath] = useState(null);
  const [expandedPathDay, setExpandedPathDay] = useState(null);
  const [pathDayJustCompleted, setPathDayJustCompleted] = useState(false);
  const [sleepToolOpen, setSleepToolOpen] = useState(null);
  const [soundscapePlaying, setSoundscapePlaying] = useState(null);
  const [soundscapeVolume, setSoundscapeVolumeState] = useState(0.5);
  const [soundscapeTimerMinutes, setSoundscapeTimerMinutes] = useState(null);
  const soundscapeTimerRef = React.useRef(null);

  useEffect(() => () => stopSoundscape(), []);

  const toggleSoundscape = (id) => {
    if (soundscapeTimerRef.current) { clearTimeout(soundscapeTimerRef.current); soundscapeTimerRef.current = null; }
    if (soundscapePlaying === id) {
      stopSoundscape();
      setSoundscapePlaying(null);
      setSoundscapeTimerMinutes(null);
    } else {
      startSoundscape(id, soundscapeVolume);
      setSoundscapePlaying(id);
    }
  };

  const changeSoundscapeVolume = (value) => {
    setSoundscapeVolumeState(value);
    setSoundscapeVolume(value);
  };

  const setSoundscapeSleepTimer = (minutes) => {
    if (soundscapeTimerRef.current) { clearTimeout(soundscapeTimerRef.current); soundscapeTimerRef.current = null; }
    setSoundscapeTimerMinutes(minutes);
    if (minutes) {
      soundscapeTimerRef.current = setTimeout(() => {
        stopSoundscape();
        setSoundscapePlaying(null);
        setSoundscapeTimerMinutes(null);
      }, minutes * 60 * 1000);
    }
  };
  const [careMessage, setCareMessage] = useState("");
  const [careSection, setCareSection] = useState("quick");
  const [careSituationsExpanded, setCareSituationsExpanded] = useState(false);
  const [restDates, setRestDates] = useState([]);
  const [restRangeDraft, setRestRangeDraft] = useState({ start: "", end: "" });
  const [essentialsPickerOpen, setEssentialsPickerOpen] = useState(false);
  const [checkInPopupOpen, setCheckInPopupOpen] = useState(false);
  const [checkInMoreMoodsOpen, setCheckInMoreMoodsOpen] = useState(false);
  const [checkInCustomizeOpen, setCheckInCustomizeOpen] = useState(false);
  useEffect(() => {
    // Both sections are opt-in expansions, not settings — without this they'd
    // stay expanded for the rest of the session once opened once, making the
    // "optional" label a lie the next time the check-in opens.
    if (checkInPopupOpen) {
      setCheckInMoreMoodsOpen(false);
      setCheckInCustomizeOpen(false);
    }
  }, [checkInPopupOpen]);
  const [completedTodayExpanded, setCompletedTodayExpanded] = useState(false);
  const [comfortToolOpen, setComfortToolOpen] = useState(null);
  const [breathPhase, setBreathPhase] = useState("in");
  const [checkInPopupDismissedToday, setCheckInPopupDismissedToday] = useState(false);
  const [dailyCheckInLoaded, setDailyCheckInLoaded] = useState(false);

  useEffect(() => {
    const filterValue = [
      preferences.high_contrast && "contrast(1.3) saturate(1.15)",
      preferences.colorblind_mode && "saturate(1.5) contrast(1.15)",
    ].filter(Boolean).join(" ") || "none";
    document.documentElement.style.filter = filterValue;
    document.documentElement.style.zoom = preferences.large_text ? "1.18" : "1";
    return () => { document.documentElement.style.filter = "none"; document.documentElement.style.zoom = "1"; };
  }, [preferences.high_contrast, preferences.colorblind_mode, preferences.large_text]);
  const [notificationNudgeOpen, setNotificationNudgeOpen] = useState(false);
  const [notificationNudgeReason, setNotificationNudgeReason] = useState("");
  const [nextStepSkipped, setNextStepSkipped] = useState([]);
  const [nextStepMoreOpen, setNextStepMoreOpen] = useState(false);
  const [nextStepDismissedToday, setNextStepDismissedToday] = useState(false);
  const [nextStepHint, setNextStepHint] = useState(null);
  const pickEasierSuggestion = (taskKey) => setNextStepHint({ key: taskKey, text: MAKE_IT_EASIER_SUGGESTIONS[Math.floor(Math.random() * MAKE_IT_EASIER_SUGGESTIONS.length)] });

  const [betaBannerDismissed, setBetaBannerDismissed] = useState(() => {
    try { return window.localStorage.getItem("plushlist-beta-banner-dismissed") !== "0"; } catch (_error) { return true; }
  });
  const dismissBetaBanner = () => {
    setBetaBannerDismissed(true);
    try { window.localStorage.setItem("plushlist-beta-banner-dismissed", "1"); } catch (_error) {}
  };
  const [collectionTab, setCollectionTab] = useState("mascot");
  const [collectionLoadedFor, setCollectionLoadedFor] = useState(null);
  const [mascotCollection, setMascotCollection] = useState({
    bestStreak: 0,
    visitStreak: 0,
    bestVisitStreak: 0,
    lastVisitDate: "",
    unlockedIds: ["classic"],
    selectedId: "classic",
    celebrationSound: true,
    lastCelebratedDate: "",
  });
  const [celebrationOpen, setCelebrationOpen] = useState(false);
  const [celebrationTitleText, setCelebrationTitleText] = useState("");
  const [badgeCelebration, setBadgeCelebration] = useState(null);
  const [celebrateKey, setCelebrateKey] = useState(null);
  const [recentlyCompletedKeys, setRecentlyCompletedKeys] = useState([]);
  const flushPendingQueue = async () => {
    if (!user || !navigator.onLine || pendingQueueRef.current.length === 0) return;
    setSyncStatus("syncing");
    const queue = [...pendingQueueRef.current];
    pendingQueueRef.current = [];
    for (const item of queue) {
      const { error: dailyError } = await supabase.from("daily_progress").upsert({
        user_id: user.id,
        progress_date: item.progressDate,
        completed_keys: item.completedKeys,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,progress_date" });
      let taskError = null;
      if (item.taskKey) {
        const result = await supabase.from("tracker_progress").upsert(
          { user_id: user.id, task_key: item.taskKey, completed: item.completed, updated_at: new Date().toISOString() },
          { onConflict: "user_id,task_key" }
        );
        taskError = result.error;
      }
      if (dailyError || taskError) pendingQueueRef.current.push(item);
    }
    try { window.localStorage.setItem(`plushlist-pending-${user.id}`, JSON.stringify(pendingQueueRef.current)); } catch (_error) {}
    if (pendingQueueRef.current.length === 0) {
      setSyncStatus("ready");
      setLastSyncedAt(new Date().toISOString());
    } else {
      setSyncStatus("offline");
    }
  };

  useEffect(() => {
    if (!user) return;
    try {
      const stored = window.localStorage.getItem(`plushlist-pending-${user.id}`);
      if (stored) pendingQueueRef.current = JSON.parse(stored);
    } catch (_error) {}
    flushPendingQueue();
    const handleOnline = () => flushPendingQueue();
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [user?.id]);

  const triggerCelebrate = (key) => {
    setCelebrateKey(key);
    if (navigator.vibrate) { try { navigator.vibrate(16); } catch (_error) {} }
    window.setTimeout(() => setCelebrateKey((current) => current === key ? null : current), 550);
    setRecentlyCompletedKeys((keys) => [...keys, key]);
    window.setTimeout(() => setRecentlyCompletedKeys((keys) => keys.filter((item) => item !== key)), 1100);
  };
  const [returnGapDays, setReturnGapDays] = useState(0);
  const [returnBannerDismissed, setReturnBannerDismissed] = useState(false);
  const [hardDayBannerDismissed, setHardDayBannerDismissed] = useState(false);

  useEffect(() => {
    const setConnectionState = () => setOnline(navigator.onLine);
    window.addEventListener("online", setConnectionState);
    window.addEventListener("offline", setConnectionState);
    return () => {
      window.removeEventListener("online", setConnectionState);
      window.removeEventListener("offline", setConnectionState);
    };
  }, []);

  useEffect(() => {
    if (codeCooldown <= 0) return undefined;
    const timer = setTimeout(() => setCodeCooldown((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => clearTimeout(timer);
  }, [codeCooldown]);

  useEffect(() => {
    const timer = setInterval(() => {
      const next = trackerPeriod();
      setPeriod((previous) =>
        previous.date === next.date && previous.weekStart === next.weekStart ? previous : next
      );
    }, 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (active) {
        setUser(session?.user ?? null);
        setSyncStatus(session ? "ready" : "signed-out");
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setUser(session?.user ?? null);
        setSyncStatus(session ? "ready" : "signed-out");
      }
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Lets the local watch-sync server (Android only, see
    // android/.../watchsync/) know whether there's currently a signed-in
    // account to attach a new watch pairing to. Never sends a password or
    // token — just the account id, same "the watch never sees your
    // credentials" guarantee the existing cloud pairing already makes.
    window.Capacitor?.Plugins?.WatchSyncBridge?.setSignedInUser({ userId: user?.id || null }).catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    supabase.from("app_preferences").select("*").eq("user_id", user.id).maybeSingle().then(({ data, error }) => {
      if (!active) return;
      if (data) setPreferences((current) => ({ ...current, ...data, dark_mode: false, reminder_times: Array.isArray(data.reminder_times) ? data.reminder_times : current.reminder_times }));
      // A failed fetch also leaves `data` null, same as a genuinely new
      // account with no preferences row yet — those aren't the same thing.
      // Reopening onboarding for an already-onboarded user just because
      // this one request hit a transient network blip would be wrong, so
      // only treat "no row" as "needs onboarding" when the fetch actually
      // succeeded.
      if (error) setSettingsMessage("Your preferences couldn't be loaded yet.");
      else if (!data || !data.onboarding_complete) setOnboardingStep(1);
      // Keep the stored timezone in sync with this device's actual local timezone,
      // so scheduled notifications are bucketed (morning/midday/evening/night)
      // against real local time instead of a hardcoded fallback.
      try {
        const deviceTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (deviceTimezone && deviceTimezone !== data?.timezone) {
          supabase.from("app_preferences").upsert({ user_id: user.id, timezone: deviceTimezone, updated_at: new Date().toISOString() }, { onConflict: "user_id" }).then(() => {});
          setPreferences((current) => ({ ...current, timezone: deviceTimezone }));
        }
      } catch (_error) {}
    });
    return () => { active = false; };
  }, [user]);

  useEffect(() => {
    if (!user) {
      setCollectionLoadedFor(null);
      setMascotCollection({
        bestStreak: 0,
        visitStreak: 0,
        bestVisitStreak: 0,
        lastVisitDate: "",
        unlockedIds: ["classic"],
        selectedId: "classic",
        celebrationSound: true,
        lastCelebratedDate: "",
      });
      return;
    }
    let active = true;
    let saved = null;
    try {
      saved = JSON.parse(window.localStorage.getItem(`plushlist-mascot-${user.id}`) || "null");
    } catch (_error) {
      saved = null;
    }
    const loadCollection = async () => {
      const { data: priorRow } = await supabase.from("user_achievements").select("last_visit_date").eq("user_id", user.id).maybeSingle();
      const priorLastVisitDate = priorRow?.last_visit_date || "";
      const { data, error } = await supabase.rpc("record_plushlist_visit", {
        p_visit_date: period.date,
      });
      if (!active) return;
      const gap = daysBetweenDates(priorLastVisitDate, period.date);
      setReturnGapDays(priorLastVisitDate && gap !== null && gap >= 2 ? gap : 0);
      const row = Array.isArray(data) ? data[0] : data;
      const savedIds = Array.isArray(saved?.unlockedIds) ? saved.unlockedIds : [];
      const serverIds = Array.isArray(row?.unlocked_ids) ? row.unlocked_ids : [];
      const unlockedIds = [...new Set(["classic", ...serverIds, ...savedIds])].filter((id) =>
        MASCOT_OUTFITS.some((outfit) => outfit.id === id)
      );
      const savedBadgeIds = Array.isArray(saved?.earnedBadgeIds) ? saved.earnedBadgeIds : [];
      const serverBadgeIds = Array.isArray(row?.earned_badge_ids) ? row.earned_badge_ids : [];
      const earnedBadgeIds = [...new Set([...serverBadgeIds, ...savedBadgeIds])];
      const selectedId = MASCOT_OUTFITS.some((outfit) => outfit.id === row?.selected_mascot)
        ? row.selected_mascot
        : MASCOT_OUTFITS.some((outfit) => outfit.id === saved?.selectedId)
          ? saved.selectedId
          : "classic";
      const next = {
        bestStreak: Math.max(0, Number(row?.best_care_streak) || 0, Number(saved?.bestStreak) || 0),
        visitStreak: Math.max(0, Number(row?.visit_streak) || 0),
        bestVisitStreak: Math.max(0, Number(row?.best_visit_streak) || 0),
        lastVisitDate: row?.last_visit_date || "",
        unlockedIds,
        earnedBadgeIds,
        selectedId,
        celebrationSound: row?.celebration_sound !== false && saved?.celebrationSound !== false,
        lastCelebratedDate: row?.last_celebrated_date || saved?.lastCelebratedDate || "",
      };
      setMascotCollection(next);
      window.localStorage.setItem(`plushlist-mascot-${user.id}`, JSON.stringify(next));
      setCollectionLoadedFor(user.id);
      if (!error && row) {
        await supabase.from("user_achievements").update({
          best_care_streak: next.bestStreak,
          unlocked_ids: next.unlockedIds,
          earned_badge_ids: next.earnedBadgeIds,
          selected_mascot: next.selectedId,
          celebration_sound: next.celebrationSound,
          last_celebrated_date: next.lastCelebratedDate || null,
          updated_at: new Date().toISOString(),
        }).eq("user_id", user.id);
      }
    };
    loadCollection();
    return () => { active = false; };
  }, [user?.id, period.date]);

  useEffect(() => {
    if (!user) {
      setDone({});
      setTrackerTasks([]);
      setTaskSnoozes([]);
      setTrackerProfile(null);
      setDisplayNameDraft("");
      setPersonalSchedules([]);
      setPrivateNote("");
      setPrivateNoteMessage("");
      return;
    }
    let active = true;
    const warmCache = readWarmStartCache(user.id, period.date);
    if (warmCache) {
      setDone(warmCache.done || {});
      setTrackerProfile(warmCache.profile || null);
      setDisplayNameDraft(warmCache.profile?.display_name || "");
      setComfortItemDraft(warmCache.profile?.comfort_item_name || "");
      setTrackerTasks(warmCache.tasks || []);
      setTaskSnoozes(warmCache.snoozes || []);
      setPersonalSchedules(warmCache.schedules || []);
      setScheduleExceptions(warmCache.exceptions || []);
      try { window.PlushLifeRuntime?.metric("warm-cache-hydrated", performance.now(), String(warmCache.tasks?.length || 0) + " tasks"); } catch (_error) {}
    } else {
      setDone({});
    }
    setSyncStatus("syncing");
    Promise.all([
      supabase
        .from("daily_progress")
        .select("completed_keys")
        .eq("user_id", user.id)
        .eq("progress_date", period.date)
        .maybeSingle(),
      supabase
        .from("tracker_progress")
        .select("task_key, completed, updated_at")
        .eq("user_id", user.id),
      supabase.from("tracker_profiles").select("display_name, show_personal_schedule, account_type, comfort_item_name, guardian_read_only").eq("user_id", user.id).maybeSingle(),
      supabase.from("tracker_tasks").select("task_key, day_id, section, task, detail, sort_order, is_bonus, schedule_type, start_date, end_date, one_time_date, why_note, soft_label, tiny_label, estimated_minutes, essential_on_low_capacity, archived_at, archive_reason, schedule_days, reminder_time, paused_since, paused_until, pause_reason").eq("user_id", user.id).order("sort_order"),
      supabase.from("tracker_schedules").select("day_id, label, wake, morning, work, workout, home, entries").eq("user_id", user.id).order("day_id"),
      supabase.from("schedule_exceptions").select("id, start_date, end_date, entries").eq("user_id", user.id).order("start_date"),
      supabase.from("task_snoozes").select("task_key, snoozed_until").eq("user_id", user.id).gt("snoozed_until", new Date().toISOString()),
    ]).then(async ([dailyResult, legacyResult, profileResult, tasksResult, schedulesResult, exceptionsResult, snoozesResult]) => {
        if (!active) return;

        // Tasks/profile/schedule are loaded in the same round trip as today's
        // completions so syncStatus only reaches "ready" once everything
        // needed to compute today's progress is actually in state — loading
        // them on a separate, unsynchronized timer previously let a brief
        // window with an empty task list masquerade as "today undone" and
        // wipe (then immediately re-fire) the 100% celebration.
        setTrackerProfile(profileResult.data || null);
        setDisplayNameDraft(profileResult.data?.display_name || "");
        setComfortItemDraft(profileResult.data?.comfort_item_name || "");
        setTrackerTasks(tasksResult.data || []);
        setTaskSnoozes(snoozesResult.data || []);
        setPersonalSchedules(schedulesResult.data || []);
        setScheduleExceptions(exceptionsResult.data || []);
        if (profileResult.error || tasksResult.error || schedulesResult.error || exceptionsResult.error || snoozesResult.error) setTaskMessage("Couldn't load your private tracker.");

        if (dailyResult.error || legacyResult.error) {
          setSyncStatus("error");
          return;
        }

        const hasDatedProgress = Boolean(dailyResult.data);
        const completedKeys = hasDatedProgress
          ? (dailyResult.data.completed_keys || [])
          : (legacyResult.data || [])
              .filter((row) =>
                row.completed &&
                row.updated_at &&
                trackerPeriod(new Date(row.updated_at)).date === period.date
              )
              .map((row) => row.task_key);

        const serverDone = Object.fromEntries(completedKeys.map((key) => [key, true]));
        setDone(serverDone);
        setWeeklyHistory((entries) => [
          ...entries.filter((entry) => entry.progress_date !== period.date),
          { progress_date: period.date, completed_keys: completedKeys },
        ]);
        writeWarmStartCache(user.id, period.date, {
          done: serverDone,
          profile: profileResult.data || null,
          tasks: tasksResult.data || [],
          snoozes: snoozesResult.data || [],
          schedules: schedulesResult.data || [],
          exceptions: exceptionsResult.data || [],
        });
        try { window.PlushLifeRuntime?.metric("tracker-sync-ready", performance.now(), String((tasksResult.data || []).length) + " tasks"); } catch (_error) {}

        if (!hasDatedProgress) {
          const { error: migrationError } = await supabase.from("daily_progress").upsert({
            user_id: user.id,
            progress_date: period.date,
            completed_keys: completedKeys,
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id,progress_date" });
          if (!active) return;
          if (migrationError) {
            setSyncStatus("error");
            return;
          }
        }

        const completedKeySet = new Set(completedKeys);
        const mirrorUpdates = (legacyResult.data || [])
          .filter((row) => Boolean(row.completed) !== completedKeySet.has(row.task_key))
          .map((row) => ({
            user_id: user.id,
            task_key: row.task_key,
            completed: completedKeySet.has(row.task_key),
            updated_at: new Date().toISOString(),
          }));
        if (mirrorUpdates.length) {
          const { error: mirrorError } = await supabase
            .from("tracker_progress")
            .upsert(mirrorUpdates, { onConflict: "user_id,task_key" });
          if (!active) return;
          if (mirrorError) {
            setSyncStatus("error");
            return;
          }
        }
        setSyncStatus("ready");
      });
    return () => { active = false; };
  }, [user?.id, period.date]);

  // Keep the phone UI in step with changes made from a connected watch.
  // The watch writes the same daily_progress row as the phone, and Realtime
  // updates the visible checklist without making the user refresh the app.
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`plushlife-watch-progress-${user.id}-${period.date}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "daily_progress",
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const next = payload?.new;
        if (!next || next.progress_date !== period.date) return;
        const completedKeys = Array.isArray(next.completed_keys) ? next.completed_keys : [];
        setDone(Object.fromEntries(completedKeys.map((key) => [key, true])));
        setWeeklyHistory((entries) => [
          ...entries.filter((entry) => entry.progress_date !== period.date),
          { progress_date: period.date, completed_keys: completedKeys },
        ]);
        setHabitHistory((entries) => [
          ...entries.filter((entry) => entry.progress_date !== period.date),
          { progress_date: period.date, completed_keys: completedKeys, updated_at: next.updated_at || new Date().toISOString() },
        ]);
        setLastSyncedAt(next.updated_at || new Date().toISOString());
        setSyncStatus("ready");
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, period.date]);

  useEffect(() => {
    if (!user) {
      setWeeklyHistory([]);
      return;
    }
    let active = true;
    supabase
      .from("daily_progress")
      .select("progress_date, completed_keys")
      .eq("user_id", user.id)
      .gte("progress_date", period.weekStart)
      .lte("progress_date", period.date)
      .then(({ data, error }) => {
        if (!active) return;
        if (!error) setWeeklyHistory(data || []);
      });
    return () => { active = false; };
  }, [user, period.weekStart, period.date]);

  useEffect(() => {
    if (!user) {
      setHabitHistory([]);
      return;
    }
    let active = true;
    supabase
      .from("daily_progress")
      .select("progress_date, completed_keys, updated_at")
      .eq("user_id", user.id)
      .lte("progress_date", period.date)
      .order("progress_date")
      .then(({ data, error }) => {
        if (!active) return;
        if (!error) setHabitHistory(data || []);
      });
    return () => { active = false; };
  }, [user?.id, period.date]);

  const [supportAchievements, setSupportAchievements] = useState(null);
  const [ownerIsRestingToday, setOwnerIsRestingToday] = useState(false);

  const loadSupportOwner = async (targetOwnerId) => {
    latestSupportOwnerRequestRef.current = targetOwnerId;
    if (!targetOwnerId) {
      setSupportOwnerId(null);
      setSupportNotes([]);
      setSupportRewards([]);
      setSupportProgress([]);
      setSupportWeeklyHistory([]);
      setSupportTrackerTasks([]);
      setSupportAchievements(null);
      return;
    }
    setSupportOwnerId(targetOwnerId);
    const [notesResult, rewardsResult, progressResult, historyResult, tasksResult, suggestionsResult, achievementsResult, restResult] = await Promise.all([
      supabase.from("support_notes").select("id, caregiver_name, body, is_read, suggested_tool_id, created_at").eq("owner_user_id", targetOwnerId).order("created_at", { ascending: false }),
      supabase.from("support_rewards").select("id, title, details, target_percent, active, week_start, earned_at, claimed_at, approval_required, approved_at, caregiver_user_id, created_at").eq("owner_user_id", targetOwnerId).eq("active", true).order("created_at", { ascending: false }),
      supabase.from("daily_progress").select("completed_keys").eq("user_id", targetOwnerId).eq("progress_date", period.date).maybeSingle(),
      supabase.from("daily_progress").select("progress_date, completed_keys").eq("user_id", targetOwnerId).gte("progress_date", period.weekStart).lte("progress_date", period.date),
      supabase.from("tracker_tasks").select("task_key, day_id, section, task, detail, sort_order, is_bonus, schedule_type, start_date, end_date, one_time_date, why_note, archived_at, schedule_days, paused_since, paused_until").eq("user_id", targetOwnerId).is("archived_at", null).order("sort_order"),
      supabase.from("task_suggestions").select("id, owner_user_id, caregiver_user_id, caregiver_name, task, suggested_day_id, status, created_at").eq("owner_user_id", targetOwnerId).order("created_at", { ascending: false }),
      supabase.from("user_achievements").select("visit_streak, best_visit_streak, best_care_streak, last_celebrated_date").eq("user_id", targetOwnerId).maybeSingle(),
      supabase.from("rest_days").select("rest_date").eq("user_id", targetOwnerId).eq("rest_date", period.date).maybeSingle(),
    ]);
    if (latestSupportOwnerRequestRef.current !== targetOwnerId) return; // superseded by a newer request
    setSupportNotes(notesResult.data || []);
    setSupportRewards(rewardsResult.data || []);
    setSupportProgress((progressResult.data?.completed_keys || []).map((taskKey) => ({ task_key: taskKey, completed: true })));
    setSupportWeeklyHistory(historyResult.data || []);
    setSupportTrackerTasks(tasksResult.data || []);
    setTaskSuggestions(suggestionsResult.data || []);
    setSupportAchievements(achievementsResult.data || null);
    setOwnerIsRestingToday(!!restResult.data);
    if (isSupportAdult && targetOwnerId !== user?.id && user?.email) {
      supabase.rpc("touch_caregiver_link_viewed", { p_owner_user_id: targetOwnerId }).then(() => {});
    }
    if (notesResult.error || rewardsResult.error || progressResult.error || historyResult.error || tasksResult.error || suggestionsResult.error) {
      setSupportMessage("Some guardian information couldn't be refreshed.");
    }
  };

  const loadSupportData = async (currentUser = user) => {
    if (!currentUser) return;
    setSupportMessage("");
    const { data: links, error: linksError } = await supabase
      .from("caregiver_links")
      .select("id, owner_user_id, caregiver_email, label, active, can_view_progress, can_send_notes, can_add_rewards, can_suggest_tasks, care_agreement, created_at, last_viewed_at, accepted_at")
      .order("created_at", { ascending: false });
    if (linksError) {
      setSupportMessage("Couldn't load guardian access right now.");
      return;
    }
    const linkRows = links || [];
    setSupportLinks(linkRows);
    const { data: requestRows } = await supabase.from("guardian_support_requests").select("id, owner_user_id, caregiver_email, request_type, message, status, created_at").ilike("caregiver_email", currentUser.email || "").order("created_at", { ascending: false }).limit(30);
    setGuardianSupportRequests(requestRows || []);
    const adultLink = linkRows.find((link) =>
      link.owner_user_id !== currentUser.id &&
      link.active &&
      !!link.accepted_at &&
      link.caregiver_email === (currentUser.email || "").toLowerCase()
    );
    const invitedOwnerIds = linkRows
      .filter((link) => link.owner_user_id !== currentUser.id && link.active)
      .map((link) => link.owner_user_id);
    const { data: people } = invitedOwnerIds.length
      ? await supabase.from("tracker_profiles").select("user_id, display_name").in("user_id", invitedOwnerIds)
      : { data: [] };
    setSupportPeople(people || []);
    const { data: relationships } = await supabase.rpc("list_my_support_relationships");
    setSupportRelationships(relationships || []);
    const currentTargetStillAvailable = supportViewMode === "caretaker" && invitedOwnerIds.includes(supportOwnerId);
    const targetOwnerId = currentTargetStillAvailable
      ? supportOwnerId
      : (supportViewMode === "caretaker" && adultLink ? adultLink.owner_user_id : currentUser.id);
    await loadSupportOwner(targetOwnerId);
  };

  useEffect(() => {
    if (!user) {
      setSupportLinks([]);
      setSupportNotes([]);
      setSupportRewards([]);
      setSupportProgress([]);
      setSupportWeeklyHistory([]);
      setSupportOwnerId(null);
      setSupportPeople([]);
      setSupportRelationships([]);
      setGuardianSupportRequests([]);
      setTaskSuggestions([]);
      return;
    }
    loadSupportData(user);
  }, [user]);

  const inviteSupportAdult = async () => {
    const address = inviteEmail.trim().toLowerCase();
    if (!address || !address.includes("@")) {
      setSupportMessage("Enter the guardian's email address first.");
      return;
    }
    setSupportMessage("Adding guardian access…");
    const rolePermissions = GUARDIAN_ROLE_PRESETS.find((role) => role.id === guardianRolePreset)?.permissions || GUARDIAN_ROLE_PRESETS[0].permissions;
    const { error } = await supabase.from("caregiver_links").upsert(
      { owner_user_id: user.id, caregiver_email: address, label: "Guardian", active: true, ...rolePermissions },
      { onConflict: "owner_user_id,caregiver_email" }
    );
    if (error) {
      setSupportMessage("Couldn't add that invitation. Please try again.");
      return;
    }
    setInviteEmail("");
    setSupportMessage("Invitation sent. They'll see it once they sign in with that exact email, and nothing is shared until they accept.");
    await loadSupportData(user);
  };

  const sendGuardianSupportRequest = async () => {
    const activeGuardians = supportLinks.filter((link) => link.owner_user_id === user?.id && link.active && link.accepted_at);
    const address = supportRequestGuardian || activeGuardians[0]?.caregiver_email || "";
    if (!address) { setSupportMessage("Connect with an active Guardian before sending a support request."); return; }
    setSupportMessage("Sending your support request…");
    const { error } = await supabase.from("guardian_support_requests").insert({
      owner_user_id: user.id,
      caregiver_email: address,
      request_type: supportRequestType,
      message: supportRequestText.trim() || null,
    });
    if (error) { setSupportMessage("That request could not be sent yet."); return; }
    setSupportRequestText("");
    setSupportMessage("Your Guardian received a clear request. You stay in control of what happens next.");
  };

  const updateGuardianSupportRequest = async (requestId, status) => {
    // No owner_user_id filter here on purpose — RLS lets the addressed Guardian
    // resolve a request too, not just the owner who created it.
    const { error } = await supabase.from("guardian_support_requests").update({ status, resolved_at: status === "resolved" ? new Date().toISOString() : null }).eq("id", requestId);
    if (error) { setSupportMessage("That request could not be updated."); return; }
    setGuardianSupportRequests((rows) => rows.map((row) => row.id === requestId ? { ...row, status } : row));
  };

  const updateCaretakerPermission = async (link, permission, enabled) => {
    setSupportMessage("Updating guardian permissions…");
    const { error } = await supabase.from("caregiver_links").update({ [permission]: enabled }).eq("id", link.id).eq("owner_user_id", user.id);
    if (error) {
      setSupportMessage("That permission couldn't be changed.");
      return;
    }
    setSupportLinks((items) => items.map((item) => item.id === link.id ? { ...item, [permission]: enabled } : item));
    setSupportMessage("Guardian permissions updated.");
  };

  const updateCareAgreement = async (link, agreement) => {
    const cleaned = agreement.trim().slice(0, 1000);
    setSupportMessage("Saving your care agreement…");
    const { error } = await supabase.from("caregiver_links").update({ care_agreement: cleaned || null }).eq("id", link.id).eq("owner_user_id", user.id);
    if (error) { setSupportMessage("That care agreement couldn't be saved."); return; }
    setSupportLinks((items) => items.map((item) => item.id === link.id ? { ...item, care_agreement: cleaned || null } : item));
    setSupportMessage("Care agreement saved. You can change it whenever you need.");
  };

  const submitTaskSuggestion = async () => {
    const task = suggestedTask.trim();
    if (!task || !supportOwnerId) return;
    const { error } = await supabase.from("task_suggestions").insert({
      owner_user_id: supportOwnerId,
      caregiver_user_id: user.id,
      caregiver_name: trackerProfile?.display_name || "Guardian",
      task,
      suggested_day_id: suggestedTaskDay,
    });
    if (error) {
      setSupportMessage("That task suggestion couldn't be sent.");
      return;
    }
    setSuggestedTask("");
    setSupportMessage("Task suggestion sent for the owner to accept or decline.");
    await loadSupportOwner(supportOwnerId);
  };

  const decideTaskSuggestion = async (suggestion, decision) => {
    if (decision === "accepted") {
      const taskKey = `custom-${crypto.randomUUID()}`;
      const availableSections = taskSectionsForDay(suggestion.suggested_day_id);
      const selectedSection = suggestionSectionsById[suggestion.id] || availableSections[0] || "My tasks";
      const matchingSectionTasks = trackerTasks.filter((item) =>
        item.day_id === suggestion.suggested_day_id && item.section === selectedSection
      );
      const row = {
        user_id: user.id, task_key: taskKey, day_id: suggestion.suggested_day_id,
        section: selectedSection, task: suggestion.task, detail: `Suggested by ${suggestion.caregiver_name}`,
        sort_order: matchingSectionTasks.reduce((max, item) => Math.max(max, Number(item.sort_order) || 0), 0) + 1,
        is_bonus: matchingSectionTasks.length ? matchingSectionTasks.every(taskIsOptional) : taskIsOptional({ section: selectedSection }),
        schedule_type: "weekly",
        start_date: null, end_date: null, one_time_date: null,
      };
      const { error: taskError } = await supabase.from("tracker_tasks").insert(row);
      if (taskError) { setSupportMessage("The suggested task couldn't be added."); return; }
      setTrackerTasks((items) => [...items, row]);
    }
    const { error } = await supabase.from("task_suggestions").update({ status: decision }).eq("id", suggestion.id).eq("owner_user_id", user.id);
    if (error) { setSupportMessage("That suggestion couldn't be updated."); return; }
    setTaskSuggestions((items) => items.map((item) => item.id === suggestion.id ? { ...item, status: decision } : item));
    setSuggestionSectionsById((current) => {
      const next = { ...current };
      delete next[suggestion.id];
      return next;
    });
    setSupportMessage(decision === "accepted" ? "Suggestion accepted and added to your tracker ✨" : "Suggestion declined.");
  };

  const removeSupportAdult = async (linkId) => {
    if (!window.confirm("Permanently end this guardian relationship? They will immediately lose access.")) return;
    const { error } = await supabase.from("caregiver_links").delete().eq("id", linkId);
    setSupportMessage(error ? "Couldn't end access." : "Guardian relationship ended.");
    if (!error) await loadSupportData(user);
  };

  const acceptSupportInvitation = async (linkId) => {
    const invitation = supportLinks.find((link) => link.id === linkId);
    setSupportMessage("Accepting invitation…");
    const { error } = await supabase.rpc("accept_support_invitation", { link_id: linkId });
    if (error) {
      setSupportMessage("Couldn't accept that invitation. Please try again.");
      return;
    }
    setSupportMessage("Invitation accepted 💛");
    await loadSupportData(user);
    if (invitation?.owner_user_id) {
      setSupportViewMode("caretaker");
      await loadSupportOwner(invitation.owner_user_id);
    }
  };

  const declineSupportInvitation = async (linkId) => {
    if (!window.confirm("Decline this invitation?")) return;
    const { error } = await supabase.rpc("decline_support_invitation", { link_id: linkId });
    setSupportMessage(error ? "Couldn't decline that invitation." : "Invitation declined.");
    if (!error) await loadSupportData(user);
  };

  const setSupportAdultActive = async (linkId, active) => {
    setSupportMessage(active ? "Resuming guardian access…" : "Pausing guardian access…");
    const { error } = await supabase
      .from("caregiver_links")
      .update({ active })
      .eq("id", linkId)
      .eq("owner_user_id", user.id);
    if (error) {
      setSupportMessage(active ? "Couldn't resume access." : "Couldn't pause access.");
      return;
    }
    setSupportMessage(active ? "Guardian access resumed." : "Guardian access paused. Your relationship setup is saved.");
    await loadSupportData(user);
  };

  const addSupportNote = async () => {
    const body = newNote.trim();
    if (!body) {
      setSupportMessage("Write a note first.");
      return;
    }
    const { error } = await supabase.from("support_notes").insert({
      owner_user_id: supportOwnerId,
      caregiver_user_id: user.id,
      caregiver_name: trackerProfile?.display_name || "Guardian",
      body,
    });
    if (error) {
      setSupportMessage("Couldn't save the note.");
      return;
    }
    setNewNote("");
    setSupportMessage("Encouraging note sent 💛");
    if (isSupportAdult) {
      supabase.functions.invoke("notify-new-note", {
        body: { owner_user_id: supportOwnerId, caregiver_name: trackerProfile?.display_name || "Guardian", message: body },
      }).catch(() => {});
    }
    await loadSupportData(user);
  };

  const suggestComfortTool = async (toolId) => {
    const tool = COMFORT_TOOLS.find((item) => item.id === toolId);
    if (!tool || !supportOwnerId) return;
    setSupportMessage("Sending suggestion…");
    const body = `Your Guardian thought this might help right now: ${tool.icon} ${tool.name}`;
    const { error } = await supabase.from("support_notes").insert({
      owner_user_id: supportOwnerId,
      caregiver_user_id: user.id,
      caregiver_name: trackerProfile?.display_name || "Guardian",
      body,
      suggested_tool_id: toolId,
    });
    if (error) {
      setSupportMessage("Couldn't send that suggestion.");
      return;
    }
    setSupportMessage(`Suggested ${tool.name} 💛`);
    supabase.functions.invoke("notify-new-note", {
      body: { owner_user_id: supportOwnerId, caregiver_name: user.email?.split("@")[0] || "Guardian", message: body },
    }).catch(() => {});
    await loadSupportData(user);
  };

  const deleteSupportNote = async (noteId) => {
    if (!window.confirm("Delete this guardian note? This cannot be undone.")) return;
    setSupportMessage("Deleting note…");
    const { error } = await supabase
      .from("support_notes")
      .delete()
      .eq("id", noteId)
      .eq("owner_user_id", user.id);
    if (error) {
      setSupportMessage("Couldn't delete that note.");
      return;
    }
    setSupportNotes((notes) => notes.filter((note) => note.id !== noteId));
    setSupportMessage("Guardian note deleted.");
  };

  const addSupportReward = async () => {
    const title = rewardTitle.trim();
    const target = Math.max(1, Math.min(100, Number(rewardTarget) || 75));
    if (!title) {
      setSupportMessage("Give the reward a name first.");
      return;
    }
    const { error } = await supabase.from("support_rewards").insert({
      owner_user_id: supportOwnerId,
      caregiver_user_id: user.id,
      title,
      details: rewardDetails.trim(),
      target_percent: target,
      week_start: rewardTargetPeriod === "weekly" ? period.weekStart : null,
      approval_required: rewardApprovalRequired,
    });
    if (error) {
      setSupportMessage("Couldn't save the reward.");
      return;
    }
    setRewardTitle("");
    setRewardDetails("");
    setRewardTarget("75");
    setRewardTargetPeriod("daily");
    setRewardApprovalRequired(false);
    setSupportMessage("Reward added 🎁");
    await loadSupportData(user);
  };

  const updateRewardStatus = async (reward, action) => {
    const changes = action === "approve"
      ? { approved_at: new Date().toISOString() }
      : { claimed_at: new Date().toISOString(), active: false };
    // No owner_user_id filter here on purpose — RLS lets a permitted caregiver
    // approve/claim rewards too, not just the owner who set them up.
    const { error } = await supabase.from("support_rewards").update(changes).eq("id", reward.id);
    if (error) { setSupportMessage("That reward couldn't be updated."); return; }
    setSupportRewards((items) => action === "claim" ? items.filter((item) => item.id !== reward.id) : items.map((item) => item.id === reward.id ? { ...item, ...changes } : item));
    setSupportMessage(action === "approve" ? "Reward approved ✨" : "Reward marked claimed—enjoy it 💛");
  };

  useEffect(() => {
    if (!user) { setLongHistory([]); return; }
    let alive = true;
    setPrivateNoteLoaded(false);
    const monthStart = `${reflectionCalendarMonth}-01`;
    const monthStartDate = new Date(`${monthStart}T12:00:00Z`);
    const monthEnd = new Date(Date.UTC(monthStartDate.getUTCFullYear(), monthStartDate.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
    supabase
      .from("daily_progress")
      .select("progress_date, completed_keys")
      .eq("user_id", user.id)
      .gte("progress_date", monthStart)
      .lte("progress_date", monthEnd)
      .then(({ data, error }) => {
        if (!alive || error) return;
        setLongHistory(data || []);
      });
    return () => { alive = false; };
  }, [user, reflectionCalendarMonth]);

  useEffect(() => {
    if (!user) { setPreviousWeekHistory([]); return; }
    let alive = true;
    supabase
      .from("daily_progress")
      .select("progress_date, completed_keys")
      .eq("user_id", user.id)
      .gte("progress_date", offsetDate(period.weekStart, -7 * TREND_WEEKS))
      .lte("progress_date", offsetDate(period.weekStart, -1))
      .then(({ data, error }) => {
        if (!alive || error) return;
        setPreviousWeekHistory(data || []);
      });
    return () => { alive = false; };
  }, [user, period.weekStart]);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    setPrivateNote("");
    setPrivateNotePrompt("");
    setPrivateNoteMessage("");
    setPrivateNoteEditing(false);
    supabase
      .from("private_notes")
      .select("body, prompt")
      .eq("user_id", user.id)
      .eq("note_date", selectedProgressDate)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) {
          setPrivateNoteMessage("Couldn't load your private note.");
          return;
        }
        setPrivateNote(data?.body || "");
        setPrivateNotePrompt(data?.prompt || "");
        setPrivateNoteLoaded(true);
      });
    return () => { alive = false; };
  }, [user, selectedProgressDate]);

  useEffect(() => {
    if (!user || dayIdForDate(selectedProgressDate) !== "sun") { setLastWeekReflection(""); return; }
    let alive = true;
    supabase
      .from("private_notes")
      .select("body")
      .eq("user_id", user.id)
      .eq("note_date", offsetDate(selectedProgressDate, -7))
      .maybeSingle()
      .then(({ data }) => {
        if (!alive) return;
        setLastWeekReflection(data?.body || "");
      });
    return () => { alive = false; };
  }, [user, selectedProgressDate]);

  useEffect(() => {
    if (!user) { setWeeklyIntentionText(""); setWeeklyIntentionHistory([]); return; }
    let alive = true;
    supabase
      .from("weekly_intentions")
      .select("week_start, body, updated_at")
      .eq("user_id", user.id)
      .order("week_start", { ascending: false })
      .then(({ data }) => {
        if (!alive) return;
        const entries = (data || []).filter((entry) => entry.body?.trim());
        setWeeklyIntentionHistory(entries);
        setWeeklyIntentionText(entries.find((entry) => entry.week_start === period.weekStart)?.body || "");
      });
    return () => { alive = false; };
  }, [user, period.weekStart]);

  const saveWeeklyIntentionEdit = async () => {
    if (!user) return;
    setWeeklyIntentionMessage("Saving…");
    const text = weeklyIntentionDraft.trim();
    const { error } = await supabase.from("weekly_intentions").upsert({
      user_id: user.id,
      week_start: period.weekStart,
      body: text,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,week_start" });
    if (error) {
      setWeeklyIntentionMessage(`Couldn't save that: ${error.message}`);
      return;
    }
    setWeeklyIntentionText(text);
    setWeeklyIntentionHistory((entries) => {
      if (!text) return entries.filter((entry) => entry.week_start !== period.weekStart);
      const nextEntry = { week_start: period.weekStart, body: text, updated_at: new Date().toISOString() };
      return [nextEntry, ...entries.filter((entry) => entry.week_start !== period.weekStart)].sort((a, b) => b.week_start.localeCompare(a.week_start));
    });
    setWeeklyIntentionEditing(false);
    setWeeklyIntentionMessage("");
  };


  useEffect(() => {
    // Only ever shows for a signed-in user, and only on Monday — the actual
    // first day of a Mon-Sun week — not Sunday (the last day of the week
    // that's ending), which is when this used to fire despite talking about
    // "the week ahead." Since today is now the day AFTER the week closed,
    // "last week" means yesterday's Sunday and the week before this one.
    if (!user || dayIdForDate(period.date) !== "mon") { setWeeklyKickoffOpen(false); return; }
    let alive = true;
    const closingWeekStart = offsetDate(period.weekStart, -7);
    (async () => {
      const [{ data: noteRow }, { data: checkinRow }] = await Promise.all([
        supabase.from("weekly_intentions").select("body").eq("user_id", user.id).eq("week_start", closingWeekStart).maybeSingle(),
        supabase.from("weekly_intention_checkins").select("id").eq("user_id", user.id).eq("week_start", closingWeekStart).maybeSingle(),
      ]);
      if (!alive) return;
      if (!checkinRow) {
        setWeeklyKickoffNote(noteRow?.body || "");
        setWeeklyKickoffOpen(true);
      }
    })();
    return () => { alive = false; };
  }, [user, period.date]);

  useEffect(() => {
    if (!user || !preferences.onboarding_complete || preferences.weekly_intention_intro_seen || dayIdForDate(period.date) === "sun") {
      return;
    }
    let alive = true;
    supabase.from("weekly_intentions").select("body").eq("user_id", user.id).eq("week_start", period.weekStart).maybeSingle().then(({ data }) => {
      if (!alive) return;
      if (!data?.body) setIntroIntentionOpen(true);
    });
    return () => { alive = false; };
  }, [user, preferences.onboarding_complete, preferences.weekly_intention_intro_seen, period.weekStart]);

  const dismissIntroIntention = async (writtenSomething) => {
    setIntroIntentionOpen(false);
    const next = { ...preferences, weekly_intention_intro_seen: true };
    setPreferences(next);
    await savePreferences(next);
  };

  const saveIntroIntention = async () => {
    const text = introIntentionDraft.trim();
    if (!text) { setIntroIntentionMessage("Write a little something first, or skip for now 💛"); return; }
    setIntroIntentionMessage("Saving…");
    const { error } = await supabase.from("weekly_intentions").upsert({
      user_id: user.id,
      week_start: period.weekStart,
      body: text,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,week_start" });
    if (error) {
      setIntroIntentionMessage(`Couldn't save that: ${error.message}`);
      return;
    }
    setWeeklyIntentionText(text);
    setWeeklyIntentionHistory((entries) => [{ week_start: period.weekStart, body: text, updated_at: new Date().toISOString() }, ...entries.filter((entry) => entry.week_start !== period.weekStart)].sort((a, b) => b.week_start.localeCompare(a.week_start)));
    await dismissIntroIntention(true);
  };

  useEffect(() => {
    if (!user) { setDailyCheckIn({ capacity: null, mood: null, energy: null, day_type: "full", support_preference: null, soft_day: false, custom_essentials: null }); setDailyCheckInHistory([]); setDailyCheckInLoaded(false); return; }
    let alive = true;
    setDailyCheckInLoaded(false);
    supabase.from("daily_check_ins").select("*").eq("user_id", user.id).eq("check_date", period.date).maybeSingle().then(({ data }) => {
      if (!alive) return;
      setDailyCheckIn({
        capacity: data?.capacity || null,
        mood: data?.mood || null,
        energy: data?.energy || null,
        day_type: data?.day_type || (data?.soft_day ? "soft" : "full"),
        support_preference: data?.support_preference || null,
        soft_day: !!data?.soft_day,
        custom_essentials: data?.custom_essentials || null,
      });
      setDailyCheckInLoaded(true);
    });
    setNextStepSkipped([]);
    setNextStepDismissedToday(false);
    setCheckInPopupDismissedToday(false);
    return () => { alive = false; };
  }, [user, period.date]);

  useEffect(() => {
    if (!user) { setCareSessionHistory([]); setPathProgress([]); return; }
    let alive = true;
    const historyStart = offsetDate(period.date, -120);
    supabase.from("daily_check_ins").select("*").eq("user_id", user.id).gte("check_date", historyStart).lte("check_date", period.date).order("check_date").then(({ data }) => {
      if (alive) setDailyCheckInHistory(data || []);
    });
    supabase.from("plush_path_progress").select("path_id, current_day, completed_days, status, updated_at").eq("user_id", user.id).then(({ data }) => {
      if (alive) setPathProgress(data || []);
    });
    supabase.from("care_session_logs").select("id, session_id, session_kind, completed_at, outcome, check_date").eq("user_id", user.id).order("completed_at", { ascending: false }).limit(100).then(({ data }) => {
      if (alive) setCareSessionHistory(data || []);
    });
    return () => { alive = false; };
  }, [user?.id, period.date]);

  useEffect(() => {
    if (preferences.onboarding_complete && dailyCheckInLoaded && !dailyCheckIn.capacity && !checkInPopupDismissedToday) {
      setCheckInPopupOpen(true);
    }
  }, [preferences.onboarding_complete, dailyCheckInLoaded, dailyCheckIn.capacity, checkInPopupDismissedToday]);

  const saveDailyCheckIn = async (patch) => {
    const previous = dailyCheckIn;
    const next = { ...dailyCheckIn, ...patch };
    setDailyCheckIn(next);
    if (!user) return;
    const { error } = await supabase.from("daily_check_ins").upsert({
      user_id: user.id,
      check_date: period.date,
      capacity: next.capacity,
      mood: next.mood,
      energy: next.energy,
      day_type: next.day_type || "full",
      support_preference: next.support_preference,
      soft_day: next.soft_day,
      custom_essentials: next.custom_essentials,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,check_date" });
    if (error) {
      // Roll back the optimistic update — otherwise the UI keeps showing
      // this check-in as saved even though it never reached the database.
      setDailyCheckIn(previous);
      return;
    }
    setDailyCheckInHistory((rows) => [
      ...rows.filter((row) => row.check_date !== period.date),
      { ...next, check_date: period.date },
    ].sort((a, b) => a.check_date.localeCompare(b.check_date)));
  };

  const deleteDailyCheckIn = async (date) => {
    if (!user || !date) return;
    if (!window.confirm("Delete this mood and energy check-in? Task progress and private reflections will stay.")) return;
    const { error } = await supabase.from("daily_check_ins").delete().eq("user_id", user.id).eq("check_date", date);
    if (error) { setCareMessage("That check-in could not be deleted."); return; }
    setDailyCheckInHistory((rows) => rows.filter((row) => row.check_date !== date));
    if (date === period.date) setDailyCheckIn({ capacity: null, mood: null, energy: null, day_type: "full", support_preference: null, soft_day: false, custom_essentials: null });
    setCheckInViewerDate(null);
  };

  const openCareSession = (toolId) => {
    setCareMessage("");
    setComfortToolOpen(toolId);
  };

  const finishCareSession = () => {
    const toolId = comfortToolOpen;
    setComfortToolOpen(null);
    if (toolId) { setCareOutcomeTool(toolId); setCareOutcomeKind("care"); }
  };

  const finishSleepSession = () => {
    const toolId = sleepToolOpen;
    setSleepToolOpen(null);
    if (toolId) { setCareOutcomeTool(toolId); setCareOutcomeKind("sleep"); }
  };

  const activePacerTool = COMFORT_TOOLS.find((t) => t.id === comfortToolOpen && t.breathingPacer) || SLEEP_TOOLS.find((t) => t.id === sleepToolOpen && t.breathingPacer);
  useEffect(() => {
    if (!activePacerTool || preferences.reduced_motion) return;
    const phases = [["in", 4000], ["hold", 4000], ["out", 6000]];
    let phaseIndex = 0;
    setBreathPhase(phases[0][0]);
    let timeoutId = setTimeout(function advance() {
      phaseIndex = (phaseIndex + 1) % phases.length;
      setBreathPhase(phases[phaseIndex][0]);
      timeoutId = setTimeout(advance, phases[phaseIndex][1]);
    }, phases[phaseIndex][1]);
    return () => clearTimeout(timeoutId);
  }, [activePacerTool?.id, preferences.reduced_motion]);

  const saveCareOutcome = async (outcome) => {
    const sessionId = careOutcomeTool;
    const sessionKind = careOutcomeKind;
    setCareOutcomeTool(null);
    setCareOutcomeKind("care");
    if (!user || !sessionId) return;
    const { error } = await supabase.from("care_session_logs").insert({
      user_id: user.id,
      session_id: sessionId,
      session_kind: sessionKind,
      completed_at: new Date().toISOString(),
      outcome,
      check_date: period.date,
    });
    if (!error) setCareSessionHistory((rows) => [{
      id: `local-${Date.now()}`,
      session_id: sessionId,
      session_kind: sessionKind,
      completed_at: new Date().toISOString(),
      outcome,
      check_date: period.date,
    }, ...rows].slice(0, 100));
    setCareMessage(error ? "That result could not be saved, but the care you took still counts." : "Saved privately. PlushLife will use this only to make your suggestions more useful.");
  };

  const updatePathDay = async (pathId, dayNumber) => {
    const path = PLUSH_PATHS.find((item) => item.id === pathId);
    if (!user || !path) return;
    const existing = pathProgress.find((item) => item.path_id === pathId);
    const completedDays = Array.from(new Set([...(existing?.completed_days || []), dayNumber])).sort((a, b) => a - b);
    const completed = completedDays.length >= path.days.length;
    const nextRow = {
      user_id: user.id,
      path_id: pathId,
      current_day: completed ? path.days.length : Math.min(path.days.length, Math.max(dayNumber + 1, existing?.current_day || 1)),
      completed_days: completedDays,
      status: completed ? "completed" : "active",
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("plush_path_progress").upsert(nextRow, { onConflict: "user_id,path_id" });
    if (error) { setCareMessage("That path step could not be saved yet."); return; }
    setPathProgress((rows) => [...rows.filter((row) => row.path_id !== pathId), nextRow]);
    setCareMessage(completed ? "Path complete — keep what helped and leave the rest. ✨" : "One gentle path step saved.");
    if (!completed) setPathDayJustCompleted(true);
  };

  const remindAboutPathDay = (label) => {
    if (!window.PlushLifeNativeNotifications?.snoozeTask) return;
    window.PlushLifeNativeNotifications.snoozeTask({ taskKey: `path-step-${Date.now()}`, label, minutes: 180 }).catch(() => {});
    setCareMessage("We'll nudge you about this step in a few hours.");
  };

  const pauseCarePath = async (pathId) => {
    const existing = pathProgress.find((item) => item.path_id === pathId);
    if (!user) return;
    const nextStatus = existing?.status === "paused" ? "active" : "paused";
    const nextRow = {
      user_id: user.id,
      path_id: pathId,
      current_day: existing?.current_day || 1,
      completed_days: existing?.completed_days || [],
      status: nextStatus,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("plush_path_progress").upsert(nextRow, { onConflict: "user_id,path_id" });
    if (error) { setCareMessage("That path could not be updated yet."); return; }
    setPathProgress((rows) => [...rows.filter((row) => row.path_id !== pathId), nextRow]);
  };

  useEffect(() => {
    if (!user) { setRestDates([]); return; }
    let alive = true;
    supabase.from("rest_days").select("rest_date").eq("user_id", user.id).then(({ data }) => {
      if (!alive) return;
      setRestDates((data || []).map((row) => row.rest_date));
    });
    return () => { alive = false; };
  }, [user?.id]);

  const toggleRestToday = async () => {
    if (!user) return;
    await selectDayType(restDates.includes(period.date) ? "full" : "rest");
  };

  const selectDayType = async (value) => {
    await saveDailyCheckIn({ day_type: value, soft_day: value === "soft" || value === "tiny" || value === "recovery" });
    const resting = restDates.includes(period.date);
    if (value === "rest" && !resting) {
      const { error } = await supabase.from("rest_days").insert({ user_id: user.id, rest_date: period.date });
      if (!error) setRestDates((dates) => [...dates, period.date]);
    } else if (value !== "rest" && resting) {
      const { error } = await supabase.from("rest_days").delete().eq("user_id", user.id).eq("rest_date", period.date);
      if (!error) setRestDates((dates) => dates.filter((date) => date !== period.date));
    }
  };

  const saveRestRange = async () => {
    if (!user || !restRangeDraft.start || !restRangeDraft.end || restRangeDraft.end < restRangeDraft.start) return;
    const rangeDates = [];
    let cursor = restRangeDraft.start;
    let guard = 0;
    while (cursor <= restRangeDraft.end && guard < 60) {
      rangeDates.push(cursor);
      cursor = offsetDate(cursor, 1);
      guard += 1;
    }
    const { error } = await supabase.from("rest_days").upsert(rangeDates.map((date) => ({ user_id: user.id, rest_date: date })), { onConflict: "user_id,rest_date" });
    if (error) {
      setSettingsMessage("That rest range couldn't be saved yet.");
      return;
    }
    setRestDates((dates) => Array.from(new Set([...dates, ...rangeDates])));
    setRestRangeDraft({ start: "", end: "" });
  };

  const moveTaskToTomorrow = async (taskKey, fromDate) => {
    const tomorrow = offsetDate(fromDate, 1);
    const { error } = await supabase.from("tracker_tasks").update({ one_time_date: tomorrow }).eq("user_id", user.id).eq("task_key", taskKey);
    if (!error) {
      setTrackerTasks((tasks) => tasks.map((task) => task.task_key === taskKey ? { ...task, one_time_date: tomorrow } : task));
      setTaskMessage("Moved to tomorrow 🌙");
    } else {
      setTaskMessage("Couldn't move that task yet.");
    }
  };

  const snoozeTaskReminder = async (task, minutes) => {
    if (!user || !task) return;
    const snoozedUntil = new Date(Date.now() + minutes * 60000).toISOString();
    const row = { user_id: user.id, task_key: task.task_key, snoozed_until: snoozedUntil, updated_at: new Date().toISOString() };
    const { error } = await supabase.from("task_snoozes").upsert(row, { onConflict: "user_id,task_key" });
    if (error) { setTaskMessage("Couldn't snooze that reminder."); return; }
    setTaskSnoozes((items) => [...items.filter((item) => item.task_key !== task.task_key), row]);
    if (window.PlushLifeNativeNotifications?.snoozeTask) {
      window.PlushLifeNativeNotifications.snoozeTask({ taskKey: task.task_key, label: task.task, minutes }).catch(() => {});
    }
    setTaskMessage(`We'll gently remind you about “${task.task}” in ${minutes < 60 ? `${minutes} minutes` : `${Math.round(minutes / 60)} hour`}.`);
  };

  const clearTaskSnooze = async (taskKey) => {
    if (!user || !taskKey) return;
    const previousSnoozes = taskSnoozes;
    setTaskSnoozes((items) => items.filter((item) => item.task_key !== taskKey));
    const { error } = await supabase.from("task_snoozes").delete().eq("user_id", user.id).eq("task_key", taskKey);
    if (error) {
      // Roll back — otherwise the UI shows reminders as back on while the
      // snooze row still exists server-side and keeps suppressing them.
      setTaskSnoozes(previousSnoozes);
      setTaskMessage("Couldn't turn that reminder back on yet.");
    }
  };

  const archiveTrackerTask = async (taskKey, reason = "no_longer_needed") => {
    if (!user || !taskKey) return;
    const archivedAt = new Date().toISOString();
    const { error } = await supabase.from("tracker_tasks").update({ archived_at: archivedAt, archive_reason: reason }).eq("user_id", user.id).eq("task_key", taskKey);
    if (error) { setTaskMessage("Couldn't archive that task."); return; }
    setTrackerTasks((items) => items.map((item) => item.task_key === taskKey ? { ...item, archived_at: archivedAt, archive_reason: reason } : item));
    clearTaskSnooze(taskKey);
    setTaskMessage("Task archived. Its history is still safe.");
  };

  const restoreArchivedTask = async (taskKey) => {
    if (!user || !taskKey) return;
    const { error } = await supabase.from("tracker_tasks").update({ archived_at: null, archive_reason: null }).eq("user_id", user.id).eq("task_key", taskKey);
    if (error) { setTaskMessage("Couldn't restore that task."); return; }
    setTrackerTasks((items) => items.map((item) => item.task_key === taskKey ? { ...item, archived_at: null, archive_reason: null } : item));
    setTaskMessage("Task returned to your list.");
  };

  const pauseTrackerTask = async (taskKey, untilDate = null) => {
    if (!user || !taskKey) return;
    const pausedSince = period.date;
    const { error } = await supabase.from("tracker_tasks").update({ paused_since: pausedSince, paused_until: untilDate }).eq("user_id", user.id).eq("task_key", taskKey);
    if (error) { setTaskMessage("Couldn't pause that task."); return; }
    setTrackerTasks((items) => items.map((item) => item.task_key === taskKey ? { ...item, paused_since: pausedSince, paused_until: untilDate } : item));
    setTaskMessage(untilDate ? `Paused through ${untilDate}. It'll come back on its own.` : "Paused. Resume it whenever you're ready.");
  };

  const resumeTrackerTask = async (taskKey) => {
    if (!user || !taskKey) return;
    // Cap paused_until at yesterday rather than clearing paused_since/until
    // outright — this keeps the days it WAS paused excluded from Progress
    // history (see isTaskPausedOnDate), instead of quietly rewriting them
    // to look missed now that the pause is over.
    const yesterday = offsetDate(period.date, -1);
    const { error } = await supabase.from("tracker_tasks").update({ paused_until: yesterday }).eq("user_id", user.id).eq("task_key", taskKey);
    if (error) { setTaskMessage("Couldn't resume that task."); return; }
    setTrackerTasks((items) => items.map((item) => item.task_key === taskKey ? { ...item, paused_until: yesterday } : item));
    setTaskMessage("Welcome back — resumed today.");
  };

  const duplicateTrackerTask = async (task) => {
    if (!user || !task) return;
    const copy = {
      user_id: user.id,
      task_key: `copy-${Date.now()}-${window.crypto.getRandomValues(new Uint32Array(1))[0].toString(36).slice(0, 5)}`,
      day_id: task.day_id,
      section: task.section,
      task: `${task.task} (copy)`.slice(0, 180),
      detail: task.detail || null,
      sort_order: Math.max(0, ...trackerTasks.filter((item) => item.day_id === task.day_id).map((item) => Number(item.sort_order) || 0)) + 1,
      is_bonus: !!task.is_bonus,
      schedule_type: task.schedule_type || "weekly",
      start_date: task.start_date || null,
      end_date: task.end_date || null,
      one_time_date: task.one_time_date || null,
      why_note: task.why_note || null,
      soft_label: task.soft_label || null,
      tiny_label: task.tiny_label || null,
      estimated_minutes: task.estimated_minutes || null,
      essential_on_low_capacity: !!task.essential_on_low_capacity,
      schedule_days: Array.isArray(task.schedule_days) ? task.schedule_days : [],
      reminder_time: task.reminder_time || null,
    };
    const { error } = await supabase.from("tracker_tasks").insert(copy);
    if (error) { setTaskMessage("Couldn't duplicate that task."); return; }
    setTrackerTasks((items) => [...items, copy]);
    setTaskMessage("Task duplicated. Edit the copy whenever you're ready.");
  };

  const openTaskHelp = (task) => {
    const defaultGuardian = ownedSupportLinks.find((link) => link.active && link.accepted_at)?.caregiver_email || "";
    setTaskHelpDraft({ task, caregiver_email: defaultGuardian, request_type: "encouragement", note: "" });
  };

  const sendTaskHelpRequest = async () => {
    if (!user || !taskHelpDraft?.task) return;
    if (!taskHelpDraft.caregiver_email) { setTaskMessage("Connect with an active Guardian before asking for help."); return; }
    const message = [`Task: ${taskHelpDraft.task.task}`, taskHelpDraft.note.trim()].filter(Boolean).join("\n").slice(0, 500);
    const { error } = await supabase.from("guardian_support_requests").insert({
      owner_user_id: user.id,
      caregiver_email: taskHelpDraft.caregiver_email,
      request_type: taskHelpDraft.request_type,
      message,
    });
    if (error) { setTaskMessage("Couldn't send that support request."); return; }
    setTaskHelpDraft(null);
    setTaskMessage("Your Guardian received the support request 💛");
  };

  const moveAllOneTimeTasksToTomorrow = async () => {
    const movable = rows.filter((row) => row.sourceTask?.schedule_type === "once" && !viewDone[row.key]);
    if (!movable.length) { setTaskMessage("There are no unfinished one-time tasks to move."); return; }
    const tomorrow = offsetDate(selectedProgressDate, 1);
    const results = await Promise.all(movable.map((row) => supabase.from("tracker_tasks").update({ one_time_date: tomorrow }).eq("user_id", user.id).eq("task_key", row.key)));
    if (results.some(({ error }) => error)) { setTaskMessage("Some tasks couldn't be moved. Your list was left unchanged."); return; }
    const keys = new Set(movable.map((row) => row.key));
    setTrackerTasks((items) => items.map((item) => keys.has(item.task_key) ? { ...item, one_time_date: tomorrow } : item));
    setTaskMessage(`Moved ${movable.length} unfinished ${movable.length === 1 ? "task" : "tasks"} to tomorrow.`);
  };

  const goToFeedback = () => {
    setSettingsOpen(true);
    window.setTimeout(() => {
      document.getElementById("feedback-card")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
  };

  const goWriteWeeklyIntention = () => {
    setWeeklyKickoffOpen(false);
    setDashboard("progress");
    setWeeklyIntentionEditing(true);
  };

  const selectCheckInMood = async (value) => {
    const guess = MOOD_DAY_GUESSES[value] || MOOD_DAY_GUESSES.okay;
    await saveDailyCheckIn({
      mood: value,
      capacity: guess.capacity,
      energy: guess.energy,
      day_type: guess.day_type,
      soft_day: guess.day_type === "soft" || guess.day_type === "tiny",
    });
  };

  const saveWeeklyKickoffFeeling = async (feeling) => {
    setWeeklyKickoffMessage("Saving…");
    // This rates the week that just closed, not the new week the popup
    // opened on — same reasoning as the kickoff lookup above.
    const { error } = await supabase.from("weekly_intention_checkins").upsert({
      user_id: user.id,
      week_start: offsetDate(period.weekStart, -7),
      feeling,
    }, { onConflict: "user_id,week_start" });
    if (error) {
      setWeeklyKickoffMessage(`Couldn't save that: ${error.message}`);
      return;
    }
    setWeeklyKickoffOpen(false);
    setWeeklyKickoffMessage("");
  };

  useEffect(() => {
    if (!user) {
      setReflectionDates([]);
      setReflectionHistory([]);
      return;
    }
    let alive = true;
    supabase
      .from("private_notes")
      .select("note_date, body, prompt, updated_at")
      .eq("user_id", user.id)
      .order("note_date", { ascending: false })
      .then(({ data, error }) => {
        if (!alive || error) return;
        setReflectionDates((data || []).map((note) => note.note_date));
        setReflectionHistory(data || []);
      });
    return () => { alive = false; };
  }, [user]);

  useEffect(() => {
    if (!user || !reflectionViewerDate) return;
    let alive = true;
    setReflectionViewerLoading(true);
    setReflectionViewerNote("");
    setReflectionViewerPrompt("");
    supabase
      .from("private_notes")
      .select("body, prompt")
      .eq("user_id", user.id)
      .eq("note_date", reflectionViewerDate)
      .maybeSingle()
      .then(({ data }) => {
        if (!alive) return;
        setReflectionViewerNote(data?.body || "");
        setReflectionViewerPrompt(data?.prompt || "");
        setReflectionViewerLoading(false);
      });
    return () => { alive = false; };
  }, [user, reflectionViewerDate]);

  const savePrivateNote = async () => {
    if (!user) return;
    if (journalQuickOpenDate > period.date) {
      setPrivateNoteMessage("Reflections unlock on that day.");
      return;
    }
    setPrivateNoteMessage("Saving privately…");
    const { error } = await supabase.from("private_notes").upsert({
      user_id: user.id,
      note_date: journalQuickOpenDate,
      body: privateNoteDraft,
      prompt: journalPromptToSave,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,note_date" });
    if (error) {
      setPrivateNoteMessage("Couldn't save your private reflection.");
      return;
    }
    setReflectionDates((dates) => privateNoteDraft.trim() ? Array.from(new Set([...dates, journalQuickOpenDate])) : dates.filter((date) => date !== journalQuickOpenDate));
    setPrivateNote(privateNoteDraft);
    setPrivateNotePrompt(journalPromptToSave || "");
    setReflectionHistory((entries) => {
      const nextEntry = { note_date: journalQuickOpenDate, body: privateNoteDraft, prompt: journalPromptToSave, updated_at: new Date().toISOString() };
      if (!privateNoteDraft.trim()) return entries.filter((entry) => entry.note_date !== journalQuickOpenDate);
      return [nextEntry, ...entries.filter((entry) => entry.note_date !== journalQuickOpenDate)].sort((a, b) => b.note_date.localeCompare(a.note_date));
    });
    setPrivateNoteEditing(false);
    setPrivateNoteMessage("");
  };

  const taskSectionsForDay = (dayId) => {
    const sectionsForSelectedList = trackerTasks
      .filter((item) => item.day_id === dayId)
      .map((item) => item.section)
      .filter(Boolean);
    const sectionsFromOtherLists = trackerTasks
      .filter((item) => item.day_id !== dayId)
      .map((item) => item.section)
      .filter(Boolean);
    return Array.from(new Set([...sectionsForSelectedList, ...sectionsFromOtherLists]));
  };
  const existingTaskGroups = Array.from(new Set(trackerTasks.map((task) => task.section).filter(Boolean)));
  const taskGroupOrder = [
    ...(Array.isArray(preferences.task_group_order) ? preferences.task_group_order : []).filter((section) => existingTaskGroups.includes(section)),
    ...existingTaskGroups.filter((section) => !preferences.task_group_order?.includes(section)),
  ];
  const moveTaskGroup = async (section, direction, visibleSections = taskGroupOrder) => {
    const visibleIndex = visibleSections.indexOf(section);
    const targetSection = visibleSections[visibleIndex + direction];
    const currentIndex = taskGroupOrder.indexOf(section);
    const targetIndex = taskGroupOrder.indexOf(targetSection);
    if (!user || currentIndex < 0 || targetIndex < 0) return;
    const nextOrder = [...taskGroupOrder];
    [nextOrder[currentIndex], nextOrder[targetIndex]] = [nextOrder[targetIndex], nextOrder[currentIndex]];
    const previousOrder = Array.isArray(preferences.task_group_order) ? preferences.task_group_order : [];
    setPreferences((current) => ({ ...current, task_group_order: nextOrder }));
    const { error } = await supabase.from("app_preferences").upsert({
      user_id: user.id,
      task_group_order: nextOrder,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    if (error) {
      setPreferences((current) => ({ ...current, task_group_order: previousOrder }));
      setTaskMessage("Couldn't save that group order. Nothing changed.");
    }
  };
  const sectionIsOptional = (dayId, section) => {
    const matchingTasks = trackerTasks.filter((item) => item.day_id === dayId && item.section === section);
    return matchingTasks.length
      ? matchingTasks.every(taskIsOptional)
      : taskIsOptional({ section });
  };
  const newTaskSectionOptions = taskSectionsForDay(newTaskDay);
  const editTaskSectionOptions = editTaskDraft ? taskSectionsForDay(editTaskDraft.day_id) : [];

  const openTaskManager = (dayId = dayIdForDate(period.date)) => {
    const nextSections = taskSectionsForDay(dayId);
    setNewTaskDay(dayId);
    setNewTaskSection(nextSections[0] || "My tasks");
    setNewTaskCustomSection("");
    setTaskAdvancedOpen(false);
    setManageTasks(true);
  };

  useEffect(() => {
    if (!manageTasks) return;
    const nextSections = taskSectionsForDay(newTaskDay);
    setNewTaskSection((current) => current === "__custom__" || nextSections.includes(current) ? current : (nextSections[0] || "My tasks"));
  }, [manageTasks]);

  useEffect(() => {
    if (newTaskSection === "__custom__") return;
    if (!newTaskSectionOptions.includes(newTaskSection)) {
      setNewTaskSection(newTaskSectionOptions[0] || "My tasks");
    }
  }, [newTaskDay, trackerTasks, newTaskSection]);

  const previewNaturalSchedule = () => {
    const parsed = window.PlushLifeCare.parseNaturalSchedule(naturalScheduleText, new Date());
    setNaturalSchedulePreview(parsed);
    return parsed;
  };

  const applyNaturalSchedule = () => {
    const parsed = previewNaturalSchedule();
    if (!parsed.recognized) return;
    setNewTaskDay(parsed.day_id || "daily");
    setNewTaskScheduleDays(parsed.schedule_days || []);
    setNewTaskScheduleType(parsed.schedule_type || "weekly");
    setNewTaskOneTimeDate(parsed.one_time_date || "");
    setNewTaskReminderTime(parsed.reminder_time || "");
    setTaskMessage(`Schedule ready: ${parsed.summary}. Review it, then add your task.`);
  };

  const importTasksFromText = async () => {
    const lines = importText.split("\n").map((line) => line.trim()).filter(Boolean).slice(0, 50);
    if (lines.length === 0) {
      setImportMessage("Paste one task per line first.");
      return;
    }
    const existingTaskNames = new Set(
      trackerTasks
        .filter((item) => !item.archived_at && (item.day_id === newTaskDay || (newTaskDay !== "daily" && item.day_id === "daily")))
        .map((item) => item.task.trim().toLocaleLowerCase())
    );
    const seenImportedNames = new Set();
    const duplicateNames = Array.from(new Set(lines.filter((task) => {
      const normalized = task.toLocaleLowerCase();
      const duplicate = existingTaskNames.has(normalized) || seenImportedNames.has(normalized);
      seenImportedNames.add(normalized);
      return duplicate;
    })));
    if (duplicateNames.length > 0 && !window.confirm(`You already have ${duplicateNames.length === 1 ? `“${duplicateNames[0]}”` : `${duplicateNames.length} matching tasks`} on this list. Import ${duplicateNames.length === 1 ? "it" : "them"} again anyway?`)) {
      setImportMessage("Import cancelled — your current tasks are unchanged.");
      return;
    }
    if (SUPPORTER_FEATURES_ENABLED && !isSupporterAccount) {
      const existingCount = trackerTasks.filter((item) => item.day_id === "daily" || item.day_id === newTaskDay).length;
      if (existingCount + lines.length > FREE_TASK_LIMIT_PER_DAY) {
        setImportMessage(`🌟 Free accounts can have up to ${FREE_TASK_LIMIT_PER_DAY} tasks for this day — that's not enough room for all ${lines.length} pasted lines. Become a Supporter for unlimited tasks, or paste fewer.`);
        return;
      }
    }
    const dayTasks = trackerTasks
      .filter((item) => item.day_id === newTaskDay)
      .sort((a, b) => Number(a.sort_order) - Number(b.sort_order));
    const startIndex = dayTasks.length;
    const section = newTaskSection || newTaskSectionOptions[0] || "My tasks";
    const rows = lines.map((task, index) => ({
      user_id: user.id,
      task_key: `custom-${crypto.randomUUID()}`,
      day_id: newTaskDay,
      section,
      task: task.slice(0, 140),
      detail: "",
      sort_order: startIndex + index + 1,
      is_bonus: sectionIsOptional(newTaskDay, section),
      schedule_type: "weekly",
      start_date: null,
      end_date: null,
      one_time_date: null,
      why_note: "",
    }));
    setImportMessage("Importing…");
    const { error } = await supabase.from("tracker_tasks").insert(rows);
    if (error) {
      setImportMessage("Couldn't import those tasks.");
      return;
    }
    setTrackerTasks((tasks) => [...tasks, ...rows]);
    setImportText("");
    setImportMessage(`✨ Imported ${rows.length} ${rows.length === 1 ? "task" : "tasks"} into ${section}.`);
  };

  const addStarterPack = async () => {
    const pack = TEMPLATE_PACKS.find((item) => item.id === starterPackId) || TEMPLATE_PACKS[0];
    const existingTaskNames = new Set(
      trackerTasks
        .filter((item) => item.day_id === "daily" && !item.archived_at)
        .map((item) => item.task.trim().toLocaleLowerCase())
    );
    const tasksToAdd = pack.tasks.filter((item) => !existingTaskNames.has(item.task.trim().toLocaleLowerCase()));
    if (tasksToAdd.length === 0) {
      setStarterPackMessage(`Everything in ${pack.label} is already on your every-day list.`);
      return;
    }
    if (SUPPORTER_FEATURES_ENABLED && !isSupporterAccount) {
      const dailyCount = trackerTasks.filter((item) => item.day_id === "daily" && !item.archived_at).length;
      if (dailyCount + tasksToAdd.length > FREE_TASK_LIMIT_PER_DAY) {
        setStarterPackMessage(`This pack needs ${tasksToAdd.length} open spots on your every-day list. Free accounts can have up to ${FREE_TASK_LIMIT_PER_DAY}.`);
        return;
      }
    }
    const nextSortOrder = Math.max(0, ...trackerTasks.filter((item) => item.day_id === "daily").map((item) => Number(item.sort_order) || 0));
    const rows = tasksToAdd.map((item, index) => ({
      user_id: user.id,
      task_key: `starter-${pack.id}-${crypto.randomUUID()}`,
      day_id: "daily",
      section: item.section,
      task: item.task,
      detail: "",
      sort_order: nextSortOrder + index + 1,
      is_bonus: false,
      schedule_type: "weekly",
    }));
    setStarterPackMessage(`Adding ${tasksToAdd.length} ${tasksToAdd.length === 1 ? "task" : "tasks"}…`);
    const { error } = await supabase.from("tracker_tasks").insert(rows);
    if (error) {
      setStarterPackMessage("Couldn't add that starter pack. Please try again.");
      return;
    }
    setTrackerTasks((tasks) => [...tasks, ...rows]);
    setStarterPackMessage(`Added ${tasksToAdd.length} ${tasksToAdd.length === 1 ? "task" : "tasks"} from ${pack.label}. Nothing you already had was changed.`);
  };

  const addTrackerTask = async () => {
    const task = newTaskName.trim();
    const section = newTaskSection === "__custom__"
      ? newTaskCustomSection.trim()
      : (newTaskSection || newTaskSectionOptions[0] || "My tasks");
    const sectionTasks = trackerTasks.filter((item) => item.day_id === newTaskDay && item.section === section);
    const dayTasks = trackerTasks
      .filter((item) => item.day_id === newTaskDay)
      .sort((a, b) => Number(a.sort_order) - Number(b.sort_order) || a.task_key.localeCompare(b.task_key));
    if (!task) {
      setTaskMessage("Give the task a name first.");
      window.requestAnimationFrame(() => newTaskNameInputRef.current?.focus());
      return;
    }
    if (!section) {
      setTaskMessage("Choose a section or name your new section first.");
      return;
    }
    const matchingTask = trackerTasks.find((item) =>
      !item.archived_at &&
      (item.day_id === newTaskDay || (newTaskDay !== "daily" && item.day_id === "daily")) &&
      item.task.trim().toLocaleLowerCase() === task.toLocaleLowerCase()
    );
    if (matchingTask && !window.confirm(`You already have “${matchingTask.task}” on this list. Add another one anyway?`)) {
      setTaskMessage("No duplicate added — your current task is still there.");
      return;
    }
    if (SUPPORTER_FEATURES_ENABLED && !isSupporterAccount) {
      const combinedDayTaskCount = trackerTasks.filter((item) => item.day_id === "daily" || item.day_id === newTaskDay).length;
      if (combinedDayTaskCount >= FREE_TASK_LIMIT_PER_DAY) {
        setTaskMessage(`🌟 Free accounts can have up to ${FREE_TASK_LIMIT_PER_DAY} tasks for this day. Become a Supporter for unlimited tasks.`);
        return;
      }
    }
    const taskKey = `custom-${crypto.randomUUID()}`;
    const lastSectionIndex = dayTasks.reduce((lastIndex, item, index) => item.section === section ? index : lastIndex, -1);
    const insertionIndex = lastSectionIndex >= 0 ? lastSectionIndex + 1 : dayTasks.length;
    const row = {
      user_id: user.id,
      task_key: taskKey,
      day_id: newTaskDay,
      section,
      task,
      detail: encodeTaskDetail(newTaskKind),
      sort_order: insertionIndex + 1,
      is_bonus: sectionIsOptional(newTaskDay, section),
      schedule_type: newTaskScheduleType,
      start_date: newTaskScheduleType === "range" ? (newTaskStartDate || null) : null,
      end_date: newTaskScheduleType === "range" ? (newTaskEndDate || null) : null,
      one_time_date: newTaskScheduleType === "once" ? (newTaskOneTimeDate || selectedProgressDate) : null,
      schedule_days: newTaskScheduleType === "weekly" ? newTaskScheduleDays : [],
      reminder_time: newTaskReminderTime || null,
      why_note: newTaskWhy.trim(),
      soft_label: newTaskSoftLabel.trim() || null,
      tiny_label: newTaskTinyLabel.trim() || null,
      estimated_minutes: newTaskEstimatedMinutes ? Number(newTaskEstimatedMinutes) : null,
      essential_on_low_capacity: newTaskEssentialOnLow,
    };
    setTaskMessage("Adding task…");
    const { error } = await supabase.from("tracker_tasks").insert(row);
    if (error) {
      setTaskMessage("Couldn't add that task.");
      return;
    }
    const normalizedDayTasks = [...dayTasks];
    normalizedDayTasks.splice(insertionIndex, 0, row);
    const normalizedWithOrder = normalizedDayTasks.map((item, index) => ({ ...item, sort_order: index + 1 }));
    const orderResults = await Promise.all(normalizedWithOrder
      .filter((item) => item.task_key !== taskKey && Number(dayTasks.find((task) => task.task_key === item.task_key)?.sort_order) !== item.sort_order)
      .map((item) => supabase
        .from("tracker_tasks")
        .update({ sort_order: item.sort_order })
        .eq("user_id", user.id)
        .eq("task_key", item.task_key)
      )
    );
    if (orderResults.some(({ error: orderError }) => orderError)) {
      await supabase.from("tracker_tasks").delete().eq("user_id", user.id).eq("task_key", taskKey);
      setTaskMessage("That group couldn't be reordered safely, so the new task was not kept.");
      return;
    }
    if (!trackerProfile) {
      const displayName = (user.email || "My").split("@")[0];
      const { data } = await supabase.from("tracker_profiles").upsert({
        user_id: user.id,
        display_name: displayName,
        show_personal_schedule: false,
        account_type: "little",
        updated_at: new Date().toISOString(),
      }).select("display_name, show_personal_schedule, account_type").single();
      if (data) setTrackerProfile(data);
    }
    setTrackerTasks((tasks) => [
      ...tasks.filter((item) => item.day_id !== newTaskDay),
      ...normalizedWithOrder,
    ]);
    setNewTaskName("");
    setNewTaskKind("regular");
    setNewTaskWhy("");
    setNewTaskSoftLabel("");
    setNewTaskTinyLabel("");
    setNewTaskEstimatedMinutes("");
    setNewTaskEssentialOnLow(false);
    setNewTaskScheduleDays([]);
    setNewTaskReminderTime("");
    setNaturalScheduleText("");
    setNaturalSchedulePreview(null);
    setNewTaskSection(section);
    setNewTaskCustomSection("");
    setActive(newTaskDay);
    setSelectedProgressDate(dateForDayId(newTaskDay, period));
    setTaskMessage(`Added “${task}” inside ${section} ✨`);
  };

  const [recentlyDeletedTask, setRecentlyDeletedTask] = useState(null);
  const undoDeleteTimer = React.useRef(null);
  const pendingDeleteKey = React.useRef(null);

  const finalizeDeleteTask = async (taskKey, taskRow) => {
    if (!taskKey || !user) return;
    const { error: tasksError } = await supabase.from("tracker_tasks").delete().eq("user_id", user.id).eq("task_key", taskKey);
    const { error: progressError } = await supabase.from("tracker_progress").delete().eq("user_id", user.id).eq("task_key", taskKey);
    if ((tasksError || progressError) && taskRow) {
      // The delete never actually happened server-side (network blip, RLS
      // reject, etc.) — restore it rather than leaving the task silently
      // gone from the UI while it still exists in the database.
      setTrackerTasks((tasks) => tasks.some((task) => task.task_key === taskKey) ? tasks : [...tasks, taskRow]);
      setTaskMessage(`"${taskRow.task}" couldn't be deleted yet, so it's back on your list.`);
    }
  };

  const deleteTrackerTask = async (taskKey, taskLabel) => {
    const taskRow = trackerTasks.find((task) => task.task_key === taskKey);
    setTrackerTasks((tasks) => tasks.filter((task) => task.task_key !== taskKey));
    setDone((current) => {
      const next = { ...current };
      delete next[taskKey];
      return next;
    });
    setPendingTaskDelete(null);
    setTaskMessage("");
    if (undoDeleteTimer.current) {
      window.clearTimeout(undoDeleteTimer.current);
      // A previous delete was still waiting to be undone — since we're replacing
      // its toast now, finalize that one for real instead of silently dropping it.
      finalizeDeleteTask(pendingDeleteKey.current, recentlyDeletedTask);
    }
    pendingDeleteKey.current = taskKey;
    setRecentlyDeletedTask(taskRow ? { ...taskRow, label: taskLabel } : null);
    undoDeleteTimer.current = window.setTimeout(() => {
      setRecentlyDeletedTask(null);
      finalizeDeleteTask(taskKey, taskRow);
      pendingDeleteKey.current = null;
    }, 6000);
  };

  const undoDeleteTask = () => {
    if (!recentlyDeletedTask) return;
    if (undoDeleteTimer.current) window.clearTimeout(undoDeleteTimer.current);
    pendingDeleteKey.current = null;
    setTrackerTasks((tasks) => [...tasks, recentlyDeletedTask]);
    setRecentlyDeletedTask(null);
    setTaskMessage("Task restored ✨");
  };

  const moveTrackerTask = async (taskKey, direction) => {
    const originalTasks = [...trackerTasks];
    const target = trackerTasks.find((item) => item.task_key === taskKey);
    if (!target) return;
    const sectionTasks = trackerTasks
      .filter((item) => item.day_id === target.day_id && item.section === target.section)
      .sort((a, b) => a.sort_order - b.sort_order || a.task_key.localeCompare(b.task_key));
    const currentIndex = sectionTasks.findIndex((item) => item.task_key === taskKey);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= sectionTasks.length) return;

    const reordered = [...sectionTasks];
    [reordered[currentIndex], reordered[nextIndex]] = [reordered[nextIndex], reordered[currentIndex]];
    const baseOrder = Math.min(...sectionTasks.map((item) => Number(item.sort_order) || 0));
    const orderByKey = Object.fromEntries(reordered.map((item, index) => [item.task_key, baseOrder + index]));
    setTrackerTasks((tasks) => tasks.map((item) => orderByKey[item.task_key] === undefined ? item : { ...item, sort_order: orderByKey[item.task_key] }));
    setTaskMessage("Saving new order…");

    const results = await Promise.all(reordered.map((item) =>
      supabase.from("tracker_tasks")
        .update({ sort_order: orderByKey[item.task_key] })
        .eq("user_id", user.id)
        .eq("task_key", item.task_key)
    ));
    if (results.some(({ error }) => error)) {
      setTrackerTasks(originalTasks);
      setTaskMessage("Couldn't save that order.");
      return;
    }
    setTaskMessage("Task moved ✨");
  };

  const taskDragKeyRef = React.useRef(null);
  const taskPointerDragRef = React.useRef(null);

  const reorderTrackerTask = async (sourceKey, targetKey) => {
    if (!sourceKey || !targetKey || sourceKey === targetKey) return;
    const source = trackerTasks.find((item) => item.task_key === sourceKey);
    const target = trackerTasks.find((item) => item.task_key === targetKey);
    if (!source || !target || source.section !== target.section) return;
    if (!taskIsScheduledForDate(source, selectedProgressDate) || !taskIsScheduledForDate(target, selectedProgressDate)) return;
    const originalTasks = [...trackerTasks];
    const sectionTasks = trackerTasks
      .filter((item) => item.section === source.section && taskIsScheduledForDate(item, selectedProgressDate))
      .sort((a, b) => a.sort_order - b.sort_order || a.task_key.localeCompare(b.task_key));
    const fromIndex = sectionTasks.findIndex((item) => item.task_key === sourceKey);
    const toIndex = sectionTasks.findIndex((item) => item.task_key === targetKey);
    if (fromIndex < 0 || toIndex < 0) return;

    const reordered = [...sectionTasks];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    const orderByKey = Object.fromEntries(reordered.map((item, index) => [item.task_key, index + 1]));
    setTrackerTasks((tasks) => tasks.map((item) => orderByKey[item.task_key] === undefined ? item : { ...item, sort_order: orderByKey[item.task_key] }));
    setTaskMessage("Saving new order…");

    const results = await Promise.all(reordered.map((item) =>
      supabase.from("tracker_tasks")
        .update({ sort_order: orderByKey[item.task_key] })
        .eq("user_id", user.id)
        .eq("task_key", item.task_key)
    ));
    if (results.some(({ error }) => error)) {
      setTrackerTasks(originalTasks);
      setTaskMessage("Couldn't save that order.");
      return;
    }
    setTaskMessage("Task moved ✨");
  };

  const moveTaskToSection = async (sourceKey, targetSection, targetKey = null) => {
    if (!sourceKey || !targetSection) return;
    const source = trackerTasks.find((item) => item.task_key === sourceKey);
    const target = targetKey ? trackerTasks.find((item) => item.task_key === targetKey) : null;
    if (!source) return;
    if (target && (!taskIsScheduledForDate(source, selectedProgressDate) || !taskIsScheduledForDate(target, selectedProgressDate))) return;
    if (target && target.section !== targetSection) return;
    if (source.section === targetSection && targetKey && sourceKey !== targetKey) {
      await reorderTrackerTask(sourceKey, targetKey);
      return;
    }
    if (source.section === targetSection && targetKey === sourceKey) return;

    const originalTasks = [...trackerTasks];
    const sourceSection = source.section;
    const sourceRemaining = trackerTasks
      .filter((item) => item.section === sourceSection && item.task_key !== sourceKey && taskIsScheduledForDate(item, selectedProgressDate))
      .sort((a, b) => Number(a.sort_order) - Number(b.sort_order) || a.task_key.localeCompare(b.task_key));
    const targetTasks = trackerTasks
      .filter((item) => item.section === targetSection && item.task_key !== sourceKey && taskIsScheduledForDate(item, selectedProgressDate))
      .sort((a, b) => Number(a.sort_order) - Number(b.sort_order) || a.task_key.localeCompare(b.task_key));
    const insertionIndex = targetKey
      ? Math.max(0, targetTasks.findIndex((item) => item.task_key === targetKey))
      : targetTasks.length;
    const moved = {
      ...source,
      section: targetSection,
      is_bonus: sectionIsOptional(source.day_id, targetSection),
    };
    targetTasks.splice(insertionIndex < 0 ? targetTasks.length : insertionIndex, 0, moved);

    const nextRows = [
      ...sourceRemaining.map((item, index) => ({ ...item, sort_order: index + 1 })),
      ...targetTasks.map((item, index) => ({ ...item, sort_order: index + 1 })),
    ];
    const nextByKey = new Map(nextRows.map((item) => [item.task_key, item]));
    setTrackerTasks((tasks) => tasks.map((item) => nextByKey.get(item.task_key) || item));
    setTaskMessage(sourceSection === targetSection ? "Saving new order…" : `Moving to ${targetSection}…`);

    const results = await Promise.all(nextRows.map((item) => {
      const update = item.task_key === sourceKey
        ? { section: targetSection, is_bonus: item.is_bonus, sort_order: item.sort_order }
        : { sort_order: item.sort_order };
      return supabase.from("tracker_tasks")
        .update(update)
        .eq("user_id", user.id)
        .eq("task_key", item.task_key);
    }));
    if (results.some(({ error }) => error)) {
      setTrackerTasks(originalTasks);
      setTaskMessage("Couldn't move that task. Nothing changed.");
      return;
    }
    setTaskMessage(sourceSection === targetSection ? "Task moved ✨" : `Moved to ${targetSection} ✨`);
  };

  const taskDropRows = (scope) => [...(scope || document).querySelectorAll("[data-plushlife-task-drop-key]")];

  const animateTaskReflow = (before) => {
    requestAnimationFrame(() => taskDropRows(before.scope).forEach((row) => {
      const previousTop = before.get(row);
      if (previousTop === undefined) return;
      const delta = previousTop - row.getBoundingClientRect().top;
      if (Math.abs(delta) > 1) row.animate(
        [{ transform: `translateY(${delta}px)` }, { transform: "translateY(0)" }],
        { duration: 170, easing: "cubic-bezier(.2,.8,.2,1)" }
      );
    }));
  };

  const clearPointerTaskDrag = (drag) => {
    if (!drag) return;
    if (drag.activationTimer) clearTimeout(drag.activationTimer);
    if (drag.autoScrollFrame) cancelAnimationFrame(drag.autoScrollFrame);
    (drag.wiggleAnimations || []).forEach((animation) => animation.cancel());
    drag.preview?.remove();
    drag.placeholder?.remove();
    if (drag.row) {
      drag.row.style.height = drag.rowStyle.height;
      drag.row.style.minHeight = drag.rowStyle.minHeight;
      drag.row.style.margin = drag.rowStyle.margin;
      drag.row.style.padding = drag.rowStyle.padding;
      drag.row.style.borderWidth = drag.rowStyle.borderWidth;
      drag.row.style.opacity = drag.rowStyle.opacity;
      drag.row.style.overflow = drag.rowStyle.overflow;
      drag.row.style.pointerEvents = drag.rowStyle.pointerEvents;
    }
    document.querySelectorAll("[data-plushlife-task-dragging='true']").forEach((node) => delete node.dataset.plushlifeTaskDragging);
  };

  const placeTaskPlaceholder = (drag, clientX, clientY) => {
    if (!drag.active) return;
    drag.preview.style.left = `${Math.max(10, Math.min(clientX + 14, window.innerWidth - drag.preview.offsetWidth - 10))}px`;
    drag.preview.style.top = `${Math.max(10, Math.min(clientY - 52, window.innerHeight - drag.preview.offsetHeight - 10))}px`;
    const hit = document.elementFromPoint(clientX, clientY);
    const targetRow = hit?.closest?.("[data-plushlife-task-drop-key]");
    const targetSection = hit?.closest?.("[data-plushlife-task-drop-section]");
    let section = targetRow?.getAttribute("data-plushlife-task-drop-section") || targetSection?.getAttribute("data-plushlife-task-drop-section") || null;
    let targetKey = null;
    let insertionParent = null;
    let insertionBefore = null;
    let destination = "Drag to a task or group";

    if (targetRow && targetRow !== drag.row) {
      const rect = targetRow.getBoundingClientRect();
      const after = clientY >= rect.top + rect.height / 2;
      insertionParent = targetRow.parentNode;
      insertionBefore = after ? targetRow.nextSibling : targetRow;
      if (after) {
        const rowsInSection = taskDropRows(drag.scope).filter((row) => row !== drag.row && row.getAttribute("data-plushlife-task-drop-section") === section);
        const next = rowsInSection[rowsInSection.indexOf(targetRow) + 1] || null;
        targetKey = next?.getAttribute("data-plushlife-task-drop-key") || null;
        destination = next?.getAttribute("data-plushlife-task-drop-label") ? `Place before ${next.getAttribute("data-plushlife-task-drop-label")}` : `Place at end of ${section}`;
      } else {
        targetKey = targetRow.getAttribute("data-plushlife-task-drop-key");
        destination = `Place before ${targetRow.getAttribute("data-plushlife-task-drop-label") || "this task"}`;
      }
    } else if (targetSection) {
      const rowContainer = targetSection.querySelector("[data-plushlife-task-row-container]") || targetSection;
      insertionParent = rowContainer;
      insertionBefore = null;
      destination = `Place at end of ${section}`;
    }

    const signature = `${section || ""}:${targetKey || "end"}:${insertionParent ? "target" : "none"}`;
    if (insertionParent && signature !== drag.destinationSignature) {
      const before = new Map(taskDropRows(drag.scope).map((row) => [row, row.getBoundingClientRect().top]));
      before.scope = drag.scope;
      insertionParent.insertBefore(drag.placeholder, insertionBefore);
      drag.destinationSignature = signature;
      drag.targetSection = section;
      drag.targetKey = targetKey;
      animateTaskReflow(before);
    }
    drag.preview.querySelector("[data-drag-destination]").textContent = destination;
  };

  const runTaskAutoScroll = (drag) => {
    if (!drag.active) return;
    const edge = 84;
    const direction = drag.lastY < edge ? -1 : drag.lastY > window.innerHeight - edge ? 1 : 0;
    if (direction) {
      window.scrollBy(0, direction * 10);
      placeTaskPlaceholder(drag, drag.lastX, drag.lastY);
    }
    drag.autoScrollFrame = requestAnimationFrame(() => runTaskAutoScroll(drag));
  };

  const activatePointerTaskDrag = (drag) => {
    if (drag.active) return;
    drag.active = true;
    taskDragKeyRef.current = drag.taskKey;
    drag.row.dataset.plushlifeTaskDragging = "true";
    const rect = drag.row.getBoundingClientRect();
    const placeholder = document.createElement("div");
    placeholder.setAttribute("aria-hidden", "true");
    placeholder.style.cssText = `height:${rect.height}px;box-sizing:border-box;border:2px dashed #D9A6E3;border-radius:12px;background:rgba(249,231,247,.58);margin:0 0 6px;transition:height .16s ease,transform .16s ease`;
    drag.row.parentNode.insertBefore(placeholder, drag.row);
    drag.placeholder = placeholder;
    drag.rowStyle = {
      height: drag.row.style.height, minHeight: drag.row.style.minHeight, margin: drag.row.style.margin,
      padding: drag.row.style.padding, borderWidth: drag.row.style.borderWidth, opacity: drag.row.style.opacity,
      overflow: drag.row.style.overflow, pointerEvents: drag.row.style.pointerEvents,
    };
    Object.assign(drag.row.style, { height: "0px", minHeight: "0px", margin: "0px", padding: "0px", borderWidth: "0px", opacity: "0", overflow: "hidden", pointerEvents: "none" });
    drag.wiggleAnimations = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
      ? []
      : taskDropRows(drag.scope)
        .filter((row) => row !== drag.row)
        .map((row, index) => row.animate(
          [
            { translate: "-1px 0", rotate: "-0.12deg" },
            { translate: "1px 0", rotate: "0.12deg" },
          ],
          { duration: 180, iterations: Infinity, direction: "alternate", easing: "ease-in-out", delay: -(index % 4) * 35 }
        ));
    const preview = document.createElement("div");
    preview.setAttribute("role", "status");
    preview.style.cssText = `position:fixed;z-index:9999;width:${Math.min(rect.width, 330)}px;box-sizing:border-box;padding:11px 13px;border:1px solid #E6D4F2;border-radius:12px;background:#FFFCFE;color:#5B4B6B;box-shadow:0 16px 34px rgba(66,42,78,.28);pointer-events:none;font-family:inherit;line-height:1.35`;
    const title = document.createElement("strong");
    title.textContent = drag.label;
    title.style.cssText = "display:block;font-size:13px";
    const destination = document.createElement("span");
    destination.dataset.dragDestination = "true";
    destination.textContent = "Choose a new position";
    destination.style.cssText = "display:block;margin-top:3px;color:#9A4EAD;font-size:11px;font-weight:800";
    preview.append(title, destination);
    document.body.appendChild(preview);
    drag.preview = preview;
    if (navigator.vibrate) navigator.vibrate(18);
    placeTaskPlaceholder(drag, drag.lastX, drag.lastY);
    runTaskAutoScroll(drag);
  };

  const startPointerTaskDrag = (event, taskKey, taskLabel) => {
    if (event.button !== undefined && event.button !== 0) return;
    const row = event.currentTarget.closest("[data-plushlife-task-drop-key]");
    if (!row) return;
    event.preventDefault();
    event.stopPropagation();
    window.getSelection?.()?.removeAllRanges();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const drag = {
      pointerId: event.pointerId, handle: event.currentTarget, row, scope: row.closest("[data-plushlife-task-drag-scope]") || document, taskKey, label: taskLabel,
      startX: event.clientX, startY: event.clientY, lastX: event.clientX, lastY: event.clientY,
      active: false, destinationSignature: null, targetSection: null, targetKey: null, autoScrollFrame: null, activationTimer: null, wiggleAnimations: [],
    };
    taskPointerDragRef.current = drag;
    if (event.pointerType === "touch" || event.pointerType === "pen") {
      drag.activationTimer = setTimeout(() => {
        drag.activationTimer = null;
        if (taskPointerDragRef.current === drag) activatePointerTaskDrag(drag);
      }, 140);
    }
  };

  const movePointerTaskDrag = (event) => {
    const drag = taskPointerDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    if (!drag.active && !drag.activationTimer && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) >= 7) activatePointerTaskDrag(drag);
    if (drag.active) placeTaskPlaceholder(drag, event.clientX, event.clientY);
  };

  const endPointerTaskDrag = (event) => {
    const drag = taskPointerDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    taskPointerDragRef.current = null;
    taskDragKeyRef.current = null;
    try { drag.handle.releasePointerCapture?.(event.pointerId); } catch (_error) {}
    const shouldMove = drag.active && drag.targetSection && drag.targetKey !== drag.taskKey;
    const targetSection = drag.targetSection;
    const targetKey = drag.targetKey;
    clearPointerTaskDrag(drag);
    if (shouldMove) moveTaskToSection(drag.taskKey, targetSection, targetKey);
  };

  const cancelPointerTaskDrag = (event) => {
    const drag = taskPointerDragRef.current;
    if (!drag || (event?.pointerId !== undefined && drag.pointerId !== event.pointerId)) return;
    taskPointerDragRef.current = null;
    taskDragKeyRef.current = null;
    clearPointerTaskDrag(drag);
  };

  const startEditingTask = (task) => {
    setEditingTaskKey(task.task_key);
    setEditTaskDraft({
      ...task,
      detail: cleanTaskDetail(task.detail || ""),
      habit_type: habitTypeForTask(task),
      custom_section: "",
      why_note: task.why_note || "",
    });
  };

  const saveEditedTask = async () => {
    const editedSection = editTaskDraft?.section === "__custom__"
      ? (editTaskDraft.custom_section || "").trim()
      : (editTaskDraft?.section || "").trim();
    if (!editTaskDraft || !editTaskDraft.task.trim() || !editedSection) {
      setTaskMessage("Task name and section are required.");
      return;
    }
    const originalTask = trackerTasks.find((item) => item.task_key === editingTaskKey);
    const placementChanged = !!originalTask && (originalTask.day_id !== editTaskDraft.day_id || originalTask.section !== editedSection);
    const targetDayTasks = trackerTasks
      .filter((item) => item.day_id === editTaskDraft.day_id && item.task_key !== editingTaskKey)
      .sort((a, b) => Number(a.sort_order) - Number(b.sort_order) || a.task_key.localeCompare(b.task_key));
    const targetSectionLastIndex = targetDayTasks.reduce((lastIndex, item, index) => item.section === editedSection ? index : lastIndex, -1);
    const targetInsertionIndex = targetSectionLastIndex >= 0 ? targetSectionLastIndex + 1 : targetDayTasks.length;
    const changes = {
      task: editTaskDraft.task.trim(),
      detail: encodeTaskDetail(editTaskDraft.habit_type || "regular", editTaskDraft.detail || ""),
      day_id: editTaskDraft.day_id,
      section: editedSection,
      is_bonus: !!editTaskDraft.is_bonus,
      schedule_type: editTaskDraft.schedule_type || "weekly",
      start_date: editTaskDraft.schedule_type === "range" ? (editTaskDraft.start_date || null) : null,
      end_date: editTaskDraft.schedule_type === "range" ? (editTaskDraft.end_date || null) : null,
      one_time_date: editTaskDraft.schedule_type === "once" ? (editTaskDraft.one_time_date || selectedProgressDate) : null,
      schedule_days: editTaskDraft.schedule_type === "weekly" && Array.isArray(editTaskDraft.schedule_days) ? editTaskDraft.schedule_days : [],
      reminder_time: editTaskDraft.reminder_time || null,
      why_note: (editTaskDraft.why_note || "").trim(),
      soft_label: (editTaskDraft.soft_label || "").trim() || null,
      tiny_label: (editTaskDraft.tiny_label || "").trim() || null,
      estimated_minutes: editTaskDraft.estimated_minutes ? Number(editTaskDraft.estimated_minutes) : null,
      essential_on_low_capacity: !!editTaskDraft.essential_on_low_capacity,
      sort_order: placementChanged ? targetInsertionIndex + 1 : (Number(originalTask?.sort_order) || targetInsertionIndex + 1),
    };
    setTaskMessage("Saving task changes…");
    const { error } = await supabase.from("tracker_tasks").update(changes).eq("user_id", user.id).eq("task_key", editingTaskKey);
    if (error) { setTaskMessage("Couldn't save that task."); return; }
    if (!placementChanged) {
      setTrackerTasks((items) => items.map((item) => item.task_key === editingTaskKey ? { ...item, ...changes } : item));
      setEditingTaskKey(null);
      setEditTaskDraft(null);
      setTaskMessage(`Saved “${changes.task}” ✨`);
      return;
    }
    let reorderedTasks = trackerTasks.map((item) => item.task_key === editingTaskKey ? { ...item, ...changes } : item);
    const affectedDays = [...new Set([originalTask?.day_id, changes.day_id].filter(Boolean))];
    affectedDays.forEach((dayId) => {
      const orderedForDay = reorderedTasks
        .filter((item) => item.day_id === dayId && item.task_key !== editingTaskKey)
        .sort((a, b) => Number(a.sort_order) - Number(b.sort_order) || a.task_key.localeCompare(b.task_key));
      if (dayId === changes.day_id) {
        const editedTask = reorderedTasks.find((item) => item.task_key === editingTaskKey);
        const lastIndex = orderedForDay.reduce((last, item, index) => item.section === editedSection ? index : last, -1);
        orderedForDay.splice(lastIndex >= 0 ? lastIndex + 1 : orderedForDay.length, 0, editedTask);
      }
      const normalized = orderedForDay.map((item, index) => ({ ...item, sort_order: index + 1 }));
      reorderedTasks = [
        ...reorderedTasks.filter((item) => item.day_id !== dayId),
        ...normalized,
      ];
    });
    const orderResults = await Promise.all(reorderedTasks
      .filter((item) => affectedDays.includes(item.day_id))
      .map((item) => supabase
        .from("tracker_tasks")
        .update({ sort_order: item.sort_order })
        .eq("user_id", user.id)
        .eq("task_key", item.task_key)
      )
    );
    if (orderResults.some(({ error: orderError }) => orderError)) {
      setTaskMessage("The task was saved, but its group order needs another try.");
    } else {
      setTaskMessage(`Moved “${changes.task}” into ${editedSection} ✨`);
    }
    setTrackerTasks(reorderedTasks);
    setEditingTaskKey(null);
    setEditTaskDraft(null);
  };

  const buildScheduleRow = (dayId, entries) => {
    const dayLabel = DAYS.find((item) => item.id === dayId)?.label || dayId.toUpperCase();
    const fullLabel = DAYS.find((item) => item.id === dayId)?.label === "THU" ? "Thursday" :
      ({ mon: "Monday", tue: "Tuesday", wed: "Wednesday", fri: "Friday", sat: "Saturday", sun: "Sunday" }[dayId] || dayLabel);
    const cleanEntries = entries
      .filter((entry) => entry.time || (entry.text || "").trim())
      .map((entry) => ({ time: entry.time || "", text: (entry.text || "").trim() }));
    return {
      user_id: user.id,
      day_id: dayId,
      label: fullLabel,
      entries: cleanEntries,
      updated_at: new Date().toISOString(),
    };
  };

  const savePersonalSchedule = async () => {
    const row = buildScheduleRow(scheduleEditingDayId, scheduleDraft.entries);
    setScheduleMessage("Saving schedule…");
    const { error } = await supabase.from("tracker_schedules").upsert(row, { onConflict: "user_id,day_id" });
    if (error) {
      setScheduleMessage(`Couldn't save that schedule: ${error.message}`);
      return;
    }
    setPersonalSchedules((items) => [...items.filter((item) => item.day_id !== scheduleEditingDayId), row]);
    if (!trackerProfile) {
      const displayName = (user.email || "My").split("@")[0];
      const { data } = await supabase.from("tracker_profiles").upsert({
        user_id: user.id,
        display_name: displayName,
        show_personal_schedule: true,
        account_type: "little",
        updated_at: new Date().toISOString(),
      }).select("display_name, show_personal_schedule, account_type").single();
      if (data) setTrackerProfile(data);
    }
    setScheduleMessage("Schedule saved ✨");
  };

  const copyScheduleToAllDays = async () => {
    if (!window.confirm("Copy this schedule to all 7 days? Any existing schedule on other days will be replaced.")) return;
    setScheduleMessage("Copying to every day…");
    const rows = DAYS.map((dayItem) => buildScheduleRow(dayItem.id, scheduleDraft.entries));
    const { error } = await supabase.from("tracker_schedules").upsert(rows, { onConflict: "user_id,day_id" });
    if (error) {
      setScheduleMessage(`Couldn't copy to every day: ${error.message}`);
      return;
    }
    setPersonalSchedules((items) => [...items.filter((item) => !DAYS.some((dayItem) => dayItem.id === item.day_id)), ...rows]);
    setScheduleMessage("Copied this schedule to every day ✨");
  };

  const toggleCopyToDay = (dayId) => {
    setCopyToDayIds((current) => current.includes(dayId) ? current.filter((id) => id !== dayId) : [...current, dayId]);
  };

  const copyScheduleToSelectedDays = async () => {
    if (copyToDayIds.length === 0) {
      setScheduleMessage("Pick at least one day to copy to first.");
      return;
    }
    const dayLabels = copyToDayIds.map((id) => DAYS.find((item) => item.id === id)?.label || id.toUpperCase()).join(", ");
    if (!window.confirm(`Copy this schedule to ${dayLabels}? Any existing schedule on ${copyToDayIds.length === 1 ? "that day" : "those days"} will be replaced.`)) return;
    setScheduleMessage("Copying to selected days…");
    const rows = copyToDayIds.map((dayId) => buildScheduleRow(dayId, scheduleDraft.entries));
    const { error } = await supabase.from("tracker_schedules").upsert(rows, { onConflict: "user_id,day_id" });
    if (error) {
      setScheduleMessage(`Couldn't copy to those days: ${error.message}`);
      return;
    }
    setPersonalSchedules((items) => [...items.filter((item) => !copyToDayIds.includes(item.day_id)), ...rows]);
    setCopyToDayIds([]);
    setScheduleMessage(`Copied this schedule to ${dayLabels} ✨`);
  };

  const addScheduleEntry = () => {
    setScheduleDraft((draft) => ({ entries: [...draft.entries, { id: crypto.randomUUID(), time: "", text: "" }] }));
  };
  const updateScheduleEntry = (id, patch) => {
    setScheduleDraft((draft) => ({ entries: draft.entries.map((entry) => entry.id === id ? { ...entry, ...patch } : entry) }));
  };
  const removeScheduleEntry = (id) => {
    setScheduleDraft((draft) => ({ entries: draft.entries.filter((entry) => entry.id !== id) }));
  };

  const addScheduleExceptionEntry = () => {
    setScheduleExceptionDraft((draft) => ({ ...draft, entries: [...draft.entries, { id: crypto.randomUUID(), time: "", text: "" }] }));
  };
  const updateScheduleExceptionEntry = (id, patch) => {
    setScheduleExceptionDraft((draft) => ({ ...draft, entries: draft.entries.map((entry) => entry.id === id ? { ...entry, ...patch } : entry) }));
  };
  const removeScheduleExceptionEntry = (id) => {
    setScheduleExceptionDraft((draft) => ({ ...draft, entries: draft.entries.filter((entry) => entry.id !== id) }));
  };
  const saveScheduleException = async () => {
    const startDate = scheduleExceptionDraft.start_date || period.date;
    const endDate = scheduleExceptionDraft.end_date || startDate;
    const entries = scheduleExceptionDraft.entries.filter((entry) => entry.time || (entry.text || "").trim()).map((entry) => ({ time: entry.time || "", text: (entry.text || "").trim() }));
    if (endDate < startDate) { setScheduleExceptionMessage("Choose an end date on or after the start date."); return; }
    if (!entries.length) { setScheduleExceptionMessage("Add at least one extra schedule item first."); return; }
    setScheduleExceptionMessage("Saving temporary extras…");
    const row = { user_id: user.id, start_date: startDate, end_date: endDate, entries, updated_at: new Date().toISOString() };
    const { data, error } = await supabase.from("schedule_exceptions").insert(row).select("id, start_date, end_date, entries").single();
    if (error) { setScheduleExceptionMessage(`Couldn't save those extras: ${error.message}`); return; }
    setScheduleExceptions((items) => [...items, data]);
    setScheduleExceptionDraft({ start_date: period.date, end_date: period.date, entries: [] });
    setScheduleExceptionMessage("Temporary extras saved — your usual schedule stays underneath. ✨");
  };
  const deleteScheduleException = async (id) => {
    const { error } = await supabase.from("schedule_exceptions").delete().eq("id", id).eq("user_id", user.id);
    if (error) { setScheduleExceptionMessage(`Couldn't remove that exception: ${error.message}`); return; }
    setScheduleExceptions((items) => items.filter((item) => item.id !== id));
    setScheduleExceptionMessage("Temporary extras removed.");
  };

  const clearPersonalSchedule = async () => {
    if (!window.confirm("Clear this day's schedule? Your checklist tasks will stay.")) return;
    const { error } = await supabase.from("tracker_schedules").delete().eq("user_id", user.id).eq("day_id", scheduleEditingDayId);
    if (error) {
      setScheduleMessage(`Couldn't clear that schedule: ${error.message}`);
      return;
    }
    setPersonalSchedules((items) => items.filter((item) => item.day_id !== scheduleEditingDayId));
    setScheduleDraft({ entries: [] });
    setScheduleMessage("Day schedule cleared.");
  };

  const sendSignInLink = async () => {
    const address = email.trim();
    if (!address) {
      setSignInMessage("Type your email address first.");
      return;
    }
    if (codeCooldown > 0) {
      setSignInMessage(`Please wait ${codeCooldown} seconds before requesting another code.`);
      return;
    }
    setSignInMessage("Sending your one-time code…");
    const { error } = await supabase.auth.signInWithOtp({
      email: address,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: window.location.origin + window.location.pathname,
      },
    });
    if (error) {
      const waitSeconds = Number((error.message || "").match(/after (\d+) seconds/)?.[1]) || 30;
      if (error.status === 429 || /rate limit/i.test(error.message || "")) {
        setCodeCooldown(waitSeconds);
        setSignInMessage(`Please wait ${waitSeconds} seconds, then use the newest code email.`);
      } else {
        setSignInMessage("Couldn't send the code. Please try again.");
      }
      return;
    }
    setCodeCooldown(30);
    setSignInMessage("Code sent! Enter the newest code from your email below.");
  };

  const verifySignInCode = async () => {
    const address = email.trim();
    const token = otpCode.trim();
    if (!address) {
      setSignInMessage("Type your email address first.");
      return;
    }
    if (!/^\d{6,8}$/.test(token)) {
      setSignInMessage("Enter the 6–8 digit code from your newest email.");
      return;
    }
    setSignInMessage("Signing you in…");
    let { error } = await supabase.auth.verifyOtp({
      email: address,
      token,
      type: "email",
    });
    if (error) {
      ({ error } = await supabase.auth.verifyOtp({
        email: address,
        token,
        type: "signup",
      }));
    }
    if (error) {
      setSignInMessage("That code didn't work or has expired. Please send a fresh one.");
      return;
    }
    setOtpCode("");
    setSignInMessage("Signed in! This browser will remember you.");
  };

  const signInWithPassword = async () => {
    const address = email.trim();
    if (!address) {
      setSignInMessage("Type your email address first.");
      return;
    }
    if (!password) {
      setSignInMessage("Type your password first.");
      return;
    }
    setSignInMessage("Signing you in…");
    const { error } = await supabase.auth.signInWithPassword({ email: address, password });
    if (error) {
      setSignInMessage("That email or password didn't work.");
      return;
    }
    setPassword("");
    setSignInMessage("Signed in! This browser will remember you.");
  };

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    setSignInMessage("Signing out…");
    if ("clearAppBadge" in navigator) { try { navigator.clearAppBadge().catch(() => {}); } catch (_error) {} }
    if (user && "serviceWorker" in navigator) {
      // Deactivate this device's push registration before the session clears, so a
      // reminder meant for this account can never surface after someone else signs
      // in on the same shared device/browser.
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        const subscription = await registration?.pushManager.getSubscription();
        if (subscription) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint).eq("user_id", user.id);
          await subscription.unsubscribe();
        }
      } catch (_error) {}
    }
    if (user && window.__plushlifeNativePushToken) {
      // Same as above, for the native Android FCM registration - a shared Android
      // device must not keep receiving this account's push after sign-out.
      try {
        await supabase.from("push_subscriptions").delete().eq("fcm_token", window.__plushlifeNativePushToken).eq("user_id", user.id);
      } catch (_error) {}
    }
    setUser(null);
    setDone({});
    setTrackerTasks([]);
    setPersonalSchedules([]);
    setWeeklyHistory([]);
    setShowSignIn(true);
    setSyncStatus("signed-out");

    try {
      await supabase.auth.signOut({ scope: "local" });
    } finally {
      supabase.auth.stopAutoRefresh();
      window.localStorage.removeItem(SUPABASE_AUTH_STORAGE_KEY);
      // Otherwise a different profile signing in next on this same device
      // would briefly see this profile's task labels still on the home
      // screen widget, left over from before it's overwritten with theirs.
      window.Capacitor?.Plugins?.WidgetBridge?.clearWidget().catch(() => {});
      window.location.replace(window.location.origin + window.location.pathname);
    }
  };

  const savePreferences = async (nextPreferences = preferences) => {
    if (!user) return;
    setSettingsMessage("Saving your settings…");
    const row = {
      user_id: user.id,
      notifications_enabled: !!nextPreferences.notifications_enabled,
      reminder_times: nextPreferences.reminder_times,
      quiet_start: nextPreferences.quiet_start,
      quiet_end: nextPreferences.quiet_end,
      discreet_notifications: !!nextPreferences.discreet_notifications,
      nurturing_checkins: !!nextPreferences.nurturing_checkins,
      nickname_style: nextPreferences.nickname_style,
      large_text: !!nextPreferences.large_text,
      reduced_motion: !!nextPreferences.reduced_motion,
      high_contrast: !!nextPreferences.high_contrast,
      simple_mode: !!nextPreferences.simple_mode,
      pattern_insights_enabled: nextPreferences.pattern_insights_enabled !== false,
      gentle_streaks: !!nextPreferences.gentle_streaks,
      colorblind_mode: !!nextPreferences.colorblind_mode,
      notification_nudge_dismissed_at: nextPreferences.notification_nudge_dismissed_at || null,
      smart_reminder_hint_dismissed_at: nextPreferences.smart_reminder_hint_dismissed_at || null,
      dark_mode: !!nextPreferences.dark_mode,
      seen_features: nextPreferences.seen_features || [],
      dino_theme: !!nextPreferences.dino_theme,
      weekly_intention_intro_seen: !!nextPreferences.weekly_intention_intro_seen,
      focus_mode: !!nextPreferences.focus_mode,
      baby_voice: nextPreferences.baby_voice === "fatherly" ? "fatherly" : "motherly",
      beta_banner_dismissed: !!nextPreferences.beta_banner_dismissed,
      onboarding_reason: nextPreferences.onboarding_reason || null,
      task_group_order: Array.isArray(nextPreferences.task_group_order) ? nextPreferences.task_group_order : [],
      last_seen_changelog: nextPreferences.last_seen_changelog || "",
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("app_preferences").upsert(row, { onConflict: "user_id" });
    setSettingsMessage(error ? "Those settings couldn't be saved." : "Settings saved privately ✨");
  };

  // Opt-in, Android-only companion to connectWatch() above. Unlike the cloud
  // pairing flow, this needs no code: it opens a short window during which
  // the watch's own next attempt to reach this exact phone (loopback only,
  // never a real network) is trusted automatically, since only a watch
  // already Bluetooth-paired to this specific device could possibly reach
  // it at all. Cloud pairing above is untouched and keeps working the same
  // way regardless of whether this is ever used.
  const startLocalWatchSync = async () => {
    const WatchSyncBridge = window.Capacitor?.Plugins?.WatchSyncBridge;
    if (!WatchSyncBridge || !user || localWatchSyncBusy) return;
    setLocalWatchSyncBusy(true);
    setLocalWatchSyncMessage("Open PlushLife on your watch now — you have 2 minutes.");
    try {
      await WatchSyncBridge.startPairingMode();
    } catch (_error) {
      setLocalWatchSyncMessage("Couldn't enable instant local sync on this device.");
    } finally {
      setLocalWatchSyncBusy(false);
    }
  };

  const connectWatch = async () => {
    if (!user || watchPairingBusy) return;
    const code = watchPairingCode.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (code.length !== 8) {
      setWatchPairingMessage("Enter the 8-character code shown on your watch.");
      return;
    }
    setWatchPairingBusy(true);
    setWatchPairingMessage("Connecting your watch…");
    const { data: sessionData } = await supabase.auth.getSession();
    let data = null;
    let error = null;
    try {
      const response = await fetch("https://pvitdhixycegmcovapyh.supabase.co/functions/v1/watch-sync", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${sessionData.session?.access_token || ""}` },
        body: JSON.stringify({ action: "claim", pairing_code: code }),
      });
      data = await response.json();
      if (!response.ok) error = new Error(data?.error || "Pairing failed");
    } catch (requestError) {
      error = requestError;
    }
    setWatchPairingBusy(false);
    if (error || !data?.connected) {
      setWatchPairingMessage("That code is invalid or expired. Ask the watch for a new code and try again.");
      return;
    }
    setWatchPairingCode("");
    setWatchPairingMessage("Your watch is connected. Tap “I connected it” on the watch to load today’s tasks.");
  };

  const updatePreference = (patch) => {
    setPreferences((current) => {
      const next = { ...current, ...patch };
      savePreferences(next);
      return next;
    });
  };

  const markFeatureSeen = (id) => {
    if ((preferences.seen_features || []).includes(id)) return;
    updatePreference({ seen_features: [...(preferences.seen_features || []), id] });
  };

  const FeatureTip = ({ id, text }) => {
    if ((preferences.seen_features || []).includes(id)) return null;
    return (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 9, padding: "8px 10px", borderRadius: 10, background: "#FFF9E9", border: "1px solid #F0D99E" }}>
        <span style={{ fontSize: 11.5, lineHeight: 1.4, color: "#6B5A3D" }}>💡 {text}</span>
        <button type="button" onClick={() => markFeatureSeen(id)} aria-label="Dismiss tip" style={{ padding: "2px 6px", borderRadius: 7, border: "1px solid #F0D99E", background: "white", color: "#A56D14", fontWeight: 900, fontSize: 10.5, cursor: "pointer", flexShrink: 0 }}>Got it</button>
      </div>
    );
  };

  const saveDisplayName = async () => {
    if (!user) return;
    const displayName = displayNameDraft.trim().replace(/\s+/g, " ").slice(0, 40);
    if (!displayName) {
      setSettingsMessage("Please give your PlushLife a name first.");
      return;
    }
    setSettingsMessage("Saving your PlushLife name…");
    const row = {
      user_id: user.id,
      display_name: displayName,
      show_personal_schedule: !!trackerProfile?.show_personal_schedule,
      account_type: trackerProfile?.account_type || "little",
      comfort_item_name: comfortItemDraft.trim().replace(/\s+/g, " ").slice(0, 80),
      guardian_read_only: true,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from("tracker_profiles")
      .upsert(row, { onConflict: "user_id" })
      .select("display_name, show_personal_schedule, account_type")
      .single();
    if (error) {
      setSettingsMessage("That name couldn't be saved yet.");
      return;
    }
    setTrackerProfile(data);
    setDisplayNameDraft(data.display_name);
    setSettingsMessage(`${data.display_name}’s PlushLife is ready 💜`);
  };

  const saveComfortItem = async () => {
    if (!user) return;
    const displayName = (trackerProfile?.display_name || displayNameDraft).trim().replace(/\s+/g, " ").slice(0, 40);
    if (!displayName) {
      setSettingsMessage("Save your PlushLife name before adding a comfort item.");
      return;
    }
    setSettingsMessage("Saving comfort item…");
    const { data, error } = await supabase.from("tracker_profiles").upsert({
      user_id: user.id,
      display_name: displayName,
      comfort_item_name: comfortItemDraft.trim().replace(/\s+/g, " ").slice(0, 80),
      guardian_read_only: true,
      show_personal_schedule: !!trackerProfile?.show_personal_schedule,
      account_type: trackerProfile?.account_type || "little",
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" }).select("display_name, show_personal_schedule, account_type, comfort_item_name, guardian_read_only").single();
    if (error) {
      setSettingsMessage("That comfort item couldn’t be saved yet.");
      return;
    }
    setTrackerProfile(data);
    setComfortItemDraft(data.comfort_item_name || "");
    setSettingsMessage(data.comfort_item_name ? "Comfort item saved 💛" : "Comfort item cleared.");
  };

  const completeOnboarding = async () => {
    if (!user) return;
    const displayName = displayNameDraft.trim().replace(/\s+/g, " ").slice(0, 40);
    const guardianEmail = inviteEmail.trim().toLowerCase();
    if (!displayName) {
      setOnboardingMessage("Add your name first.");
      setOnboardingStep(1);
      return;
    }
    if (onboardingMode === "guardian" && (!guardianEmail || !guardianEmail.includes("@"))) {
      setOnboardingMessage("Add your guardian's email address first.");
      setOnboardingStep(2);
      return;
    }
    setOnboardingMessage("Saving your space…");
    const { data: profileData, error: profileError } = await supabase.from("tracker_profiles").upsert({
      user_id: user.id,
      display_name: displayName,
      comfort_item_name: comfortItemDraft.trim().replace(/\s+/g, " ").slice(0, 80),
      guardian_read_only: true,
      show_personal_schedule: false,
      account_type: onboardingMode === "supporter" ? "caretaker" : "little",
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" }).select("*").single();
    if (profileError) {
      setOnboardingMessage("Your space couldn't be saved yet. Please try again.");
      return;
    }
    if (onboardingMode === "guardian") {
      const rolePermissions = GUARDIAN_ROLE_PRESETS.find((role) => role.id === guardianRolePreset)?.permissions || GUARDIAN_ROLE_PRESETS[0].permissions;
      const { error: guardianLinkError } = await supabase.from("caregiver_links").upsert(
        { owner_user_id: user.id, caregiver_email: guardianEmail, label: "Guardian", active: true, ...rolePermissions },
        { onConflict: "owner_user_id,caregiver_email" }
      );
      if (guardianLinkError) {
        setOnboardingMessage("Your space is saved, but guardian access couldn't be added yet.");
        return;
      }
      const { error: guardianEmailError } = await supabase.auth.signInWithOtp({
        email: guardianEmail,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: window.location.origin + window.location.pathname,
        },
      });
      if (guardianEmailError) {
        setOnboardingMessage("Your guardian was added, but we couldn't send their email yet. Try again from Profile.");
        return;
      }
    }
    if (onboardingMode !== "supporter" && trackerTasks.length === 0) {
      const pack = TEMPLATE_PACKS.find((item) => item.id === selectedTemplateId) || TEMPLATE_PACKS[0];
      if (pack.tasks.length > 0) {
        const starterTasks = pack.tasks.map((item, index) => ({
          user_id: user.id, task_key: `starter-${Date.now()}-${index}`, day_id: "daily", section: item.section,
          task: item.task, detail: "", sort_order: index, is_bonus: false, schedule_type: "weekly",
        }));
        const { error: starterError } = await supabase.from("tracker_tasks").insert(starterTasks);
        if (!starterError) setTrackerTasks(starterTasks);
      }
    }
    let softError = null;
    const weeklyIntention = onboardingIntentionDraft.trim();
    if (onboardingMode !== "supporter" && weeklyIntention) {
      const { error: noteError } = await supabase.from("weekly_intentions").upsert({
        user_id: user.id,
        week_start: period.weekStart,
        body: weeklyIntention,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,week_start" });
      if (noteError) {
        softError = "Your space is saved, but your weekly intention couldn't be saved yet — you can add it again from PlushCalendar.";
      } else {
        setWeeklyIntentionText(weeklyIntention);
        setWeeklyIntentionHistory((entries) => [{ week_start: period.weekStart, body: weeklyIntention, updated_at: new Date().toISOString() }, ...entries.filter((entry) => entry.week_start !== period.weekStart)].sort((a, b) => b.week_start.localeCompare(a.week_start)));
      }
    }
    const reasonProfile = onboardingReason ? ONBOARDING_REASON_PROFILES[onboardingReason] : null;
    const previousPreferences = preferences;
    const next = {
      ...preferences,
      onboarding_complete: true,
      weekly_intention_intro_seen: true,
      onboarding_reason: onboardingReason,
      ...(reasonProfile?.preferences || {}),
    };
    setPreferences(next);
    const { error: preferencesError } = await supabase.from("app_preferences").upsert({ user_id: user.id, ...next, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (preferencesError) {
      // This flag controls whether onboarding shows again — a silent failure
      // here would mean it silently reappears next sign-in with no explanation.
      setPreferences(previousPreferences);
      setOnboardingMessage("Your space is saved, but your settings couldn't be saved yet. Please try again.");
      return;
    }
    if (onboardingReason === "burnout") {
      const recoveryCheckIn = {
        capacity: "low",
        mood: null,
        energy: "low",
        day_type: "recovery",
        support_preference: "comfort",
        soft_day: true,
        custom_essentials: null,
      };
      const { error: checkInError } = await supabase.from("daily_check_ins").upsert({
        user_id: user.id,
        check_date: period.date,
        ...recoveryCheckIn,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,check_date" });
      if (checkInError) {
        softError = "Your space is saved, but today's recovery check-in couldn't be saved yet.";
      } else {
        setDailyCheckIn(recoveryCheckIn);
        setDailyCheckInHistory((rows) => [
          ...rows.filter((row) => row.check_date !== period.date),
          { ...recoveryCheckIn, check_date: period.date },
        ].sort((a, b) => a.check_date.localeCompare(b.check_date)));
      }
    }
    supabase.from("onboarding_events").insert({ user_id: user.id, step: onboardingStep, onboarding_mode: onboardingMode, event: "completed" }).then(() => {});
    setTrackerProfile(profileData);
    setOnboardingMessage(softError || "");
    setOnboardingStep(0);
    if (onboardingMode === "supporter") {
      const firstSupportedOwner = invitedSupportLinks[0]?.owner_user_id;
      if (firstSupportedOwner) {
        setSupportViewMode("caretaker");
        await loadSupportOwner(firstSupportedOwner);
      } else {
        setSupportViewMode("mine");
      }
      setDashboard("guardian");
    }
  };

  const saveNativePushToken = async (token) => {
    if (!token) return false;
    const { error: subscriptionError } = await supabase.from("push_subscriptions").upsert({
      user_id: user.id,
      platform: "android",
      fcm_token: token,
      updated_at: new Date().toISOString(),
    }, { onConflict: "fcm_token" });
    return !subscriptionError;
  };

  const enableNativeNotifications = async () => {
    const PushNotifications = window.Capacitor?.Plugins?.PushNotifications;
    const NotificationPermission = window.Capacitor?.Plugins?.NotificationPermission;
    try {
      // PushNotifications.requestPermissions() routes through a Capacitor
      // core method (Bridge.getPermissionStates) with an open, unfixed
      // upstream bug (ionic-team/capacitor#8400) that throws a real native
      // NullPointerException — a full app crash, not a catchable JS error —
      // confirmed via Crashlytics stack traces on real releases. Our own
      // native plugin requests the same POST_NOTIFICATIONS permission
      // directly with Android's own API, sidestepping that code path
      // entirely. Falls back to the Capacitor call only if that plugin is
      // somehow unavailable (e.g. a stale cached build).
      const permission = NotificationPermission
        ? await NotificationPermission.requestPostNotifications()
        : await PushNotifications.requestPermissions().then((result) => ({ granted: result?.receive === "granted" }));
      if (!permission?.granted) {
        setSettingsMessage("Notifications are still off. You can allow them in this device's app settings.");
        return;
      }
      const next = { ...preferences, notifications_enabled: true };
      setPreferences(next);
      await savePreferences(next);
      if (window.__plushlifeNativePushToken) {
        await saveNativePushToken(window.__plushlifeNativePushToken);
        setSettingsMessage("Notifications are enabled on this device ✨");
      } else {
        // Token arrives asynchronously via the "registration" listener in the
        // native-shell script; the effect below picks it up once it lands.
        setSettingsMessage("Finishing setup on this device…");
      }
      await PushNotifications.register();
    } catch (error) {
      setSettingsMessage(`Couldn't finish setting up notifications on this device (${error?.message || "unknown error"}).`);
    }
  };

  useEffect(() => {
    if (!window.Capacitor?.isNativePlatform?.() || !user) return;
    const handler = () => {
      saveNativePushToken(window.__plushlifeNativePushToken).then((ok) => {
        if (ok) setSettingsMessage("Notifications are enabled on this device ✨");
      });
    };
    document.addEventListener("plushlife-native-push-token", handler);
    return () => document.removeEventListener("plushlife-native-push-token", handler);
  }, [user?.id]);

  // The WebView's content loads live from GitHub Pages regardless of which
  // native build is installed, so it has no way on its own to say which
  // native build (with which native fixes) is actually on the device —
  // @capacitor/app covers versionName/versionCode, and the small
  // BuildInfo plugin covers the exact commit that native build compiled
  // from, set by android-release.yml at CI build time.
  useEffect(() => {
    if (!window.Capacitor?.isNativePlatform?.()) return;
    Promise.all([
      window.Capacitor.Plugins.App?.getInfo?.().catch(() => null),
      window.Capacitor.Plugins.BuildInfo?.getInfo?.().catch(() => null),
    ]).then(([appInfo, buildInfo]) => {
      if (!appInfo) return;
      setNativeBuildInfo({ version: appInfo.version, build: appInfo.build, gitSha: buildInfo?.gitSha || "unknown" });
    });
  }, []);

  const enableNotifications = async () => {
    if (window.Capacitor?.isNativePlatform?.() && window.Capacitor?.Plugins?.PushNotifications) {
      return enableNativeNotifications();
    }
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setSettingsMessage("This browser doesn't support app notifications. On iPhone, you'll need to add PlushLife to your Home Screen first (Share → Add to Home Screen), then try again from there.");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setSettingsMessage("Notifications are still off. You can allow them in your phone's site settings.");
        return;
      }
      const next = { ...preferences, notifications_enabled: true };
      setPreferences(next);
      await savePreferences(next);
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      const subscriptionJson = subscription.toJSON();
      const { error: subscriptionError } = await supabase.from("push_subscriptions").upsert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscriptionJson.keys?.p256dh,
        auth: subscriptionJson.keys?.auth,
        updated_at: new Date().toISOString(),
      }, { onConflict: "endpoint" });
      if (subscriptionError) {
        setSettingsMessage(`Permission worked, but this device couldn't be registered: ${subscriptionError.message}`);
        return;
      }
      await registration.showNotification(voice.testNotifTitle, {
        body: preferences.discreet_notifications ? voice.testNotifBodyDiscreet : voice.testNotifBody,
        icon: "./icon.svg?v=2",
        badge: "./icon.svg?v=2",
        tag: "plushlist-test",
        data: { url: new URL("./", registration.scope).href },
      });
      setSettingsMessage("Notifications are enabled on this device, including when PlushLife is closed ✨");
    } catch (error) {
      setSettingsMessage(`Couldn't finish setting up notifications on this device (${error?.message || "unknown error"}).`);
    }
  };

  const signOutOtherDevices = async () => {
    if (!user) return;
    setSettingsMessage("Signing out your other devices…");
    // supabase.auth.signOut({ scope: "others" }) only invalidates the other
    // devices' sessions - it leaves their push_subscriptions rows in place,
    // so a lost/stolen/sold device would keep receiving this account's
    // reminders forever. Delete every subscription row except this device's
    // own, identified the same way handleSignOut identifies "this device".
    try {
      let currentEndpoint = null;
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        const subscription = await registration?.pushManager.getSubscription();
        currentEndpoint = subscription?.endpoint || null;
      }
      const currentFcmToken = window.__plushlifeNativePushToken || null;
      let deleteQuery = supabase.from("push_subscriptions").delete().eq("user_id", user.id);
      if (currentEndpoint) deleteQuery = deleteQuery.neq("endpoint", currentEndpoint);
      if (currentFcmToken) deleteQuery = deleteQuery.neq("fcm_token", currentFcmToken);
      await deleteQuery;
    } catch (_error) {}
    const { error } = await supabase.auth.signOut({ scope: "others" });
    setSettingsMessage(error ? "Other devices couldn't be signed out." : "Other sessions have been signed out. This device stays connected.");
  };

  const tryOpenNotificationNudge = (chance) => {
    if (!preferences.onboarding_complete || preferences.notifications_enabled || notificationNudgeOpen) return;
    const lastDismissed = preferences.notification_nudge_dismissed_at;
    const cooldownOk = !lastDismissed || (Date.now() - new Date(lastDismissed).getTime()) > 14 * 24 * 60 * 60 * 1000;
    if (!cooldownOk) return;
    if (Math.random() >= chance) return;
    const personalized = careDaysTotal >= 3
      ? `You've logged ${careDaysTotal} essential-care days. A quiet reminder can help on the days when remembering is hard.`
      : NOTIFICATION_NUDGE_REASONS[Math.floor(Math.random() * NOTIFICATION_NUDGE_REASONS.length)];
    setNotificationNudgeReason(personalized);
    setNotificationNudgeOpen(true);
  };

  useEffect(() => {
    tryOpenNotificationNudge(0.15);
  }, [preferences.onboarding_complete, preferences.notifications_enabled, preferences.notification_nudge_dismissed_at]);

  const dismissNotificationNudge = () => {
    setNotificationNudgeOpen(false);
    updatePreference({ notification_nudge_dismissed_at: new Date().toISOString() });
  };

  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const submitFeedback = async () => {
    const trimmed = feedbackText.trim();
    if (!trimmed) { setFeedbackMessage("Write a little something first 💛"); return; }
    setFeedbackMessage("Sending…");
    const { error } = await supabase.from("feedback_messages").insert({
      user_id: user?.id || null,
      message: trimmed.slice(0, 2000),
    });
    if (error) {
      setFeedbackMessage(`Couldn't send that: ${error.message}`);
      return;
    }
    setFeedbackText("");
    setFeedbackMessage("Thank you — this was sent 💛");
  };

  const [adminOpen, setAdminOpen] = useState(false);
  // Admin-only, session-local simulation of a future PlushPlus plan — never
  // persisted, never read by any real feature check (PLUSH_ENFORCE_ENTITLEMENTS
  // stays false), purely so the preview panel below can show what
  // hasPlushFeature() would return under each plan once billing is real.
  const [devPreviewPlan, setDevPreviewPlan] = useState(null);
  const [adminFeedback, setAdminFeedback] = useState([]);
  const [adminErrors, setAdminErrors] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [adminOnline, setAdminOnline] = useState(0);
  const [adminFunnel, setAdminFunnel] = useState(null);
  const [adminMessage, setAdminMessage] = useState("");
  const [supporterEmailDraft, setSupporterEmailDraft] = useState("");
  const [supporterGrantMessage, setSupporterGrantMessage] = useState("");
  const [reviewAccountRole, setReviewAccountRole] = useState("cozy");
  const [reviewAccountEmail, setReviewAccountEmail] = useState("");
  const [reviewAccountPassword, setReviewAccountPassword] = useState("");
  const [reviewAccountMessage, setReviewAccountMessage] = useState("");

  const createOrUpdateReviewAccount = async () => {
    const email = reviewAccountEmail.trim().toLowerCase();
    const password = reviewAccountPassword;
    if (!email || !email.includes("@")) {
      setReviewAccountMessage("Enter a valid email first.");
      return;
    }
    if (password.length < 8) {
      setReviewAccountMessage("Password must be at least 8 characters.");
      return;
    }
    setReviewAccountMessage("Saving…");
    const { data, error } = await supabase.functions.invoke("manage-review-account", {
      body: { role: reviewAccountRole, email, password },
    });
    if (error || data?.error) {
      setReviewAccountMessage(`Couldn't save: ${data?.error || error?.message}`);
      return;
    }
    setReviewAccountMessage(`${data.status === "created" ? "Created" : "Updated"} the ${reviewAccountRole} review account.`);
    setReviewAccountPassword("");
  };

  const setSupporterStatus = async (grant) => {
    const email = supporterEmailDraft.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      setSupporterGrantMessage("Enter a valid email first.");
      return;
    }
    setSupporterGrantMessage("Updating…");
    const { error } = await supabase.rpc("admin_set_supporter_status", { target_email: email, new_value: grant });
    if (error) {
      setSupporterGrantMessage(`Couldn't update: ${error.message}`);
      return;
    }
    setSupporterGrantMessage(`${email} is now ${grant ? "a Supporter 🌟" : "on the free plan"}.`);
  };

  const loadAdminData = async () => {
    if (!isAdminUser) return;
    setAdminMessage("Loading…");
    const onlineSince = new Date(Date.now() - 5 * 60000).toISOString();
    const [feedbackRes, errorsRes, statsRes, onlineRes, funnelRes] = await Promise.all([
      supabase.from("feedback_messages").select("id, email, message, resolved, created_at").order("created_at", { ascending: false }),
      supabase.from("app_error_logs").select("id, message, stack, url, user_id, created_at").order("created_at", { ascending: false }).limit(100),
      supabase.rpc("admin_dashboard_stats"),
      supabase.from("user_presence").select("user_id", { count: "exact", head: true }).gte("last_active_at", onlineSince),
      supabase.rpc("admin_onboarding_funnel"),
    ]);
    setAdminFeedback(feedbackRes.data || []);
    setAdminErrors(errorsRes.data || []);
    setAdminStats(statsRes.data || null);
    setAdminOnline(onlineRes.count || 0);
    setAdminFunnel(funnelRes.data || null);
    setAdminMessage(feedbackRes.error || errorsRes.error || statsRes.error || onlineRes.error ? "Some admin data couldn't load." : "");
  };

  const clearAllErrors = async () => {
    if (!window.confirm(`Permanently delete all ${adminErrors.length} error log entries?`)) return;
    setAdminMessage("Clearing errors…");
    const { error } = await supabase.from("app_error_logs").delete().not("id", "is", null);
    if (error) {
      setAdminMessage(`Couldn't clear errors: ${error.message}`);
      return;
    }
    setAdminErrors([]);
    setAdminMessage("Error logs cleared ✨");
  };

  const resolveFeedback = async (item) => {
    setAdminFeedback((items) => items.filter((entry) => entry.id !== item.id));
    const { error } = await supabase.from("feedback_messages").delete().eq("id", item.id);
    if (error) {
      setAdminMessage(`Couldn't delete that message: ${error.message}`);
      setAdminFeedback((items) => [...items, item].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    }
  };

  const exportMyData = async () => {
    if (!user) return;
    setSettingsMessage("Preparing your data for download…");
    try {
      const [
        profileRes, prefsRes, tasksRes, schedulesRes, notesRes, dailyRes, checkInsRes, careRes, pathsRes,
        supportRequestsRes, achievementsRes, restDaysRes, weeklyIntentionRes, weeklyIntentionsRes, taskCompletionRes,
        caregiverLinksRes, supportNotesRes, supportRewardsRes, taskSuggestionsRes, mommyChatsRes,
      ] = await Promise.all([
        supabase.from("tracker_profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("app_preferences").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("tracker_tasks").select("*").eq("user_id", user.id),
        supabase.from("tracker_schedules").select("*").eq("user_id", user.id),
        supabase.from("private_notes").select("*").eq("user_id", user.id),
        supabase.from("daily_progress").select("*").eq("user_id", user.id),
        supabase.from("daily_check_ins").select("*").eq("user_id", user.id),
        supabase.from("care_session_logs").select("*").eq("user_id", user.id),
        supabase.from("plush_path_progress").select("*").eq("user_id", user.id),
        supabase.from("guardian_support_requests").select("*").eq("owner_user_id", user.id),
        supabase.from("user_achievements").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("rest_days").select("*").eq("user_id", user.id),
        supabase.from("weekly_intention_checkins").select("*").eq("user_id", user.id),
        supabase.from("weekly_intentions").select("*").eq("user_id", user.id),
        supabase.from("tracker_progress").select("*").eq("user_id", user.id),
        supabase.from("caregiver_links").select("*").eq("owner_user_id", user.id),
        supabase.from("support_notes").select("*").or(`owner_user_id.eq.${user.id},caregiver_user_id.eq.${user.id}`),
        supabase.from("support_rewards").select("*").or(`owner_user_id.eq.${user.id},caregiver_user_id.eq.${user.id}`),
        supabase.from("task_suggestions").select("*").or(`owner_user_id.eq.${user.id},caregiver_user_id.eq.${user.id}`),
        supabase.from("mommy_chat_threads").select("*").eq("user_id", user.id),
      ]);
      const payload = {
        exported_at: new Date().toISOString(),
        account_email: user.email,
        profile: profileRes.data || null,
        preferences: prefsRes.data || null,
        tasks: tasksRes.data || [],
        schedules: schedulesRes.data || [],
        private_reflections: notesRes.data || [],
        daily_progress: dailyRes.data || [],
        mood_and_energy_check_ins: checkInsRes.data || [],
        care_session_history: careRes.data || [],
        plush_path_progress: pathsRes.data || [],
        guardian_support_requests: supportRequestsRes.data || [],
        achievements: achievementsRes.data || null,
        rest_days: restDaysRes.data || [],
        weekly_intention_checkins: weeklyIntentionRes.data || [],
        weekly_intentions: weeklyIntentionsRes.data || [],
        task_completion_history: taskCompletionRes.data || [],
        guardian_connections: caregiverLinksRes.data || [],
        guardian_notes: supportNotesRes.data || [],
        guardian_rewards: supportRewardsRes.data || [],
        guardian_task_suggestions: taskSuggestionsRes.data || [],
        private_mommy_chats: mommyChatsRes.data || [],
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `plushlist-export-${period.date}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setSettingsMessage("Your data has been downloaded ✨");
    } catch (exportError) {
      setSettingsMessage(`Couldn't prepare your download: ${exportError?.message || "unknown error"}`);
    }
  };

  const restoreFromBackup = async (file) => {
    if (!user || !file) return;
    setSettingsMessage("Reading your backup file…");
    let payload;
    try {
      payload = JSON.parse(await file.text());
    } catch {
      setSettingsMessage("That file doesn't look like a PlushLife backup (couldn't read it as JSON).");
      return;
    }
    if (!payload || typeof payload !== "object" || !payload.exported_at) {
      setSettingsMessage("That file doesn't look like a PlushLife backup export.");
      return;
    }
    const restorePreview = RESTORABLE_DATA_TABLES.map((spec) => {
      const raw = payload[spec.payloadKey];
      const count = spec.single ? (raw ? 1 : 0) : (Array.isArray(raw) ? raw.length : 0);
      return { label: spec.payloadKey.replace(/_/g, " "), count };
    }).filter((item) => item.count > 0);
    const totalRecords = restorePreview.reduce((sum, item) => sum + item.count, 0);
    const categorySummary = restorePreview.slice(0, 10).map((item) => "• " + item.label + ": " + item.count).join("\n");
    const extraCategories = restorePreview.length > 10 ? "\n• +" + (restorePreview.length - 10) + " more categories" : "";
    const previewText = "Restore preview\n\n" + (categorySummary || "No independently restorable records found") + extraCategories + "\n\n" + totalRecords + " record" + (totalRecords === 1 ? "" : "s") + " would be added or updated. Existing cloud records are not bulk-deleted. A fresh on-device Safety copy will be created before restoring. Guardian connections are not restored.";
    if (!window.confirm(previewText)) return;
    setSettingsMessage("Creating a Safety copy before restoring…");
    try {
      const safetyStatus = await createDeviceBackup(supabase, user);
      setDeviceBackupStatus(safetyStatus);
    } catch (_error) {
      setSettingsMessage("Restore stopped because PlushLife could not create a Safety copy first. Nothing was changed.");
      return;
    }
    setSettingsMessage("Safety copy created before restoring. Restoring your backup…");
    const restoredTables = [];
    const failedTables = [];
    for (const spec of RESTORABLE_DATA_TABLES) {
      const raw = payload[spec.payloadKey];
      const rows = spec.single ? (raw ? [raw] : []) : (Array.isArray(raw) ? raw : []);
      if (rows.length === 0) continue;
      const prepared = rows.map((row) => {
        const clean = { ...row, user_id: user.id };
        if (spec.stripId) delete clean.id;
        return clean;
      });
      const { error } = spec.onConflict
        ? await supabase.from(spec.table).upsert(prepared, { onConflict: spec.onConflict })
        : await supabase.from(spec.table).insert(prepared);
      if (error) failedTables.push(spec.table); else restoredTables.push(spec.table);
    }
    if (failedTables.length === 0 && restoredTables.length === 0) {
      setSettingsMessage("That backup didn't have any of your own data to restore.");
      return;
    }
    setSettingsMessage(
      failedTables.length === 0
        ? `Backup restored ✨ (${restoredTables.length} categories). Reloading… Guardian connections need to be re-invited if you had any.`
        : `Restored ${restoredTables.length} categories, but ${failedTables.length} had trouble (${failedTables.join(", ")}). Reloading…`
    );
    setTimeout(() => window.location.reload(), 1600);
  };

  const deleteAllCheckIns = async () => {
    if (!user) return;
    if (!window.confirm("Permanently delete all your mood & energy check-in history? This can't be undone, but your tasks, routines, and account stay exactly as they are.")) return;
    setSettingsMessage("Deleting your check-in history…");
    const { error } = await supabase.from("daily_check_ins").delete().eq("user_id", user.id);
    setSettingsMessage(error ? `Couldn't delete check-ins: ${error.message}` : "All mood & energy check-ins have been deleted.");
  };

  const deleteAllReflections = async () => {
    if (!user) return;
    if (!window.confirm("Permanently delete all your private reflections? This can't be undone, but your tasks, routines, and account stay exactly as they are.")) return;
    setSettingsMessage("Deleting your reflections…");
    const { error } = await supabase.from("private_notes").delete().eq("user_id", user.id);
    setSettingsMessage(error ? `Couldn't delete reflections: ${error.message}` : "All private reflections have been deleted.");
  };

  const requestEmailChange = async () => {
    if (!user) return;
    const nextEmail = emailChangeDraft.trim().toLowerCase();
    if (!nextEmail || !nextEmail.includes("@")) {
      setSettingsMessage("Enter a valid new email address.");
      return;
    }
    if (nextEmail === (user.email || "").toLowerCase()) {
      setSettingsMessage("That is already your account email.");
      return;
    }
    setSettingsMessage("Sending confirmation links to both email addresses…");
    const { error } = await supabase.auth.updateUser(
      { email: nextEmail },
      { emailRedirectTo: window.location.origin + window.location.pathname }
    );
    if (error) {
      setSettingsMessage("We couldn't start that email change. Check the address and try again.");
      return;
    }
    setEmailChangeDraft("");
    setSettingsMessage("Check both your current and new inboxes. Open both confirmation links to finish changing your email.");
  };

  const deleteMyAccount = async () => {
    const confirmation = window.prompt("This permanently deletes your PlushLife account, tasks, progress, schedules, and private reflections. Type DELETE MY ACCOUNT to continue.");
    if (confirmation !== "DELETE MY ACCOUNT") {
      setSettingsMessage("Account deletion was cancelled.");
      return;
    }
    setSettingsMessage("Permanently deleting your account…");
    const { error } = await supabase.functions.invoke("delete-my-account", { body: { confirmation: true } });
    if (error) {
      setSettingsMessage("Your account was not deleted. Please try again.");
      return;
    }
    await supabase.auth.signOut({ scope: "local" });
    window.localStorage.removeItem(SUPABASE_AUTH_STORAGE_KEY);
    window.Capacitor?.Plugins?.WidgetBridge?.clearWidget().catch(() => {});
    window.location.replace(window.location.origin + window.location.pathname);
  };

  const COPING_OPTIONS_TAGGED = [
    { text: "Put distance between me and the urge", times: ["any"] },
    { text: "Hold Tigger or a pillow 🐯", times: ["any"] },
    { text: "Name 5 things I can see, 4 I can touch, 3 I can hear", times: ["any"] },
    { text: "Splash cold water on my face or hands", times: ["morning", "midday", "afternoon"] },
    { text: "Step outside for one minute of air", times: ["morning", "midday", "afternoon"] },
    { text: "Text or call someone and say I'm struggling", times: ["any"] },
    { text: "Put on one song and just listen to it fully", times: ["any"] },
    { text: "Squeeze something tight for 10 seconds, then let go", times: ["any"] },
    { text: "Wrap up in a blanket and just breathe for a minute", times: ["evening", "night"] },
    { text: "Take a sip of water", times: ["any"] },
    { text: "Get somewhere soft and comfortable", times: ["evening", "night"] },
    { text: "Hold Tigger for a minute", times: ["any"] },
    { text: "Put on a calming sound", times: ["evening", "night"] },
    { text: "Take three slow breaths", times: ["any"] },
    { text: "Step into fresh air", times: ["morning", "midday", "afternoon"] },
    { text: "Sit with your feet on the floor and notice the support beneath you", times: ["any"] },
    { text: "Wash your hands with warm water", times: ["any"] },
    { text: "Look at something soft or familiar", times: ["night"] },
    { text: "Open a window or change rooms for a moment", times: ["morning", "midday", "afternoon"] },
    { text: "Write one sentence about what you need right now", times: ["any"] },
    { text: "Choose one tiny task you can finish in two minutes", times: ["morning", "midday", "afternoon"] },
  ];
  const COPING_OPTIONS = COPING_OPTIONS_TAGGED.map((item) => item.text);
  const deviceHour = new Date().getHours();
  const deviceTimeOfDay = deviceHour >= 5 && deviceHour < 11 ? "morning"
    : deviceHour >= 11 && deviceHour < 14 ? "midday"
    : deviceHour >= 14 && deviceHour < 18 ? "afternoon"
    : deviceHour >= 18 && deviceHour < 22 ? "evening"
    : "night";
  const timeFittingIndexes = COPING_OPTIONS_TAGGED
    .map((item, index) => ({ index, fits: item.times.includes("any") || item.times.includes(deviceTimeOfDay) }))
    .filter((item) => item.fits)
    .map((item) => item.index);
  const pickCopingIndex = (excludeIndex) => {
    const pool = timeFittingIndexes.length ? timeFittingIndexes : COPING_OPTIONS.map((_, index) => index);
    const options = pool.filter((index) => index !== excludeIndex);
    const finalPool = options.length ? options : pool;
    return finalPool[Math.floor(Math.random() * finalPool.length)];
  };
  const [copingPick, setCopingPick] = useState(() => pickCopingIndex(null));
  const reshuffle = () => setCopingPick((p) => pickCopingIndex(p));

  const isHistoricalView = selectedProgressDate !== period.date;
  const isFutureView = selectedProgressDate > period.date;
  const selectedProgressDayId = dayIdForDate(selectedProgressDate);
  const historicalDay = ALL.find((item) => item.id === selectedProgressDayId) || DAILY;
  const day = isHistoricalView
    ? { ...historicalDay, title: `${new Date(`${selectedProgressDate}T12:00:00`).toLocaleDateString("en-US", { weekday: "long" })} history` }
    : ALL.find((item) => item.id === active);
  const scheduleDayId = isHistoricalView ? selectedProgressDayId : (active === "daily" ? dayIdForDate(period.date) : active);
  const scheduleEditingDayId = scheduleEditDayId || scheduleDayId;
  // Tasks is a week-aware view: Today stays the default, while the same
  // selectedProgressDate pipeline can safely preview the rest of this week.
  // Existing toggle() guards already prevent completing future tasks.
  const taskWeekDates = Array.from({ length: 7 }, (_, index) => offsetDate(period.weekStart, index));
  const selectedTaskViewIsRest = !isHistoricalView && dailyCheckIn.day_type === "rest";
  const selectedTaskDateLabel = new Date(`${selectedProgressDate}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
  const selectTaskPreviewDate = (date) => {
    setSelectedProgressDate(date);
    setActive(dayIdForDate(date));
    setFocusHelperOpen(false);
    setFocusSuggestionKey(null);
  };
  const reflectionPrompt = reflectionPromptForDay(day.id, selectedProgressDate, day.reflect);
  const journalQuickPrompt = reflectionPromptForDay(dayIdForDate(journalQuickOpenDate), journalQuickOpenDate, "What would you like to reflect on?");
  const journalDisplayedPrompt = privateNotePrompt || journalQuickPrompt;
  const journalPromptToSave = privateNotePrompt || journalQuickPrompt;
  const openJournalForSelectedDate = () => {
    setJournalQuickOpenDate(selectedProgressDate);
    setPrivateNoteDraft(privateNote);
    setPrivateNoteMessage("");
    setJournalQuickOpen(true);
  };
  const openTodayJournal = async () => {
    if (!user) return;
    const { data, error } = await supabase.from("private_notes").select("body, prompt").eq("user_id", user.id).eq("note_date", period.date).maybeSingle();
    const body = error ? "" : (data?.body || "");
    setPrivateNote(body);
    setPrivateNotePrompt(error ? "" : (data?.prompt || ""));
    setJournalQuickOpenDate(period.date);
    setPrivateNoteDraft(body);
    setPrivateNoteMessage(error ? "Couldn't load today's private note." : "");
    setPrivateNoteEditing(false);
    setDailyJournalPromptOpen(false);
    setJournalQuickOpen(true);
  };
  const reflectionMonthDate = new Date(`${reflectionCalendarMonth}-01T12:00:00Z`);
  const reflectionMonthStart = (reflectionMonthDate.getUTCDay() + 6) % 7;
  const reflectionMonthDays = new Date(Date.UTC(reflectionMonthDate.getUTCFullYear(), reflectionMonthDate.getUTCMonth() + 1, 0)).getUTCDate();
  const reflectionDateSet = new Set(reflectionDates);
  const selectedSchedule = personalSchedules.find((item) => item.day_id === scheduleDayId) || null;
  const selectedScheduleDate = isHistoricalView ? selectedProgressDate : period.date;
  const selectedScheduleExceptionEntries = scheduleExceptions
    .filter((item) => item.start_date <= selectedScheduleDate && item.end_date >= selectedScheduleDate)
    .flatMap((item) => (item.entries || []).map((entry) => ({ ...entry, isException: true })));
  const historicalEntry = weeklyHistory.find((entry) => entry.progress_date === selectedProgressDate);
  const historicalDoneKeys = new Set(historicalEntry?.completed_keys || []);
  const viewDone = isHistoricalView
    ? Object.fromEntries([...historicalDoneKeys].map((key) => [key, true]))
    : done;

  useEffect(() => {
    if (dashboard !== "today") return;
    setActive(dayIdForDate(period.date));
    setSelectedProgressDate(period.date);
  }, [dashboard, period.date]);

  useEffect(() => {
    if (!manageSchedule) return;
    setScheduleEditDayId(scheduleDayId);
    setScheduleExceptionDraft((draft) => draft.start_date ? draft : { ...draft, start_date: period.date, end_date: period.date });
    setScheduleExceptionMessage("");
  }, [manageSchedule]);

  useEffect(() => {
    const editingSchedule = personalSchedules.find((item) => item.day_id === scheduleEditingDayId) || null;
    const entries = editingSchedule?.entries?.length
      ? editingSchedule.entries.map((entry, index) => ({ id: entry.id || `saved-${index}`, time: entry.time || "", text: entry.text || "" }))
      : legacyScheduleToEntries(editingSchedule);
    setScheduleDraft({ entries });
    setScheduleMessage("");
    setCopyToDayIds([]);
  }, [scheduleEditingDayId, personalSchedules]);

  const syncNow = async () => {
    if (!user) return;
    if (!navigator.onLine) {
      setOnline(false);
      setSyncStatus("offline");
      return;
    }
    setOnline(true);
    setSyncStatus("syncing");
    const { data, error } = await supabase
      .from("daily_progress")
      .select("completed_keys, updated_at")
      .eq("user_id", user.id)
      .eq("progress_date", period.date)
      .maybeSingle();
    if (error) {
      setSyncStatus("error");
      return;
    }
    const completedKeys = data?.completed_keys || [];
    setDone(Object.fromEntries(completedKeys.map((key) => [key, true])));
    setWeeklyHistory((entries) => [
      ...entries.filter((entry) => entry.progress_date !== period.date),
      { progress_date: period.date, completed_keys: completedKeys },
    ]);
    setHabitHistory((entries) => [
      ...entries.filter((entry) => entry.progress_date !== period.date),
      { progress_date: period.date, completed_keys: completedKeys },
    ]);
    setLastSyncedAt(data?.updated_at || new Date().toISOString());
    setSyncStatus("ready");
  };

  const toggle = (key, targetDate = selectedProgressDate) => {
    if (!user || targetDate > period.date) return;
    if (targetDate !== period.date) {
      const dateDoneKeys = targetDate === selectedProgressDate
        ? new Set(longHistoryByDate.get(targetDate) || historicalDoneKeys)
        : new Set((longHistoryByDate.get(targetDate) || weeklyHistory.find((entry) => entry.progress_date === targetDate)?.completed_keys || []));
      const nextKeys = new Set(dateDoneKeys);
      if (nextKeys.has(key)) nextKeys.delete(key);
      else { nextKeys.add(key); triggerCelebrate(key); }
      const completedKeys = [...nextKeys];
      const previousHistory = [...weeklyHistory];
      const previousLongHistory = [...longHistory];
      const previousHabitHistory = [...habitHistory];
      setWeeklyHistory((entries) => [
        ...entries.filter((entry) => entry.progress_date !== targetDate),
        { progress_date: targetDate, completed_keys: completedKeys },
      ]);
      setLongHistory((entries) => [
        ...entries.filter((entry) => entry.progress_date !== targetDate),
        { progress_date: targetDate, completed_keys: completedKeys },
      ]);
      setHabitHistory((entries) => [
        ...entries.filter((entry) => entry.progress_date !== targetDate),
        { progress_date: targetDate, completed_keys: completedKeys },
      ]);
      setSyncStatus("syncing");
      supabase.from("daily_progress").upsert({
        user_id: user.id,
        progress_date: targetDate,
        completed_keys: completedKeys,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,progress_date" }).then(({ error }) => {
        if (error) {
          if (!navigator.onLine) {
            pendingQueueRef.current.push({ progressDate: targetDate, completedKeys, taskKey: null, completed: null });
            try { window.localStorage.setItem(`plushlist-pending-${user.id}`, JSON.stringify(pendingQueueRef.current)); } catch (_error) {}
            setSyncStatus("offline");
            return;
          }
          setWeeklyHistory(previousHistory);
          setLongHistory(previousLongHistory);
          setHabitHistory(previousHabitHistory);
          setSyncStatus("error");
          return;
        }
        setSyncStatus("ready");
        setLastSyncedAt(new Date().toISOString());
      });
      return;
    }

    const next = !done[key];
    if (next) triggerCelebrate(key);
    if (next && taskSnoozes.some((item) => item.task_key === key)) clearTaskSnooze(key);
    const previousDone = { ...done };
    const nextDone = { ...done, [key]: next };
    if (!next) delete nextDone[key];
    const completedKeys = Object.keys(nextDone).filter((taskKey) => nextDone[taskKey]);
    setDone(nextDone);
    setWeeklyHistory((entries) => [
      ...entries.filter((entry) => entry.progress_date !== period.date),
      { progress_date: period.date, completed_keys: completedKeys },
    ]);
    setHabitHistory((entries) => [
      ...entries.filter((entry) => entry.progress_date !== period.date),
      { progress_date: period.date, completed_keys: completedKeys },
    ]);
    setSyncStatus("syncing");
    Promise.all([
      supabase.from("tracker_progress").upsert(
        { user_id: user.id, task_key: key, completed: next, updated_at: new Date().toISOString() },
        { onConflict: "user_id,task_key" }
      ),
      supabase.from("daily_progress").upsert({
        user_id: user.id,
        progress_date: period.date,
        completed_keys: completedKeys,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,progress_date" }),
    ]).then(([legacyResult, dailyResult]) => {
        if (legacyResult.error || dailyResult.error) {
          if (!navigator.onLine) {
            pendingQueueRef.current.push({ progressDate: period.date, completedKeys, taskKey: key, completed: next });
            try { window.localStorage.setItem(`plushlist-pending-${user.id}`, JSON.stringify(pendingQueueRef.current)); } catch (_error) {}
            setSyncStatus("offline");
            return;
          }
          setDone(previousDone);
          setWeeklyHistory((entries) => [
            ...entries.filter((entry) => entry.progress_date !== period.date),
            { progress_date: period.date, completed_keys: Object.keys(previousDone).filter((taskKey) => previousDone[taskKey]) },
          ]);
          setHabitHistory((entries) => [
            ...entries.filter((entry) => entry.progress_date !== period.date),
            { progress_date: period.date, completed_keys: Object.keys(previousDone).filter((taskKey) => previousDone[taskKey]) },
          ]);
          setSyncStatus("error");
          return;
        }
        setSyncStatus("ready");
        setLastSyncedAt(new Date().toISOString());
      });
  };

  // Normalize an item — either a plain string, or { label, how } for expandable ones
  const norm = (it) => (typeof it === "string" ? { label: it, how: null } : it);

  const rowForTask = (task) => {
    const cleanDetail = cleanTaskDetail(task.detail || "");
    const selectedDayType = dailyCheckIn.day_type || (dailyCheckIn.soft_day ? "soft" : "full");
    const adaptiveLabel = selectedDayType === "tiny"
      ? (task.tiny_label || task.soft_label || task.task)
      : selectedDayType === "recovery"
        ? (task.soft_label || task.tiny_label || task.task)
      : selectedDayType === "soft"
        ? (task.soft_label || task.task)
        : task.task;
    return {
      sourceTask: task,
      key: task.task_key,
      label: adaptiveLabel,
      originalLabel: task.task,
      dayType: selectedDayType,
      how: cleanDetail || null,
      why: task.why_note || null,
      right: task.day_id === "daily" || !cleanDetail || cleanDetail.length > 40 ? null : cleanDetail,
      section: task.section,
      // True "every day" tasks (day_id "daily", or schedule_days covering
      // all 7 days) get grouped under one "Daily" header below, distinct
      // from this-list's-own section — otherwise they were indistinguishable
      // from a today-only task that just happens to share the same section.
      isEveryday: false,
      isBonus: taskIsOptional(task),
      habitType: habitTypeForTask(task),
    };
  };

  // PlushPause: paused_since/paused_until are a stored date range rather than
  // a live boolean, specifically so that resuming a task only ever caps the
  // range going forward (sets paused_until to yesterday) instead of clearing
  // it - clearing it outright would make isTaskPausedOnDate retroactively
  // return false for the days it WAS paused, silently rewriting how those
  // already-recorded days look in Progress after the fact.
  const isTaskPausedOnDate = (task, date) => {
    if (!task.paused_since) return false;
    if (date < task.paused_since) return false;
    if (task.paused_until && date > task.paused_until) return false;
    return true;
  };

  // Build this signed-in user's private rows for the selected day.
  const scheduledTasksForView = trackerTasks
    .filter((task) => taskIsScheduledForDate(task, selectedProgressDate))
    .sort((a, b) => {
      if (a.day_id !== b.day_id) return a.day_id === "daily" ? -1 : b.day_id === "daily" ? 1 : 0;
      return a.sort_order - b.sort_order;
    });
  // Keep every saved section contiguous and honor the user's saved group order.
  // New groups that have not been positioned yet retain their first-seen order.
  const taskSectionOrder = new Map(taskGroupOrder.map((section, index) => [section, index]));
  scheduledTasksForView.forEach((task) => {
    const sectionKey = task.section || "MY TASKS";
    if (!taskSectionOrder.has(sectionKey)) taskSectionOrder.set(sectionKey, taskSectionOrder.size);
  });
  const rows = scheduledTasksForView
    .sort((a, b) => {
      const aSection = a.section || "MY TASKS";
      const bSection = b.section || "MY TASKS";
      const sectionDelta = taskSectionOrder.get(aSection) - taskSectionOrder.get(bSection);
      if (sectionDelta) return sectionDelta;
      return (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0) || a.task_key.localeCompare(b.task_key);
    })
    .map(rowForTask);
  useEffect(() => {
    if (!user || !window.PlushLifeNativeNotifications) return;
    const taskReminders = trackerTasks
      .filter((task) => !task.archived_at && task.reminder_time && !isTaskPausedOnDate(task, period.date))
      .map((task) => ({
        taskKey: task.task_key,
        label: task.task,
        time: String(task.reminder_time).slice(0, 5),
        scheduleDays: Array.isArray(task.schedule_days) && task.schedule_days.length
          ? task.schedule_days
          : (task.day_id === "daily" ? [] : [task.day_id]),
      }));
    window.PlushLifeNativeNotifications.syncDailyReminders({
      enabled: !!preferences.notifications_enabled,
      times: preferences.reminder_times || [],
      discreet: !!preferences.discreet_notifications,
      restDates,
      taskReminders,
    }).catch(() => {});
  }, [user?.id, preferences.notifications_enabled, preferences.discreet_notifications, JSON.stringify(preferences.reminder_times || []), JSON.stringify(restDates), JSON.stringify(trackerTasks.map((task) => [task.task_key, task.archived_at, task.reminder_time, task.schedule_days, task.day_id]))]);
  const doneCount = rows.filter((r) => viewDone[r.key]).length;
  const requiredRows = rows.filter((row) => !row.isBonus);
  const optionalRows = rows.filter((row) => row.isBonus);
  const requiredDoneCount = requiredRows.filter((row) => viewDone[row.key]).length;
  const optionalDoneCount = optionalRows.filter((row) => viewDone[row.key]).length;
  const pct = requiredRows.length ? Math.round((requiredDoneCount / requiredRows.length) * 100) : 0;
  // Hoisted so the "Feeling stuck?" helper further down can tell whether the
  // One Next Step card is already showing this same single-task suggestion,
  // instead of duplicating it right underneath.
  const nextStepEssentialPool = dailyCheckIn.custom_essentials?.length
    ? rows.filter((r) => dailyCheckIn.custom_essentials.includes(r.key))
    : requiredRows;
  // Reduces the whole list to one thing when capacity is genuinely low —
  // not needed on a Full day, where seeing the real list is the point.
  const nextStepTask = dailyCheckIn.day_type === "soft" && !nextStepDismissedToday
    ? nextStepEssentialPool.find((r) => !viewDone[r.key] && !nextStepSkipped.includes(r.key))
    : null;
  // The helper always offers an unfinished required task from the date you're currently viewing.
  const focusChoices = trackerTasks
    .filter((task) =>
      taskIsScheduledForDate(task, selectedProgressDate) &&
      !taskIsOptional(task) &&
      !viewDone[task.task_key]
    )
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((task) => ({
      key: task.task_key,
      label: task.task,
      how: cleanTaskDetail(task.detail || "") || null,
      why: task.why_note || null,
      sourceTask: task,
    }));
  const focusedEssential = focusChoices.find((choice) => choice.key === focusSuggestionKey) || null;
  const pickRandomFocusTask = () => {
    if (!focusChoices.length) {
      setFocusSuggestionKey(null);
      setFocusHelperOpen(true);
      return;
    }
    const alternatives = focusChoices.filter((choice) => choice.key !== focusSuggestionKey);
    const pool = alternatives.length ? alternatives : focusChoices;
    const picked = pool[Math.floor(Math.random() * pool.length)];
    setFocusSuggestionKey(picked.key);
    setFocusHelperOpen(true);
  };

  const historyByDate = React.useMemo(() => new Map(
    weeklyHistory.map((entry) => [entry.progress_date, new Set(entry.completed_keys || [])])
  ), [weeklyHistory]);
  const habitHistoryByDate = React.useMemo(() => {
    const map = new Map(
      habitHistory.map((entry) => [entry.progress_date, new Set(entry.completed_keys || [])])
    );
    map.set(period.date, new Set(Object.keys(done).filter((key) => done[key])));
    return map;
  }, [habitHistory, period.date, done]);
  const taskIsExpectedOnDate = (task, date) => taskIsScheduledForDate(task, date);
  const habitStatsForTask = (task) => {
    const firstHistoryDate = habitHistory.length
      ? habitHistory.reduce((earliest, entry) => entry.progress_date < earliest ? entry.progress_date : earliest, period.date)
      : period.date;
    let best = 0;
    let running = 0;
    let total = 0;
    let cursor = firstHistoryDate;
    let guard = 0;
    while (cursor <= period.date && guard < 1100) {
      if (taskIsExpectedOnDate(task, cursor)) {
        if (habitHistoryByDate.get(cursor)?.has(task.task_key)) {
          running += 1;
          total += 1;
          best = Math.max(best, running);
        } else {
          running = 0;
        }
      }
      cursor = offsetDate(cursor, 1);
      guard += 1;
    }

    let current = 0;
    cursor = period.date;
    guard = 0;
    let maySkipToday = true;
    while (guard < 1100 && cursor >= firstHistoryDate) {
      if (taskIsExpectedOnDate(task, cursor)) {
        const completed = habitHistoryByDate.get(cursor)?.has(task.task_key);
        if (completed) {
          current += 1;
          maySkipToday = false;
        } else if (maySkipToday && cursor === period.date) {
          maySkipToday = false;
        } else {
          break;
        }
      }
      cursor = offsetDate(cursor, -1);
      guard += 1;
    }
    const earnedReward = [...HABIT_REWARDS].reverse().find((reward) => total >= reward.count) || null;
    const nextReward = HABIT_REWARDS.find((reward) => total < reward.count) || null;
    return { current, best, total, earnedReward, nextReward };
  };
  const habitTasks = React.useMemo(() => trackerTasks
    .filter((task) => habitTypeForTask(task) !== "regular")
    .map((task) => ({ ...task, habitType: habitTypeForTask(task), stats: habitStatsForTask(task) })),
  [trackerTasks, habitHistory, done, period.date]);
  const habitGardenTotalCheckIns = habitTasks.reduce((total, task) => total + task.stats.total, 0);
  const habitGardenGrowthPct = habitTasks.length
    ? Math.round(habitTasks.reduce((total, task) => {
      const nextCount = task.stats.nextReward?.count;
      return total + (nextCount ? Math.min(100, (task.stats.total / nextCount) * 100) : 100);
    }, 0) / habitTasks.length)
    : 0;
  const bestBuildHabitStreak = Math.max(
    0,
    ...habitTasks.filter((task) => task.habitType === "build").map((task) => task.stats.best)
  );
  const bestReduceHabitStreak = Math.max(
    0,
    ...habitTasks.filter((task) => task.habitType === "reduce").map((task) => task.stats.best)
  );
  const maxBuildHabitCheckIns = Math.max(
    0,
    ...habitTasks.filter((task) => task.habitType === "build").map((task) => task.stats.total)
  );
  const maxReduceHabitCheckIns = Math.max(
    0,
    ...habitTasks.filter((task) => task.habitType === "reduce").map((task) => task.stats.total)
  );
  const dailyTasks = trackerTasks.filter((task) => task.day_id === "daily" && taskOccursOn(task, period.date));
  const dailyKeys = dailyTasks.map((task) => task.task_key);
  const essentialKeys = dailyTasks.filter((task) => !taskIsOptional(task)).map((task) => task.task_key);
  const bonusKeys = dailyTasks.filter(taskIsOptional).map((task) => task.task_key);
  let weeklyEssentialDone = 0;
  let weeklyEssentialPossible = 0;
  let weeklyOverallDone = 0;
  let weeklyOverallPossible = 0;
  let weeklyBonusDone = 0;
  let caringDays = 0;

  datesThroughToday(period).forEach((date) => {
    const completed = date === period.date
      ? new Set(Object.keys(done).filter((key) => done[key]))
      : (historyByDate.get(date) || new Set());
    const datedTasks = trackerTasks.filter((task) => taskIsScheduledForDate(task, date) && !isTaskPausedOnDate(task, date));
    const datedEssentialKeys = datedTasks.filter((task) => !taskIsOptional(task)).map((task) => task.task_key);
    const datedBonusKeys = datedTasks.filter(taskIsOptional).map((task) => task.task_key);
    const overallKeys = datedEssentialKeys;
    if (overallKeys.some((key) => completed.has(key)) || datedBonusKeys.some((key) => completed.has(key))) caringDays += 1;
    weeklyEssentialDone += datedEssentialKeys.filter((key) => completed.has(key)).length;
    weeklyEssentialPossible += datedEssentialKeys.length;
    weeklyOverallDone += overallKeys.filter((key) => completed.has(key)).length;
    weeklyOverallPossible += overallKeys.length;
    weeklyBonusDone += datedBonusKeys.filter((key) => completed.has(key)).length;
  });

  const weeklyEssentialPct = weeklyEssentialPossible
    ? Math.round((weeklyEssentialDone / weeklyEssentialPossible) * 100)
    : 0;
  const weeklyOverallPct = weeklyOverallPossible
    ? Math.round((weeklyOverallDone / weeklyOverallPossible) * 100)
    : 0;
  const hasWeeklyActivity = weeklyEssentialDone > 0 || weeklyBonusDone > 0 || caringDays > 0;

  useEffect(() => {
    const WidgetBridge = window.Capacitor?.Plugins?.WidgetBridge;
    if (!WidgetBridge || !user || selectedProgressDate !== period.date) return;
    const nextTask = rows.find((row) => !row.isBonus && !viewDone[row.key]) || rows.find((row) => !viewDone[row.key]);
    WidgetBridge.updateWidget({
      nextTask: dailyCheckIn.day_type === "rest" ? "Resting counts today" : (nextTask?.label || "Today's caring steps are complete"),
      dayType: `${(dailyCheckIn.day_type || "full").replace(/^./, (letter) => letter.toUpperCase())} Day · ${pct}%`,
      progress: pct,
      weeklyProgress: weeklyOverallPct,
      tasks: rows.slice(0, 4).map((row) => ({ label: row.label, done: !!viewDone[row.key] })),
    }).catch((error) => console.error("[widget] updateWidget failed:", error));
  }, [user?.id, selectedProgressDate, period.date, dailyCheckIn.day_type, pct, weeklyOverallPct, JSON.stringify(rows.slice(0, 4).map((row) => [row.key, row.label, !!viewDone[row.key]]))]);

  // Applies one watch-originated task change to Supabase. Mirrors the exact
  // upsert shape the existing cloud watch-sync Edge Function already uses
  // (both daily_progress.completed_keys and tracker_progress), so this is
  // additive to — not a divergence from — how a watch completion has always
  // been written. Kept as a small standalone function rather than reusing
  // the local toggle() closure, so a reconciliation triggered from a
  // background/reconnect path can never race or conflict with it.
  const applyWatchTaskUpdate = async (taskKey, completed, date) => {
    if (!user) return;
    const { data: existingRow } = await supabase
      .from("daily_progress")
      .select("completed_keys")
      .eq("user_id", user.id)
      .eq("progress_date", date)
      .maybeSingle();
    const completedKeys = new Set(existingRow?.completed_keys || []);
    if (completed) completedKeys.add(taskKey); else completedKeys.delete(taskKey);
    const updatedAt = new Date().toISOString();
    await Promise.all([
      supabase.from("daily_progress").upsert(
        { user_id: user.id, progress_date: date, completed_keys: [...completedKeys], updated_at: updatedAt },
        { onConflict: "user_id,progress_date" }),
      supabase.from("tracker_progress").upsert(
        { user_id: user.id, task_key: taskKey, completed, updated_at: updatedAt },
        { onConflict: "user_id,task_key" }),
    ]);
  };

  // Drains anything the watch recorded locally while this device's local
  // sync server handled it directly (app closed, or briefly offline) up to
  // Supabase, the moment the app is next open to do it. The local write
  // already happened instantly and for free; this is only about keeping
  // Supabase — the actual source of truth — eventually consistent with it.
  useEffect(() => {
    const WatchSyncBridge = window.Capacitor?.Plugins?.WatchSyncBridge;
    if (!WatchSyncBridge || !user) return;
    let active = true;
    const reconcile = async () => {
      try {
        const { changes } = await WatchSyncBridge.getPendingChanges();
        if (!active || !changes?.length) return;
        for (const change of changes) {
          await applyWatchTaskUpdate(change.taskKey, change.completed, change.date);
        }
        await WatchSyncBridge.markSynced({ ids: changes.map((change) => change.id) });
        if (active && changes.some((change) => change.date === period.date)) syncNow();
      } catch (_error) {
        // Best-effort — the same unsynced rows are simply retried next time.
      }
    };
    reconcile();
    const onVisible = () => { if (document.visibilityState === "visible") reconcile(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { active = false; document.removeEventListener("visibilitychange", onVisible); };
  }, [user?.id]);

  // Instant UI feedback for the case the app happens to already be open
  // when the watch tap arrives — WatchSyncService (native) fires this the
  // moment it accepts a /complete call, so there's no need to wait for the
  // next visibilitychange reconciliation pass above.
  useEffect(() => {
    const WatchSyncBridge = window.Capacitor?.Plugins?.WatchSyncBridge;
    if (!WatchSyncBridge || !user) return;
    const listenerPromise = WatchSyncBridge.addListener("watchTaskUpdated", async (event) => {
      try {
        await applyWatchTaskUpdate(event.taskKey, event.completed, event.date);
        if (event.date === period.date) syncNow();
      } catch (_error) {}
    });
    return () => { listenerPromise.then((handle) => handle.remove()).catch(() => {}); };
  }, [user?.id, period.date]);

  const previousWeekHistoryByDate = new Map(previousWeekHistory.map((entry) => [entry.progress_date, new Set(entry.completed_keys || [])]));
  let previousWeekDone = 0;
  let previousWeekPossible = 0;
  Array.from({ length: 7 }, (_, index) => offsetDate(period.weekStart, index - 7)).forEach((date) => {
    const completed = previousWeekHistoryByDate.get(date) || new Set();
    const overallKeys = trackerTasks.filter((task) => taskIsScheduledForDate(task, date) && !taskIsOptional(task)).map((task) => task.task_key);
    previousWeekDone += overallKeys.filter((key) => completed.has(key)).length;
    previousWeekPossible += overallKeys.length;
  });
  const previousWeekPct = previousWeekPossible ? Math.round((previousWeekDone / previousWeekPossible) * 100) : null;
  const weekOverWeekDelta = previousWeekPct === null ? null : weeklyOverallPct - previousWeekPct;

  const weeklyTrendPoints = Array.from({ length: TREND_WEEKS }, (_, weekIndex) => {
    const weeksAgo = TREND_WEEKS - weekIndex;
    const trendWeekStart = offsetDate(period.weekStart, -7 * weeksAgo);
    let trendDone = 0;
    let trendPossible = 0;
    Array.from({ length: 7 }, (_, dayIndex) => offsetDate(trendWeekStart, dayIndex)).forEach((date) => {
      const completed = previousWeekHistoryByDate.get(date) || new Set();
      const overallKeys = trackerTasks.filter((task) => taskIsScheduledForDate(task, date) && !taskIsOptional(task)).map((task) => task.task_key);
      trendDone += overallKeys.filter((key) => completed.has(key)).length;
      trendPossible += overallKeys.length;
    });
    return { weekStart: trendWeekStart, pct: trendPossible ? Math.round((trendDone / trendPossible) * 100) : null, isCurrent: false };
  }).concat([{ weekStart: period.weekStart, pct: weeklyOverallPct, isCurrent: true }]);

  const completedKeysForToday = new Set(Object.keys(done).filter((key) => done[key]));
  const todayDayId = dayIdForDate(period.date);
  const requiredKeysCache = new Map();
  const requiredKeysForDate = (date) => {
    if (requiredKeysCache.has(date)) return requiredKeysCache.get(date);
    const keys = trackerTasks
      .filter((task) =>
        taskIsScheduledForDate(task, date) &&
        !taskIsOptional(task) &&
        !task.archived_at &&
        !isTaskPausedOnDate(task, date)
      )
      .map((task) => task.task_key);
    requiredKeysCache.set(date, keys);
    return keys;
  };
  const todayRequiredKeys = requiredKeysForDate(period.date);
  const todayRequiredDone = todayRequiredKeys.filter((key) => completedKeysForToday.has(key)).length;

  const completedKeysOnDate = (date) => date === period.date ? completedKeysForToday : (habitHistoryByDate.get(date) || new Set());
  const completionTotalsForDates = (dates) => dates.reduce((totals, date) => {
    const requiredKeys = requiredKeysForDate(date);
    const completed = completedKeysOnDate(date);
    totals.done += requiredKeys.filter((key) => completed.has(key)).length;
    totals.possible += requiredKeys.length;
    return totals;
  }, { done: 0, possible: 0 });

  const currentMonthKey = period.date.slice(0, 7);
  const currentMonthDates = datesInMonthThrough(currentMonthKey, period.date);
  const currentMonthTotals = completionTotalsForDates(currentMonthDates);
  const monthlyOverallPct = currentMonthTotals.possible ? Math.round((currentMonthTotals.done / currentMonthTotals.possible) * 100) : 0;

  const dayOfMonth = Number(period.date.slice(8, 10));
  const previousMonthKey = monthKeyOffset(period.date, -1);
  const previousMonthSameRangeDates = datesInMonthThrough(previousMonthKey, null).slice(0, Math.min(dayOfMonth, daysInCalendarMonth(previousMonthKey)));
  const previousMonthTotals = completionTotalsForDates(previousMonthSameRangeDates);
  const previousMonthSameRangePct = previousMonthTotals.possible ? Math.round((previousMonthTotals.done / previousMonthTotals.possible) * 100) : null;
  const monthOverMonthDelta = previousMonthSameRangePct === null ? null : monthlyOverallPct - previousMonthSameRangePct;

  const monthlyTrendPoints = Array.from({ length: TREND_MONTHS }, (_, monthIndex) => {
    const monthsAgo = TREND_MONTHS - monthIndex;
    const monthKey = monthKeyOffset(period.date, -monthsAgo);
    const totals = completionTotalsForDates(datesInMonthThrough(monthKey, period.date));
    return { monthKey, pct: totals.possible ? Math.round((totals.done / totals.possible) * 100) : null, isCurrent: false };
  }).concat([{ monthKey: currentMonthKey, pct: currentMonthTotals.possible ? monthlyOverallPct : null, isCurrent: true }]);

  const monthlyMostConsistent = (() => {
    const recurringTasks = trackerTasks.filter((task) => !taskIsOptional(task) && task.schedule_type !== "once" && !task.archived_at);
    const routineCounts = recurringTasks
      .map((task) => ({
        task,
        count: currentMonthDates.filter((date) =>
          taskIsScheduledForDate(task, date) &&
          !isTaskPausedOnDate(task, date) &&
          completedKeysOnDate(date).has(task.task_key)
        ).length,
      }))
      .filter((entry) => entry.count >= 3)
      .sort((a, b) => b.count - a.count);
    return routineCounts[0] || null;
  })();

  const weekdayPatternInsight = (() => {
    if (habitHistory.length < 10) return null;
    const buckets = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };
    habitHistory.forEach((entry) => {
      const dayId = dayIdForDate(entry.progress_date);
      const keys = requiredKeysForDate(entry.progress_date);
      if (keys.length === 0) return;
      const completed = new Set(entry.completed_keys || []);
      const pct = keys.filter((key) => completed.has(key)).length / keys.length;
      buckets[dayId].push(pct);
    });
    const averages = Object.entries(buckets)
      .filter(([, values]) => values.length >= 2)
      .map(([dayId, values]) => ({ dayId, avg: values.reduce((a, b) => a + b, 0) / values.length }));
    if (averages.length < 3) return null;
    averages.sort((a, b) => b.avg - a.avg);
    const best = averages[0];
    if (best.avg < 0.6) return null;
    const dayLabel = DAYS.find((d) => d.id === best.dayId)?.label || best.dayId;
    return `${dayLabel}s tend to go well for you — you've completed your essentials there about ${Math.round(best.avg * 100)}% of the time.`;
  })();

  const wellbeingPatternInsight = (() => {
    if (preferences.pattern_insights_enabled === false) return null;
    const difficultMoods = new Set(["tired", "stressed", "anxious", "sad", "angry", "lonely", "overwhelmed", "numb", "sick"]);
    const lowEnergy = new Set(["empty", "low"]);
    const buckets = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };
    dailyCheckInHistory.forEach((entry) => {
      const dayId = dayIdForDate(entry.check_date);
      buckets[dayId].push({
        difficult: difficultMoods.has(entry.mood) || lowEnergy.has(entry.energy) || ["tiny", "recovery", "rest"].includes(entry.day_type),
      });
    });
    const candidates = Object.entries(buckets)
      .filter(([, values]) => values.length >= 3)
      .map(([dayId, values]) => ({ dayId, count: values.length, difficultCount: values.filter((item) => item.difficult).length }))
      .filter((item) => item.difficultCount >= 3 && item.difficultCount / item.count >= 0.6)
      .sort((a, b) => (b.difficultCount / b.count) - (a.difficultCount / a.count));
    if (!candidates.length) return null;
    const hardest = candidates[0];
    const dayLabel = DAYS.find((item) => item.id === hardest.dayId)?.label || hardest.dayId.toUpperCase();
    return {
      dayId: hardest.dayId,
      text: `${dayLabel}s have felt heavier in ${hardest.difficultCount} of your last ${hardest.count} check-ins. Would a smaller default list help?`,
    };
  })();

  const energyCompletionInsight = (() => {
    if (preferences.pattern_insights_enabled === false) return null;
    const habitByDate = new Map(habitHistory.map((entry) => [entry.progress_date, new Set(entry.completed_keys || [])]));
    const higherEnergyPcts = [];
    const lowerEnergyPcts = [];
    dailyCheckInHistory.forEach((entry) => {
      if (entry.energy !== "high" && entry.energy !== "steady" && entry.energy !== "low" && entry.energy !== "empty") return;
      const requiredKeys = requiredKeysForDate(entry.check_date);
      if (requiredKeys.length === 0) return;
      const completed = habitByDate.get(entry.check_date) || new Set();
      const pct = requiredKeys.filter((key) => completed.has(key)).length / requiredKeys.length;
      (entry.energy === "high" || entry.energy === "steady" ? higherEnergyPcts : lowerEnergyPcts).push(pct);
    });
    if (higherEnergyPcts.length < 4 || lowerEnergyPcts.length < 4) return null;
    const average = (values) => values.reduce((a, b) => a + b, 0) / values.length;
    const higherPct = Math.round(average(higherEnergyPcts) * 100);
    const lowerPct = Math.round(average(lowerEnergyPcts) * 100);
    if (Math.abs(higherPct - lowerPct) < 15) return null;
    return { higherPct, lowerPct, sampleSize: higherEnergyPcts.length + lowerEnergyPcts.length };
  })();

  // Suggests a reminder time based on when this account actually tends to
  // update its progress (daily_progress.updated_at), rather than guessing.
  // Never applied automatically - see soft_weekdays' own comment in the
  // database schema for why an insight like this should only ever be
  // something the user opts into.
  const smartReminderSuggestion = (() => {
    if (!preferences.notifications_enabled) return null;
    if (preferences.smart_reminder_hint_dismissed_at) {
      const dismissedDaysAgo = daysBetweenDates(preferences.smart_reminder_hint_dismissed_at.slice(0, 10), period.date);
      if (dismissedDaysAgo === null || dismissedDaysAgo < 30) return null;
    }
    const hourCounts = new Array(24).fill(0);
    let sampleSize = 0;
    habitHistory.forEach((entry) => {
      if (!entry.updated_at) return;
      const localHour = Number(new Date(entry.updated_at).toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: preferences.timezone || "America/Chicago" }));
      if (!Number.isFinite(localHour)) return;
      hourCounts[localHour % 24] += 1;
      sampleSize += 1;
    });
    if (sampleSize < 10) return null;
    const busiestHour = hourCounts.indexOf(Math.max(...hourCounts));
    if (hourCounts[busiestHour] / sampleSize < 0.3) return null;
    const alreadyCovered = (preferences.reminder_times || []).some((time) => {
      const reminderHour = Number(time.slice(0, 2));
      const diff = Math.abs(reminderHour - busiestHour);
      return Math.min(diff, 24 - diff) <= 1;
    });
    if (alreadyCovered) return null;
    const suggestedTime = `${String(busiestHour).padStart(2, "0")}:00`;
    return { suggestedTime, label: formatTime12(suggestedTime) };
  })();

  // Shown one at a time (with a Next control) rather than stacked, so having
  // several pattern insights available at once doesn't turn this card into a
  // wall of text.
  const patternInsightCards = [
    weekdayPatternInsight && {
      key: "weekday",
      background: "#F3E8FA99", border: "#E6D4F2", color: "#6B5A7D",
      node: <><strong>📈 A gentle pattern:</strong> {weekdayPatternInsight}</>,
    },
    wellbeingPatternInsight && {
      key: "wellbeing",
      background: "#EAF8F4", border: "#BFE5D2", color: "#526F67",
      node: (
        <>
          <strong>♥ A possible care pattern:</strong> {wellbeingPatternInsight.text}
          <div style={{ marginTop: 7, display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button type="button" onClick={() => openTaskManager(wellbeingPatternInsight.dayId)} style={{ padding: "6px 9px", borderRadius: 8, border: 0, background: "#318C79", color: "white", fontWeight: 900, fontSize: 11, cursor: "pointer" }}>Edit that day’s tasks</button>
            <button type="button" onClick={() => setCheckInPopupOpen(true)} style={{ padding: "6px 9px", borderRadius: 8, border: "1px solid #73B7A8", background: "white", color: "#318C79", fontWeight: 900, fontSize: 11, cursor: "pointer" }}>Choose a gentler day</button>
          </div>
          <div style={{ marginTop: 6, fontSize: 10.5, color: "#6B8A82" }}>This is an observation, not a diagnosis. PlushLife never changes your routine without you.</div>
        </>
      ),
    },
    energyCompletionInsight && {
      key: "energy",
      background: "#FFFBEF", border: "#F0D99E", color: "#6B5A3D",
      node: (
        <>
          <strong>⚡ Energy and your list:</strong> On days you've logged higher energy, you've completed about {energyCompletionInsight.higherPct}% of your list — on lower-energy days, about {energyCompletionInsight.lowerPct}%.
          <div style={{ marginTop: 6, fontSize: 10.5, color: "#A56D14" }}>Based on {energyCompletionInsight.sampleSize} check-ins. Not a rule — just a pattern that might help you plan gentler days ahead of time.</div>
        </>
      ),
    },
  ].filter(Boolean);

  const weeklyHighlights = (() => {
    const weekDates = datesThroughToday(period);
    const completedOn = (date) => date === period.date
      ? new Set(Object.keys(done).filter((key) => done[key]))
      : (historyByDate.get(date) || new Set());

    const recurringTasks = trackerTasks.filter((task) => !taskIsOptional(task) && task.schedule_type !== "once");
    const routineCounts = recurringTasks
      .map((task) => ({
        task,
        count: weekDates.filter((date) =>
          taskIsScheduledForDate(task, date) &&
          completedOn(date).has(task.task_key)
        ).length,
      }))
      .filter((entry) => entry.count >= 2)
      .sort((a, b) => b.count - a.count);
    const mostConsistent = routineCounts[0] || null;

    const weekStart = period.weekStart;
    const helpfulTools = {};
    careSessionHistory
      .filter((entry) => entry.check_date >= weekStart && entry.check_date <= period.date && ["helped", "a_little"].includes(entry.outcome))
      .forEach((entry) => { helpfulTools[entry.session_id] = (helpfulTools[entry.session_id] || 0) + 1; });
    const topToolId = Object.keys(helpfulTools).sort((a, b) => helpfulTools[b] - helpfulTools[a])[0] || null;
    const topTool = topToolId ? [...COMFORT_TOOLS, ...SLEEP_TOOLS, ...PLUSH_PATHS].find((tool) => tool.id === topToolId) : null;

    const weekMoods = {};
    dailyCheckInHistory
      .filter((entry) => entry.check_date >= weekStart && entry.check_date <= period.date && entry.mood)
      .forEach((entry) => { weekMoods[entry.mood] = (weekMoods[entry.mood] || 0) + 1; });
    const topMood = Object.keys(weekMoods).sort((a, b) => weekMoods[b] - weekMoods[a])[0] || null;

    if (!mostConsistent && !topTool && !topMood) return null;
    return { mostConsistent, topTool, topMood };
  })();

  // Care Areas are intentionally made from a person's own task groups rather
  // than a fixed wellness taxonomy. "Morning," "School," "Comfort," and a
  // custom group can all be meaningful care areas; this keeps the summary
  // personal without asking anyone to classify themselves.
  const careAreas = (() => {
    const areas = new Map();
    const normalizeArea = (rawLabel) => {
      const cleaned = String(rawLabel || "Everyday care").trim() || "Everyday care";
      const words = cleaned.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      if (/^mornings?$/.test(words)) return { key: "morning", label: "☀️ Mornings" };
      if (/^afternoons?$/.test(words)) return { key: "afternoon", label: "🕒 Afternoon" };
      if (/^evenings?$/.test(words)) return { key: "evening", label: "🌆 Evenings" };
      if (/^my tasks?$/.test(words)) return { key: "my-tasks", label: "My tasks" };
      return { key: words || cleaned.toLowerCase(), label: cleaned };
    };
    datesThroughToday(period).forEach((date) => {
      const completed = date === period.date
        ? new Set(Object.keys(done).filter((key) => done[key]))
        : (historyByDate.get(date) || new Set());
      trackerTasks
        .filter((task) => !task.archived_at && !taskIsOptional(task) && taskIsScheduledForDate(task, date) && !isTaskPausedOnDate(task, date))
        .forEach((task) => {
          const normalized = normalizeArea(task.section);
          const area = areas.get(normalized.key) || { label: normalized.label, done: 0, possible: 0 };
          area.possible += 1;
          if (completed.has(task.task_key)) area.done += 1;
          areas.set(normalized.key, area);
        });
    });
    return [...areas.values()]
      .map((area) => ({ ...area, pct: area.possible ? Math.round((area.done / area.possible) * 100) : 0 }))
      .sort((a, b) => b.possible - a.possible || a.label.localeCompare(b.label))
      .slice(0, 6);
  })();

  const careStory = (() => {
    const lines = [];
    if (caringDays > 0) lines.push(`You made room for care on ${caringDays} ${caringDays === 1 ? "day" : "days"} this week.`);
    if (weeklyHighlights?.mostConsistent) lines.push(`${weeklyHighlights.mostConsistent.task.task} was a steady part of your rhythm.`);
    if (weeklyHighlights?.topTool) lines.push(`${weeklyHighlights.topTool.name || weeklyHighlights.topTool.title} seemed to be a helpful support.`);
    if (weeklyHighlights?.topMood) lines.push(`Your most common check-in feeling was ${weeklyHighlights.topMood}.`);
    if (lines.length === 0) lines.push("Your story will start taking shape as you check in and choose small caring steps.");
    return lines.slice(0, 3);
  })();

  const todayDailyCoreKeys = requiredKeysForDate(period.date);
  const todayDailyCoreIsComplete =
    todayDailyCoreKeys.length > 0 &&
    todayDailyCoreKeys.every((key) => completedKeysForToday.has(key));

  const longHistoryByDate = new Map(longHistory.map((entry) => [entry.progress_date, new Set(entry.completed_keys || [])]));
  const markPastTasksDone = async (date, taskKeys) => {
    if (!user || date >= period.date || taskKeys.length === 0) return;
    const alreadyDone = new Set(longHistoryByDate.get(date) || []);
    const missingKeys = taskKeys.filter((key) => !alreadyDone.has(key));
    if (missingKeys.length === 0) return;
    if (!window.confirm(`Mark these ${missingKeys.length} activities as done for ${new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}? You can still uncheck any one afterward.`)) return;
    const completedKeys = [...new Set([...alreadyDone, ...taskKeys])];
    const previousHistory = [...weeklyHistory];
    const previousLongHistory = [...longHistory];
    const previousHabitHistory = [...habitHistory];
    const entry = { progress_date: date, completed_keys: completedKeys };
    setWeeklyHistory((entries) => [...entries.filter((item) => item.progress_date !== date), entry]);
    setLongHistory((entries) => [...entries.filter((item) => item.progress_date !== date), entry]);
    setHabitHistory((entries) => [...entries.filter((item) => item.progress_date !== date), entry]);
    setSyncStatus("syncing");
    const { error } = await supabase.from("daily_progress").upsert({
      user_id: user.id,
      progress_date: date,
      completed_keys: completedKeys,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,progress_date" });
    if (error) {
      setWeeklyHistory(previousHistory);
      setLongHistory(previousLongHistory);
      setHabitHistory(previousHabitHistory);
      setSyncStatus(navigator.onLine ? "error" : "offline");
      return;
    }
    setSyncStatus("ready");
    setLastSyncedAt(new Date().toISOString());
  };
  const dayCompletionPct = (date) => {
    if (date > period.date) return null;
    const requiredKeys = requiredKeysForDate(date);
    const completed = date === period.date ? completedKeysForToday : (longHistoryByDate.get(date) || new Set());
    const doneCountForDate = requiredKeys.filter((key) => completed.has(key)).length;
    return requiredKeys.length ? Math.round((doneCountForDate / requiredKeys.length) * 100) : null;
  };
  const todayEssentialsPercent = todayRequiredKeys.length
    ? Math.round((todayRequiredDone / todayRequiredKeys.length) * 100)
    : 0;
  const todayIsComplete = todayRequiredKeys.length > 0 && todayRequiredDone === todayRequiredKeys.length;
  const mascotMood = todayIsComplete ? "excited" : (todayRequiredKeys.length > 0 && todayRequiredDone === 0) ? "tired" : "neutral";

  useEffect(() => {
    if (!user || !("setAppBadge" in navigator)) return;
    const remaining = Math.max(0, todayRequiredKeys.length - todayRequiredDone);
    try {
      if (remaining > 0) navigator.setAppBadge(remaining).catch(() => {});
      else navigator.clearAppBadge().catch(() => {});
    } catch (_error) {}
  }, [user, todayRequiredKeys.length, todayRequiredDone]);

  const firstCareHistoryDate = habitHistory.length
    ? habitHistory.reduce((earliest, entry) => entry.progress_date < earliest ? entry.progress_date : earliest, period.date)
    : period.date;
  const restDatesSet = new Set(restDates);
  const careDayIsComplete = (date) => {
    if (restDatesSet.has(date)) return true;
    const requiredKeys = requiredKeysForDate(date);
    const completed = habitHistoryByDate.get(date) || new Set();
    return requiredKeys.length > 0 && requiredKeys.every((key) => completed.has(key));
  };

  let bestCompleteStreak = 0;
  let runningCompleteStreak = 0;
  let careCursor = firstCareHistoryDate;
  let careGuard = 0;
  while (careCursor <= period.date && careGuard < 2200) {
    if (careDayIsComplete(careCursor)) {
      runningCompleteStreak += 1;
      bestCompleteStreak = Math.max(bestCompleteStreak, runningCompleteStreak);
    } else {
      runningCompleteStreak = 0;
    }
    careCursor = offsetDate(careCursor, 1);
    careGuard += 1;
  }
  let currentCompleteStreak = 0;
  careCursor = period.date;
  careGuard = 0;
  let maySkipIncompleteToday = true;
  while (careCursor >= firstCareHistoryDate && careGuard < 2200) {
    if (careDayIsComplete(careCursor)) {
      currentCompleteStreak += 1;
      maySkipIncompleteToday = false;
    } else if (maySkipIncompleteToday && careCursor === period.date) {
      maySkipIncompleteToday = false;
    } else {
      break;
    }
    careCursor = offsetDate(careCursor, -1);
    careGuard += 1;
  }

  const currentUnlockProgress = Math.max(currentCompleteStreak, bestCompleteStreak, todayDailyCoreIsComplete ? 1 : 0);
  const savedBestStreak = Math.max(mascotCollection.bestStreak, currentUnlockProgress);
  const careDaysTotal = new Set(
    habitHistory
      .map((entry) => entry.progress_date)
      .filter((date) => careDayIsComplete(date))
  ).size;
  const activityDaysTotal = new Set([
    ...habitHistory.filter((entry) => (entry.completed_keys || []).length > 0).map((entry) => entry.progress_date),
    ...dailyCheckInHistory.map((entry) => entry.check_date),
    ...reflectionDates,
  ]).size;
  const WINS_JAR_NOTES = [
    { emoji: "🌼", title: "A gentle try", text: "You showed up in a small way. That belongs in the jar." },
    { emoji: "🫧", title: "A soft reset", text: "You made room for one little bit of care." },
    { emoji: "⭐", title: "A bright spot", text: "A real win, saved for the days you need to remember." },
    { emoji: "🧸", title: "Cozy effort", text: "You kept yourself company and did what you could." },
    { emoji: "🌈", title: "A brave little step", text: "You moved forward without needing to do everything." },
  ];
  const winsJarEntries = [...habitHistory]
    .filter((entry) => (entry.completed_keys || []).length > 0)
    .sort((left, right) => String(right.progress_date).localeCompare(String(left.progress_date)))
    .slice(0, 12)
    .map((entry, index) => ({
      date: entry.progress_date,
      count: (entry.completed_keys || []).length,
      ...WINS_JAR_NOTES[(index + (entry.completed_keys || []).length) % WINS_JAR_NOTES.length],
    }));
  const mascotGrowth = mascotGrowthStageForDays(activityDaysTotal);
  const mascotRequirementProgress = (outfit) => {
    switch (outfit.unlock.type) {
      case "daily_core": return careDaysTotal >= 1 || todayDailyCoreIsComplete ? 1 : 0;
      case "care_days": return careDaysTotal;
      case "activity_days": return activityDaysTotal;
      case "build_checkins": return maxBuildHabitCheckIns;
      case "reduce_checkins": return maxReduceHabitCheckIns;
      case "reflection_count": return reflectionDates.length;
      case "founding": return (user?.created_at && new Date(user.created_at) < new Date("2026-09-01T00:00:00Z")) ? 1 : 0;
      default: return Number.NEGATIVE_INFINITY;
    }
  };
  const newlyEarnedIds = MASCOT_OUTFITS
    .filter((outfit) => mascotRequirementProgress(outfit) >= outfit.unlock.count)
    .map((outfit) => outfit.id);
  const unlockedIdSet = new Set(["classic", ...(mascotCollection.unlockedIds || []), ...newlyEarnedIds]);
  const unlockedOutfits = MASCOT_OUTFITS.filter((outfit) => unlockedIdSet.has(outfit.id));
  const selectedOutfit = unlockedOutfits.find((outfit) => outfit.id === mascotCollection.selectedId) || MASCOT_OUTFITS[0];

  const saveMascotCollection = (nextCollection) => {
    const normalized = {
      ...nextCollection,
      unlockedIds: [...new Set(["classic", ...(nextCollection.unlockedIds || [])])],
      earnedBadgeIds: [...new Set(nextCollection.earnedBadgeIds || [])],
    };
    setMascotCollection(normalized);
    if (user) {
      window.localStorage.setItem(`plushlist-mascot-${user.id}`, JSON.stringify(normalized));
      supabase.from("user_achievements").upsert({
        user_id: user.id,
        visit_streak: normalized.visitStreak,
        best_visit_streak: normalized.bestVisitStreak,
        last_visit_date: normalized.lastVisitDate || null,
        best_care_streak: normalized.bestStreak,
        unlocked_ids: normalized.unlockedIds,
        earned_badge_ids: normalized.earnedBadgeIds,
        selected_mascot: normalized.selectedId,
        celebration_sound: normalized.celebrationSound,
        last_celebrated_date: normalized.lastCelebratedDate || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" }).then(({ error }) => {
        if (error) console.warn("Mascot collection sync is waiting to retry.", error.message);
      });
    }
  };

  useEffect(() => {
    if (!user || collectionLoadedFor !== user.id) return;
    const nextIds = [...unlockedIdSet];
    const currentIds = mascotCollection.unlockedIds || [];
    const unlocksChanged = nextIds.some((id) => !currentIds.includes(id));
    if (currentUnlockProgress <= mascotCollection.bestStreak && !unlocksChanged) return;
    saveMascotCollection({
      ...mascotCollection,
      bestStreak: Math.max(mascotCollection.bestStreak, currentUnlockProgress),
      unlockedIds: nextIds,
    });
  }, [
    user?.id,
    collectionLoadedFor,
    currentUnlockProgress,
    mascotCollection.bestStreak,
    (mascotCollection.unlockedIds || []).join("|"),
    newlyEarnedIds.join("|"),
  ]);

  useEffect(() => {
    if (!user || collectionLoadedFor !== user.id || syncStatus !== "ready") return;
    if (!todayIsComplete && mascotCollection.lastCelebratedDate === period.date) {
      saveMascotCollection({ ...mascotCollection, lastCelebratedDate: "" });
    }
  }, [user?.id, collectionLoadedFor, syncStatus, todayIsComplete, mascotCollection.lastCelebratedDate, period.date]);

  useEffect(() => {
    if (
      !user ||
      collectionLoadedFor !== user.id ||
      syncStatus !== "ready" ||
      !todayIsComplete ||
      mascotCollection.lastCelebratedDate === period.date
    ) return;
    const next = {
      ...mascotCollection,
      bestStreak: Math.max(mascotCollection.bestStreak, currentCompleteStreak),
      lastCelebratedDate: period.date,
    };
    saveMascotCollection(next);
    setCelebrationOpen(true);
    setCelebrationTitleText(voice.celebrationTitles[Math.floor(Math.random() * voice.celebrationTitles.length)]);
    if (mascotCollection.celebrationSound && !isQuietTime(preferences)) playCelebrationChime();
    window.setTimeout(() => tryOpenNotificationNudge(0.3), 6000);
  }, [
    user?.id,
    collectionLoadedFor,
    syncStatus,
    todayIsComplete,
    period.date,
    currentCompleteStreak,
    mascotCollection.lastCelebratedDate,
    mascotCollection.celebrationSound,
  ]);

  const myInboundLinks = supportLinks.filter((link) =>
    link.owner_user_id !== user?.id &&
    link.active &&
    link.caregiver_email === (user?.email || "").toLowerCase()
  );
  const invitedSupportLinks = myInboundLinks.filter((link) => !!link.accepted_at);
  const pendingSupportInvites = myInboundLinks.filter((link) => !link.accepted_at);
  const canUseCaretakerDashboard = invitedSupportLinks.length > 0;
  const ownedSupportLinks = supportLinks.filter((link) => link.owner_user_id === user?.id);
  const hasOwnGuardian = ownedSupportLinks.some((link) => link.active && link.accepted_at);
  const isGuardianAccount = !!user && trackerProfile?.account_type === "caretaker";
  const dashboardItems = isGuardianAccount
    ? [...DASHBOARDS, { id: "guardian", label: "Guardian", icon: "💛", accent: "#318C79" }]
    : DASHBOARDS;

  useEffect(() => {
    if (!user) {
      setPendingInviteAutoOpenedFor(null);
      return;
    }
    if (
      preferences.onboarding_complete &&
      pendingSupportInvites.length > 0 &&
      pendingInviteAutoOpenedFor !== user.id
    ) {
      setPendingInviteAutoOpenedFor(user.id);
      setSupportViewMode("mine");
    }
  }, [user?.id, preferences.onboarding_complete, pendingSupportInvites.length, pendingInviteAutoOpenedFor]);

  const goToDashboard = (id) => {
    setDashboard(id);
    if (id === "today") {
      setActive(dayIdForDate(period.date));
      setSelectedProgressDate(period.date);
    }
    if (id === "guardian") {
      const firstSupportedOwner = isGuardianAccount ? invitedSupportLinks[0]?.owner_user_id : null;
      if (firstSupportedOwner) {
        setSupportViewMode("caretaker");
        loadSupportOwner(firstSupportedOwner);
      } else {
        setSupportViewMode("mine");
      }
    }
  };
  const dashboardIndex = dashboardItems.findIndex((item) => item.id === dashboard);
  const stepDashboard = (direction) => {
    const currentIndex = dashboardIndex === -1 ? 0 : dashboardIndex;
    const nextItem = dashboardItems[Math.max(0, Math.min(dashboardItems.length - 1, currentIndex + direction))];
    if (nextItem && nextItem.id !== dashboard) {
      goToDashboard(nextItem.id);
      document.getElementById(`dashboard-tab-${nextItem.id}`)?.focus();
    }
  };
  const isAdminUser = ["johnston.alexander.k@gmail.com", "johnston.alexander.k+plushlisttest@gmail.com"].includes((user?.email || "").toLowerCase());
  const isMamaCornerProfile = (user?.email || "").trim().toLowerCase() === "johnston.alexander.k@gmail.com";
  const isSupporterAccount = !!preferences.is_supporter || isAdminUser;
  const personalPlushlistTitle = trackerProfile?.display_name
    ? `${trackerProfile.display_name}’s PlushLife`
    : "My PlushLife";
  const isSupportAdult = !!user && supportViewMode === "caretaker" && canUseCaretakerDashboard;
  const activeSupportLink = invitedSupportLinks.find((link) => link.owner_user_id === supportOwnerId) || null;
  const canViewSupportProgress = !isSupportAdult || !!activeSupportLink?.can_view_progress;
  const canSendSupportNotes = !isSupportAdult || !!activeSupportLink?.can_send_notes;
  const canAddSupportRewards = !isSupportAdult || !!activeSupportLink?.can_add_rewards;
  const selectedSupportName = supportPeople.find((person) => person.user_id === supportOwnerId)?.display_name || "your Cozy";
  const supportTaskSource = isSupportAdult ? supportTrackerTasks : trackerTasks;
  const supportTodayDayId = dayIdForDate(period.date);
  const supportTodayDayLabel = DAYS.find((item) => item.id === supportTodayDayId)?.label || supportTodayDayId.toUpperCase();
  const supportDailyEssentialKeys = supportTaskSource
    .filter((task) =>
      taskIsScheduledForDate(task, period.date) &&
      task.day_id === "daily" &&
      !(Array.isArray(task.schedule_days) && task.schedule_days.length) &&
      !taskIsOptional(task) &&
      !task.archived_at
    )
    .map((task) => task.task_key);
  const supportScheduledTodayKeys = supportTaskSource
    .filter((task) =>
      taskIsScheduledForDate(task, period.date) &&
      !(task.day_id === "daily" && !(Array.isArray(task.schedule_days) && task.schedule_days.length)) &&
      !taskIsOptional(task) &&
      !task.archived_at
    )
    .map((task) => task.task_key);
  const supportTodayKeys = [...new Set([...supportDailyEssentialKeys, ...supportScheduledTodayKeys])];
  const supportDoneKeys = new Set(supportProgress.filter((row) => row.completed).map((row) => row.task_key));
  const supportCompletedCount = supportTodayKeys.filter((key) => supportDoneKeys.has(key)).length;
  const supportDailyEssentialCompleted = supportDailyEssentialKeys.filter((key) => supportDoneKeys.has(key)).length;
  const supportScheduledTodayCompleted = supportScheduledTodayKeys.filter((key) => supportDoneKeys.has(key)).length;
  const supportPercent = supportTodayKeys.length ? Math.round((supportCompletedCount / supportTodayKeys.length) * 100) : 0;
  const supportHistoryByDate = new Map(
    supportWeeklyHistory.map((entry) => [entry.progress_date, new Set(entry.completed_keys || [])])
  );
  let supportWeeklyCompletedCount = 0;
  let supportWeeklyPossibleCount = 0;
  datesThroughToday(period).forEach((date) => {
    const completed = date === period.date ? supportDoneKeys : (supportHistoryByDate.get(date) || new Set());
    const dailyEssentialKeys = supportTaskSource
      .filter((task) =>
        taskIsScheduledForDate(task, date) &&
        !taskIsOptional(task) &&
        !task.archived_at &&
        !isTaskPausedOnDate(task, date)
      )
      .map((task) => task.task_key);
    const applicableKeys = dailyEssentialKeys;
    supportWeeklyCompletedCount += applicableKeys.filter((key) => completed.has(key)).length;
    supportWeeklyPossibleCount += applicableKeys.length;
  });
  const supportWeeklyPercent = supportWeeklyPossibleCount
    ? Math.round((supportWeeklyCompletedCount / supportWeeklyPossibleCount) * 100)
    : 0;
  const displayedSupportPercent = supportProgressView === "weekly" ? supportWeeklyPercent : supportPercent;
  const displayedSupportCompleted = supportProgressView === "weekly" ? supportWeeklyCompletedCount : supportCompletedCount;
  const displayedSupportPossible = supportProgressView === "weekly" ? supportWeeklyPossibleCount : supportTodayKeys.length;

  useEffect(() => {
    if (!user) return;
    if (supportViewMode === "caretaker") {
      const selectedInviteStillActive = invitedSupportLinks.some((link) => link.owner_user_id === supportOwnerId);
      if (selectedInviteStillActive) return;
      const firstInvite = invitedSupportLinks[0];
      if (firstInvite) {
        loadSupportOwner(firstInvite.owner_user_id);
      } else {
        setSupportViewMode("mine");
        loadSupportOwner(user.id);
      }
      return;
    }
    if (supportOwnerId !== user.id) loadSupportOwner(user.id);
  }, [user?.id, supportViewMode, supportLinks.length]);

  useEffect(() => {
    if (!user || dashboard !== "guardian" || supportViewMode !== "mine" || unreadNoteCount === 0) return;
    setUnreadNoteCount(0);
    supabase.from("support_notes").update({ is_read: true }).eq("owner_user_id", user.id).eq("is_read", false).then(() => {});
  }, [user?.id, dashboard, supportViewMode]);

  const babyMode = preferences.nickname_style === "baby";
  useEffect(() => {
    if (babyMode) setTodayCardIndex(1);
  }, [babyMode]);
  useEffect(() => {
    if (!user?.id || !preferences.onboarding_complete || !privateNoteLoaded || privateNote) return;
    if (!dailyCheckIn.capacity && !checkInPopupDismissedToday) return;
    const promptKey = `plushlife-journal-prompt-${user.id}-${period.date}`;
    if (window.localStorage.getItem(promptKey) === "seen") return;
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(promptKey, "seen");
      setJournalQuickOpenDate(period.date);
      setPrivateNoteDraft("");
      setPrivateNoteMessage("");
      setPrivateNoteEditing(true);
      setDailyJournalPromptOpen(true);
      setJournalQuickOpen(true);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [user?.id, preferences.onboarding_complete, privateNoteLoaded, privateNote, dailyCheckIn.capacity, checkInPopupDismissedToday, period.date]);
  const dinoTheme = !!preferences.dino_theme;
  const selectedAppearanceTheme = APPEARANCE_THEMES.find((theme) => theme.id === appearanceTheme) || APPEARANCE_THEMES[0];
  const selectAppearanceTheme = (themeId) => {
    setAppearanceTheme(themeId);
    if (user?.id) window.localStorage.setItem(`plushlist-appearance-${user.id}`, themeId);
  };

  const BADGE_DEFS = [
    { id: "first_step", badge: "🌱", name: "First Step", hint: "Complete your essential care on one day.", check: () => careDaysTotal >= 1 },
    { id: "one_week", badge: "🔥", name: "Seven Caring Days", hint: "Complete your essential care on any 7 days.", check: () => careDaysTotal >= 7 },
    { id: "two_weeks", badge: "🏅", name: "Fourteen Caring Days", hint: "Complete your essential care on any 14 days.", check: () => careDaysTotal >= 14 },
    { id: "one_month", badge: "🌟", name: "Thirty Caring Days", hint: "Complete your essential care on any 30 days.", check: () => careDaysTotal >= 30 },
    { id: "two_months", badge: "💎", name: "Sixty Caring Days", hint: "Complete your essential care on any 60 days.", check: () => careDaysTotal >= 60 },
    { id: "hundred_days", badge: "👑", name: "One Hundred Caring Days", hint: "Complete your essential care on any 100 days.", check: () => careDaysTotal >= 100 },
    { id: "two_hundred_days", badge: "🎊", name: "Two Hundred Caring Days", hint: "Complete your essential care on any 200 days.", check: () => careDaysTotal >= 200 },
    { id: "one_year", badge: "🏆", name: "A Year of Care", hint: "Complete your essential care on any 365 days.", check: () => careDaysTotal >= 365 },
    { id: "getting_started", badge: "👣", name: "Getting Started", hint: "Check in or care for yourself once.", check: () => activityDaysTotal >= 1 },
    { id: "regular_visitor", badge: "🧸", name: "Regular Visitor", hint: "Check in or care for yourself on any 7 days.", check: () => activityDaysTotal >= 7 },
    { id: "devoted_visitor", badge: "🌙", name: "Devoted Visitor", hint: "Check in or care for yourself on any 30 days.", check: () => activityDaysTotal >= 30 },
    { id: "sixty_visitor", badge: "💫", name: "60-Day Visitor", hint: "Check in or care for yourself on any 60 days.", check: () => activityDaysTotal >= 60 },
    { id: "hundred_visitor", badge: "💯", name: "100-Day Visitor", hint: "Check in or care for yourself on any 100 days.", check: () => activityDaysTotal >= 100 },
    { id: "first_reflection", badge: "📝", name: "First Reflection", hint: "Write your first private reflection.", check: () => reflectionDates.length >= 1 },
    { id: "reflection_habit", badge: "✍️", name: "Reflection Habit", hint: "Write 10 private reflections.", check: () => reflectionDates.length >= 10 },
    { id: "reflection_devotee", badge: "📖", name: "Reflection Devotee", hint: "Write 30 private reflections.", check: () => reflectionDates.length >= 30 },
    { id: "reflection_sage", badge: "📚", name: "Reflection Sage", hint: "Write 100 private reflections.", check: () => reflectionDates.length >= 100 },
    { id: "intention_setter", badge: "📮", name: "Intention Setter", hint: "Write a reflection on a Sunday.", check: () => reflectionDates.some((date) => dayIdForDate(date) === "sun") },
    { id: "honest_checkin", badge: "♥", name: "Honest Check-In", hint: "Tell PlushLife how today really feels.", check: () => dailyCheckInHistory.length >= 1 },
    { id: "tiny_counts", badge: "🌼", name: "Tiny Still Counts", hint: "Choose a Tiny Day when that is what you need.", check: () => dailyCheckInHistory.some((item) => item.day_type === "tiny") },
    { id: "recovery_return", badge: "🛋️", name: "Gentle Return", hint: "Choose a Recovery Day and come back softly.", check: () => dailyCheckInHistory.some((item) => item.day_type === "recovery") },
    { id: "care_explorer", badge: "🌿", name: "Care Explorer", hint: "Try a PlushCare tool and record how it felt.", check: () => careSessionHistory.length >= 1 },
    { id: "guardian_connected", badge: "💛", name: "Guardian Connected", hint: "Add a trusted Guardian.", check: () => ownedSupportLinks.length >= 1 },
    { id: "two_guardians", badge: "🧑‍🤝‍🧑", name: "Two Guardians", hint: "Add two trusted Guardians.", check: () => ownedSupportLinks.length >= 2 },
    { id: "habit_starter", badge: "🥇", name: "Habit Starter", hint: "Create your first build or reduce habit.", check: () => habitTasks.length >= 1 },
    { id: "habit_gardener", badge: "🌈", name: "Habit Gardener", hint: "Earn your first badge in the Habit Garden.", check: () => habitTasks.some((item) => item.stats.earnedReward) },
    { id: "habit_collector", badge: "🌻", name: "Habit Collector", hint: "Earn badges on 3 different habits.", check: () => habitTasks.filter((item) => item.stats.earnedReward).length >= 3 },
    { id: "full_grown", badge: "🌳", name: "Full Grown", hint: "Complete 30 check-ins on any single habit.", check: () => habitTasks.some((item) => item.stats.total >= 30) },
    { id: "habit_builder", badge: "🎯", name: "Habit Builder", hint: "Earn a badge on a habit you're building.", check: () => habitTasks.some((item) => item.habitType === "build" && item.stats.earnedReward) },
    { id: "habit_reducer", badge: "🛡️", name: "Habit Reducer", hint: "Earn a badge on a habit you're reducing.", check: () => habitTasks.some((item) => item.habitType === "reduce" && item.stats.earnedReward) },
    { id: "organizer", badge: "📋", name: "Organizer", hint: "Have 10 tasks set up.", check: () => trackerTasks.length >= 10 },
    { id: "big_planner", badge: "🧩", name: "Big Planner", hint: "Have 25 tasks set up.", check: () => trackerTasks.length >= 25 },
    { id: "schedule_setter", badge: "🗓️", name: "Schedule Setter", hint: "Set up a schedule for one day.", check: () => personalSchedules.length >= 1 },
    { id: "full_week_scheduled", badge: "📅", name: "Full Week Scheduled", hint: "Set up a schedule for all 7 days.", check: () => personalSchedules.length >= 7 },
    { id: "personalizer", badge: "🎨", name: "Personalizer", hint: "Try Baby Mode or Dino Theme.", check: () => babyMode || dinoTheme },
    { id: "reminder_ready", badge: "🔔", name: "Reminder Ready", hint: "Turn on push notifications.", check: () => !!preferences.notifications_enabled },
    { id: "focused", badge: "🎯", name: "Focused", hint: "Try PlushFocus.", check: () => !!preferences.focus_mode },
    { id: "perfect_week", badge: "✨", name: "Whole Week Glow", hint: "Reach 100% for one whole week.", check: () => weeklyOverallPct === 100 },
    { id: "bonus_lover", badge: "🌈", name: "Bonus Lover", hint: "Complete 5 bonus items in one week.", check: () => weeklyBonusDone >= 5 },
    { id: "founding_cozy", badge: "🌟", name: "Founding Cozy", hint: "Join PlushLife during its early access period.", check: () => !!user?.created_at && new Date(user.created_at) < new Date("2026-09-01T00:00:00Z") },
  ];
  const newlyEarnedBadgeIds = BADGE_DEFS.filter((item) => item.check()).map((item) => item.id);
  const earnedBadgeIdSet = new Set([...(mascotCollection.earnedBadgeIds || []), ...newlyEarnedBadgeIds]);

  useEffect(() => {
    if (!user || collectionLoadedFor !== user.id) return;
    const currentBadgeIds = mascotCollection.earnedBadgeIds || [];
    const justEarnedIds = newlyEarnedBadgeIds.filter((id) => !currentBadgeIds.includes(id));
    if (justEarnedIds.length === 0) return;
    saveMascotCollection({
      ...mascotCollection,
      bestStreak: Math.max(mascotCollection.bestStreak, currentUnlockProgress),
      unlockedIds: [...unlockedIdSet],
      earnedBadgeIds: [...earnedBadgeIdSet],
    });
    const justEarnedDefs = BADGE_DEFS.filter((item) => justEarnedIds.includes(item.id));
    setBadgeCelebration({
      intro: BADGE_CELEBRATION_INTROS[Math.floor(Math.random() * BADGE_CELEBRATION_INTROS.length)],
      badges: justEarnedDefs,
    });
    if (mascotCollection.celebrationSound && !isQuietTime(preferences)) playCelebrationChime();
  }, [
    user?.id,
    collectionLoadedFor,
    newlyEarnedBadgeIds.join("|"),
    (mascotCollection.earnedBadgeIds || []).join("|"),
  ]);

  useEffect(() => {
    if (!badgeCelebration) return undefined;
    const timer = window.setTimeout(() => setBadgeCelebration(null), 6000);
    return () => window.clearTimeout(timer);
  }, [badgeCelebration]);

  const refreshDeviceBackup = React.useCallback(async () => {
    if (!user?.id || deviceBackupBusy) return;
    setDeviceBackupBusy(true);
    try {
      const status = await createDeviceBackup(supabase, user);
      setDeviceBackupStatus(status);
      setSettingsMessage("On-device backup updated. Your cloud copy was left untouched.");
    } catch (_error) {
      setSettingsMessage("Could not refresh the on-device backup. Your cloud data is still safe.");
    } finally {
      setDeviceBackupBusy(false);
    }
  }, [user?.id, deviceBackupBusy]);

  const verifyDeviceBackupNow = React.useCallback(async () => {
    if (!user?.id || deviceBackupVerifyBusy) return;
    setDeviceBackupVerifyBusy(true);
    try {
      const result = await verifyDeviceBackup(user.id);
      const status = await getDeviceBackupStatus(user.id);
      setDeviceBackupStatus(status);
      setSettingsMessage(result.ok ? "On-device backup verified. The latest recovery copy is readable." : (result.reason || "The on-device backup could not be verified."));
    } catch (_error) {
      setSettingsMessage("The on-device backup could not be verified. Your cloud copy is still untouched.");
    } finally {
      setDeviceBackupVerifyBusy(false);
    }
  }, [user?.id, deviceBackupVerifyBusy]);

  useEffect(() => {
    if (!user?.id) return undefined;
    let cancelled = false;
    getDeviceBackupStatus(user.id).then((status) => { if (!cancelled) setDeviceBackupStatus(status); });
    return () => { cancelled = true; };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !online) return undefined;
    return scheduleAutomaticDeviceBackup({
      supabase,
      user,
      online,
      onStatus: setDeviceBackupStatus,
    });
  }, [user?.id, online]);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    const beat = () => {
      if (!alive) return;
      supabase.from("user_presence").upsert({
        user_id: user.id,
        last_active_at: new Date().toISOString(),
      }, { onConflict: "user_id" }).then(() => {});
    };
    beat();
    const interval = window.setInterval(beat, 60000);
    return () => { alive = false; window.clearInterval(interval); };
  }, [user?.id]);

  let lastSection = null;

  if (syncStatus === "loading") {
    return <AppLoadingScreen />;
  }

  if (!user) {
    return <LandingPage email={email} setEmail={setEmail} otpCode={otpCode} setOtpCode={setOtpCode} showSignIn={showSignIn} setShowSignIn={setShowSignIn} sendSignInLink={sendSignInLink} verifySignInCode={verifySignInCode} signInMessage={signInMessage} codeCooldown={codeCooldown} password={password} setPassword={setPassword} showPasswordField={showPasswordField} setShowPasswordField={setShowPasswordField} signInWithPassword={signInWithPassword} />;
  }

  const themeKey = babyMode ? (preferences.baby_voice === "fatherly" ? "baby_fatherly" : "baby_motherly") : dinoTheme ? "dino" : "warm";
  const babyCaregiverName = preferences.baby_voice === "fatherly" ? "Daddy" : "Mommy";
  const selectedMotherlyNickname = MOTHERLY_NICKNAMES[
    [...period.date].reduce((sum, character) => sum + character.charCodeAt(0), 0) % MOTHERLY_NICKNAMES.length
  ];
  const baseVoice = THEME_VOICE[themeKey];
  const voice = themeKey === "baby_motherly" ? {
    ...baseVoice,
    dayComplete: `All your little jobs are done, ${selectedMotherlyNickname}. Mommy is so, so proud of you! 🧸✨`,
    celebrationTitles: [`Look at you go, ${selectedMotherlyNickname}! Mommy's so proud! 🎉`, `All the little jobs are done—Mommy's beaming, ${selectedMotherlyNickname}! 🍼`, `Such a good try, ${selectedMotherlyNickname}. You did it! ✨`],
    nurturingSome: (count) => `You already did ${count} ${count === 1 ? "little thing" : "little things"} today, ${selectedMotherlyNickname}. Mommy noticed, and she's proud of you. 🧸`,
    nurturingNone: `No rush, ${selectedMotherlyNickname}. We can make today very small—just one tiny thing when you're ready. Mommy's right here. 🍼`,
    welcomeBack: (days) => `It's been ${days} sleeps, ${selectedMotherlyNickname}. You don't need to explain a thing—Mommy's just happy to see you. We can start with one tiny step. 🧸`,
    testNotifTitle: `A little hello for ${selectedMotherlyNickname} from Mommy 🍼`,
    testNotifBody: `Just a gentle check-in, ${selectedMotherlyNickname}. Come back whenever you feel ready. 🧸`,
  } : baseVoice;
  const comfortItemName = trackerProfile?.comfort_item_name?.trim() || "a comfort item";
  const currentCopingOption = COPING_OPTIONS[copingPick].replace(/Tigger/gi, comfortItemName);
  const onboardingTotalSteps = onboardingMode === "supporter" ? 2 : (onboardingMode === "guardian" ? 7 : 6);
  const autoPopupToShow = (() => {
    if (weeklyKickoffOpen) return "weekly_kickoff";
    if (user && preferences.onboarding_complete && preferences.last_seen_changelog !== CURRENT_CHANGELOG_VERSION) return "changelog";
    if (introIntentionOpen) return "intro_intention";
    if (celebrationOpen) return "celebration";
    if (checkInPopupOpen) return "check_in";
    if (dailyJournalPromptOpen) return "daily_journal";
    if (notificationNudgeOpen) return "notification_nudge";
    return null;
  })();

  return (
    <div id="main-content" tabIndex="-1" className={`${babyMode ? "baby-mode" : dinoTheme ? "dino-theme" : ""} appearance-${appearanceTheme}`} style={{
      minHeight: "100vh",
      background: babyMode ? "#FFF0FA" : selectedAppearanceTheme.background,
      backgroundImage: preferences.simple_mode ? "none" : babyMode ? `
        radial-gradient(circle at 8% 9%, #FFBFE4 0%, transparent 34%),
        radial-gradient(circle at 93% 8%, #BDEBFF 0%, transparent 35%),
        radial-gradient(circle at 88% 91%, #FFF0A8 0%, transparent 38%),
        radial-gradient(circle at 9% 88%, #C8F4DE 0%, transparent 38%)
      ` : `
        linear-gradient(135deg, ${selectedAppearanceTheme.wash}, transparent 64%),
        radial-gradient(circle at 8% 12%, ${selectedAppearanceTheme.glowA} 0%, transparent 42%),
        radial-gradient(circle at 92% 8%, ${selectedAppearanceTheme.glowB} 0%, transparent 42%),
        radial-gradient(circle at 85% 90%, ${selectedAppearanceTheme.glowC} 0%, transparent 48%),
        radial-gradient(circle at 10% 85%, ${selectedAppearanceTheme.glowD} 0%, transparent 48%)
      `,
      fontFamily: babyMode ? "'Comic Sans MS','Nunito','Segoe UI',sans-serif" : "'Avenir Next','Segoe UI',system-ui,sans-serif",
      color: preferences.high_contrast ? "#2D2038" : "#5B4B6B",
      fontSize: babyMode ? "118%" : "100%",
      padding: "max(24px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(48px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left))",
      position: "relative",
      boxShadow: appearanceTheme === "soft" || babyMode ? "none" : `inset 0 0 0 8px ${selectedAppearanceTheme.accent}55`,
    }}>
      {!babyMode && appearanceTheme !== "soft" && <div aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 8, background: `linear-gradient(90deg, ${selectedAppearanceTheme.accent}, ${selectedAppearanceTheme.glowB}, ${selectedAppearanceTheme.accent})`, boxShadow: `0 3px 14px ${selectedAppearanceTheme.accent}88`, pointerEvents: "none" }} />}
      <style>{`
        @keyframes mascotBounce {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-12px) rotate(-4deg); }
          55% { transform: translateY(-4px) rotate(4deg); }
        }
        @keyframes accessorySparkle {
          0%, 100% { transform: rotate(-8deg) scale(1); }
          50% { transform: rotate(8deg) scale(1.18); }
        }
        @keyframes confettiFall {
          0% { transform: translateY(-15vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(105vh) rotate(720deg); opacity: 0.15; }
        }
        .plush-mascot { position: relative; display: inline-block; flex: 0 0 auto; }
        .mascot-celebrating { animation: mascotBounce .85s ease-in-out infinite; }
        .mascot-accessory {
          position: absolute; z-index: 2; top: 2%; left: 50%; transform: translateX(-50%);
          font-size: 34px; line-height: 1; filter: drop-shadow(0 3px 3px rgba(70,38,88,.22));
        }
        .mascot-accessory-bow { left: 26%; top: 14%; }
        .mascot-accessory-glasses { top: 38%; font-size: 38px; }
        .mascot-accessory-cape { left: 82%; top: 55%; font-size: 31px; }
        .mascot-accessory-party { left: 72%; top: 4%; }
        .mascot-celebrating .mascot-accessory { animation: accessorySparkle .7s ease-in-out infinite; }
        .celebration-confetti {
          position: fixed; top: -10vh; z-index: 61; pointer-events: none;
          animation: confettiFall 2.4s linear forwards;
        }
        .baby-mode button {
          min-height: 38px;
          border-radius: 14px;
          box-shadow: 0 4px 10px rgba(166,93,193,.10);
        }
        .baby-mode input,
        .baby-mode select,
        .baby-mode textarea {
          min-height: 38px;
          border-radius: 14px;
        }
        .baby-mode .baby-shell {
          padding: 10px;
          border-radius: 34px;
          background: rgba(255,255,255,.28);
          box-shadow: 0 18px 55px rgba(166,93,193,.12);
        }
        .baby-mode .nursery-nook {
          position: relative; isolation: isolate; display: block; width: 100%; min-height: 148px;
          margin: -2px 0 16px; overflow: hidden; padding: 22px 18px 14px;
          border: 1px solid #E6BCEB; border-radius: 24px; cursor: pointer;
          background: linear-gradient(135deg, #FFF8FD 0%, #F5EBFF 48%, #E8F9FF 100%);
          box-shadow: inset 0 0 0 4px rgba(255,255,255,.5), 0 10px 24px rgba(166,93,193,.14);
        }
        .baby-mode .nursery-nook::before {
          content: ""; position: absolute; inset: 0; z-index: -1; opacity: .55;
          background: radial-gradient(circle at 18% 24%, #FFFFFF 0 3px, transparent 4px) 0 0 / 32px 32px,
            radial-gradient(circle at 74% 72%, #F3D3FA 0 2px, transparent 3px) 0 0 / 26px 26px;
        }
        .baby-mode .nursery-nook-label { position: absolute; top: 12px; left: 16px; color: #9A62AB; font-size: 9px; font-weight: 900; letter-spacing: .16em; }
        .baby-mode .nursery-cloud { position: absolute; z-index: 0; font-size: 31px; opacity: .78; filter: drop-shadow(0 3px 3px rgba(133,102,170,.12)); }
        .baby-mode .nursery-cloud-left { left: 6%; top: 42px; }
        .baby-mode .nursery-cloud-right { right: 8%; top: 46px; font-size: 25px; }
        .baby-mode .nursery-mobile { position: absolute; z-index: 2; top: -5px; right: 17%; display: flex; align-items: flex-start; gap: 6px; color: #A967C1; font-size: 15px; transform-origin: top center; animation: nurseryMobileSway 3.6s ease-in-out infinite; }
        .baby-mode .nursery-mobile-bar { position: absolute; top: -13px; left: 50%; transform: translateX(-50%) scaleX(2.3); font-size: 38px; line-height: 1; color: #C487D9; }
        .baby-mode .nursery-mobile span:not(.nursery-mobile-bar) { padding-top: 18px; }
        .baby-mode .nursery-toy { position: absolute; z-index: 2; bottom: 16px; font-size: 25px; filter: drop-shadow(0 3px 3px rgba(103,68,127,.15)); }
        .baby-mode .nursery-toy-left { left: 13%; }
        .baby-mode .nursery-toy-right { right: 13%; }
        .baby-mode .nursery-star-lamp { display: grid; justify-items: center; gap: 0; color: #A96E5C; line-height: .62; filter: drop-shadow(0 0 7px rgba(255,209,102,.72)); }
        .baby-mode .nursery-star-lamp span:first-child { font-size: 26px; }
        .baby-mode .nursery-star-lamp span:last-child { font-size: 21px; font-weight: 900; }
        .baby-mode .nursery-toy-basket { display: grid; justify-items: center; line-height: .65; }
        .baby-mode .nursery-toy-basket span:first-child { z-index: 1; margin-bottom: -3px; font-size: 17px; }
        .baby-mode .nursery-toy-basket span:last-child { font-size: 27px; }
        .baby-mode .nursery-mascot { position: relative; z-index: 1; display: flex; justify-content: center; padding-top: 12px; }
        .baby-mode .nursery-nook-caption { position: absolute; z-index: 3; right: 14px; bottom: 10px; color: #9A62AB; font-size: 10px; font-weight: 800; }
        .baby-mode .baby-arrival-ritual { margin: 0 0 12px; padding: 12px 13px; border: 1px solid #E7BFE9; border-radius: 17px; background: linear-gradient(135deg,#FFF8FD,#F4EDFF 60%,#E8F9FF); box-shadow: 0 7px 17px rgba(166,93,193,.10); }
        .baby-mode .baby-arrival-kicker { color: #A057B5; font-size: 9.5px; letter-spacing: .13em; font-weight: 900; }
        .baby-mode .baby-arrival-title { margin-top: 3px; color: #68446F; font-size: 16px; font-weight: 900; }
        .baby-mode .baby-arrival-copy { margin-top: 3px; color: #806D8B; font-size: 11px; line-height: 1.4; }
        .baby-mode .baby-arrival-actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 9px; }
        .baby-mode .baby-arrival-actions button { min-height: 32px; padding: 6px 8px; border: 1px solid #DAC2E7; border-radius: 11px; background: #FFFFFFC9; color: #795686; font-size: 10.5px; font-weight: 900; cursor: pointer; }
        .baby-mode .baby-care-suite { margin: 0 0 14px; padding: 9px 11px; border: 1px solid #E7BFE9; border-radius: 16px; background: linear-gradient(145deg, #FFF9FD, #F4F0FF 55%, #EAF9FF); box-shadow: 0 7px 16px rgba(166,93,193,.10); }
        .baby-mode .baby-care-header { display: flex; width: 100%; align-items: center; justify-content: space-between; gap: 10px; min-height: 0; padding: 2px; border: 0; border-radius: 0; background: transparent; box-shadow: none; cursor: pointer; text-align: left; }
        .baby-mode .baby-care-header-right { display: flex; align-items: center; gap: 7px; flex-shrink: 0; }
        .baby-mode .baby-care-arrow { color: #A057B5; font-size: 20px; font-weight: 900; }
        .baby-mode .baby-care-kicker, .baby-mode .baby-section-label { font-size: 10px; letter-spacing: .12em; font-weight: 900; color: #A057B5; }
        .baby-mode .baby-care-title { margin-top: 2px; color: #68446F; font-size: 14px; font-weight: 900; }
        .baby-mode .baby-sticker { padding: 5px 7px; border: 1px dashed #DDA6E7; border-radius: 10px; background: #FFFFFFAA; color: #8A529A; font-size: 9.5px; font-weight: 900; text-align: center; }
        .baby-mode .baby-care-summary { margin: 6px 2px 1px; color: #856B8B; font-size: 10.5px; font-weight: 700; }
        .baby-mode .baby-milestone, .baby-mode .baby-nursery-unlock, .baby-mode .baby-gentle-empty { margin-top: 11px; padding: 9px 10px; border-radius: 12px; background: rgba(255,255,255,.68); color: #6B5A7D; font-size: 12px; line-height: 1.45; }
        .baby-mode .baby-milestone { border: 1px solid #F0C9DF; }
        .baby-mode .baby-nursery-unlock { border: 1px solid #CDE8F5; }
        .baby-mode .baby-gentle-empty { border: 1px dashed #D7B9E4; }
        .baby-mode .baby-wind-down, .baby-mode .baby-comfort { margin-top: 12px; padding-top: 11px; border-top: 1px solid #EBD8EF; }
        .baby-mode .baby-wind-down-copy { margin-top: 4px; color: #7A6888; font-size: 11.5px; line-height: 1.42; }
        .baby-mode .baby-wind-down-steps, .baby-mode .baby-comfort-actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
        .baby-mode .baby-step, .baby-mode .baby-comfort-actions button { min-height: 32px; padding: 6px 8px; border: 1px solid #DCC2E7; border-radius: 11px; background: #FFFFFFC8; color: #795686; font-size: 11px; font-weight: 800; cursor: pointer; }
        .baby-mode .baby-little-jobs { display: grid; gap: 6px; margin-top: 8px; }
        .baby-mode .baby-little-jobs button { display: flex; align-items: center; gap: 8px; width: 100%; min-height: 42px; padding: 7px 9px; border: 1px solid #DCC2E7; border-radius: 12px; background: #FFFFFFC8; color: #684F75; cursor: pointer; text-align: left; }
        .baby-mode .baby-little-jobs button > span:last-child { min-width: 0; }
        .baby-mode .baby-little-jobs strong { display: block; font-size: 11.5px; line-height: 1.3; }
        .baby-mode .baby-little-jobs small { display: block; margin-top: 2px; color: #927C9E; font-size: 9.5px; line-height: 1.25; }
        .baby-mode .baby-little-jobs-toggle { width: 100%; min-height: 34px; margin-top: 7px; padding: 6px 9px; border: 1px solid #DCC2E7; border-radius: 11px; background: #FFFFFFA8; color: #8E4EAA; font-size: 10.5px; font-weight: 900; cursor: pointer; }
        .baby-mode .baby-little-job-check { flex: 0 0 auto; color: #B768C9; font-size: 20px; line-height: 1; }
        .baby-mode .baby-step-done { border-color: #9FDFC9; background: #E9FFF5; color: #348462; text-decoration: line-through; }
        .baby-mode .baby-wind-down-finished, .baby-mode .baby-comfort-note { margin-top: 8px; padding: 8px 10px; border-radius: 11px; background: #FFF0FA; color: #7A4E83; font-size: 11.5px; font-weight: 800; line-height: 1.42; }
        .baby-mode .baby-comfort-note { background: #F0FBFF; color: #4E7185; }
        .baby-mode .baby-journal-prompt { display: flex; width: 100%; align-items: center; justify-content: space-between; margin-top: 12px; padding: 9px 10px; border: 1px solid #D8B8E3; border-radius: 12px; background: #FFFFFFB8; color: #8D4FA2; font-size: 12px; font-weight: 900; cursor: pointer; }
        .baby-mode .baby-journal-prompt span { font-size: 20px; line-height: .7; }
        .baby-mode .baby-care-footer { margin-top: 9px; color: #9A79A2; font-size: 9.5px; font-weight: 700; text-align: center; }
        .mamas-corner { margin: 0 0 14px; overflow: hidden; border: 1px solid #E7BFE9; border-radius: 18px; background: linear-gradient(145deg,#FFF8FD,#F2EDFF 58%,#EAF9FF); box-shadow: 0 7px 16px rgba(166,93,193,.10); }
        .mamas-corner-header { display: flex; width: 100%; align-items: center; justify-content: space-between; gap: 10px; padding: 11px 12px; border: 0; background: transparent; color: #75428C; cursor: pointer; text-align: left; }
        .mamas-corner-kicker, .mamas-corner-title { display: block; }
        .mamas-corner-kicker { font-size: 9.5px; letter-spacing: .12em; font-weight: 900; color: #A057B5; }
        .mamas-corner-title { margin-top: 2px; font-size: 14px; font-weight: 900; color: #68446F; }
        .mamas-corner-summary { padding: 0 12px 11px; color: #856B8B; font-size: 11px; line-height: 1.4; }
        .mamas-private-window { position: fixed; inset: 0; z-index: 120; display: flex; align-items: stretch; justify-content: center; padding: max(10px, env(safe-area-inset-top)) max(10px, env(safe-area-inset-right)) max(10px, env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-left)); background: rgba(48,35,57,.58); backdrop-filter: blur(8px); }
        .mamas-private-card { display: flex; width: min(620px, 100%); min-height: 0; flex-direction: column; overflow: hidden; border: 1px solid #D8B8E3; border-radius: 22px; background: linear-gradient(160deg,#FFF9FD,#F4EEFF 62%,#EDF9FF); box-shadow: 0 24px 70px rgba(43,25,53,.35); }
        .mamas-private-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 13px 14px; border-bottom: 1px solid #E7D3EC; background: rgba(255,255,255,.72); }
        .mamas-private-header button { min-height: 36px; padding: 7px 12px; border: 1px solid #D9B8E8; border-radius: 11px; background: white; color: #80548E; font-weight: 900; cursor: pointer; }
        .mamas-private-card .mamas-corner-body { display: flex; min-height: 0; flex: 1; flex-direction: column; padding: 12px; }
        .mamas-private-card .mamas-messages { min-height: 180px; max-height: none; flex: 1; }
        .mamas-corner-body { padding: 0 11px 11px; }
        .mamas-corner-note { margin: 0 0 8px; color: #866C8E; font-size: 10px; line-height: 1.42; }
        .mamas-messages { display: grid; gap: 7px; max-height: 260px; overflow-y: auto; padding: 8px; border: 1px solid #E9D4EF; border-radius: 13px; background: rgba(255,255,255,.65); }
        .mamas-message { max-width: 88%; padding: 8px 10px; border-radius: 12px 12px 12px 4px; background: #FFF0FA; color: #644E70; font-size: 12px; line-height: 1.45; white-space: pre-wrap; }
        .mamas-message-user { justify-self: end; border-radius: 12px 12px 4px 12px; background: #EAF5FF; color: #45677D; }
        .mamas-starters { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
        .mamas-starters button { padding: 7px 9px; border: 1px solid #DABEE4; border-radius: 999px; background: #FFFFFFC9; color: #80548E; font-size: 10.5px; font-weight: 900; cursor: pointer; }
        .mamas-starters button:disabled { opacity: .55; cursor: not-allowed; }
        .mamas-compose { display: flex; gap: 7px; align-items: end; margin-top: 8px; }
        .mamas-compose textarea { flex: 1; resize: vertical; padding: 8px 9px; border: 1px solid #DABEE4; background: white; color: #5B4B6B; font: inherit; font-size: 12px; line-height: 1.35; }
        .mamas-compose button { padding: 9px 10px; border: 0; background: #B768C9; color: white; font-weight: 900; cursor: pointer; }
        .mamas-compose button:disabled, .mamas-reset:disabled { opacity: .55; cursor: not-allowed; }
        .mamas-corner-error { margin-top: 7px; color: #A3485F; font-size: 11px; font-weight: 700; }
        .mamas-task-confirm { margin-top: 8px; padding: 9px 10px; border: 1px solid #B9DFF2; border-radius: 12px; background: #F0FAFF; color: #4A6D81; font-size: 11.5px; line-height: 1.4; }
        .mamas-task-confirm > div:last-child { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 7px; }
        .mamas-task-confirm button { min-height: 31px; padding: 6px 8px; border: 1px solid #A9D1E9; border-radius: 10px; background: white; color: #33779C; font-size: 11px; font-weight: 900; cursor: pointer; }
        .mamas-task-confirm button:first-child { border-color: #7ACAA7; background: #E8FFF3; color: #277858; }
        .mamas-task-checkin { width: 100%; min-height: 35px; margin-top: 8px; padding: 7px 9px; border: 1px solid #D6B9E5; border-radius: 11px; background: #FFFFFFC9; color: #80548E; font-size: 11.5px; font-weight: 900; cursor: pointer; }
        .mamas-task-checkin:disabled { opacity: .62; cursor: default; }
        .mamas-reset { margin-top: 7px; padding: 0; border: 0; background: transparent; color: #8D4FA2; font-size: 10.5px; font-weight: 900; text-decoration: underline; cursor: pointer; }
        @keyframes nurseryMobileSway {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
        .baby-mode h1 {
          color: #8C47A8 !important;
          text-shadow: 0 3px 0 #FFFFFF, 0 7px 16px rgba(166,93,193,.22);
        }
        .baby-mode .baby-mode-welcome {
          display: block;
        }
        /* Ambient themes never recolor content. The mascot, title, status
           colors, and controls keep their intentional artwork and contrast;
           each theme changes the surrounding shell and decorative wash only. */
        .appearance-twilight:not(.baby-mode):not(.dino-theme) button,
        .appearance-meadow:not(.baby-mode):not(.dino-theme) button {
          box-shadow: 0 3px 10px rgba(55,43,102,.12);
        }
        .dash-arrow { flex-shrink: 0; }
        @media (max-width: 640px) {
          .dash-arrow { display: none; }
          .today-reflection-grid { grid-template-columns: 1fr !important; gap: 8px !important; }
        }
        @media (max-width: 480px) {
          .app-title { font-size: 22px !important; line-height: 1.08; letter-spacing: -0.035em !important; }
          .baby-mode .nursery-nook { min-height: 108px; margin-bottom: 12px; padding: 16px 14px 10px; border-radius: 19px; }
          .baby-mode .nursery-mascot { height: 82px; padding-top: 0; transform: scale(.78); transform-origin: center bottom; }
          .baby-mode .nursery-nook-label { top: 9px; left: 12px; }
          .baby-mode .nursery-cloud-left { left: 4%; top: 35px; font-size: 24px; }
          .baby-mode .nursery-cloud-right { right: 5%; top: 39px; font-size: 21px; }
          .baby-mode .nursery-toy { bottom: 10px; font-size: 19px; }
          .baby-mode .nursery-toy-left { left: 9%; }
          .baby-mode .nursery-toy-right { right: 9%; }
          .baby-mode .nursery-mobile { right: 12%; transform: scale(.8); transform-origin: top center; }
          .baby-mode .nursery-nook-caption { right: 10px; bottom: 7px; font-size: 8.5px; }
        }
      `}</style>
      {preferences.reduced_motion && <style>{`*,*::before,*::after{animation-duration:0.01ms!important;animation-iteration-count:1!important;transition-duration:0.01ms!important;scroll-behavior:auto!important}`}</style>}
      {autoPopupToShow === "weekly_kickoff" && (
        <div role="dialog" aria-modal="true" aria-labelledby="weekly-kickoff-title" style={{ position: "fixed", inset: 0, zIndex: 60, display: "grid", placeItems: "center", padding: 18, background: "rgba(64,39,80,.46)", backdropFilter: "blur(5px)" }}>
          <div style={{ width: "min(100%, 420px)", padding: "22px 20px", borderRadius: 26, background: "linear-gradient(160deg,#FFFDFE,#FFF0FA 58%,#EBFBFF)", border: "2px solid #D994E7", boxShadow: "0 24px 80px rgba(61,35,78,.3)" }}>
            <div style={{ fontSize: 11, letterSpacing: "0.14em", color: "#A65DC1", fontWeight: 900 }}>📮 A NEW WEEK BEGINS</div>
            <div id="weekly-kickoff-title" style={{ marginTop: 5, fontSize: 20, fontWeight: 900, color: "#75428C" }}>What you wrote last week</div>
            <div style={{ marginTop: 12, padding: "12px 14px", borderRadius: 14, background: "rgba(255,255,255,0.7)", border: "1px solid #E6D0F0" }}>
              {weeklyKickoffNote ? (
                <div style={{ fontSize: 13.5, lineHeight: 1.55, color: "#5B4B6B", whiteSpace: "pre-wrap" }}>{weeklyKickoffNote}</div>
              ) : (
                <div style={{ fontSize: 13, lineHeight: 1.5, color: "#8C6B9E" }}>You didn't write one last week — that's okay. Today's a good day to start. 💛</div>
              )}
            </div>
            {weeklyKickoffNote && (
              <>
                <div style={{ marginTop: 16, fontSize: 14, fontWeight: 800, color: "#6B5A7D", textAlign: "center" }}>
                  Did you complete your intention from last week?
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                  {[
                    ["not_really", "😔", "Not really"],
                    ["a_little", "😕", "A little"],
                    ["okay", "😐", "It was okay"],
                    ["pretty_good", "🙂", "Pretty good"],
                    ["yes", "🎉", "Yes!"],
                  ].map(([value, emoji, label]) => (
                    <button key={value} type="button" onClick={() => saveWeeklyKickoffFeeling(value)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "10px 8px", borderRadius: 14, border: "1px solid #E6D0F0", background: "white", cursor: "pointer", minWidth: 62 }}>
                      <span style={{ fontSize: 26 }}>{emoji}</span>
                      <span style={{ fontSize: 9.5, fontWeight: 800, color: "#8C6B9E" }}>{label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
            <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid #E6D0F0", textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#6B5A7D" }}>Ready for this week?</div>
              <div style={{ marginTop: 4, fontSize: 12, lineHeight: 1.45, color: "#8C6B9E" }}>Write down one intention for the week ahead — just one small thing you want to carry with you.</div>
              <button type="button" onClick={goWriteWeeklyIntention} style={{ marginTop: 10, width: "100%", padding: "11px 14px", borderRadius: 12, border: 0, background: "#A65DC1", color: "white", fontWeight: 900, cursor: "pointer" }}>📝 Write my intention for the week</button>
            </div>
            {weeklyKickoffMessage && <div style={{ marginTop: 10, fontSize: 11.5, color: "#8C6B9E", textAlign: "center" }}>{weeklyKickoffMessage}</div>}
            <button type="button" onClick={() => setWeeklyKickoffOpen(false)} style={{ marginTop: 10, width: "100%", padding: "9px 14px", borderRadius: 12, border: "1px solid #D8C8E2", background: "transparent", color: "#8C6B9E", fontWeight: 800, cursor: "pointer" }}>Not right now</button>
          </div>
        </div>
      )}
      {autoPopupToShow === "changelog" && (
        <div role="dialog" aria-modal="true" aria-labelledby="changelog-title" style={{ position: "fixed", inset: 0, zIndex: 60, display: "grid", placeItems: "center", padding: 18, background: "rgba(64,39,80,.46)", backdropFilter: "blur(5px)" }}>
          <div style={{ width: "min(100%, 420px)", padding: "22px 20px", borderRadius: 26, background: "linear-gradient(160deg,#FFFDFE,#FFF0FA 58%,#EBFBFF)", border: "2px solid #D994E7", boxShadow: "0 24px 80px rgba(61,35,78,.3)" }}>
            <div style={{ fontSize: 11, letterSpacing: "0.14em", color: "#A65DC1", fontWeight: 900 }}>✨ WHAT'S NEW</div>
            <div id="changelog-title" style={{ marginTop: 5, fontSize: 20, fontWeight: 900, color: "#75428C" }}>Here's what's changed</div>
            <div style={{ marginTop: 12, display: "grid", gap: 9 }}>
              {CHANGELOG_ITEMS.map((item) => (
                <div key={item} style={{ fontSize: 13, lineHeight: 1.5, color: "#5B4B6B" }}>{item}</div>
              ))}
            </div>
            <button type="button" onClick={() => updatePreference({ last_seen_changelog: CURRENT_CHANGELOG_VERSION })} style={{ marginTop: 16, width: "100%", padding: "11px 14px", borderRadius: 12, border: 0, background: "#A65DC1", color: "white", fontWeight: 900, cursor: "pointer" }}>Got it! 💛</button>
          </div>
        </div>
      )}
      {shareCardOpen && (
        <div role="dialog" aria-modal="true" aria-labelledby="share-card-title" onClick={() => setShareCardOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 60, display: "grid", placeItems: "center", padding: 18, background: "rgba(64,39,80,.46)", backdropFilter: "blur(5px)" }}>
          <div onClick={(event) => event.stopPropagation()} style={{ width: "min(100%, 380px)" }}>
            <div style={{ padding: "26px 22px", borderRadius: 28, textAlign: "center", background: "linear-gradient(160deg,#FFFDFE,#FFF0FA 55%,#EBFBFF)", border: "2px solid #D994E7", boxShadow: "0 24px 80px rgba(61,35,78,.3)" }}>
              <div style={{ fontSize: 11, letterSpacing: "0.18em", fontWeight: 900, color: "#A65DC1" }}>PLUSHLIFE · MY WEEK</div>
              <PlushMascot outfit={selectedOutfit} size={110} mood={mascotMood} activityDays={activityDaysTotal} darkMode={preferences.dark_mode} />
              <div id="share-card-title" style={{ marginTop: 4, fontSize: 34, fontWeight: 900, color: "#75428C" }}>{weeklyOverallPct}%</div>
              <div style={{ fontSize: 12.5, color: "#8C6B9E", fontWeight: 700 }}>whole-week progress</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 18 }}>
                <div style={{ padding: "10px 6px", borderRadius: 12, background: "#FFFFFFB8" }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#318C79" }}>{careDaysTotal}</div>
                  <div style={{ marginTop: 2, fontSize: 9.5, color: "#8C6B9E" }}>CARE DAYS</div>
                </div>
                <div style={{ padding: "10px 6px", borderRadius: 12, background: "#FFFFFFB8" }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#A65DC1" }}>{earnedBadgeIdSet.size}</div>
                  <div style={{ marginTop: 2, fontSize: 9.5, color: "#8C6B9E" }}>BADGES EARNED</div>
                </div>
                <div style={{ padding: "10px 6px", borderRadius: 12, background: "#FFFFFFB8" }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#4C8FE8" }}>{caringDays}</div>
                  <div style={{ marginTop: 2, fontSize: 9.5, color: "#8C6B9E" }}>CARING DAYS</div>
                </div>
              </div>
              <div style={{ marginTop: 18, fontSize: 11, color: "#8C6B9E" }}>{new Date(`${period.weekStart}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {new Date(`${period.date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
            </div>
            <div style={{ marginTop: 12, textAlign: "center" }}>
              <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.85)" }}>Take a screenshot to share 💛</div>
              <button type="button" onClick={() => setShareCardOpen(false)} style={{ marginTop: 8, padding: "9px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.4)", background: "transparent", color: "white", fontWeight: 800, cursor: "pointer" }}>Close</button>
            </div>
          </div>
        </div>
      )}
      {autoPopupToShow === "check_in" && (
        <div role="dialog" aria-modal="true" aria-labelledby="checkin-popup-title" onClick={() => { setCheckInPopupOpen(false); setCheckInPopupDismissedToday(true); }} style={{ position: "fixed", inset: 0, zIndex: 60, display: "grid", placeItems: "center", padding: 18, background: "rgba(64,39,80,.46)", backdropFilter: "blur(5px)" }}>
          <div onClick={(event) => event.stopPropagation()} style={{ width: "min(100%, 520px)", maxHeight: "min(88vh,760px)", overflowY: "auto", padding: "22px 20px", borderRadius: 26, background: "linear-gradient(160deg,#FFFDFE,#FFF0FA 58%,#EBFBFF)", border: "2px solid #D994E7", boxShadow: "0 24px 80px rgba(61,35,78,.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 11, letterSpacing: "0.14em", color: "#A65DC1", fontWeight: 900 }}>{babyMode ? `🍼 ${babyCaregiverName.toUpperCase()} CHECK-IN` : "🎯 TODAY'S CHECK-IN"}</div>
                <div id="checkin-popup-title" style={{ marginTop: 4, fontSize: 19, fontWeight: 900, color: "#75428C" }}>{babyMode ? "How does my little self feel?" : "How are you today?"}</div>
                {babyMode && <div style={{ marginTop: 5, color: "#8C6B9E", fontSize: 11.5, lineHeight: 1.45 }}>You can pick one feeling, and we will make today soft enough to hold.</div>}
                {babyMode && trackerProfile?.comfort_item_name?.trim() && <div style={{ marginTop: 6, padding: "6px 8px", borderRadius: 9, background: "#FFF8E8", color: "#806536", fontSize: 10.5, fontWeight: 800 }}>🧸 Is {trackerProfile.comfort_item_name.trim()} nearby?</div>}
              </div>
              <button type="button" onClick={() => { setCheckInPopupOpen(false); setCheckInPopupDismissedToday(true); }} aria-label="Close" style={{ padding: "4px 8px", borderRadius: 8, border: "1px solid #D9B8E8", background: "white", color: "#8E4EAA", fontWeight: 900, cursor: "pointer", flexShrink: 0 }}>✕</button>
            </div>
            <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 10.5, letterSpacing: "0.12em", color: "#8E4EAA", fontWeight: 900 }}>{babyMode ? `TELL ${babyCaregiverName.toUpperCase()} YOUR FEELING` : "HOW DO YOU FEEL?"}</div>
              <button type="button" onClick={() => setCheckInMoreMoodsOpen((open) => !open)} style={{ padding: "4px 8px", borderRadius: 999, border: "1px solid #D9B8E8", background: "white", color: "#8E4EAA", fontWeight: 800, fontSize: 10.5, cursor: "pointer" }}>{checkInMoreMoodsOpen ? "Fewer" : "More feelings"}</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginTop: 7 }}>
              {CHECKIN_MOODS.filter(([value]) => checkInMoreMoodsOpen || PRIMARY_CHECKIN_MOODS.includes(value) || dailyCheckIn.mood === value).map(([value, emoji, label]) => (
                <button key={value} type="button" onClick={() => selectCheckInMood(value)} aria-pressed={dailyCheckIn.mood === value} style={{ padding: "9px 4px", borderRadius: 11, border: dailyCheckIn.mood === value ? "2px solid #A65DC1" : "1px solid #E3C9EC", background: dailyCheckIn.mood === value ? "#F7ECFB" : "white", cursor: "pointer", textAlign: "center" }}>
                  <div style={{ fontSize: 18 }}>{emoji}</div><div style={{ marginTop: 2, fontSize: 10, fontWeight: 800, color: "#6B5A7D" }}>{label}</div>
                </button>
              ))}
            </div>
            {dailyCheckIn.mood && dailyCheckIn.capacity && (
              <div style={{ marginTop: 9, padding: "8px 10px", borderRadius: 10, background: "#F7ECFB", color: "#6B5A7D", fontSize: 11.5, lineHeight: 1.4 }}>
                {babyMode ? `${babyCaregiverName}'s gentle guess` : "PlushLife's gentle guess"}: <strong>{DAY_TYPES.find(([value]) => value === dailyCheckIn.day_type)?.[2] || "Full"} Day</strong> · {CAPACITY_LABELS[dailyCheckIn.capacity]} capacity · {ENERGY_LEVELS.find(([value]) => value === dailyCheckIn.energy)?.[2] || "Steady"} energy
              </div>
            )}
            <div style={{ marginTop: 13, fontSize: 10.5, letterSpacing: "0.12em", color: "#4C8FE8", fontWeight: 900 }}>CHOOSE TODAY'S PLAN</div>
            <div style={{ marginTop: 4, fontSize: 11.5, lineHeight: 1.45, color: "#6B7C99" }}>Pick the size of day you actually have. This changes task versions, never what you have already earned.</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(88px,1fr))", gap: 7, marginTop: 7 }}>
              {DAY_TYPES.map(([value, emoji, label, description]) => (
                <button key={value} type="button" onClick={() => selectDayType(value)} aria-pressed={dailyCheckIn.day_type === value} title={description} style={{ padding: "8px 5px", borderRadius: 11, border: dailyCheckIn.day_type === value ? "2px solid #4C8FE8" : "1px solid #CFE4F5", background: dailyCheckIn.day_type === value ? "#EAF4FF" : "white", cursor: "pointer" }}>
                  <div style={{ fontSize: 18 }}>{emoji}</div><div style={{ fontSize: 10.5, fontWeight: 900, color: "#4C6F98" }}>{label}</div>
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setCheckInCustomizeOpen((open) => !open)} aria-expanded={checkInCustomizeOpen} style={{ marginTop: 12, width: "100%", padding: "8px 11px", borderRadius: 11, border: "1px solid #D9B8E8", background: "rgba(255,255,255,.72)", color: "#75428C", fontWeight: 900, fontSize: 11.5, cursor: "pointer" }}>
              {checkInCustomizeOpen ? "Hide extra options" : "Customize today · optional"} {checkInCustomizeOpen ? "⌃" : "⌄"}
            </button>
            {checkInCustomizeOpen && <>
            <div style={{ marginTop: 13, fontSize: 10.5, letterSpacing: "0.12em", color: "#318C79", fontWeight: 900 }}>ENERGY · OPTIONAL</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 7, marginTop: 7 }}>
              {ENERGY_LEVELS.map(([value, emoji, label]) => (
                <button key={value} type="button" onClick={() => saveDailyCheckIn({ energy: value })} aria-pressed={dailyCheckIn.energy === value} style={{ padding: "8px 4px", borderRadius: 11, border: dailyCheckIn.energy === value ? "2px solid #318C79" : "1px solid #CFE8E1", background: dailyCheckIn.energy === value ? "#EAF8F4" : "white", cursor: "pointer" }}>
                  <div style={{ fontSize: 18 }}>{emoji}</div><div style={{ fontSize: 10, fontWeight: 800, color: "#5E766F" }}>{label}</div>
                </button>
              ))}
            </div>
            <div style={{ marginTop: 13, fontSize: 10.5, letterSpacing: "0.12em", color: "#A56D14", fontWeight: 900 }}>WHAT WOULD HELP? · OPTIONAL</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 7 }}>
              {SUPPORT_PREFERENCES.map(([value, emoji, label]) => (
                <button key={value} type="button" onClick={() => saveDailyCheckIn({ support_preference: dailyCheckIn.support_preference === value ? null : value })} aria-pressed={dailyCheckIn.support_preference === value} style={{ padding: "7px 9px", borderRadius: 999, border: dailyCheckIn.support_preference === value ? "2px solid #D4A017" : "1px solid #F0D99E", background: dailyCheckIn.support_preference === value ? "#FFF4CF" : "white", color: "#7B641E", fontWeight: 800, fontSize: 10.5, cursor: "pointer" }}>{emoji} {label}</button>
              ))}
            </div>
            {dailyCheckIn.support_preference && SUPPORT_GUIDANCE[dailyCheckIn.support_preference] && (
              <div style={{ marginTop: 9, padding: "9px 11px", borderRadius: 11, background: "#FFF9E9", border: "1px solid #F0D99E", color: "#6B5A3D", fontSize: 11.5, lineHeight: 1.45 }}>
                {SUPPORT_GUIDANCE[dailyCheckIn.support_preference].text}
                {SUPPORT_GUIDANCE[dailyCheckIn.support_preference].action && (
                  <button type="button" onClick={() => {
                    if (dailyCheckIn.support_preference === "comfort") {
                      setCheckInPopupOpen(false);
                      openCareSession("comfort_item");
                    } else if (dailyCheckIn.support_preference === "practical") {
                      setEssentialsPickerOpen(true);
                    } else if (dailyCheckIn.support_preference === "company") {
                      setCheckInPopupOpen(false);
                      setDashboard("guardian");
                    }
                  }} style={{ display: "block", marginTop: 7, padding: "6px 9px", borderRadius: 8, border: "1px solid #D4A017", background: "white", color: "#8A6A21", fontWeight: 900, fontSize: 11, cursor: "pointer" }}>
                    {SUPPORT_GUIDANCE[dailyCheckIn.support_preference].action}
                  </button>
                )}
              </div>
            )}
            {dailyCheckIn.capacity === "very_low" && !dailyCheckIn.soft_day && (
              <div style={{ marginTop: 12, padding: "9px 11px", borderRadius: 10, background: "#FFF9E9", fontSize: 12.5, color: "#6B5A3D" }}>
                That's okay. Today can be smaller. <button type="button" onClick={() => selectDayType("soft")} style={{ marginLeft: 4, padding: "4px 9px", borderRadius: 7, border: "1px solid #F0D99E", background: "white", color: "#A56D14", fontWeight: 800, fontSize: 11.5, cursor: "pointer" }}>Start a Soft Day</button>
              </div>
            )}
            {(dailyCheckIn.capacity === "very_low" || dailyCheckIn.capacity === "low") && (
              <div style={{ marginTop: 13, paddingTop: 13, borderTop: "1px solid #E6D4F2" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: "#8C6B9E" }}>WHAT COUNTS TODAY</div>
                  <button type="button" onClick={() => setEssentialsPickerOpen(true)} style={{ padding: "4px 8px", borderRadius: 8, border: "1px solid #D9B8E8", background: "white", color: "#8E4EAA", fontWeight: 900, fontSize: 11, cursor: "pointer" }}>{dailyCheckIn.custom_essentials?.length ? "✏️ Change" : "＋ Choose"}</button>
                </div>
                {dailyCheckIn.custom_essentials?.length ? (
                  <div style={{ marginTop: 8, fontSize: 12, color: "#6B5A7D" }}>Showing just these {dailyCheckIn.custom_essentials.length} picks on your Today list.</div>
                ) : (
                  <div style={{ marginTop: 6, fontSize: 12, color: "#8C6B9E" }}>Pick a small handful of today's tasks — your Today list will simplify to just those.</div>
                )}
              </div>
            )}
            </>}
            <button type="button" disabled={!dailyCheckIn.mood} onClick={() => { setCheckInPopupOpen(false); setCheckInPopupDismissedToday(true); }} style={{ marginTop: 16, width: "100%", padding: "10px 14px", borderRadius: 12, border: 0, background: dailyCheckIn.mood ? "#A65DC1" : "#D8C8E2", color: "white", fontWeight: 900, cursor: dailyCheckIn.mood ? "pointer" : "not-allowed" }}>{dailyCheckIn.mood ? (babyMode ? "All done for now 🍼" : "Looks good") : "Choose the closest feeling"}</button>
          </div>
        </div>
      )}
      {comfortToolOpen && (() => {
        const tool = COMFORT_TOOLS.find((t) => t.id === comfortToolOpen);
        if (!tool) return null;
        const showBreathingPacer = !!tool.breathingPacer && !preferences.reduced_motion;
        return (
          <div role="dialog" aria-modal="true" aria-labelledby="comfort-tool-title" onClick={() => setComfortToolOpen(null)} style={{ position: "fixed", inset: 0, zIndex: 60, display: "grid", placeItems: "center", padding: 18, background: "rgba(64,39,80,.46)", backdropFilter: "blur(5px)" }}>
            <div onClick={(event) => event.stopPropagation()} style={{ width: "min(100%, 380px)", padding: "22px 20px", borderRadius: 26, background: "linear-gradient(160deg,#FFFDFE,#FFF0FA 58%,#EBFBFF)", border: "2px solid #D994E7", boxShadow: "0 24px 80px rgba(61,35,78,.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 32 }}>{tool.icon}</div>
                  <div id="comfort-tool-title" style={{ marginTop: 6, fontSize: 19, fontWeight: 900, color: "#75428C" }}>{tool.name}</div>
                </div>
                <button type="button" onClick={() => setComfortToolOpen(null)} aria-label="Close" style={{ padding: "4px 8px", borderRadius: 8, border: "1px solid #D9B8E8", background: "white", color: "#8E4EAA", fontWeight: 900, cursor: "pointer", flexShrink: 0 }}>✕</button>
              </div>
              {showBreathingPacer ? (
                <div style={{ display: "grid", justifyItems: "center", marginTop: 20 }}>
                  <div aria-live="polite" style={{
                    width: breathPhase === "out" ? 90 : 150,
                    height: breathPhase === "out" ? 90 : 150,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    background: "radial-gradient(circle at 35% 30%, #EBC8F6, #B64CCB)",
                    color: "white",
                    fontWeight: 900,
                    fontSize: 14,
                    transition: `width ${breathPhase === "in" ? 4 : breathPhase === "out" ? 6 : 0.3}s ease-in-out, height ${breathPhase === "in" ? 4 : breathPhase === "out" ? 6 : 0.3}s ease-in-out`,
                  }}>
                    {breathPhase === "in" ? "Breathe in…" : breathPhase === "hold" ? "Hold…" : "Breathe out…"}
                  </div>
                  <div style={{ marginTop: 16, fontSize: 12, color: "#7B6888", textAlign: "center", lineHeight: 1.5 }}>Follow the circle for as many rounds as feel helpful, then tap Done.</div>
                </div>
              ) : (
                <div style={{ display: "grid", gap: 9, marginTop: 14 }}>
                  {tool.steps.map((step, index) => (
                    <div key={index} style={{ display: "flex", gap: 9, fontSize: 13.5, lineHeight: 1.5, color: "#5B4B6B" }}>
                      <span style={{ flexShrink: 0, color: "#A65DC1", fontWeight: 900 }}>{index + 1}.</span>
                      <span>{step.replace(/Tigger/gi, comfortItemName)}</span>
                    </div>
                  ))}
                </div>
              )}
              <button type="button" onClick={finishCareSession} style={{ marginTop: 16, width: "100%", padding: "10px 14px", borderRadius: 12, border: 0, background: "#A65DC1", color: "white", fontWeight: 900, cursor: "pointer" }}>Done</button>
            </div>
          </div>
        );
      })()}
      {careOutcomeTool && (
        <div role="dialog" aria-modal="true" aria-labelledby="care-outcome-title" onClick={() => setCareOutcomeTool(null)} style={{ position: "fixed", inset: 0, zIndex: 61, display: "grid", placeItems: "center", padding: 18, background: "rgba(64,39,80,.46)", backdropFilter: "blur(5px)" }}>
          <div onClick={(event) => event.stopPropagation()} style={{ width: "min(100%,390px)", padding: 20, borderRadius: 24, background: "linear-gradient(145deg,#F2FFFB,#FFF7FC)", border: "2px solid #73B7A8", boxShadow: "0 24px 80px rgba(61,35,78,.3)" }}>
            <div id="care-outcome-title" style={{ fontSize: 18, fontWeight: 900, color: "#4F625D" }}>Did that help?</div>
            <div style={{ marginTop: 5, color: "#6B7F78", fontSize: 12, lineHeight: 1.5 }}>Your answer stays private and helps PlushLife learn which tools are useful for you. It never becomes a diagnosis.</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8, marginTop: 13 }}>
              {[["helped","💚 Yes"],["a_little","🌱 A little"],["not_really","🤍 Not really"],["worse","♥ It made things worse"]].map(([value,label]) => <button key={value} type="button" onClick={() => saveCareOutcome(value)} style={{ padding: "10px 8px", borderRadius: 11, border: "1px solid #BFE5D2", background: "white", color: "#526F67", fontWeight: 900, fontSize: 11.5, cursor: "pointer" }}>{label}</button>)}
            </div>
            <button type="button" onClick={() => saveCareOutcome("skipped")} style={{ marginTop: 9, width: "100%", padding: "8px", borderRadius: 10, border: 0, background: "transparent", color: "#7B8F89", fontWeight: 800, cursor: "pointer" }}>Skip</button>
          </div>
        </div>
      )}
      {autoPopupToShow === "notification_nudge" && (
        <div role="dialog" aria-modal="true" aria-labelledby="notif-nudge-title" onClick={dismissNotificationNudge} style={{ position: "fixed", inset: 0, zIndex: 60, display: "grid", placeItems: "center", padding: 18, background: "rgba(64,39,80,.46)", backdropFilter: "blur(5px)" }}>
          <div onClick={(event) => event.stopPropagation()} style={{ width: "min(100%, 380px)", padding: "22px 20px", borderRadius: 26, background: "linear-gradient(160deg,#FFFDFE,#F1FFF9 58%,#EBFBFF)", border: "2px solid #A9DFC4", boxShadow: "0 24px 80px rgba(61,35,78,.3)" }}>
            <div style={{ fontSize: 11, letterSpacing: "0.14em", color: "#268A50", fontWeight: 900 }}>🔔 JUST A THOUGHT</div>
            <div id="notif-nudge-title" style={{ marginTop: 5, fontSize: 19, fontWeight: 900, color: "#1F5C3B" }}>Want a gentle reminder?</div>
            <p style={{ marginTop: 8, fontSize: 13, lineHeight: 1.55, color: "#2F6E48" }}>{notificationNudgeReason}</p>
            <div style={{ display: "flex", gap: 7, marginTop: 14 }}>
              <button type="button" onClick={() => { dismissNotificationNudge(); enableNotifications(); }} style={{ flex: 1, padding: "10px 12px", borderRadius: 11, border: 0, background: "#318C79", color: "white", fontWeight: 900, cursor: "pointer" }}>Turn on notifications</button>
              <button type="button" onClick={dismissNotificationNudge} style={{ flex: 1, padding: "10px 12px", borderRadius: 11, border: "1px solid #A9DFC4", background: "white", color: "#268A50", fontWeight: 800, cursor: "pointer" }}>Not now</button>
            </div>
          </div>
        </div>
      )}
      {essentialsPickerOpen && (
        <div role="dialog" aria-modal="true" aria-labelledby="essentials-picker-title" onClick={() => setEssentialsPickerOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 60, display: "grid", placeItems: "center", padding: 18, background: "rgba(64,39,80,.46)", backdropFilter: "blur(5px)" }}>
          <div onClick={(event) => event.stopPropagation()} style={{ width: "min(100%, 420px)", maxHeight: "82vh", overflowY: "auto", padding: "22px 20px", borderRadius: 26, background: "linear-gradient(160deg,#FFFDFE,#FFF0FA 58%,#EBFBFF)", border: "2px solid #D994E7", boxShadow: "0 24px 80px rgba(61,35,78,.3)" }}>
            <div style={{ fontSize: 11, letterSpacing: "0.14em", color: "#A65DC1", fontWeight: 900 }}>WHAT COUNTS TODAY</div>
            <div id="essentials-picker-title" style={{ marginTop: 5, fontSize: 19, fontWeight: 900, color: "#75428C" }}>Today, enough is...</div>
            <p style={{ marginTop: 6, fontSize: 12.5, color: "#8C6B9E", lineHeight: 1.5 }}>Pick just a few things from today's list. When these are done, today counts as a good day — the rest can wait.</p>
            <div style={{ display: "grid", gap: 7, marginTop: 12 }}>
              {rows.map((r) => {
                const selected = (dailyCheckIn.custom_essentials || []).includes(r.key);
                return (
                  <button key={r.key} type="button" onClick={() => {
                    const current = dailyCheckIn.custom_essentials || [];
                    const next = selected ? current.filter((k) => k !== r.key) : [...current, r.key];
                    saveDailyCheckIn({ custom_essentials: next });
                  }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, border: selected ? "2px solid #A65DC1" : "1px solid #E3C9EC", background: selected ? "#F7ECFB" : "white", textAlign: "left", cursor: "pointer" }}>
                    <span style={{ width: 20, height: 20, borderRadius: 6, border: selected ? "none" : "2px solid #D9B8E8", background: selected ? "#A65DC1" : "transparent", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, flexShrink: 0 }}>{selected ? "✓" : ""}</span>
                    <span style={{ fontSize: 13.5, color: "#5B4B6B" }}>{r.sourceTask && <HabitTypeIcon task={r.sourceTask} />}{r.label}</span>
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 7, marginTop: 14 }}>
              <button type="button" onClick={() => saveDailyCheckIn({ custom_essentials: null })} style={{ flex: 1, padding: "9px 12px", borderRadius: 10, border: "1px solid #D9B8E8", background: "white", color: "#8E4EAA", fontWeight: 800, cursor: "pointer" }}>Clear picks</button>
              <button type="button" onClick={() => setEssentialsPickerOpen(false)} style={{ flex: 1, padding: "9px 12px", borderRadius: 10, border: 0, background: "#A65DC1", color: "white", fontWeight: 900, cursor: "pointer" }}>Done</button>
            </div>
          </div>
        </div>
      )}
      {autoPopupToShow === "intro_intention" && (
        <div role="dialog" aria-modal="true" aria-labelledby="intro-intention-title" style={{ position: "fixed", inset: 0, zIndex: 60, display: "grid", placeItems: "center", padding: 18, background: "rgba(64,39,80,.46)", backdropFilter: "blur(5px)" }}>
          <div style={{ width: "min(100%, 420px)", padding: "22px 20px", borderRadius: 26, background: "linear-gradient(160deg,#FFFDFE,#FFF0FA 58%,#EBFBFF)", border: "2px solid #D994E7", boxShadow: "0 24px 80px rgba(61,35,78,.3)" }}>
            <div style={{ fontSize: 11, letterSpacing: "0.14em", color: "#A65DC1", fontWeight: 900 }}>✨ NEW</div>
            <div id="intro-intention-title" style={{ marginTop: 5, fontSize: 20, fontWeight: 900, color: "#75428C" }}>Set one intention for this week</div>
            <p style={{ marginTop: 8, fontSize: 13, lineHeight: 1.55, color: "#6B5A7D" }}>
              Every Sunday, PlushLife can now remind you what you were carrying that week and let you check in on it. Want to start this week?
            </p>
            <textarea value={introIntentionDraft} onChange={(event) => setIntroIntentionDraft(event.target.value)} maxLength={2000} placeholder="Example: Be a little gentler with myself this week." style={{ width: "100%", boxSizing: "border-box", minHeight: 80, marginTop: 8, padding: 10, borderRadius: 10, border: "1px solid #DCC9E8", resize: "vertical" }} />
            <div style={{ marginTop: 6, fontSize: 10.5, color: "#8C6B9E" }}>Private — only you can ever read this.</div>
            <button type="button" onClick={saveIntroIntention} style={{ marginTop: 12, width: "100%", padding: "11px 14px", borderRadius: 12, border: 0, background: "#A65DC1", color: "white", fontWeight: 900, cursor: "pointer" }}>📝 Save my intention</button>
            {introIntentionMessage && <div style={{ marginTop: 8, fontSize: 11.5, color: "#8C6B9E", textAlign: "center" }}>{introIntentionMessage}</div>}
            <button type="button" onClick={() => dismissIntroIntention(false)} style={{ marginTop: 8, width: "100%", padding: "9px 14px", borderRadius: 12, border: "1px solid #D8C8E2", background: "transparent", color: "#8C6B9E", fontWeight: 800, cursor: "pointer" }}>Not right now</button>
          </div>
        </div>
      )}
      {autoPopupToShow === "celebration" && (
        <div role="dialog" aria-modal="true" aria-labelledby="day-complete-title" onClick={() => setCelebrationOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 60, display: "grid", placeItems: "center", padding: 18, background: "rgba(64,39,80,.46)", backdropFilter: "blur(5px)" }}>
          {!preferences.reduced_motion && ["💛","✨","💜","⭐","🎀","✨","💛","🌟","💜","✨","⭐","🎀"].map((piece, index) => (
            <span key={index} className="celebration-confetti" style={{ left: `${5 + index * 8}%`, animationDelay: `${(index % 5) * 0.12}s`, fontSize: `${18 + index % 3 * 6}px` }}>{piece}</span>
          ))}
          <div onClick={(event) => event.stopPropagation()} style={{ position: "relative", zIndex: 62, width: "min(100%, 390px)", padding: "22px 20px", borderRadius: 26, textAlign: "center", background: "linear-gradient(160deg,#FFFDFE,#FFF0FA 58%,#EBFBFF)", border: "2px solid #D994E7", boxShadow: "0 24px 80px rgba(61,35,78,.3)" }}>
            <PlushMascot outfit={selectedOutfit} size={170} celebrating={!preferences.reduced_motion} mood="excited" activityDays={activityDaysTotal} darkMode={preferences.dark_mode} />
            <div id="day-complete-title" style={{ marginTop: -5, fontSize: 24, fontWeight: 900, color: "#75428C" }}>{celebrationTitleText || voice.celebrationTitles[0]}</div>
            <div style={{ marginTop: 7, fontSize: 13.5, lineHeight: 1.55, color: "#6B5A7D" }}>
              You cared for every required task today. Bonus items are still optional—this day already counts.
            </div>
            <div style={{ marginTop: 11, padding: "8px 10px", borderRadius: 12, background: "#FFFFFFAA", color: "#318C79", fontWeight: 900 }}>
              ♥ {careDaysTotal} essential-care {careDaysTotal === 1 ? "day" : "days"} altogether
            </div>
            {babyMode && <div style={{ marginTop: 8, padding: "8px 10px", borderRadius: 12, background: "#FFF0FA", border: "1px dashed #E1A7D9", color: "#9A4F98", fontSize: 12, fontWeight: 900 }}>🎀 Today’s little-win sticker: Super Cozy Helper</div>}
            <button type="button" onClick={() => setCelebrationOpen(false)} style={{ marginTop: 14, padding: "10px 16px", borderRadius: 12, border: 0, background: "#A65DC1", color: "white", fontWeight: 900, cursor: "pointer" }}>Celebrate my win 💛</button>
          </div>
        </div>
      )}
      {taskHelpDraft && (
        <div role="dialog" aria-modal="true" aria-labelledby="task-help-title" style={{ position: "fixed", inset: 0, zIndex: 66, display: "grid", placeItems: "center", padding: 18, background: "rgba(45,32,56,.45)", backdropFilter: "blur(4px)" }}>
          <div style={{ width: "min(100%, 410px)", padding: 20, borderRadius: 22, background: "#FFFDFE", border: "1px solid #F0C5D8", boxShadow: "0 24px 70px rgba(45,32,56,.25)" }}>
            <div id="task-help-title" style={{ fontSize: 19, fontWeight: 900, color: "#8E4E75" }}>Ask for help with this task</div>
            <div style={{ marginTop: 6, padding: "8px 10px", borderRadius: 10, background: "#FFF8FC", color: "#5B4B6B", fontWeight: 900 }}>{taskHelpDraft.task.task}</div>
            <label style={{ display: "grid", gap: 4, marginTop: 10, fontSize: 10.5, fontWeight: 900, color: "#7D668C" }}>GUARDIAN
              <select value={taskHelpDraft.caregiver_email} onChange={(event) => setTaskHelpDraft((draft) => ({ ...draft, caregiver_email: event.target.value }))} style={{ padding: 9, borderRadius: 9, border: "1px solid #E3C9EC", background: "white" }}>
                {ownedSupportLinks.filter((link) => link.active && link.accepted_at).map((link) => <option key={link.id} value={link.caregiver_email}>{link.label || link.caregiver_email}</option>)}
              </select>
            </label>
            <div style={{ marginTop: 10, fontSize: 10.5, fontWeight: 900, color: "#7D668C" }}>WHAT WOULD HELP?</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
              {[["encouragement","Encourage me"],["practical_help","Practical help"],["company","Quiet company"],["body_double","Body-double"]].map(([value,label]) => <button key={value} type="button" aria-pressed={taskHelpDraft.request_type === value} onClick={() => setTaskHelpDraft((draft) => ({ ...draft, request_type: value }))} style={{ padding: "6px 8px", borderRadius: 999, border: taskHelpDraft.request_type === value ? "2px solid #A65DC1" : "1px solid #E3C9EC", background: taskHelpDraft.request_type === value ? "#F7ECFB" : "white", color: "#76558A", fontWeight: 800, fontSize: 10.5, cursor: "pointer" }}>{label}</button>)}
            </div>
            <textarea value={taskHelpDraft.note} onChange={(event) => setTaskHelpDraft((draft) => ({ ...draft, note: event.target.value }))} maxLength={380} placeholder="Optional note — say what would feel useful." aria-label="Optional Guardian help note" style={{ width: "100%", boxSizing: "border-box", minHeight: 72, marginTop: 10, padding: 9, borderRadius: 9, border: "1px solid #E3C9EC", resize: "vertical" }} />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 13 }}>
              <button type="button" onClick={() => setTaskHelpDraft(null)} style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #D8C8E2", background: "white", color: "#76558A", fontWeight: 900 }}>Never mind</button>
              <button type="button" onClick={sendTaskHelpRequest} style={{ padding: "8px 12px", borderRadius: 10, border: 0, background: "#A65DC1", color: "white", fontWeight: 900 }}>Send request 💛</button>
            </div>
          </div>
        </div>
      )}
      {pendingTaskDelete && (
        <div role="dialog" aria-modal="true" aria-labelledby="delete-task-title" style={{ position: "fixed", inset: 0, zIndex: 65, display: "grid", placeItems: "center", padding: 18, background: "rgba(45,32,56,.45)", backdropFilter: "blur(4px)" }}>
          <div style={{ width: "min(100%, 390px)", padding: 20, borderRadius: 22, background: "#FFFDFE", border: "1px solid #F0B8C4", boxShadow: "0 24px 70px rgba(45,32,56,.25)" }}>
            <div id="delete-task-title" style={{ fontSize: 19, fontWeight: 900, color: "#7A4051" }}>Delete this task?</div>
            <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.5, color: "#6B5A7D" }}>
              <strong>{pendingTaskDelete.label}</strong> will be removed from <strong>{pendingTaskDelete.section}</strong>. Other tasks in that group will stay.
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
  <button type="button" onClick={() => setPendingTaskDelete(null)} style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #D8C8E2", background: "white", color: "#76558A", fontWeight: 900 }}>Keep task</button>
              <button type="button" onClick={() => deleteTrackerTask(pendingTaskDelete.key, pendingTaskDelete.label)} style={{ padding: "8px 12px", borderRadius: 10, border: 0, background: "#C45D74", color: "white", fontWeight: 900 }}>Delete task</button>
            </div>
          </div>
        </div>
      )}
      {editingTaskKey && editTaskDraft && (
        <div role="dialog" aria-modal="true" aria-labelledby="edit-task-title" style={{ position: "fixed", inset: 0, zIndex: 65, display: "grid", placeItems: "center", padding: 18, background: "rgba(45,32,56,.45)", backdropFilter: "blur(4px)" }}>
          <div style={{ width: "min(100%, 460px)", maxHeight: "calc(100dvh - 36px)", overflowY: "auto", padding: 20, borderRadius: 22, background: "#FFFDFE", border: "1px solid #E3C9EC", boxShadow: "0 24px 70px rgba(45,32,56,.25)" }}>
            <div id="edit-task-title" style={{ fontSize: 19, fontWeight: 900, color: "#5B4B6B" }}>Edit task</div>

            <label style={{ display: "grid", gap: 4, marginTop: 12, fontSize: 10.5, fontWeight: 900, color: "#7D668C" }}>
              TASK NAME
              <input value={editTaskDraft.task} onChange={(event) => setEditTaskDraft((draft) => ({ ...draft, task: event.target.value }))} maxLength={240} aria-label="Task name" style={{ width: "100%", boxSizing: "border-box", padding: 9, borderRadius: 10, border: "1px solid #E3C9EC" }} />
            </label>

            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 10.5, fontWeight: 900, color: "#7D668C" }}>LIST</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 6, marginTop: 6 }}>
                {[{ id: "daily", label: "Every day" }, ...DAYS].map((item) => {
                  const selected = editTaskDraft.day_id === item.id;
                  return (
                    <button key={item.id} type="button" aria-pressed={selected} onClick={() => setEditTaskDraft((draft) => ({ ...draft, day_id: item.id, section: taskSectionsForDay(item.id)[0] || draft.section }))} style={{ minWidth: 0, padding: "7px 4px", borderRadius: 9, border: selected ? "2px solid #A65DC1" : "1px solid #DCC9E8", background: selected ? "#F2DEFA" : "white", color: selected ? "#7E3D99" : "#6B5A7D", fontWeight: 900, fontSize: item.id === "daily" ? 10 : 11, cursor: "pointer" }}>
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <label style={{ display: "grid", gap: 4, marginTop: 10, fontSize: 10.5, fontWeight: 900, color: "#7D668C" }}>
              GROUP
              <select value={editTaskDraft.section} onChange={(event) => setEditTaskDraft((draft) => ({ ...draft, section: event.target.value }))} aria-label="Choose section" style={{ width: "100%", boxSizing: "border-box", padding: 9, borderRadius: 10, border: "1px solid #E3C9EC", background: "white" }}>
                {editTaskSectionOptions.map((section) => <option key={section} value={section}>{section}</option>)}
                {editTaskDraft.section !== "__custom__" && !editTaskSectionOptions.includes(editTaskDraft.section) && <option value={editTaskDraft.section}>{editTaskDraft.section}</option>}
                <option value="__custom__">＋ Create a custom section…</option>
              </select>
            </label>
            {editTaskDraft.section === "__custom__" && (
              <input value={editTaskDraft.custom_section} onChange={(event) => setEditTaskDraft((draft) => ({ ...draft, custom_section: event.target.value }))} maxLength={120} aria-label="New section name" placeholder="Name your new section" style={{ width: "100%", boxSizing: "border-box", marginTop: 7, padding: 9, borderRadius: 10, border: "1px solid #E3C9EC" }} />
            )}

            <label style={{ display: "grid", gap: 4, marginTop: 10, fontSize: 10.5, fontWeight: 900, color: "#7D668C" }}>
              HOW OFTEN SHOULD IT COME BACK?
              <select value={editTaskDraft.schedule_type || "weekly"} onChange={(event) => setEditTaskDraft((draft) => ({ ...draft, schedule_type: event.target.value }))} aria-label="Choose repeating schedule" style={{ width: "100%", padding: 9, borderRadius: 10, border: "1px solid #E3C9EC", background: "white" }}>
                <option value="weekly">Every week</option>
                <option value="range">Only between two dates</option>
                <option value="once">Only one time</option>
              </select>
            </label>

            {(editTaskDraft.schedule_type || "weekly") === "weekly" && (
              <div style={{ padding: 9, borderRadius: 10, background: "#FAF7FC", border: "1px solid #E3C9EC", marginTop: 8 }}>
                <div style={{ fontSize: 10.5, fontWeight: 900, color: "#7D668C" }}>SPECIFIC DAYS · OPTIONAL</div>
                <div style={{ display: "flex", gap: 5, marginTop: 7 }}>
                  {[["Weekdays", WEEKDAY_PRESET_IDS], ["Weekend", WEEKEND_PRESET_IDS]].map(([presetLabel, presetDays]) => {
                    const currentDays = Array.isArray(editTaskDraft.schedule_days) ? editTaskDraft.schedule_days : [];
                    const active = presetDays.length === currentDays.length && presetDays.every((id) => currentDays.includes(id));
                    return <button key={presetLabel} type="button" aria-pressed={active} onClick={() => setEditTaskDraft((draft) => ({ ...draft, schedule_days: active ? [] : presetDays }))} style={{ flex: 1, padding: "6px 4px", borderRadius: 8, border: active ? "2px solid #A65DC1" : "1px solid #DCC9E8", background: active ? "#F2DEFA" : "white", color: active ? "#7E3D99" : "#6B5A7D", fontWeight: 900, fontSize: 10.5, cursor: "pointer" }}>{presetLabel}</button>;
                  })}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", gap: 5, marginTop: 7 }}>
                  {DAYS.map((item) => {
                    const currentDays = Array.isArray(editTaskDraft.schedule_days) ? editTaskDraft.schedule_days : [];
                    const selected = currentDays.includes(item.id);
                    return <button key={item.id} type="button" aria-pressed={selected} onClick={() => setEditTaskDraft((draft) => { const days = Array.isArray(draft.schedule_days) ? draft.schedule_days : []; return { ...draft, schedule_days: selected ? days.filter((id) => id !== item.id) : [...days, item.id] }; })} style={{ minWidth: 0, padding: "7px 2px", borderRadius: 8, border: selected ? "2px solid #A65DC1" : "1px solid #DCC9E8", background: selected ? "#F2DEFA" : "white", color: selected ? "#7E3D99" : "#6B5A7D", fontWeight: 900, fontSize: 10, cursor: "pointer" }}>{item.label.slice(0, 3)}</button>;
                  })}
                </div>
                <div style={{ marginTop: 5, fontSize: 10.5, color: "#8C6B9E" }}>{(editTaskDraft.schedule_days || []).length ? "Only appears on the selected days." : `No days selected: uses "${editTaskDraft.day_id === "daily" ? "Every day" : DAYS.find((d) => d.id === editTaskDraft.day_id)?.label}".`}</div>
              </div>
            )}
            {editTaskDraft.schedule_type === "range" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginTop: 8 }}>
                <label style={{ fontSize: 11.5, fontWeight: 800 }}>Starts<input type="date" value={editTaskDraft.start_date || ""} onChange={(event) => setEditTaskDraft((draft) => ({ ...draft, start_date: event.target.value }))} style={{ width: "100%", boxSizing: "border-box", marginTop: 4, padding: 8, borderRadius: 9, border: "1px solid #E3C9EC" }} /></label>
                <label style={{ fontSize: 11.5, fontWeight: 800 }}>Ends<input type="date" value={editTaskDraft.end_date || ""} onChange={(event) => setEditTaskDraft((draft) => ({ ...draft, end_date: event.target.value }))} style={{ width: "100%", boxSizing: "border-box", marginTop: 4, padding: 8, borderRadius: 9, border: "1px solid #E3C9EC" }} /></label>
              </div>
            )}
            {editTaskDraft.schedule_type === "once" && (
              <label style={{ display: "block", fontSize: 11.5, fontWeight: 800, marginTop: 8 }}>Task date<input type="date" value={editTaskDraft.one_time_date || ""} onChange={(event) => setEditTaskDraft((draft) => ({ ...draft, one_time_date: event.target.value }))} style={{ width: "100%", boxSizing: "border-box", marginTop: 4, padding: 8, borderRadius: 9, border: "1px solid #E3C9EC" }} /></label>
            )}

            <label style={{ display: "grid", gap: 4, marginTop: 10, fontSize: 10.5, fontWeight: 900, color: "#7D668C" }}>
              TASK REMINDER TIME · OPTIONAL
              <input type="time" value={editTaskDraft.reminder_time || ""} onChange={(event) => setEditTaskDraft((draft) => ({ ...draft, reminder_time: event.target.value }))} aria-label="Task reminder time" style={{ width: "100%", boxSizing: "border-box", padding: 9, borderRadius: 10, border: "1px solid #E3C9EC" }} />
            </label>

            <label style={{ display: "grid", gap: 4, marginTop: 10, fontSize: 10.5, fontWeight: 900, color: "#7D668C" }}>
              WHAT KIND OF TASK IS THIS?
              <select value={editTaskDraft.habit_type || "regular"} onChange={(event) => setEditTaskDraft((draft) => ({ ...draft, habit_type: event.target.value }))} aria-label="Choose task kind" style={{ width: "100%", padding: 9, borderRadius: 10, border: "1px solid #E3C9EC", background: "white" }}>
                <option value="regular">Regular task</option>
                <option value="build">🌱 Build a habit</option>
                <option value="reduce">🍂 Reduce a habit</option>
              </select>
            </label>

            <label style={{ display: "flex", gap: 7, alignItems: "center", fontSize: 11.5, color: "#6B5A7D", marginTop: 10 }}>
              <input type="checkbox" checked={!!editTaskDraft.is_bonus} onChange={(event) => setEditTaskDraft((draft) => ({ ...draft, is_bonus: event.target.checked }))} /> Optional / bonus task
            </label>

            <label style={{ display: "grid", gap: 4, marginTop: 10, fontSize: 10.5, fontWeight: 900, color: "#7D668C" }}>
              WHY DOES THIS MATTER TO YOU? · OPTIONAL
              <input value={editTaskDraft.why_note || ""} onChange={(event) => setEditTaskDraft((draft) => ({ ...draft, why_note: event.target.value }))} maxLength={300} aria-label="Why this task matters" style={{ width: "100%", boxSizing: "border-box", padding: 9, borderRadius: 10, border: "1px solid #E3C9EC" }} />
            </label>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <button type="button" onClick={() => { setEditingTaskKey(null); setEditTaskDraft(null); }} style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #D8C8E2", background: "white", color: "#76558A", fontWeight: 900 }}>Cancel</button>
              <button type="button" onClick={saveEditedTask} style={{ padding: "8px 12px", borderRadius: 10, border: 0, background: "#A65DC1", color: "white", fontWeight: 900 }}>Save changes</button>
            </div>
            {taskMessage && <div role="status" aria-live="polite" style={{ marginTop: 10, fontSize: 12, color: "#8C6B9E" }}>{taskMessage}</div>}
          </div>
        </div>
      )}
      {onboardingStep > 0 && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "grid", placeItems: "center", padding: 18, background: "rgba(45,32,56,0.42)", backdropFilter: "blur(5px)" }}>
          <div style={{ width: "min(100%, 480px)", maxHeight: "calc(100dvh - 36px)", overflowY: "auto", overscrollBehavior: "contain", padding: 22, borderRadius: 24, background: "#FFFDFE", border: "1px solid #E9D7F0", boxShadow: "0 24px 70px rgba(45,32,56,.25)" }}>
            <div style={{ fontSize: 11, color: "#A65DC1", fontWeight: 900, letterSpacing: ".14em" }}>WELCOME TO PLUSHLIFE · {onboardingStep}/{onboardingTotalSteps}</div>
            {onboardingStep === 1 && <>
              <h2 style={{ margin: "8px 0 6px" }}>How will you use PlushLife? 💛</h2>
              <p style={{ marginTop: 0, fontSize: 12.5, color: "#76558A", lineHeight: 1.5 }}>Set up your own cozy space, connect with a Guardian, or accept an invitation to support someone else.</p>
              <label style={{ display: "grid", gap: 5, marginTop: 12, color: "#6B5A7D", fontWeight: 800 }}>YOUR NAME
                <input value={displayNameDraft} onChange={(event) => setDisplayNameDraft(event.target.value)} maxLength={40} placeholder="What should PlushLife call you?" style={{ padding: "10px", borderRadius: 10, border: "1px solid #DCC9E8" }} />
              </label>
              <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                <button type="button" aria-pressed={onboardingMode === "cozy"} onClick={() => { setOnboardingMode("cozy"); setOnboardingMessage(""); }} style={{ padding: "10px", borderRadius: 10, border: onboardingMode === "cozy" ? "2px solid #A65DC1" : "1px solid #DCC9E8", background: onboardingMode === "cozy" ? "#F7ECFB" : "white", fontWeight: 800 }}>My own cozy space</button>
                <button type="button" aria-pressed={onboardingMode === "guardian"} onClick={() => { setOnboardingMode("guardian"); setOnboardingMessage(""); }} style={{ padding: "10px", borderRadius: 10, border: onboardingMode === "guardian" ? "2px solid #4C8FE8" : "1px solid #DCC9E8", background: onboardingMode === "guardian" ? "#EAF4FF" : "white", fontWeight: 800 }}>My cozy space + a Guardian</button>
                <button type="button" aria-pressed={onboardingMode === "supporter"} onClick={() => { setOnboardingMode("supporter"); setOnboardingMessage(""); }} style={{ padding: "10px", borderRadius: 10, border: onboardingMode === "supporter" ? "2px solid #318C79" : "1px solid #DCC9E8", background: onboardingMode === "supporter" ? "#EAF6F1" : "white", fontWeight: 800 }}>I'm here as a Guardian</button>
              </div>
            </>}
            {onboardingStep === 2 && onboardingMode === "supporter" && <>
              <h2 style={{ margin: "8px 0 6px" }}>You're here to support someone 💛</h2>
              <p style={{ fontSize: 13, lineHeight: 1.55, color: "#6B5A7D" }}>PlushLife will show invitations sent to your signed-in email. Nothing is shared until you accept, and you only see or do what the Cozy explicitly allows.</p>
              {pendingSupportInvites.length > 0
                ? <div style={{ marginTop: 10, padding: 11, borderRadius: 11, background: "#FFF9E9", border: "1px solid #F0D99E", color: "#7A5A18", fontSize: 12.5, fontWeight: 800 }}>You have {pendingSupportInvites.length} Guardian invitation{pendingSupportInvites.length === 1 ? "" : "s"} waiting.</div>
                : <div style={{ marginTop: 10, padding: 11, borderRadius: 11, background: "#F5FAFF", border: "1px solid #CFE4F5", color: "#4C6E8E", fontSize: 12.5 }}>No invitation is visible yet. Ask your Cozy to invite this exact email, then refresh the Guardian screen.</div>}
            </>}
            {onboardingStep === 2 && onboardingMode === "guardian" && <>
              <h2 style={{ margin: "8px 0 6px" }}>Add your Guardian 💛</h2>
              <p style={{ color: "#6B5A7D", lineHeight: 1.55 }}>Enter their email. They will get a sign-in invitation; if they already use PlushLife, they can sign in with that same email.</p>
              <label style={{ display: "grid", gap: 5, color: "#6B5A7D", fontWeight: 800 }}>GUARDIAN EMAIL
                <input type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="guardian@example.com" style={{ padding: "10px", borderRadius: 10, border: "1px solid #B9DCF6" }} />
              </label>
              <div style={{ marginTop: 10, fontSize: 11, fontWeight: 800, color: "#4C8FE8" }}>WHAT'S THEIR ROLE?</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6, marginTop: 6 }}>
                {GUARDIAN_ROLE_PRESETS.map((role) => (
                  <button key={role.id} type="button" onClick={() => setGuardianRolePreset(role.id)} aria-pressed={guardianRolePreset === role.id} style={{ padding: "8px 6px", borderRadius: 10, border: guardianRolePreset === role.id ? "2px solid #4C8FE8" : "1px solid #B9DCF6", background: guardianRolePreset === role.id ? "#EAF4FF" : "white", textAlign: "center", cursor: "pointer" }}>
                    <div style={{ fontSize: 16 }}>{role.icon}</div>
                    <div style={{ marginTop: 2, fontSize: 10.5, fontWeight: 800, color: "#4C6E8E" }}>{role.label}</div>
                  </button>
                ))}
              </div>
              {(() => {
                const selectedRole = GUARDIAN_ROLE_PRESETS.find((role) => role.id === guardianRolePreset);
                return selectedRole && <div style={{ marginTop: 6, fontSize: 11, lineHeight: 1.4, color: "#6B7E98" }}>{selectedRole.description}</div>;
              })()}
            </>}
            {((onboardingMode === "cozy" && onboardingStep === 2) || (onboardingMode === "guardian" && onboardingStep === 3)) && <>
              <h2 style={{ margin: "8px 0 6px" }}>One comforting detail 🧸</h2>
              <p style={{ color: "#6B5A7D", lineHeight: 1.55 }}>Optional: name a comfort item. You can change this later.</p>
              <input value={comfortItemDraft} onChange={(event) => setComfortItemDraft(event.target.value)} maxLength={80} placeholder="Example: favorite plush" aria-label="Comfort item name" style={{ width: "100%", boxSizing: "border-box", padding: "10px", borderRadius: 10, border: "1px solid #DCC9E8" }} />
            </>}
            {((onboardingMode === "cozy" && onboardingStep === 3) || (onboardingMode === "guardian" && onboardingStep === 4)) && <>
              <h2 style={{ margin: "8px 0 6px" }}>Pick a starting point 🌱</h2>
              <p style={{ color: "#6B5A7D", lineHeight: 1.55 }}>Optional — just a head start. You can add, edit, or delete anything afterward.</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 7, marginTop: 10 }}>
                {TEMPLATE_PACKS.map((pack) => (
                  <button key={pack.id} type="button" onClick={() => setSelectedTemplateId(pack.id)} aria-pressed={selectedTemplateId === pack.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "10px 6px", borderRadius: 12, border: selectedTemplateId === pack.id ? "2px solid #A65DC1" : "1px solid #DCC9E8", background: selectedTemplateId === pack.id ? "#F7ECFB" : "white", textAlign: "center", cursor: "pointer" }}>
                    <span style={{ fontSize: 20 }}>{pack.emoji}</span>
                    <span style={{ fontSize: 11.5, fontWeight: 800, color: "#5B4B6B", lineHeight: 1.25 }}>{pack.label}</span>
                    <span style={{ fontSize: 9.5, color: "#9A86A7", lineHeight: 1.3 }}>{pack.tasks.length > 0 ? pack.tasks.slice(0, 2).map((item) => item.task).join(" · ") + (pack.tasks.length > 2 ? "…" : "") : "Build it yourself"}</span>
                  </button>
                ))}
              </div>
              {(() => {
                const selectedPack = TEMPLATE_PACKS.find((pack) => pack.id === selectedTemplateId);
                if (!selectedPack) return null;
                return (
                  <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 12, background: "#F7ECFB", border: "1px solid #E3C9EC" }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#8E4EAA" }}>{selectedPack.emoji} {selectedPack.label}</div>
                    <div style={{ marginTop: 4, fontSize: 11.5, color: "#6B5A7D", lineHeight: 1.5 }}>{selectedPack.tasks.length > 0 ? selectedPack.tasks.map((item) => item.task).join(" · ") : "No starter tasks — build it all yourself."}</div>
                  </div>
                );
              })()}
            </>}
            {((onboardingMode === "cozy" && onboardingStep === 4) || (onboardingMode === "guardian" && onboardingStep === 5)) && <>
              <h2 style={{ margin: "8px 0 6px" }}>What you're working toward 🧸</h2>
              <p style={{ color: "#6B5A7D", lineHeight: 1.55 }}>
                As you check things off, your plush mascot earns new outfits and badges — for showing up day after day, for building a good habit, or for gently reducing one you're working on.
              </p>
              <p style={{ marginTop: 8, color: "#6B5A7D", lineHeight: 1.55 }}>
                Missing a day never takes anything away. You can see what you've unlocked (and what's next) anytime from 🏅 Rewards.
              </p>
            </>}
            {((onboardingMode === "cozy" && onboardingStep === 5) || (onboardingMode === "guardian" && onboardingStep === 6)) && <>
              <h2 style={{ margin: "8px 0 6px" }}>One intention for this week 📮</h2>
              <p style={{ color: "#6B5A7D", lineHeight: 1.55 }}>Optional — just one small thing you want to carry with you this week. Every Sunday, PlushLife will remind you what you wrote and let you check in on it.</p>
              <textarea value={onboardingIntentionDraft} onChange={(event) => setOnboardingIntentionDraft(event.target.value)} maxLength={2000} placeholder="Example: Be a little gentler with myself this week." style={{ width: "100%", boxSizing: "border-box", minHeight: 80, marginTop: 8, padding: 10, borderRadius: 10, border: "1px solid #DCC9E8", resize: "vertical" }} />
              <div style={{ marginTop: 6, fontSize: 10.5, color: "#8C6B9E" }}>Private — only you can ever read this. You can skip this and write one later too.</div>
            </>}
            {((onboardingMode === "cozy" && onboardingStep === 6) || (onboardingMode === "guardian" && onboardingStep === 7)) && <>
              <h2 style={{ margin: "8px 0 6px" }}>You're ready ✨</h2>
              <p style={{ color: "#6B5A7D", lineHeight: 1.55 }}>{(TEMPLATE_PACKS.find((pack) => pack.id === selectedTemplateId)?.tasks.length ?? 0) > 0 ? `PlushLife will begin with your ${TEMPLATE_PACKS.find((pack) => pack.id === selectedTemplateId)?.label.toLowerCase()} tasks.` : "You chose to start from scratch — add your first task once you're in."} Soft Plush is your default theme.</p>
              <div style={{ marginTop: 14, paddingTop: 13, borderTop: "1px solid #E9DAF2" }}>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: "#6B5A7D" }}>One last thing, totally optional 💛</div>
                <div style={{ marginTop: 3, fontSize: 12, color: "#8C6B9E" }}>What brings you here? Your choice changes a few starting settings, and you can change them later.</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  {[
                    ["general", "🌿 General self-care"],
                    ["focus", "🎯 ADHD / focus support"],
                    ["burnout", "🕊️ Recovering from burnout"],
                    ["plain", "≡ Just a normal tracker"],
                  ].map(([value, label]) => (
                    <button key={value} type="button" onClick={() => setOnboardingReason((current) => current === value ? null : value)} aria-pressed={onboardingReason === value} style={{ padding: "7px 11px", borderRadius: 999, border: onboardingReason === value ? "2px solid #A65DC1" : "1px solid #DCC9E8", background: onboardingReason === value ? "#F7ECFB" : "white", color: "#5B4B6B", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>{label}</button>
                  ))}
                </div>
                {onboardingReason && (
                  <div aria-live="polite" style={{ marginTop: 8, padding: "8px 10px", borderRadius: 10, background: "#F7ECFB", border: "1px solid #E3C9EC", color: "#6B5A7D", fontSize: 11.5, lineHeight: 1.45 }}>
                    {ONBOARDING_REASON_PROFILES[onboardingReason]?.description}
                  </div>
                )}
              </div>
              <div style={{ marginTop: 14, paddingTop: 13, borderTop: "1px solid #E9DAF2" }}>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: "#6B5A7D" }}>🔔 Want gentle reminders?</div>
                <div style={{ marginTop: 3, fontSize: 12, color: "#8C6B9E" }}>Also optional. PlushLife can send a check-in nudge at times you choose — nothing pushy, and you can turn it off anytime.</div>
                {preferences.notifications_enabled ? (
                  <div style={{ marginTop: 8, fontSize: 12.5, fontWeight: 800, color: "#318C79" }}>🔔 Notifications are on</div>
                ) : (
                  <button type="button" onClick={enableNotifications} style={{ marginTop: 8, padding: "8px 12px", borderRadius: 10, border: 0, background: "#318C79", color: "white", fontWeight: 900, fontSize: 12.5, cursor: "pointer" }}>Turn on notifications</button>
                )}
                {settingsMessage && <div style={{ marginTop: 6, fontSize: 11, color: "#8C6B9E" }}>{settingsMessage}</div>}
              </div>
            </>}
            {onboardingMessage && <div style={{ marginTop: 11, fontSize: 12, color: "#B0576B", lineHeight: 1.45 }}>{onboardingMessage}</div>}
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 18 }}>
              <button disabled={onboardingStep === 1} onClick={() => setOnboardingStep((step) => Math.max(1, step - 1))} style={{ padding: "9px 13px", borderRadius: 10, border: "1px solid #DCC9E8", background: "white", color: "#76558A", fontWeight: 800, opacity: onboardingStep === 1 ? .4 : 1 }}>Back</button>
              {onboardingStep < onboardingTotalSteps ? <button onClick={() => {
                if (onboardingStep === 1 && !displayNameDraft.trim()) {
                  setOnboardingMessage("Add your name to continue.");
                  return;
                }
                if (onboardingStep === 1 && !onboardingMode) {
                  setOnboardingMessage("Choose how you'll use PlushLife to continue.");
                  return;
                }
                if (onboardingMode === "guardian" && onboardingStep === 2 && (!inviteEmail.trim() || !inviteEmail.includes("@"))) {
                  setOnboardingMessage("Add your guardian's email address to continue.");
                  return;
                }
                setOnboardingMessage("");
                setOnboardingStep((step) => step + 1);
              }} style={{ padding: "9px 15px", borderRadius: 10, border: 0, background: "#A65DC1", color: "white", fontWeight: 900 }}>Next</button> : <button onClick={completeOnboarding} style={{ padding: "9px 15px", borderRadius: 10, border: 0, background: "#318C79", color: "white", fontWeight: 900 }}>{onboardingMode === "supporter" ? "Open Guardian invitations 💛" : "Open my tracker ✨"}</button>}
            </div>
          </div>
        </div>
      )}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", zIndex: 0, overflow: "visible" }}>
        {(preferences.simple_mode ? [] : (babyMode ? [
          { e: "🧸", top: "2%", left: "4%", size: 52 }, { e: "🍼", top: "4%", left: "84%", size: 52 },
          { e: "🌈", top: "24%", left: "6%", size: 42 }, { e: "⭐", top: "30%", left: "88%", size: 34 },
          { e: "✦", top: "58%", left: "3%", size: 36 }, { e: "🐥", top: "64%", left: "90%", size: 40 },
          { e: "🧸", top: "88%", left: "6%", size: 44 }, { e: "🍼", top: "92%", left: "84%", size: 40 },
        ] : dinoTheme ? [
          { e: "🦕", top: "2%", left: "4%", size: 54 }, { e: "🦖", top: "4%", left: "82%", size: 58 },
          { e: "🌴", top: "22%", left: "88%", size: 38 }, { e: "🥚", top: "28%", left: "6%", size: 28 },
          { e: "🦴", top: "56%", left: "4%", size: 26 }, { e: "🦕", top: "60%", left: "86%", size: 46 },
          { e: "🌋", top: "86%", left: "8%", size: 36 }, { e: "🦖", top: "90%", left: "80%", size: 44 },
        ] : [])).map((d, i) => (
          <span key={i} style={{ position: "absolute", top: d.top, left: d.left, fontSize: d.size, opacity: 0.4 }}>
            {d.e}
          </span>
        ))}
      </div>
      <div className="baby-shell" style={{ position: "relative", zIndex: 1 }}>

      <div
        onTouchStart={(event) => { swipeStartX.current = event.touches[0]?.clientX ?? null; swipeStartY.current = event.touches[0]?.clientY ?? null; }}
        onTouchEnd={(event) => {
          const startX = swipeStartX.current;
          const startY = swipeStartY.current;
          const endX = event.changedTouches[0]?.clientX;
          const endY = event.changedTouches[0]?.clientY;
          swipeStartX.current = null;
          swipeStartY.current = null;
          if (startX == null || endX == null || startY == null || endY == null) return;
          const deltaX = endX - startX;
          const deltaY = endY - startY;
          if (Math.abs(deltaX) < 60 || Math.abs(deltaX) < Math.abs(deltaY) * 1.5) return;
          stepDashboard(deltaX < 0 ? 1 : -1);
        }}
        style={{ maxWidth: 520, margin: "0 auto", touchAction: "pan-y" }}>
        {/* The routine "signed in and synced" state moved into Settings — it
            doesn't need to occupy the top of every screen. A real problem
            (offline or a failed sync) still surfaces here since that's worth
            noticing right away, not only after opening Settings. */}
        {user ? (
          (!online || syncStatus === "offline" || syncStatus === "error") && (
            <div style={{ marginBottom: 14, padding: "9px 12px", borderRadius: 12, background: "rgba(255,255,255,0.55)", border: "1px solid #F3D9EC", fontSize: 12.5, color: "#8C6B9E" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                <span>{!online || syncStatus === "offline" ? "📡 Offline — changes will wait for a connection" : "⚠️ Sync failed"}</span>
                <button type="button" disabled={syncStatus === "syncing"} onClick={syncNow} style={{ padding: "5px 8px", borderRadius: 8, border: "1px solid #D7B8E2", background: "white", color: "#8D5CA5", fontWeight: 800, fontSize: 11, cursor: syncStatus === "syncing" ? "wait" : "pointer" }}>
                  {syncStatus === "error" ? "Retry" : "Sync now"}
                </button>
              </div>
            </div>
          )
        ) : (
          <div style={{ marginBottom: 14, padding: "9px 12px", borderRadius: 12, background: "rgba(255,255,255,0.55)", border: "1px solid #F3D9EC", fontSize: 12.5, color: "#8C6B9E" }}>
            ☁️ Sign in to keep checkmarks on every device
          </div>
        )}
        {!user && showSignIn && (
          <div style={{ margin: "-5px 0 14px", padding: 12, borderRadius: 12, background: "rgba(255,255,255,0.7)", border: "1px solid #F3D9EC" }}>
            <div style={{ fontSize: 12, color: "#8C6B9E", marginBottom: 8 }}>Use the same email on your phone and computer.</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" aria-label="Email address" style={{ flex: 1, minWidth: 0, padding: "8px 10px", borderRadius: 9, border: "1px solid #E3B8D8", fontSize: 13, color: "#5B4B6B", outline: "none" }} />
              <button onClick={sendSignInLink} style={{ padding: "8px 10px", borderRadius: 9, border: "1px solid #A65DC1", background: "#C77DD6", color: "white", fontWeight: 700, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>Send link</button>
            </div>
            {signInMessage && <div style={{ marginTop: 8, fontSize: 12, color: "#8C6B9E" }}>{signInMessage}</div>}
          </div>
        )}
        <div style={{ marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, letterSpacing: "0.18em", color: "#B08AC7", fontWeight: 700 }}>{babyMode ? "WELCOME TO YOUR LITTLE NURSERY 🧸🍼✨" : dinoTheme ? "ONE LITTLE STEP AT A TIME 🦕✨" : "ONE LITTLE STEP AT A TIME ✨"}</div>
            <h1 className="app-title" style={{ fontSize: 28, margin: "6px 0 0", fontWeight: 800, letterSpacing: "-0.02em" }}>
              {user ? personalPlushlistTitle : "PlushLife"} 💜
            </h1>
          </div>
          {user && <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <button type="button" onClick={() => setCollectionOpen(true)} aria-label={`Open rewards, ${unlockedOutfits.length} outfits and ${earnedBadgeIdSet.size} badges unlocked`} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 46, height: 46, padding: 0, borderRadius: "50%", border: "1px solid #E9C96E", background: "#FFFDF4", cursor: "pointer", overflow: "hidden" }}>
              <PlushMascot outfit={selectedOutfit} size={46} mood="happy" activityDays={activityDaysTotal} darkMode={preferences.dark_mode} />
            </button>
            <button type="button" onClick={() => setProfileOpen(true)} aria-label={unreadNoteCount > 0 ? `Open profile, ${unreadNoteCount} unread notes` : "Open profile"} style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: 46, height: 46, padding: 0, borderRadius: "50%", border: "1px solid #E6D4F2", background: "#FFFFFFCC", color: "#8D5CA5", fontSize: 19, cursor: "pointer" }}>
              👤
              {unreadNoteCount > 0 && <span aria-hidden="true" style={{ position: "absolute", top: -3, right: -3, minWidth: 18, height: 18, padding: "0 4px", borderRadius: 9, background: "#C45D74", color: "white", fontSize: 10.5, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>{unreadNoteCount}</span>}
            </button>
          </div>}
        </div>

        {user && babyMode && dashboard === "today" && !betaBannerDismissed && (
          <div style={{ marginBottom: 14, display: "flex", justifyContent: "flex-start" }}>
            <button type="button" onClick={() => setTodayExtrasOpen((open) => !open)} aria-expanded={todayExtrasOpen} style={{ padding: "6px 11px", borderRadius: 999, border: "1px solid #E6D4F2", background: "#FFFFFFAA", color: "#8C6B9E", fontWeight: 800, fontSize: 11.5, cursor: "pointer" }}>
              {todayExtrasOpen ? "🧸 Hide nursery greeting" : "🧸 Show nursery greeting"}
            </button>
          </div>
        )}
        {user && babyMode && dashboard === "today" && todayExtrasOpen && (
          <NurseryNook
            outfit={selectedOutfit}
            mood={mascotMood}
            activityDays={activityDaysTotal}
            onOpenCloset={() => setCollectionOpen(true)}
          />
        )}
        {user && babyMode && dashboard === "today" && todayExtrasOpen && (
          <BabyArrivalRitual
            comfortItemName={trackerProfile?.comfort_item_name?.trim() || ""}
            onShowTinyThing={() => setTodayCardIndex(1)}
            onSoftDay={() => selectDayType("soft")}
            onShowPlanner={() => setTodayCardIndex(1)}
          />
        )}

        {user && (betaBannerDismissed ? (
          <div style={{ marginBottom: 16, display: "flex", justifyContent: "flex-start", gap: 7, flexWrap: "wrap" }}>
            {babyMode && dashboard === "today" && <button type="button" onClick={() => setTodayExtrasOpen((open) => !open)} aria-expanded={todayExtrasOpen} style={{ padding: "6px 11px", borderRadius: 999, border: "1px solid #E6D4F2", background: "#FFFFFFAA", color: "#8C6B9E", fontWeight: 800, fontSize: 11.5, cursor: "pointer" }}>{todayExtrasOpen ? "🧸 Hide nursery greeting" : "🧸 Show nursery greeting"}</button>}
            <button type="button" onClick={goToFeedback} title="This is an early test build" style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 999, border: "1px solid #B9DCF6", background: "#EAF4FF99", color: "#2D6BB5", fontWeight: 800, fontSize: 10.5, cursor: "pointer" }}>🧪 Test build · Feedback</button>
          </div>
        ) : (
          <div style={{ marginBottom: 16, padding: "12px 14px", borderRadius: 14, background: "#EAF4FF", border: "1px solid #B9DCF6", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 200px" }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: "#2D6BB5" }}>🧪 You're using an early test build</div>
              <div style={{ marginTop: 2, fontSize: 11.5, color: "#4C7AA8" }}>Things may change or break sometimes. Found something odd? Tell me — it helps a lot.</div>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button type="button" onClick={goToFeedback} style={{ padding: "7px 11px", borderRadius: 9, border: 0, background: "#4C8FE8", color: "white", fontWeight: 900, fontSize: 12, cursor: "pointer" }}>💌 Send feedback</button>
              <button type="button" onClick={dismissBetaBanner} aria-label="Dismiss test build notice" style={{ padding: "7px 9px", borderRadius: 9, border: "1px solid #B9DCF6", background: "white", color: "#2D6BB5", fontWeight: 900, cursor: "pointer" }}>✕</button>
            </div>
          </div>
        ))}

        {!user ? (
          <div style={{ padding: 22, borderRadius: 20, textAlign: "center", background: "rgba(255,255,255,0.72)", border: "1px solid #E6D4F2", boxShadow: "0 8px 24px rgba(183,143,224,0.10)" }}>
            <div style={{ fontSize: 34 }}>🔒</div>
            <div style={{ marginTop: 7, fontSize: 20, fontWeight: 900, color: "#5B4B6B" }}>Your tracker is private</div>
            <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.55, color: "#8C6B9E" }}>
              Sign in to view the schedule, checklist, weekly progress, guardian notes, and rewards.
            </div>
            <button onClick={() => setShowSignIn(true)} style={{ marginTop: 14, padding: "10px 16px", borderRadius: 11, border: 0, background: "#C77DD6", color: "white", fontWeight: 900, cursor: "pointer" }}>
              Sign in to my tracker
            </button>
          </div>
        ) : (
          <>

        {/* Dashboards */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
          <div role="tablist" aria-label="PlushLife dashboards" onKeyDown={(event) => {
            if (event.key === "ArrowRight") { event.preventDefault(); stepDashboard(1); }
            else if (event.key === "ArrowLeft") { event.preventDefault(); stepDashboard(-1); }
          }} style={{ flex: 1, display: "grid", gridTemplateColumns: `repeat(${dashboardItems.length}, minmax(0, 1fr))`, gap: 6, minWidth: 0 }}>
            {dashboardItems.map((item) => {
              const on = item.id === dashboard;
              const displayLabel = babyMode && item.id === "today" ? "Nursery" : item.label;
              return <button key={item.id} id={`dashboard-tab-${item.id}`} role="tab" aria-selected={on} onClick={() => goToDashboard(item.id)} style={{ position: "relative", minHeight: 52, padding: "7px 3px", borderRadius: 13, border: on ? `2px solid ${item.accent}` : "2px solid #F3D9EC", background: on ? `${item.accent}22` : "#FFFFFF", color: on ? item.accent : "#8C6B9E", fontWeight: 900, fontSize: displayLabel.length > 10 ? 9.5 : 11, lineHeight: 1.15, overflowWrap: "break-word", wordBreak: "break-word", cursor: "pointer" }}>
                <span style={{ display: "block", fontSize: 16, marginBottom: 2 }} aria-hidden="true">{item.icon}</span>{displayLabel}
              </button>;
            })}
          </div>
        </div>

        {dashboard === "today" && (
          <div style={{ display: "flex", alignItems: "center", gap: 7, margin: "-2px 0 14px", flexWrap: "wrap" }}>
            <button type="button" onClick={() => setCheckInPopupOpen(true)} style={{ flex: "1 1 220px", display: "flex", alignItems: "center", gap: 7, padding: "9px 11px", borderRadius: 11, border: "1px solid #E6D4F2", background: "#FFFFFFC7", color: "#76558A", fontWeight: 800, fontSize: 12, cursor: "pointer", textAlign: "left" }}>
              {babyMode ? "🍼 How does my little self feel?" : "🎯"} {dailyCheckIn.mood ? `${CHECKIN_MOODS.find(([value]) => value === dailyCheckIn.mood)?.[1] || ""} ${CHECKIN_MOODS.find(([value]) => value === dailyCheckIn.mood)?.[2] || ""}` : dailyCheckIn.capacity ? { very_low: "😞 Very low", low: "😕 Low", usual: "🙂 Usual", high: "💪 High" }[dailyCheckIn.capacity] : babyMode ? "Tell me when you are ready" : "Check in"}
              {dailyCheckIn.day_type ? ` · ${DAY_TYPES.find(([value]) => value === dailyCheckIn.day_type)?.[2] || dailyCheckIn.day_type}` : ""}
              {dailyCheckIn.custom_essentials?.length ? ` · ${dailyCheckIn.custom_essentials.length} picked` : ""}
              <span style={{ marginLeft: "auto", color: "#A65DC1", fontSize: 11 }}>{babyMode ? "Tell me" : "Change"}</span>
            </button>
            {dailyCheckIn.day_type && dailyCheckIn.day_type !== "full" && <button type="button" onClick={() => selectDayType("full")} style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #E6D4F2", background: "white", color: "#76558A", fontWeight: 800, fontSize: 11.5, cursor: "pointer" }}>Full Day</button>}
            {rows.some((row) => row.sourceTask?.schedule_type === "once" && !viewDone[row.key]) && ["soft", "tiny", "recovery"].includes(dailyCheckIn.day_type) && <button type="button" onClick={moveAllOneTimeTasksToTomorrow} style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #E7C98D", background: "#FFFBF2", color: "#9A6918", fontWeight: 800, fontSize: 11.5, cursor: "pointer" }}>Move extras</button>}
          </div>
        )}

        <CarePanel open={dashboard === "care"} babyMode={babyMode} setCheckInPopupOpen={setCheckInPopupOpen} babyCaregiverName={babyCaregiverName} careSituationsExpanded={careSituationsExpanded} setCareSituationsExpanded={setCareSituationsExpanded} setCareMessage={setCareMessage} openCareSession={openCareSession} careMessage={careMessage} isMamaCornerProfile={isMamaCornerProfile} careExtraSupportOpen={careExtraSupportOpen} setCareExtraSupportOpen={setCareExtraSupportOpen} user={user} preferences={preferences} rows={rows} viewDone={viewDone} toggle={toggle} supabase={supabase} careSection={careSection} setCareSection={setCareSection} careSessionHistory={careSessionHistory} HELP_ME_NOW_OPTIONS={HELP_ME_NOW_OPTIONS} pathProgress={pathProgress} setSelectedCarePath={setSelectedCarePath} period={period} setSleepToolOpen={setSleepToolOpen} soundscapePlaying={soundscapePlaying} toggleSoundscape={toggleSoundscape} soundscapeVolume={soundscapeVolume} changeSoundscapeVolume={changeSoundscapeVolume} setSoundscapeSleepTimer={setSoundscapeSleepTimer} soundscapeTimerMinutes={soundscapeTimerMinutes} />
        <ProfilePanel open={profileOpen} onClose={() => setProfileOpen(false)} pendingSupportInvites={pendingSupportInvites} hasOwnGuardian={hasOwnGuardian} goToDashboard={goToDashboard} setSettingsOpen={setSettingsOpen} setSafetyOpen={setSafetyOpen} setHelpOpen={setHelpOpen} goToFeedback={goToFeedback} isAdminUser={isAdminUser} setAdminOpen={setAdminOpen} loadAdminData={loadAdminData} nativeBuildInfo={nativeBuildInfo} />

        <MoodViewer checkInViewerDate={checkInViewerDate} onClose={() => setCheckInViewerDate(null)} dailyCheckInHistory={dailyCheckInHistory} reflectionDateSet={reflectionDateSet} setReflectionViewerDate={setReflectionViewerDate} deleteDailyCheckIn={deleteDailyCheckIn} CHECKIN_MOODS={CHECKIN_MOODS} ENERGY_LEVELS={ENERGY_LEVELS} DAY_TYPES={DAY_TYPES} SUPPORT_PREFERENCES={SUPPORT_PREFERENCES} />

        <CarePathViewer selectedCarePath={selectedCarePath} onClose={() => { setSelectedCarePath(null); setExpandedPathDay(null); setPathDayJustCompleted(false); }} pathProgress={pathProgress} expandedPathDay={expandedPathDay} setExpandedPathDay={setExpandedPathDay} pathDayJustCompleted={pathDayJustCompleted} setPathDayJustCompleted={setPathDayJustCompleted} period={period} setReflectionViewerDate={setReflectionViewerDate} updatePathDay={updatePathDay} remindAboutPathDay={remindAboutPathDay} pauseCarePath={pauseCarePath} />

        <SleepToolViewer sleepToolOpen={sleepToolOpen} preferences={preferences} breathPhase={breathPhase} finishSleepSession={finishSleepSession} />

        <SafetyPanel open={safetyOpen} onClose={() => setSafetyOpen(false)} />

        <HelpPanel open={helpOpen} onClose={() => setHelpOpen(false)} babyMode={babyMode} goToFeedback={goToFeedback} />

        <RewardsPanel open={collectionOpen} onClose={() => setCollectionOpen(false)} FeatureTip={FeatureTip} selectedOutfit={selectedOutfit} mascotMood={mascotMood} activityDaysTotal={activityDaysTotal} preferences={preferences} mascotGrowth={mascotGrowth} careDaysTotal={careDaysTotal} unlockedOutfits={unlockedOutfits} earnedBadgeIdSet={earnedBadgeIdSet} BADGE_DEFS={BADGE_DEFS} unlockedIdSet={unlockedIdSet} mascotRequirementProgress={mascotRequirementProgress} saveMascotCollection={saveMascotCollection} mascotCollection={mascotCollection} savedBestStreak={savedBestStreak} collectionTab={collectionTab} setCollectionTab={setCollectionTab} winsJarEntries={winsJarEntries} />

        <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} watchPairingCode={watchPairingCode} setWatchPairingCode={setWatchPairingCode} connectWatch={connectWatch} watchPairingBusy={watchPairingBusy} watchPairingMessage={watchPairingMessage} localWatchSyncBusy={localWatchSyncBusy} startLocalWatchSync={startLocalWatchSync} localWatchSyncMessage={localWatchSyncMessage} dailyCheckIn={dailyCheckIn} pct={pct} rows={rows} viewDone={viewDone} weeklyOverallPct={weeklyOverallPct} widgetSyncMsg={widgetSyncMsg} setWidgetSyncMsg={setWidgetSyncMsg} displayNameDraft={displayNameDraft} setDisplayNameDraft={setDisplayNameDraft} saveDisplayName={saveDisplayName} comfortItemDraft={comfortItemDraft} setComfortItemDraft={setComfortItemDraft} saveComfortItem={saveComfortItem} preferences={preferences} appearanceTheme={appearanceTheme} selectAppearanceTheme={selectAppearanceTheme} dinoTheme={dinoTheme} updatePreference={updatePreference} enableNotifications={enableNotifications} smartReminderSuggestion={smartReminderSuggestion} restDatesSet={restDatesSet} toggleRestToday={toggleRestToday} period={period} restRangeDraft={restRangeDraft} setRestRangeDraft={setRestRangeDraft} saveRestRange={saveRestRange} restDates={restDates} savePreferences={savePreferences} feedbackText={feedbackText} setFeedbackText={setFeedbackText} submitFeedback={submitFeedback} feedbackMessage={feedbackMessage} exportMyData={exportMyData} restoreFileInputRef={restoreFileInputRef} restoreFromBackup={restoreFromBackup} deleteAllCheckIns={deleteAllCheckIns} deleteAllReflections={deleteAllReflections} user={user} online={online} syncStatus={syncStatus} lastSyncedAt={lastSyncedAt} syncNow={syncNow} emailChangeDraft={emailChangeDraft} setEmailChangeDraft={setEmailChangeDraft} requestEmailChange={requestEmailChange} signingOut={signingOut} handleSignOut={handleSignOut} signOutOtherDevices={signOutOtherDevices} deleteMyAccount={deleteMyAccount} deviceBackupStatus={deviceBackupStatus} refreshDeviceBackup={refreshDeviceBackup} deviceBackupBusy={deviceBackupBusy} verifyDeviceBackupNow={verifyDeviceBackupNow} deviceBackupVerifyBusy={deviceBackupVerifyBusy} settingsMessage={settingsMessage} />

        <AdminPanel open={isAdminUser && adminOpen} onClose={() => setAdminOpen(false)} loadAdminData={loadAdminData} adminMessage={adminMessage} adminStats={adminStats} adminOnline={adminOnline} adminFunnel={adminFunnel} SUPPORTER_FEATURES_ENABLED={SUPPORTER_FEATURES_ENABLED} supporterEmailDraft={supporterEmailDraft} setSupporterEmailDraft={setSupporterEmailDraft} setSupporterStatus={setSupporterStatus} supporterGrantMessage={supporterGrantMessage} reviewAccountRole={reviewAccountRole} setReviewAccountRole={setReviewAccountRole} reviewAccountEmail={reviewAccountEmail} setReviewAccountEmail={setReviewAccountEmail} reviewAccountPassword={reviewAccountPassword} setReviewAccountPassword={setReviewAccountPassword} createOrUpdateReviewAccount={createOrUpdateReviewAccount} reviewAccountMessage={reviewAccountMessage} adminFeedback={adminFeedback} resolveFeedback={resolveFeedback} adminErrors={adminErrors} clearAllErrors={clearAllErrors} devPreviewPlan={devPreviewPlan} setDevPreviewPlan={setDevPreviewPlan} />

        <JournalReflectionViewer reflectionViewerDate={reflectionViewerDate} onClose={() => setReflectionViewerDate(null)} reflectionViewerPrompt={reflectionViewerPrompt} reflectionViewerLoading={reflectionViewerLoading} reflectionViewerNote={reflectionViewerNote} />

        <TasksPanel open={manageTasks} onClose={() => setManageTasks(false)} newTaskDay={newTaskDay} setNewTaskDay={setNewTaskDay} taskSectionsForDay={taskSectionsForDay} setNewTaskSection={setNewTaskSection} setNewTaskCustomSection={setNewTaskCustomSection} starterPackId={starterPackId} setStarterPackId={setStarterPackId} trackerTasks={trackerTasks} setStarterPackMessage={setStarterPackMessage} addStarterPack={addStarterPack} starterPackMessage={starterPackMessage} importOpen={importOpen} setImportOpen={setImportOpen} newTaskSection={newTaskSection} importText={importText} setImportText={setImportText} importTasksFromText={importTasksFromText} importMessage={importMessage} newTaskNameInputRef={newTaskNameInputRef} newTaskName={newTaskName} setNewTaskName={setNewTaskName} taskMessage={taskMessage} setTaskMessage={setTaskMessage} naturalScheduleText={naturalScheduleText} setNaturalScheduleText={setNaturalScheduleText} naturalSchedulePreview={naturalSchedulePreview} setNaturalSchedulePreview={setNaturalSchedulePreview} applyNaturalSchedule={applyNaturalSchedule} newTaskSectionOptions={newTaskSectionOptions} newTaskCustomSection={newTaskCustomSection} taskAdvancedOpen={taskAdvancedOpen} setTaskAdvancedOpen={setTaskAdvancedOpen} newTaskWhy={newTaskWhy} setNewTaskWhy={setNewTaskWhy} newTaskSoftLabel={newTaskSoftLabel} setNewTaskSoftLabel={setNewTaskSoftLabel} newTaskTinyLabel={newTaskTinyLabel} setNewTaskTinyLabel={setNewTaskTinyLabel} newTaskEstimatedMinutes={newTaskEstimatedMinutes} setNewTaskEstimatedMinutes={setNewTaskEstimatedMinutes} newTaskEssentialOnLow={newTaskEssentialOnLow} setNewTaskEssentialOnLow={setNewTaskEssentialOnLow} newTaskKind={newTaskKind} setNewTaskKind={setNewTaskKind} newTaskScheduleType={newTaskScheduleType} setNewTaskScheduleType={setNewTaskScheduleType} newTaskScheduleDays={newTaskScheduleDays} setNewTaskScheduleDays={setNewTaskScheduleDays} newTaskReminderTime={newTaskReminderTime} setNewTaskReminderTime={setNewTaskReminderTime} newTaskStartDate={newTaskStartDate} setNewTaskStartDate={setNewTaskStartDate} newTaskEndDate={newTaskEndDate} setNewTaskEndDate={setNewTaskEndDate} newTaskOneTimeDate={newTaskOneTimeDate} setNewTaskOneTimeDate={setNewTaskOneTimeDate} selectedProgressDate={selectedProgressDate} addTrackerTask={addTrackerTask} SUPPORTER_FEATURES_ENABLED={SUPPORTER_FEATURES_ENABLED} isSupporterAccount={isSupporterAccount} FREE_TASK_LIMIT_PER_DAY={FREE_TASK_LIMIT_PER_DAY} taskSearchQuery={taskSearchQuery} setTaskSearchQuery={setTaskSearchQuery} isTaskPausedOnDate={isTaskPausedOnDate} period={period} startPointerTaskDrag={startPointerTaskDrag} movePointerTaskDrag={movePointerTaskDrag} endPointerTaskDrag={endPointerTaskDrag} cancelPointerTaskDrag={cancelPointerTaskDrag} moveTaskToSection={moveTaskToSection} startEditingTask={startEditingTask} resumeTrackerTask={resumeTrackerTask} pauseTrackerTask={pauseTrackerTask} archiveTrackerTask={archiveTrackerTask} setPendingTaskDelete={setPendingTaskDelete} showArchivedTasks={showArchivedTasks} setShowArchivedTasks={setShowArchivedTasks} restoreArchivedTask={restoreArchivedTask} />

        <ScheduleEditorPanel open={manageSchedule} onClose={() => setManageSchedule(false)} scheduleEditingDayId={scheduleEditingDayId} setScheduleEditDayId={setScheduleEditDayId} personalSchedules={personalSchedules} scheduleDraft={scheduleDraft} updateScheduleEntry={updateScheduleEntry} removeScheduleEntry={removeScheduleEntry} addScheduleEntry={addScheduleEntry} savePersonalSchedule={savePersonalSchedule} copyScheduleToAllDays={copyScheduleToAllDays} clearPersonalSchedule={clearPersonalSchedule} copyToDayIds={copyToDayIds} toggleCopyToDay={toggleCopyToDay} copyScheduleToSelectedDays={copyScheduleToSelectedDays} scheduleMessage={scheduleMessage} scheduleExceptionDraft={scheduleExceptionDraft} setScheduleExceptionDraft={setScheduleExceptionDraft} updateScheduleExceptionEntry={updateScheduleExceptionEntry} removeScheduleExceptionEntry={removeScheduleExceptionEntry} addScheduleExceptionEntry={addScheduleExceptionEntry} saveScheduleException={saveScheduleException} scheduleExceptionMessage={scheduleExceptionMessage} scheduleExceptions={scheduleExceptions} deleteScheduleException={deleteScheduleException} />

        <GuardianPanel open={user && dashboard === "guardian"} onClose={() => setDashboard("today")} isGuardianAccount={isGuardianAccount} hasOwnGuardian={hasOwnGuardian} supportViewMode={supportViewMode} setSupportViewMode={setSupportViewMode} isSupportAdult={isSupportAdult} selectedSupportName={selectedSupportName} guardianSupportRequests={guardianSupportRequests} supportOwnerId={supportOwnerId} updateGuardianSupportRequest={updateGuardianSupportRequest} pendingSupportInvites={pendingSupportInvites} supportPeople={supportPeople} acceptSupportInvitation={acceptSupportInvitation} declineSupportInvitation={declineSupportInvitation} canUseCaretakerDashboard={canUseCaretakerDashboard} invitedSupportLinks={invitedSupportLinks} loadSupportOwner={loadSupportOwner} loadSupportData={loadSupportData} user={user} supportAchievements={supportAchievements} period={period} ownerIsRestingToday={ownerIsRestingToday} restDatesSet={restDatesSet} todayRequiredDone={todayRequiredDone} supportProgress={supportProgress} activeSupportLink={activeSupportLink} canViewSupportProgress={canViewSupportProgress} supportProgressView={supportProgressView} setSupportProgressView={setSupportProgressView} supportTodayDayLabel={supportTodayDayLabel} displayedSupportPercent={displayedSupportPercent} displayedSupportCompleted={displayedSupportCompleted} displayedSupportPossible={displayedSupportPossible} supportDailyEssentialCompleted={supportDailyEssentialCompleted} supportDailyEssentialKeys={supportDailyEssentialKeys} supportScheduledTodayCompleted={supportScheduledTodayCompleted} supportScheduledTodayKeys={supportScheduledTodayKeys} canSendSupportNotes={canSendSupportNotes} newNote={newNote} setNewNote={setNewNote} addSupportNote={addSupportNote} suggestComfortTool={suggestComfortTool} canAddSupportRewards={canAddSupportRewards} rewardTitle={rewardTitle} setRewardTitle={setRewardTitle} rewardDetails={rewardDetails} setRewardDetails={setRewardDetails} rewardTarget={rewardTarget} setRewardTarget={setRewardTarget} rewardTargetPeriod={rewardTargetPeriod} setRewardTargetPeriod={setRewardTargetPeriod} rewardApprovalRequired={rewardApprovalRequired} setRewardApprovalRequired={setRewardApprovalRequired} addSupportReward={addSupportReward} suggestedTask={suggestedTask} setSuggestedTask={setSuggestedTask} suggestedTaskDay={suggestedTaskDay} setSuggestedTaskDay={setSuggestedTaskDay} submitTaskSuggestion={submitTaskSuggestion} inviteEmail={inviteEmail} setInviteEmail={setInviteEmail} inviteSupportAdult={inviteSupportAdult} GUARDIAN_ROLE_PRESETS={GUARDIAN_ROLE_PRESETS} guardianRolePreset={guardianRolePreset} setGuardianRolePreset={setGuardianRolePreset} ownedSupportLinks={ownedSupportLinks} supportRelationships={supportRelationships} setSupportAdultActive={setSupportAdultActive} removeSupportAdult={removeSupportAdult} updateCaretakerPermission={updateCaretakerPermission} updateCareAgreement={updateCareAgreement} supportRequestGuardian={supportRequestGuardian} setSupportRequestGuardian={setSupportRequestGuardian} supportRequestType={supportRequestType} setSupportRequestType={setSupportRequestType} supportRequestText={supportRequestText} setSupportRequestText={setSupportRequestText} sendGuardianSupportRequest={sendGuardianSupportRequest} taskSuggestions={taskSuggestions} suggestionSectionsById={suggestionSectionsById} setSuggestionSectionsById={setSuggestionSectionsById} taskSectionsForDay={taskSectionsForDay} decideTaskSuggestion={decideTaskSuggestion} supportMessage={supportMessage} supportRewards={supportRewards} supportWeeklyPercent={supportWeeklyPercent} supportPercent={supportPercent} updateRewardStatus={updateRewardStatus} supportNotes={supportNotes} setComfortToolOpen={setComfortToolOpen} deleteSupportNote={deleteSupportNote} />

        <>
        <DailyJournalPanel open={journalQuickOpen && (!dailyJournalPromptOpen || autoPopupToShow === "daily_journal")} onClose={() => { setJournalQuickOpen(false); setDailyJournalPromptOpen(false); setPrivateNoteEditing(false); }} dailyJournalPromptOpen={dailyJournalPromptOpen} journalQuickOpenDate={journalQuickOpenDate} journalDisplayedPrompt={journalDisplayedPrompt} privateNoteEditing={privateNoteEditing} setPrivateNoteEditing={setPrivateNoteEditing} privateNoteDraft={privateNoteDraft} setPrivateNoteDraft={setPrivateNoteDraft} savePrivateNote={savePrivateNote} privateNote={privateNote} privateNoteMessage={privateNoteMessage} />
        <TodayPanel open={dashboard === "today"} returnGapDays={returnGapDays} returnBannerDismissed={returnBannerDismissed} setReturnBannerDismissed={setReturnBannerDismissed} voice={voice} setEssentialsPickerOpen={setEssentialsPickerOpen} selectDayType={selectDayType} wellbeingPatternInsight={wellbeingPatternInsight} todayDayId={todayDayId} hardDayBannerDismissed={hardDayBannerDismissed} setHardDayBannerDismissed={setHardDayBannerDismissed} dailyCheckIn={dailyCheckIn} restDatesSet={restDatesSet} period={period} toggleRestToday={toggleRestToday} nextStepTask={nextStepTask} FeatureTip={FeatureTip} day={day} babyMode={babyMode} nextStepHint={nextStepHint} toggle={toggle} pickEasierSuggestion={pickEasierSuggestion} nextStepMoreOpen={nextStepMoreOpen} setNextStepMoreOpen={setNextStepMoreOpen} setNextStepSkipped={setNextStepSkipped} setNextStepDismissedToday={setNextStepDismissedToday} weeklyIntentionEditing={weeklyIntentionEditing} setWeeklyIntentionEditing={setWeeklyIntentionEditing} weeklyIntentionDraft={weeklyIntentionDraft} setWeeklyIntentionDraft={setWeeklyIntentionDraft} weeklyIntentionText={weeklyIntentionText} saveWeeklyIntentionEdit={saveWeeklyIntentionEdit} weeklyIntentionMessage={weeklyIntentionMessage} todayCardIndex={todayCardIndex} setTodayCardIndex={setTodayCardIndex} taskWeekDates={taskWeekDates} selectedProgressDate={selectedProgressDate} selectTaskPreviewDate={selectTaskPreviewDate} isFutureView={isFutureView} selectedTaskDateLabel={selectedTaskDateLabel} todaySwipeStartX={todaySwipeStartX} todaySwipeStartY={todaySwipeStartY} selectedSchedule={selectedSchedule} selectedScheduleExceptionEntries={selectedScheduleExceptionEntries} scheduleDayId={scheduleDayId} manageSchedule={manageSchedule} setManageSchedule={setManageSchedule} active={active} rows={rows} viewDone={viewDone} openTaskManager={openTaskManager} todayRequiredDone={todayRequiredDone} todayRequiredKeys={todayRequiredKeys} activityDaysTotal={activityDaysTotal} careDaysTotal={careDaysTotal} babyCaregiverName={babyCaregiverName} trackerProfile={trackerProfile} openJournalForSelectedDate={openJournalForSelectedDate} isHistoricalView={isHistoricalView} focusHelperOpen={focusHelperOpen} setFocusHelperOpen={setFocusHelperOpen} pickRandomFocusTask={pickRandomFocusTask} setFocusSuggestionKey={setFocusSuggestionKey} focusedEssential={focusedEssential} focusChoices={focusChoices} selectedTaskViewIsRest={selectedTaskViewIsRest} pct={pct} requiredDoneCount={requiredDoneCount} requiredRows={requiredRows} preferences={preferences} doneCount={doneCount} focusModeShowAll={focusModeShowAll} setFocusModeShowAll={setFocusModeShowAll} isTaskPausedOnDate={isTaskPausedOnDate} openRow={openRow} setOpenRow={setOpenRow} celebrateKey={celebrateKey} pauseTrackerTask={pauseTrackerTask} resumeTrackerTask={resumeTrackerTask} taskListCollapsed={taskListCollapsed} setTaskListCollapsed={setTaskListCollapsed} recentlyCompletedKeys={recentlyCompletedKeys} moveTaskGroup={moveTaskGroup} startPointerTaskDrag={startPointerTaskDrag} movePointerTaskDrag={movePointerTaskDrag} endPointerTaskDrag={endPointerTaskDrag} cancelPointerTaskDrag={cancelPointerTaskDrag} moveTaskToTomorrow={moveTaskToTomorrow} completedTodayExpanded={completedTodayExpanded} setCompletedTodayExpanded={setCompletedTodayExpanded} calmQuickOpen={calmQuickOpen} setCalmQuickOpen={setCalmQuickOpen} currentCopingOption={currentCopingOption} reshuffle={reshuffle} setCareSection={setCareSection} goToDashboard={goToDashboard} />

        <WeekPanel open={dashboard === "week"} openTodayJournal={openTodayJournal} weekCardIndex={weekCardIndex} setWeekCardIndex={setWeekCardIndex} weekSwipeStartX={weekSwipeStartX} weekSwipeStartY={weekSwipeStartY} reflectionCalendarMonth={reflectionCalendarMonth} setReflectionCalendarMonth={setReflectionCalendarMonth} reflectionMonthDate={reflectionMonthDate} reflectionMonthStart={reflectionMonthStart} reflectionMonthDays={reflectionMonthDays} reflectionDateSet={reflectionDateSet} dailyCheckInHistory={dailyCheckInHistory} restDatesSet={restDatesSet} selectedProgressDate={selectedProgressDate} setSelectedProgressDate={setSelectedProgressDate} dayCompletionPct={dayCompletionPct} setDayViewDate={setDayViewDate} setActive={setActive} setReflectionViewerDate={setReflectionViewerDate} setCheckInViewerDate={setCheckInViewerDate} reflectionHistory={reflectionHistory} journalHistoryExpanded={journalHistoryExpanded} setJournalHistoryExpanded={setJournalHistoryExpanded} weeklyIntentionHistory={weeklyIntentionHistory} weeklyIntentionHistoryExpanded={weeklyIntentionHistoryExpanded} setWeeklyIntentionHistoryExpanded={setWeeklyIntentionHistoryExpanded} period={period} calendarWeekOffset={calendarWeekOffset} setCalendarWeekOffset={setCalendarWeekOffset} calendarWeekPreviewDate={calendarWeekPreviewDate} setCalendarWeekPreviewDate={setCalendarWeekPreviewDate} trackerTasks={trackerTasks} dayViewDate={dayViewDate} dayViewExpanded={dayViewExpanded} setDayViewExpanded={setDayViewExpanded} longHistoryByDate={longHistoryByDate} isTaskPausedOnDate={isTaskPausedOnDate} markPastTasksDone={markPastTasksDone} done={done} toggle={toggle} isHistoricalView={isHistoricalView} habitTasks={habitTasks} habitGardenGrowthPct={habitGardenGrowthPct} habitGardenTotalCheckIns={habitGardenTotalCheckIns} habitGardenOpen={habitGardenOpen} setHabitGardenOpen={setHabitGardenOpen} CHECKIN_MOODS={CHECKIN_MOODS} />

        <ProgressPanel open={dashboard === "progress"} progressView={progressView} setProgressView={setProgressView} weeklyIntentionEditing={weeklyIntentionEditing} setWeeklyIntentionEditing={setWeeklyIntentionEditing} weeklyIntentionDraft={weeklyIntentionDraft} setWeeklyIntentionDraft={setWeeklyIntentionDraft} weeklyIntentionText={weeklyIntentionText} saveWeeklyIntentionEdit={saveWeeklyIntentionEdit} hasWeeklyActivity={hasWeeklyActivity} goToDashboard={goToDashboard} weeklyOverallPct={weeklyOverallPct} weekOverWeekDelta={weekOverWeekDelta} preferences={preferences} weeklyEssentialPct={weeklyEssentialPct} weeklyOverallDone={weeklyOverallDone} weeklyOverallPossible={weeklyOverallPossible} weeklyBonusDone={weeklyBonusDone} caringDays={caringDays} weeklyEssentialDone={weeklyEssentialDone} careStory={careStory} careAreas={careAreas} openTaskManager={openTaskManager} patternInsightCards={patternInsightCards} insightCardIndex={insightCardIndex} setInsightCardIndex={setInsightCardIndex} weeklyHighlights={weeklyHighlights} period={period} goWriteWeeklyIntention={goWriteWeeklyIntention} setShareCardOpen={setShareCardOpen} progressDetailsOpen={progressDetailsOpen} setProgressDetailsOpen={setProgressDetailsOpen} TREND_WEEKS={TREND_WEEKS} TREND_MONTHS={TREND_MONTHS} currentMonthKey={currentMonthKey} monthlyOverallPct={monthlyOverallPct} monthOverMonthDelta={monthOverMonthDelta} monthlyTrendPoints={monthlyTrendPoints} tappedTrendMonth={tappedTrendMonth} setTappedTrendMonth={setTappedTrendMonth} monthlyMostConsistent={monthlyMostConsistent} currentMonthDates={currentMonthDates} weeklyTrendPoints={weeklyTrendPoints} tappedTrendWeek={tappedTrendWeek} setTappedTrendWeek={setTappedTrendWeek} habitTasks={habitTasks} habitGardenGrowthPct={habitGardenGrowthPct} habitGardenTotalCheckIns={habitGardenTotalCheckIns} habitGardenOpen={habitGardenOpen} setHabitGardenOpen={setHabitGardenOpen} />

        </>
          </>
        )}
        {user && (
          <footer style={{ marginTop: 22, padding: "20px 10px 6px", textAlign: "center", borderTop: "1px solid #E6D4F2", color: "#8C6B9E", fontSize: 11.5, lineHeight: 1.7 }}>
            <div>© 2026 Sable Johnston · PlushLife™ · All rights reserved.</div>
            <div>
              <a href="./legal.html#privacy" style={{ color: "#9C5FB5" }}>Privacy</a>
              <span aria-hidden="true"> · </span>
              <a href="./legal.html#terms" style={{ color: "#9C5FB5" }}>Terms</a>
              <span aria-hidden="true"> · </span>
              <a href="./legal.html#about" style={{ color: "#9C5FB5" }}>About</a>
              <span aria-hidden="true"> · </span>
              <a href="./support.html" style={{ color: "#9C5FB5" }}>Support</a>
            </div>
          </footer>
        )}
      </div>
      </div>
      {recentlyDeletedTask && (
        <div style={{ position: "fixed", left: "50%", bottom: 20, transform: "translateX(-50%)", zIndex: 60, display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, background: "#3B2E46", color: "white", boxShadow: "0 10px 30px rgba(0,0,0,0.25)", maxWidth: "92vw" }}>
          <span style={{ fontSize: 12.5 }}>🗑️ "{recentlyDeletedTask.label}" removed</span>
          <button type="button" onClick={undoDeleteTask} style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.4)", background: "transparent", color: "#F2D9FF", fontWeight: 900, cursor: "pointer", fontSize: 12.5, whiteSpace: "nowrap" }}>Undo</button>
        </div>
      )}
      {badgeCelebration && (
        <div role="status" style={{ position: "fixed", left: "50%", bottom: 20, transform: "translateX(-50%)", zIndex: 61, display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, background: "#3B2E46", color: "white", boxShadow: "0 10px 30px rgba(0,0,0,0.25)", maxWidth: "92vw" }}>
          <span style={{ fontSize: 12.5 }}>
            {badgeCelebration.intro} {badgeCelebration.badges.map((item) => `${item.badge} ${item.name}`).join(", ")}
          </span>
          <button type="button" onClick={() => setBadgeCelebration(null)} aria-label="Dismiss" style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.4)", background: "transparent", color: "#F2D9FF", fontWeight: 900, cursor: "pointer", fontSize: 12.5, whiteSpace: "nowrap" }}>✕</button>
        </div>
      )}
    </div>
  );
}


class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error("PlushLife crashed:", error, info);
    supabase.auth.getUser().then(({ data }) => {
      supabase.from("app_error_logs").insert({
        user_id: data?.user?.id || null,
        message: String(error?.message || error || "Unknown error").slice(0, 2000),
        stack: String(error?.stack || "").slice(0, 4000),
        url: window.location.href,
      }).then(() => {}, () => {});
    }).catch(() => {});
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "system-ui, sans-serif", textAlign: "center" }}>
          <div style={{ maxWidth: 360 }}>
            <div style={{ fontSize: 40 }}>🧸</div>
            <h1 style={{ fontSize: 18, color: "#5B4B6B", margin: "12px 0 6px" }}>Something went a little sideways</h1>
            <p style={{ fontSize: 13.5, color: "#8C6B9E", lineHeight: 1.5 }}>PlushLife hit a snag. Your data is safe — reloading usually fixes this.</p>
            <button onClick={() => window.location.reload()} style={{ marginTop: 14, padding: "10px 18px", borderRadius: 10, border: 0, background: "#A65DC1", color: "white", fontWeight: 800, cursor: "pointer" }}>Reload PlushLife</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(<AppErrorBoundary><GlowUpTracker /></AppErrorBoundary>);
