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


// â€”â€”â€”â€”â€” Sable's Weekly Glow-Up & Self-Care Tracker â€”â€”â€”â€”â€”
// Structure + care + progress, not perfection. ğŸ’œ

// Day metadata only (id/label/title/accent/reflect). Actual checklist content
// lives privately per-account in Supabase (`tracker_tasks`), never in this file.
const DAILY = { id: "daily", label: "DAILY", title: "Every Day Core", accent: "#C77DD6" };


// Quick-select presets for a task's schedule_days â€” distinct from a task's
// day_id === "daily" (which has no schedule_days at all). Both make a task
// occur every day, but before this they were indistinguishable anywhere in
// the UI; scheduleLabelForTask below is what actually tells them apart.



const ALL = [DAILY, ...DAYS];

const CHECKIN_MOODS = [
  ["happy", "ğŸ˜Š", "Happy"], ["calm", "ğŸ˜Œ", "Calm"], ["okay", "ğŸ™‚", "Okay"],
  ["tired", "ğŸ˜´", "Tired"], ["stressed", "ğŸ˜£", "Stressed"], ["anxious", "ğŸ˜Ÿ", "Anxious"],
  ["sad", "ğŸ˜¢", "Sad"], ["angry", "ğŸ˜ ", "Angry"], ["lonely", "ğŸ¥º", "Lonely"],
  ["overwhelmed", "ğŸ˜µâ€ğŸ’«", "Overwhelmed"], ["numb", "ğŸ˜¶", "Numb"], ["sick", "ğŸ¤’", "Sick"],
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
  ["empty", "â—‹", "Empty"], ["low", "ğŸŒ™", "Low"], ["steady", "ğŸŒ¤ï¸", "Steady"], ["high", "âš¡", "High"],
];

const DAY_TYPES = [
  ["full", "â˜€ï¸", "Full", "Your complete routine"],
  ["soft", "ğŸŒ¤ï¸", "Soft", "Gentler task versions"],
  ["tiny", "ğŸŒ±", "Tiny", "Smallest meaningful steps"],
  ["recovery", "â†º", "Recovery", "A few gentle rebuilding steps"],
  ["rest", "ğŸŒ´", "Rest", "Protected rest without guilt"],
];

const SUPPORT_PREFERENCES = [
  ["comfort", "ğŸ§¸", "Comfort"], ["encouragement", "ğŸ’›", "Encouragement"],
  ["structure", "â‰¡", "Structure"], ["practical", "ğŸ§°", "Practical help"],
  ["company", "â˜•", "Quiet company"], ["space", "ğŸŒ™", "Space"],
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
  { id: "anxious", icon: "ğŸŒ¬ï¸", label: "I feel anxious", tool: "breathing", next: "Afterward, choose one thing your body needs." },
  { id: "overwhelmed", icon: "â˜ï¸", label: "Everything feels like too much", tool: "grounding", next: "Then switch today to Tiny if that would feel kinder." },
  { id: "cannot_start", icon: "ğŸŒ±", label: "I cannot start", tool: "change_rooms", next: "When you return, do only the first two-minute piece." },
  { id: "need_food", icon: "ğŸ", label: "I need to eat", tool: "water", next: "Pick the easiest available food. It does not need to be a proper meal." },
  { id: "need_hygiene", icon: "âœ¦", label: "Hygiene feels hard", tool: "comfort_item", next: "Choose the Tiny version. Partial care is still care." },
  { id: "cannot_sleep", icon: "ğŸŒ™", label: "I cannot sleep", tool: "bedtime", next: "Resting quietly still helps, even if sleep does not arrive immediately." },
  { id: "lonely", icon: "â˜•", label: "I feel lonely", tool: "comfort_item", next: "You can also send a prepared support request to a Guardian." },
  { id: "not_sure", icon: "?", label: "I do not know what I need", tool: "grounding", next: "Notice what feels most urgent: body, environment, task, or connection." },
];




// Ambient sound is generated on the fly with the Web Audio API rather than
// shipping recorded audio files â€” no licensing to track, nothing to
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
    soundscapeNode×}9ë»h‘éì¶»§q«^vÙ\[ÛœÏ^Üİ\ÜØÚY[Q^Ù\[ÛœßHİ\Ü[ÛÙİ[[X\O^Üİ\Ü[ÛÙİ[[X\_Hİ\Ü›ÙÜ™\ÜÕšY]Ï^Üİ\Ü›ÙÜ™\ÜÕšY]ßHÙ]İ\Ü›ÙÜ™\ÜÕšY]Ï^ÜÙ]İ\Ü›ÙÜ™\ÜÕšY]ßHİ\ÜÙ^Q^SX™[^Üİ\ÜÙ^Q^SX™[H\Ü^YYİ\Ü\˜Ù[^Ù\Ü^YYİ\Ü\˜Ù[H\Ü^YYİ\ÜÛÛ\]Y^Ù\Ü^YYİ\ÜÛÛ\]YH\Ü^YYİ\ÜÜÜÚX›O^Ù\Ü^YYİ\ÜÜÜÚX›_Hİ\ÜZ[Q\ÜÙ[X[ÛÛ\]Y^Üİ\ÜZ[Q\ÜÙ[X[ÛÛ\]YHİ\ÜZ[Q\ÜÙ[X[Ù^\Ï^Üİ\ÜZ[Q\ÜÙ[X[Ù^\ßHİ\ÜØÚY[YÙ^PÛÛ\]Y^Üİ\ÜØÚY[YÙ^PÛÛ\]YHİ\ÜØÚY[YÙ^RÙ^\Ï^Üİ\ÜØÚY[YÙ^RÙ^\ßHØ[”Ù[™İ\Ü›İ\Ï^ØØ[”Ù[™İ\Ü›İ\ßH™]Ó›İO^Û™]Ó›İ_HÙ]™]Ó›İO^ÜÙ]™]Ó›İ_HYİ\Ü›İO^ØYİ\Ü›İ_HİYÙÙ\İÛÛY›ÜÛÛ^ÜİYÙÙ\İÛÛY›ÜÛÛHØ[Yİ\Ü™]Ø\™Ï^ØØ[Yİ\Ü™]Ø\™ßH™]Ø\™]O^Ü™]Ø\™]_HÙ]™]Ø\™]O^ÜÙ]™]Ø\™]_H™]Ø\™]Z[Ï^Ü™]Ø\™]Z[ßHÙ]™]Ø\™]Z[Ï^ÜÙ]™]Ø\™]Z[ßH™]Ø\™\™Ù]^Ü™]Ø\™\™Ù]HÙ]™]Ø\™\™Ù]^ÜÙ]™]Ø\™\™Ù]H™]Ø\™\™Ù]\š[Ù^Ü™]Ø\™\™Ù]\š[ÙHÙ]™]Ø\™\™Ù]\š[Ù^ÜÙ]™]Ø\™\™Ù]\š[ÙH™]Ø\™\›İ˜[™\]Z\™Y^Ü™]Ø\™\›İ˜[™\]Z\™YHÙ]™]Ø\™\›İ˜[™\]Z\™Y^ÜÙ]™]Ø\™\›İ˜[™\]Z\™YHYİ\Ü™]Ø\™^ØYİ\Ü™]Ø\™HİYÙÙ\İY\ÚÏ^ÜİYÙÙ\İY\ÚßHÙ]İYÙÙ\İY\ÚÏ^ÜÙ]İYÙÙ\İY\ÚßHİYÙÙ\İY\ÚÑ^O^ÜİYÙÙ\İY\ÚÑ^_HÙ]İYÙÙ\İY\ÚÑ^O^ÜÙ]İYÙÙ\İY\ÚÑ^_HİX›Z]\ÚÔİYÙÙ\İ[Û^ÜİX›Z]\ÚÔİYÙÙ\İ[ÛŸH[š]Q[XZ[^Ú[š]Q[XZ[HÙ][š]Q[XZ[^ÜÙ][š]Q[XZ[H[š]Tİ\ÜY[^Ú[š]Tİ\ÜY[HÕPT‘PS—Ô“ÓWÔ‘TÑUÏ^ÑÕPT‘PS—Ô“ÓWÔ‘TÑUßHİX\™X[”›ÛT™\Ù]^ÙİX\™X[”›ÛT™\Ù]HÙ]İX\™X[”›ÛT™\Ù]^ÜÙ]İX\™X[”›ÛT™\Ù]HİÛ™Yİ\Ü[šÜÏ^ÛİÛ™Yİ\Ü[šÜßHİ\Ü™[][ÛœÚ\Ï^Üİ\Ü™[][ÛœÚ\ßHÙ]İ\ÜY[Xİ]™O^ÜÙ]İ\ÜY[Xİ]™_H™[[İ™Tİ\ÜY[^Ü™[[İ™Tİ\ÜY[H\]PØ\™]ZÙ\”\›Z\ÜÚ[Û^İ\]PØ\™]ZÙ\”\›Z\ÜÚ[ÛŸH\]PØ\™PYÜ™Y[Y[^İ\]PØ\™PYÜ™Y[Y[Hİ\Ü™\]Y\İİX\™X[^Üİ\Ü™\]Y\İİX\™X[ŸHÙ]İ\Ü™\]Y\İİX\™X[^ÜÙ]İ\Ü™\]Y\İİX\™X[ŸHİ\Ü™\]Y\İ\O^Üİ\Ü™\]Y\İ\_HÙ]İ\Ü™\]Y\İ\O^ÜÙ]İ\Ü™\]Y\İ\_Hİ\Ü™\]Y\İ^^Üİ\Ü™\]Y\İ^HÙ]İ\Ü™\]Y\İ^^ÜÙ]İ\Ü™\]Y\İ^HÙ[™İX\™X[”İ\Ü™\]Y\İ^ÜÙ[™İX\™X[”İ\Ü™\]Y\İH\ÚÔİYÙÙ\İ[ÛœÏ^İ\ÚÔİYÙÙ\İ[ÛœßHİYÙÙ\İ[Û”ÙXİ[ÛœĞRY^ÜİYÙÙ\İ[Û”ÙXİ[ÛœĞRYHÙ]İYÙÙ\İ[Û”ÙXİ[ÛœĞRY^ÜÙ]İYÙÙ\İ[Û”ÙXİ[ÛœĞRYH\ÚÔÙXİ[ÛœÑ›Ü‘^O^İ\ÚÔÙXİ[ÛœÑ›Ü‘^_HXÚYU\ÚÔİYÙÙ\İ[Û^ÙXÚYU\ÚÔİYÙÙ\İ[ÛŸHİ\ÜY\ÜØYÙO^Üİ\ÜY\ÜØYÙ_Hİ\Ü™]Ø\™Ï^Üİ\Ü™]Ø\™ßHİ\ÜÙYZÛT\˜Ù[^Üİ\ÜÙYZÛT\˜Ù[Hİ\Ü\˜Ù[^Üİ\Ü\˜Ù[H\]T™]Ø\™İ]\Ï^İ\]T™]Ø\™İ]\ßHİ\Ü›İ\Ï^Üİ\Ü›İ\ßHÙ]ÛÛY›ÜÛÛÜ[^ÜÙ]ÛÛY›ÜÛÛÜ[ŸH[]Tİ\Ü›İO^Ù[]Tİ\Ü›İ_HÏƒBƒBˆƒBˆZ[R›İ\›˜[[™[Ü[^Ú›İ\›˜[]ZXÚÓÜ[ˆ	‰ˆ
YZ[R›İ\›˜[›Û\Ü[ˆ]]ÔÜ\ÔÚİÈOOH™Z[WÚ›İ\›˜[Š_HÛÛÜÙO^Ê
HOˆÈÙ]›İ\›˜[]ZXÚÓÜ[Š˜[ÙJNÈÙ]Z[R›İ\›˜[›Û\Ü[Š˜[ÙJNÈÙ]š]˜]S›İQY][™Ê˜[ÙJNÈ_HZ[R›İ\›˜[›Û\Ü[^ÙZ[R›İ\›˜[›Û\Ü[ŸH›İ\›˜[]ZXÚÓÜ[‘]O^Ú›İ\›˜[]ZXÚÓÜ[‘]_H›İ\›˜[\Ü^YY›Û\^Ú›İ\›˜[\Ü^YY›Û\Hš]˜]S›İQY][™Ï^Üš]˜]S›İQY][™ßHÙ]š]˜]S›İQY][™Ï^ÜÙ]š]˜]S›İQY][™ßHš]˜]S›İQ˜Y^Üš]˜]S›İQ˜YHÙ]š]˜]S›İQ˜Y^ÜÙ]š]˜]S›İQ˜YHØ]™Tš]˜]S›İO^ÜØ]™Tš]˜]S›İ_Hš]˜]S›İO^Üš]˜]S›İ_Hš]˜]S›İSY\ÜØYÙO^Üš]˜]S›İSY\ÜØYÙ_HÏƒBˆÙ^T[™[Ü[^Ù\Ú›Ø\™OOHÙ^HŸH™]\›‘Ø\^\Ï^Ü™]\›‘Ø\^\ßH™]\›˜[›™\‘\ÛZ\ÜÙY^Ü™]\›˜[›™\‘\ÛZ\ÜÙYHÙ]™]\›˜[›™\‘\ÛZ\ÜÙY^ÜÙ]™]\›˜[›™\‘\ÛZ\ÜÙYH›ÚXÙO^İ›ÚXÙ_HÙ]\ÜÙ[X[ÔXÚÙ\“Ü[^ÜÙ]\ÜÙ[X[ÔXÚÙ\“Ü[ŸHÙ[Xİ^U\O^ÜÙ[Xİ^U\_HÙ[™Z[™Ô]\›’[œÚYÚ^İÙ[™Z[™Ô]\›’[œÚYÚHÙ^Q^RY^İÙ^Q^RYH\™^P˜[›™\‘\ÛZ\ÜÙY^Ú\™^P˜[›™\‘\ÛZ\ÜÙYHÙ]\™^P˜[›™\‘\ÛZ\ÜÙY^ÜÙ]\™^P˜[›™\‘\ÛZ\ÜÙYHZ[PÚXÚÒ[^ÙZ[PÚXÚÒ[ŸH™\İ]\ÔÙ]^Ü™\İ]\ÔÙ]H\š[Ù^Ü\š[ÙHÙÙÛT™\İÙ^O^İÙÙÛT™\İÙ^_H™^İ\\ÚÏ^Û™^İ\\ÚßH™X]\™U\^Ñ™X]\™U\H^O^Ù^_H˜XS[ÙO^Ø˜XS[Ù_H™^İ\[^Û™^İ\[HÙÙÛO^İÙÙÛ_HXÚÑX\ÚY\”İYÙÙ\İ[Û^ÜXÚÑX\ÚY\”İYÙÙ\İ[ÛŸH™^İ\[Ü™SÜ[^Û™^İ\[Ü™SÜ[ŸHÙ]™^İ\[Ü™SÜ[^ÜÙ]™^İ\[Ü™SÜ[ŸHÙ]™^İ\ÚÚ\Y^ÜÙ]™^İ\ÚÚ\YHÙ]™^İ\\ÛZ\ÜÙYÙ^O^ÜÙ]™^İ\\ÛZ\ÜÙYÙ^_HÙYZÛR[[[Û‘Y][™Ï^İÙYZÛR[[[Û‘Y][™ßHÙ]ÙYZÛR[[[Û‘Y][™Ï^ÜÙ]ÙYZÛR[[[Û‘Y][™ßHÙYZÛR[[[Û‘˜Y^İÙYZÛR[[[Û‘˜YHÙ]ÙYZÛR[[[Û‘˜Y^ÜÙ]ÙYZÛR[[[Û‘˜YHÙYZÛR[[[Û•^^İÙYZÛR[[[Û•^HØ]™UÙYZÛR[[[Û‘Y]^ÜØ]™UÙYZÛR[[[Û‘Y]HÙYZÛR[[[Û“Y\ÜØYÙO^İÙYZÛR[[[Û“Y\ÜØYÙ_HÙ^PØ\™[™^^İÙ^PØ\™[™^HÙ]Ù^PØ\™[™^^ÜÙ]Ù^PØ\™[™^H\ÚÕÙYZÑ]\Ï^İ\ÚÕÙYZÑ]\ßHÙ[XİY›ÙÜ™\ÜÑ]O^ÜÙ[XİY›ÙÜ™\ÜÑ]_HÙ[Xİ\ÚÔ™]šY]Ñ]O^ÜÙ[Xİ\ÚÔ™]šY]Ñ]_H\Ñ]\™UšY]Ï^Ú\Ñ]\™UšY]ßHÙ[XİY\ÚÑ]SX™[^ÜÙ[XİY\ÚÑ]SX™[HÙ^TİÚ\Tİ\^İÙ^TİÚ\Tİ\HÙ^TİÚ\Tİ\O^İÙ^TİÚ\Tİ\_HÙ[XİYØÚY[O^ÜÙ[XİYØÚY[_HÙ[XİYØÚY[Q^Ù\[Û‘[šY\Ï^ÜÙ[XİYØÚY[Q^Ù\[Û‘[šY\ßHØÚY[Q^RY^ÜØÚY[Q^RYHX[˜YÙTØÚY[O^ÛX[˜YÙTØÚY[_HÙ]X[˜YÙTØÚY[O^ÜÙ]X[˜YÙTØÚY[_HXİ]™O^ØXİ]™_H›İÜÏ^Ü›İÜßHšY]ÑÛ™O^İšY]ÑÛ™_HÜ[•\ÚÓX[˜YÙ\^ÛÜ[•\ÚÓX[˜YÙ\ŸHÙ^T™\]Z\™YÛ™O^İÙ^T™\]Z\™YÛ™_HÙ^T™\]Z\™YÙ^\Ï^İÙ^T™\]Z\™YÙ^\ßHXİ]š]Q^\Õİ[^ØXİ]š]Q^\Õİ[HØ\™Q^\Õİ[^ØØ\™Q^\Õİ[H˜XPØ\™YÚ]™\“˜[YO^Ø˜XPØ\™YÚ]™\“˜[Y_H˜XÚÙ\”›Ùš[O^İ˜XÚÙ\”›Ùš[_HÜ[’›İ\›˜[›Ü”Ù[XİY]O^ÛÜ[’›İ\›˜[›Ü”Ù[XİY]_H\Ò\İÜšXØ[šY]Ï^Ú\Ò\İÜšXØ[šY]ßH›Øİ\Ò[\“Ü[^Ù›Øİ\Ò[\“Ü[ŸHÙ]›Øİ\Ò[\“Ü[^ÜÙ]›Øİ\Ò[\“Ü[ŸHXÚÔ˜[™ÛQ›Øİ\Õ\ÚÏ^ÜXÚÔ˜[™ÛQ›Øİ\Õ\ÚßHÙ]›Øİ\ÔİYÙÙ\İ[Û’Ù^O^ÜÙ]›Øİ\ÔİYÙÙ\İ[Û’Ù^_H›Øİ\ÙY\ÜÙ[X[^Ù›Øİ\ÙY\ÜÙ[X[H›Øİ\ĞÚÚXÙ\Ï^Ù›Øİ\ĞÚÚXÙ\ßHÙ[XİY\ÚÕšY]Ò\Ô™\İ^ÜÙ[XİY\ÚÕšY]Ò\Ô™\İHİ^ÜİH™\]Z\™YÛ™PÛİ[^Ü™\]Z\™YÛ™PÛİ[H™\]Z\™Y›İÜÏ^Ü™\]Z\™Y›İÜßH™Y™\™[˜Ù\Ï^Ü™Y™\™[˜Ù\ßHÛ™PÛİ[^ÙÛ™PÛİ[H›Øİ\Ó[ÙTÚİĞ[^Ù›Øİ\Ó[ÙTÚİĞ[HÙ]›Øİ\Ó[ÙTÚİĞ[^ÜÙ]›Øİ\Ó[ÙTÚİĞ[H\Õ\ÚÔ]\ÙYÛ‘]O^Ú\Õ\ÚÔ]\ÙYÛ‘]_HÜ[”›İÏ^ÛÜ[”›İßHÙ]Ü[”›İÏ^ÜÙ]Ü[”›İßHÙ[Xœ˜]RÙ^O^ØÙ[Xœ˜]RÙ^_H]\ÙU˜XÚÙ\•\ÚÏ^Ü]\ÙU˜XÚÙ\•\ÚßH™\İ[YU˜XÚÙ\•\ÚÏ^Ü™\İ[YU˜XÚÙ\•\ÚßH\ÚÓ\İÛÛ\ÙY^İ\ÚÓ\İÛÛ\ÙYHÙ]\ÚÓ\İÛÛ\ÙY^ÜÙ]\ÚÓ\İÛÛ\ÙYH™XÙ[PÛÛ\]YÙ^\Ï^Ü™XÙ[PÛÛ\]YÙ^\ßH[İ™U\ÚÑÜ›İ\^Û[İ™U\ÚÑÜ›İ\Hİ\Ú[\•\ÚÑ˜YÏ^Üİ\Ú[\•\ÚÑ˜YßH[İ™TÚ[\•\ÚÑ˜YÏ^Û[İ™TÚ[\•\ÚÑ˜YßH[™Ú[\•\ÚÑ˜YÏ^Ù[™Ú[\•\ÚÑ˜YßHØ[˜Ù[Ú[\•\ÚÑ˜YÏ^ØØ[˜Ù[Ú[\•\ÚÑ˜YßH[İ™U\ÚÕÕÛ[Üœ›İÏ^Û[İ™U\ÚÕÕÛ[Üœ›İßHÛÛ\]YÙ^Q^[™Y^ØÛÛ\]YÙ^Q^[™YHÙ]ÛÛ\]YÙ^Q^[™Y^ÜÙ]ÛÛ\]YÙ^Q^[™YHØ[T]ZXÚÓÜ[^ØØ[T]ZXÚÓÜ[ŸHÙ]Ø[T]ZXÚÓÜ[^ÜÙ]Ø[T]ZXÚÓÜ[ŸHİ\œ™[ÛÜ[™ÓÜ[Û^Øİ\œ™[ÛÜ[™ÓÜ[ÛŸH™\ÚY™›O^Ü™\ÚY™›_HÙ]Ø\™TÙXİ[Û^ÜÙ]Ø\™TÙXİ[ÛŸHÛÕÑ\Ú›Ø\™^ÙÛÕÑ\Ú›Ø\™HÏƒBƒBˆÙYZÔ[™[Ü[^Ù\Ú›Ø\™OOHÙYZÈŸHÜ[•Ù^R›İ\›˜[^ÛÜ[•Ù^R›İ\›˜[HÙYZĞØ\™[™^^İÙYZĞØ\™[™^HÙ]ÙYZĞØ\™[™^^ÜÙ]ÙYZĞØ\™[™^HÙYZÔİÚ\Tİ\^İÙYZÔİÚ\Tİ\HÙYZÔİÚ\Tİ\O^İÙYZÔİÚ\Tİ\_H™Y›Xİ[ÛØ[[™\“[Û^Ü™Y›Xİ[ÛØ[[™\“[ÛHÙ]™Y›Xİ[ÛØ[[™\“[Û^ÜÙ]™Y›Xİ[ÛØ[[™\“[ÛH™Y›Xİ[Û“[Û]O^Ü™Y›Xİ[Û“[Û]_H™Y›Xİ[Û“[Ûİ\^Ü™Y›Xİ[Û“[Ûİ\H™Y›Xİ[Û“[Û^\Ï^Ü™Y›Xİ[Û“[Û^\ßH™Y›Xİ[Û‘]TÙ]^Ü™Y›Xİ[Û‘]TÙ]HZ[PÚXÚÒ[’\İÜO^ÙZ[PÚXÚÒ[’\İÜ_H™\İ]\ÔÙ]^Ü™\İ]\ÔÙ]HÙ[XİY›ÙÜ™\ÜÑ]O^ÜÙ[XİY›ÙÜ™\ÜÑ]_HÙ]Ù[XİY›ÙÜ™\ÜÑ]O^ÜÙ]Ù[XİY›ÙÜ™\ÜÑ]_H^PÛÛ\][Û”İ^Ù^PÛÛ\][Û”İHÙ]^UšY]Ñ]O^ÜÙ]^UšY]Ñ]_HÙ]Xİ]™O^ÜÙ]Xİ]™_HÙ]™Y›Xİ[Û•šY]Ù\‘]O^ÜÙ]™Y›Xİ[Û•šY]Ù\‘]_HÙ]ÚXÚÒ[•šY]Ù\‘]O^ÜÙ]ÚXÚÒ[•šY]Ù\‘]_H™Y›Xİ[Û’\İÜO^Ü™Y›Xİ[Û’\İÜ_H›İ\›˜[\İÜQ^[™Y^Ú›İ\›˜[\İÜQ^[™YHÙ]›İ\›˜[\İÜQ^[™Y^ÜÙ]›İ\›˜[\İÜQ^[™YHÙYZÛR[[[Û’\İÜO^İÙYZÛR[[[Û’\İÜ_HÙYZÛR[[[Û’\İÜQ^[™Y^İÙYZÛR[[[Û’\İÜQ^[™YHÙ]ÙYZÛR[[[Û’\İÜQ^[™Y^ÜÙ]ÙYZÛR[[[Û’\İÜQ^[™YH\š[Ù^Ü\š[ÙHØ[[™\•ÙYZÓÙ™œÙ]^ØØ[[™\•ÙYZÓÙ™œÙ]HÙ]Ø[[™\•ÙYZÓÙ™œÙ]^ÜÙ]Ø[[™\•ÙYZÓÙ™œÙ]HØ[[™\•ÙYZÔ™]šY]Ñ]O^ØØ[[™\•ÙYZÔ™]šY]Ñ]_HÙ]Ø[[™\•ÙYZÔ™]šY]Ñ]O^ÜÙ]Ø[[™\•ÙYZÔ™]šY]Ñ]_H˜XÚÙ\•\ÚÜÏ^İ˜XÚÙ\•\ÚÜßH^UšY]Ñ]O^Ù^UšY]Ñ]_H^UšY]Ñ^[™Y^Ù^UšY]Ñ^[™YHÙ]^UšY]Ñ^[™Y^ÜÙ]^UšY]Ñ^[™YHÛ™Ò\İÜPQ]O^ÛÛ™Ò\İÜPQ]_H\Õ\ÚÔ]\ÙYÛ‘]O^Ú\Õ\ÚÔ]\ÙYÛ‘]_HX\šÔ\İ\ÚÜÑÛ™O^ÛX\šÔ\İ\ÚÜÑÛ™_HÛ™O^ÙÛ™_HÙÙÛO^İÙÙÛ_H\Ò\İÜšXØ[šY]Ï^Ú\Ò\İÜšXØ[šY]ßHXš]\ÚÜÏ^ÚXš]\ÚÜßHXš]Ø\™[‘Ü›İİİ^ÚXš]Ø\™[‘Ü›İİİHXš]Ø\™[•İ[ÚXÚÒ[œÏ^ÚXš]Ø\™[•İ[ÚXÚÒ[œßHXš]Ø\™[“Ü[^ÚXš]Ø\™[“Ü[ŸHÙ]Xš]Ø\™[“Ü[^ÜÙ]Xš]Ø\™[“Ü[ŸHÒPÒÒS—ÓSÓÑÏ^ĞÒPÒÒS—ÓSÓÑßHÏƒBƒBˆ›ÙÜ™\ÜÔ[™[Ü[^Ù\Ú›Ø\™OOHœ›ÙÜ™\ÜÈŸH›ÙÜ™\ÜÕšY]Ï^Ü›ÙÜ™\ÜÕšY]ßHÙ]›ÙÜ™\ÜÕšY]Ï^ÜÙ]›ÙÜ™\ÜÕšY]ßHÙYZÛR[[[Û‘Y][™Ï^İÙYZÛR[[[Û‘Y][™ßHÙ]ÙYZÛR[[[Û‘Y][™Ï^ÜÙ]ÙYZÛR[[[Û‘Y][™ßHÙYZÛR[[[Û‘˜Y^İÙYZÛR[[[Û‘˜YHÙ]ÙYZÛR[[[Û‘˜Y^ÜÙ]ÙYZÛR[[[Û‘˜YHÙYZÛR[[[Û•^^İÙYZÛR[[[Û•^HØ]™UÙYZÛR[[[Û‘Y]^ÜØ]™UÙYZÛR[[[Û‘Y]H\ÕÙYZÛPXİ]š]O^Ú\ÕÙYZÛPXİ]š]_HÛÕÑ\Ú›Ø\™^ÙÛÕÑ\Ú›Ø\™HÙYZÛSİ™\˜[İ^İÙYZÛSİ™\˜[İHÙYZÓİ™\•ÙYZÑ[O^İÙYZÓİ™\•ÙYZÑ[_H™Y™\™[˜Ù\Ï^Ü™Y™\™[˜Ù\ßHÙYZÛQ\ÜÙ[X[İ^İÙYZÛQ\ÜÙ[X[İHÙYZÛSİ™\˜[Û™O^İÙYZÛSİ™\˜[Û™_HÙYZÛSİ™\˜[ÜÜÚX›O^İÙYZÛSİ™\˜[ÜÜÚX›_HÙYZÛP›Û\ÑÛ™O^İÙYZÛP›Û\ÑÛ™_HØ\š[™Ñ^\Ï^ØØ\š[™Ñ^\ßHÙYZÛQ\ÜÙ[X[Û™O^İÙYZÛQ\ÜÙ[X[Û™_HØ\™TİÜO^ØØ\™TİÜ_HØ\™P\™X\Ï^ØØ\™P\™X\ßHÜ[•\ÚÓX[˜YÙ\^ÛÜ[•\ÚÓX[˜YÙ\ŸH]\›’[œÚYÚØ\™Ï^Ü]\›’[œÚYÚØ\™ßH[œÚYÚØ\™[™^^Ú[œÚYÚØ\™[™^HÙ][œÚYÚØ\™[™^^ÜÙ][œÚYÚØ\™[™^HÙYZÛRYÚYÚÏ^İÙYZÛRYÚYÚßH\š[Ù^Ü\š[ÙHÛÕÜš]UÙYZÛR[[[Û^ÙÛÕÜš]UÙYZÛR[[[ÛŸHÙ]Ú\™PØ\™Ü[^ÜÙ]Ú\™PØ\™Ü[ŸH›ÙÜ™\ÜÑ]Z[ÓÜ[^Ü›ÙÜ™\ÜÑ]Z[ÓÜ[ŸHÙ]›ÙÜ™\ÜÑ]Z[ÓÜ[^ÜÙ]›ÙÜ™\ÜÑ]Z[ÓÜ[ŸH‘S‘ÕÑQRÔÏ^Õ‘S‘ÕÑQRÔßH‘S‘ÓSÓ•Ï^Õ‘S‘ÓSÓ•ßHİ\œ™[[ÛÙ^O^Øİ\œ™[[ÛÙ^_H[ÛSİ™\˜[İ^Û[ÛSİ™\˜[İH[Ûİ™\“[Û[O^Û[Ûİ™\“[Û[_H[ÛU™[™Ú[Ï^Û[ÛU™[™Ú[ßH\Y™[™[Û^İ\Y™[™[ÛHÙ]\Y™[™[Û^ÜÙ]\Y™[™[ÛH[ÛS[ÜİÛÛœÚ\İ[^Û[ÛS[ÜİÛÛœÚ\İ[Hİ\œ™[[Û]\Ï^Øİ\œ™[[Û]\ßHÙYZÛU™[™Ú[Ï^İÙYZÛU™[™Ú[ßH\Y™[™ÙYZÏ^İ\Y™[™ÙYZßHÙ]\Y™[™ÙYZÏ^ÜÙ]\Y™[™ÙYZßHXš]\ÚÜÏ^ÚXš]\ÚÜßHXš]Ø\™[‘Ü›İİİ^ÚXš]Ø\™[‘Ü›İİİHXš]Ø\™[•İ[ÚXÚÒ[œÏ^ÚXš]Ø\™[•İ[ÚXÚÒ[œßHXš]Ø\™[“Ü[^ÚXš]Ø\™[“Ü[ŸHÙ]Xš]Ø\™[“Ü[^ÜÙ]Xš]Ø\™[“Ü[ŸHÏƒBƒBˆÏƒBˆÏƒBˆ
_CBˆİ\Ù\ˆ	‰ˆ
Bˆ›Ûİ\ˆİ[O^ŞÈX\™Ú[•ÜˆŒ‹Y[™ÎˆŒŒLœ‹^[YÛˆ˜Ù[\ˆ‹›Ü™\•ÜˆŒ\ÛÛYÑM‘Œˆ‹ÛÛÜˆˆÎÍQH‹›ÛÚ^™NˆLKK[™RZYÚˆKÈ_OƒBˆ]°ªHŒˆØX›H›ÚœİÛˆ0­È\ÚY™x¡(ˆ0­È[šYÚÈ™\Ù\™YÙ]ƒBˆ]ƒBˆH™YH‹‹ÛYØ[š[Üš]˜XŞHˆİ[O^ŞÈÛÛÜˆˆÎPÍQHˆ_O”š]˜XŞOØOƒBˆÜ[ˆ\šXKZY[HYHˆ0­ÈÜÜ[ƒBˆH™YH‹‹ÛYØ[š[İ\›\Èˆİ[O^ŞÈÛÛÜˆˆÎPÍQHˆ_O•\›\ÏØOƒBˆÜ[ˆ\šXKZY[HYHˆ0­ÈÜÜ[ƒBˆH™YH‹‹ÛYØ[š[ØX›İ]ˆİ[O^ŞÈÛÛÜˆˆÎPÍQHˆ_OX›İ]ØOƒBˆÜ[ˆ\šXKZY[HYHˆ0­ÈÜÜ[ƒBˆH™YH‹‹Üİ\Üš[ˆİ[O^ŞÈÛÛÜˆˆÎPÍQHˆ_O”İ\ÜØOƒBˆÙ]ƒBˆÙ›Ûİ\ƒBˆ
_CBˆÙ]ƒBˆÙ]ƒBˆÜ™XÙ[Q[]Y\ÚÈ	‰ˆ
Bˆ]ˆİ[O^ŞÈÜÚ][Ûˆ™š^Y‹YˆL	H‹›İÛNˆŒ˜[œÙ›Ü›Nˆ˜[œÛ]V
ML	JH‹’[™^ˆŒ\Ü^Nˆ™›^‹[YÛ’][\Îˆ˜Ù[\ˆ‹Ø\ˆLY[™ÎˆŒLM‹›Ü™\”˜Y]\ÎˆL‹˜XÚÙÜ›İ[™ˆˆÌĞŒ‘Mˆ‹ÛÛÜˆÚ]H‹›ŞÚYİÎˆŒLÌ™Ø˜JŒJH‹X^ÚYˆLÈˆ_OƒBˆÜ[ˆİ[O^ŞÈ›ÛÚ^™NˆL‹H_O¼'åä{î#ÈÜ™XÙ[Q[]Y\ÚË›X™[Hˆ™[[İ™YÜÜ[ƒBˆ]Ûˆ\OH˜]ÛˆˆÛÛXÚÏ^İ[™Ñ[]U\ÚßHİ[O^ŞÈY[™Îˆ\L‹›Ü™\”˜Y]\Îˆ›Ü™\ˆŒ\ÛÛY™Ø˜JMKMKMK
H‹˜XÚÙÜ›İ[™ˆ˜[œÜ\™[‹ÛÛÜˆˆÑŒ‘Q‘ˆ‹›ÛÙZYÚˆLİ\œÛÜˆœÚ[\ˆ‹›ÛÚ^™NˆL‹KÚ]TÜXÙNˆ››İÜ˜\ˆ_O•[™ÏØ]ÛƒBˆÙ]ƒBˆ
_CBˆØ˜YÙPÙ[Xœ˜][Ûˆ	‰ˆ
Bˆ]ˆ›ÛOHœİ]\Èˆİ[O^ŞÈÜÚ][Ûˆ™š^Y‹YˆL	H‹›İÛNˆŒ˜[œÙ›Ü›Nˆ˜[œÛ]V
ML	JH‹’[™^ˆŒK\Ü^Nˆ™›^‹[YÛ’][\Îˆ˜Ù[\ˆ‹Ø\ˆLY[™ÎˆŒLM‹›Ü™\”˜Y]\ÎˆL‹˜XÚÙÜ›İ[™ˆˆÌĞŒ‘Mˆ‹ÛÛÜˆÚ]H‹›ŞÚYİÎˆŒLÌ™Ø˜JŒJH‹X^ÚYˆLÈˆ_OƒBˆÜ[ˆİ[O^ŞÈ›ÛÚ^™NˆL‹H_OƒBˆØ˜YÙPÙ[Xœ˜][Û‹š[›ßHØ˜YÙPÙ[Xœ˜][Û‹˜˜YÙ\Ë›X\

][JHOˆ	Ú][K˜˜YÙ_H	Ú][K›˜[Y_X
Kš›Ú[Š‹Š_CBˆÜÜ[ƒBˆ]Ûˆ\OH˜]ÛˆˆÛÛXÚÏ^Ê
HOˆÙ]˜YÙPÙ[Xœ˜][ÛŠ[
_H\šXK[X™[H‘\ÛZ\ÜÈˆİ[O^ŞÈY[™Îˆ\L‹›Ü™\”˜Y]\Îˆ›Ü™\ˆŒ\ÛÛY™Ø˜JMKMKMK
H‹˜XÚÙÜ›İ[™ˆ˜[œÜ\™[‹ÛÛÜˆˆÑŒ‘Q‘ˆ‹›ÛÙZYÚˆLİ\œÛÜˆœÚ[\ˆ‹›ÛÚ^™NˆL‹KÚ]TÜXÙNˆ››İÜ˜\ˆ_O¸§%OØ]ÛƒBˆÙ]ƒBˆ
_CBˆÙ]ƒBˆ
NÃBŸCBƒBƒB˜Û\ÜÈ\\œ›Ü›İ[™\H^[™È™XXİÛÛ\Û™[ÃBˆÛÛœİXİÜŠ›ÜÊHÃBˆİ\\Š›ÜÊNÃBˆ\Ëœİ]HHÈ\Ñ\œ›Üˆ˜[ÙHNÃBˆCBˆİ]XÈÙ]\š]™Yİ]Qœ›ÛQ\œ›ÜŠ
HÃBˆ™]\›ˆÈ\Ñ\œ›ÜˆYHNÃBˆCBˆÛÛ\Û™[YØ]Ú
\œ›Ü‹[™›ÊHÃBˆÛÛœÛÛK™\œ›ÜŠ”\ÚY™HÜ˜\ÚYˆ‹\œ›Ü‹[™›ÊNÃBˆİ\X˜\ÙK˜]]™Ù]\Ù\Š
K[Š
È]HJHOˆÃBˆİ\X˜\ÙK™œ›ÛJ˜\Ù\œ›Ü—ÛÙÜÈŠKš[œÙ\
ÃBˆ\Ù\—ÚYˆ]OË\Ù\ËšY[BˆY\ÜØYÙNˆİš[™Ê\œ›ÜË›Y\ÜØYÙH\œ›Üˆ•[šÛ›İÛˆ\œ›ÜˆŠKœÛXÙJŒ
KBˆİXÚÎˆİš[™Ê\œ›ÜËœİXÚÈˆŠKœÛXÙJ
KBˆ\›ˆÚ[™İË›ØØ][Û‹š™Y‹BˆJK[Š

HOˆßK

HOˆßJNÃBˆJK˜Ø]Ú


HOˆßJNÃBˆCBˆ™[™\Š
HÃBˆYˆ
\Ëœİ]Kš\Ñ\œ›ÜŠHÃBˆ™]\›ˆ
Bˆ]ˆİ[O^ŞÈZ[’ZYÚˆŒLš‹\Ü^Nˆ™›^‹[YÛ’][\Îˆ˜Ù[\ˆ‹\İYPÛÛ[ˆ˜Ù[\ˆ‹Y[™Îˆ›Û˜[Z[NˆœŞ\İ[K]ZKØ[œË\Ù\šYˆ‹^[YÛˆ˜Ù[\ˆˆ_OƒBˆ]ˆİ[O^ŞÈX^ÚYˆÍŒ_OƒBˆ]ˆİ[O^ŞÈ›ÛÚ^™Nˆ_O¼'éîÙ]ƒBˆHİ[O^ŞÈ›ÛÚ^™NˆNÛÛÜˆˆÍPˆ‹X\™Ú[ˆŒLœœˆ_O”ÛÛY][™ÈÙ[H]HÚY]Ø^\ÏÚOƒBˆİ[O^ŞÈ›ÛÚ^™NˆLËKÛÛÜˆˆÎÍQH‹[™RZYÚˆKH_O”\ÚY™H]HÛ˜YËˆ[İ\ˆ]H\ÈØY™H8 %™[ØY[™È\İX[Hš^\È\ËÜƒBˆ]ÛˆÛÛXÚÏ^Ê
HOˆÚ[™İË›ØØ][Û‹œ™[ØY

_Hİ[O^ŞÈX\™Ú[•ÜˆMY[™ÎˆŒLN‹›Ü™\”˜Y]\ÎˆL›Ü™\ˆ˜XÚÙÜ›İ[™ˆˆĞMQÌH‹ÛÛÜˆÚ]H‹›ÛÙZYÚˆİ\œÛÜˆœÚ[\ˆˆ_O”™[ØY\ÚY™OØ]ÛƒBˆÙ]ƒBˆÙ]ƒBˆ
NÃBˆCBˆ™]\›ˆ\Ëœ›ÜË˜Ú[™[ÃBˆCBŸCBƒB”™XXİÓK˜Ü™X]T›Ûİ
Øİ[Y[™Ù][[Y[RY
œ›ÛİŠJKœ™[™\Š\\œ›Ü›İ[™\OÛİÕ\˜XÚÙ\ˆÏĞ\\œ›Ü›İ[™\OŠNÃB