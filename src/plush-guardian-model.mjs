import { companionAccountKey } from "./companion-account-storage.mjs";
import { smallerStep } from "./gentle-day.js";
export function guardianStorage() {
  try {
    return globalThis.localStorage;
  } catch (_) {
    return null;
  }
}
export const GUARDIAN_EVENT = "plushlife:open-guardian-companion";
export const STATE_EVENT = "plushlife:guardian-companion-changed";
export const HOME_CARDS = [
  ["companion", "Plush Guardian"],
  ["tasks", "Today’s tasks"],
  ["shortcuts", "Check-in, Journal & Focus"],
  ["moods", "Mood check-in"],
  ["kindness", "Encouragement"],
];
export const VOICES = {
  neutral: "Gentle Guardian",
  mommy: "Bot Mommy",
  daddy: "Bot Daddy",
  playful: "Playful Guardian",
};
export const ROUTINES = [
  {
    id: "morning",
    name: "A gentle morning",
    steps: [
      "Drink water",
      "Brush teeth",
      "Get dressed",
      "Choose one little task",
    ],
  },
  {
    id: "after-work",
    name: "Leave work behind",
    steps: [
      "Put your things down",
      "Change into something comfortable",
      "Take a quiet moment",
      "Choose rest or one small task",
    ],
  },
  {
    id: "evening",
    name: "Evening wind-down",
    steps: [
      "Put away three things",
      "Brush teeth",
      "Set out tomorrow’s clothes",
      "Settle somewhere comfortable",
    ],
  },
  {
    id: "tomorrow",
    name: "Prepare for tomorrow",
    steps: [
      "Check tomorrow’s schedule",
      "Pack what you need",
      "Choose your clothes",
      "Write down your first little step",
    ],
  },
];
export function localDate(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
export const freshGuardianState = () => ({
  version: 1,
  prefs: {
    voice: "neutral",
    guardianName: "",
    guidance: "gentle",
    careMode: false,
    automaticGifts: true,
    giftCategories: ["stickers","celebrations","trophies"],
    careReminders: false,
    careMorningTime: "09:00",
    careBedtimeTime: "20:15",
    littleMode: false,
    careStyle: "gentle",
    petName: "",
    name: "",
    avoid: "",
    phrases: "",
    aiConsent: false,
    shareTasks: false,
    shareMood: false,
    shareMemories: false,
    keepChat: false,
    remember: true,
    motion: true,
    sound: false,
    haptics: false,
    textSize: "normal",
    quietStart: "21:00",
    quietEnd: "08:00",
    reminders: false,
    automaticReminders: false, // Opt-in rule-based reminders through the existing Android scheduler.
    routineNudges: false,
    tomorrowNudges: false,
    routineReminderTime: "18:30",
    tomorrowReminderTime: "20:00",
  },
  home: { order: HOME_CARDS.map(([id]) => id), hidden: [] },
  inbox: [],
  memories: [],
  reflections: [],
  letters: [],
  rewards: [],
  experiments: [],
  routines: [],
  chat: [],
  activeRoutine: null,
  careChecks: { date: "", items: {} },
  careStickers: [],
  automaticGiftLedger: [],
  taskSteps: {},
  partial: {},
  lastVisit: "",
  lastPrompt: "",
  energy: "some",
});
export function normalizeGuardianState(value) {
  const d = freshGuardianState();
  if (!value || typeof value !== "object" || Array.isArray(value)) return d;
  const next = { ...d, ...value, prefs: { ...d.prefs, ...value.prefs } };
  if (!VOICES[next.prefs.voice]) next.prefs.voice = "neutral";
  next.prefs.guardianName = typeof next.prefs.guardianName === "string" ? next.prefs.guardianName.slice(0, 36) : "";
  // Existing local accounts may have opted into the old Cloudflare chatbot.
  // The Guardian is now an offline, non-chat helper. Never reactivate that
  // consent or share private tasks, moods and memories with an AI service.
  next.prefs.aiConsent = false;
  next.prefs.shareTasks = false;
  next.prefs.shareMood = false;
  next.prefs.shareMemories = false;
  next.prefs.keepChat = false;
  next.prefs.automaticGifts = next.prefs.automaticGifts !== false;
  next.prefs.giftCategories = Array.isArray(next.prefs.giftCategories) ? [...new Set(next.prefs.giftCategories.filter(x=>["stickers","celebrations","trophies"].includes(x)))] : [...d.prefs.giftCategories];
  next.automaticGiftLedger = Array.isArray(value.automaticGiftLedger) ? [...new Set(value.automaticGiftLedger.filter(x=>typeof x==="string" && /^\d{4}-\d{2}-\d{2}:(25|50|100)$/.test(x)))].slice(-180) : [];
  next.prefs.careMode = next.prefs.careMode === true;
  next.prefs.littleMode = next.prefs.littleMode === true;
  next.prefs.careReminders = next.prefs.careReminders === true;
  for (const key of ["careMorningTime","careBedtimeTime"]) if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(next.prefs[key])) next.prefs[key] = d.prefs[key];
  next.careStickers = Array.isArray(value.careStickers) ? [...new Set(value.careStickers.filter(x=>typeof x==="string" && /^\d{4}-\d{2}-\d{2}:(wake|midday|nap|night)$/.test(x)))].slice(-90) : [];
  next.prefs.careStyle = ["gentle","baby","structured"].includes(next.prefs.careStyle) ? next.prefs.careStyle : "gentle";
  next.prefs.petName = typeof next.prefs.petName === "string" ? next.prefs.petName.slice(0,40) : "";
  next.careChecks = value.careChecks && typeof value.careChecks.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.careChecks.date) && value.careChecks.items && typeof value.careChecks.items === "object" && !Array.isArray(value.careChecks.items)
    ? { date: value.careChecks.date, items: Object.fromEntries(Object.entries(value.careChecks.items).filter(([k,v]) => /^[a-z]+:[0-9]+$/.test(k) && v === true).slice(0,80)) }
    : d.careChecks;
  next.prefs.automaticReminders = next.prefs.automaticReminders === true;
  next.prefs.routineNudges = next.prefs.routineNudges === true;
  next.prefs.tomorrowNudges = next.prefs.tomorrowNudges === true;
  for (const key of ["routineReminderTime", "tomorrowReminderTime"]) {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(next.prefs[key])) next.prefs[key] = d.prefs[key];
  }
  for (const key of [
    "inbox",
    "memories",
    "reflections",
    "letters",
    "rewards",
    "experiments",
    "routines",
    "chat",
  ])
    next[key] = Array.isArray(value[key])
      ? value[key].slice(0, key === "reflections" ? 60 : 100)
      : [];
  const ids = HOME_CARDS.map(([id]) => id);
  const order = [
    ...new Set((value.home?.order || []).filter((id) => ids.includes(id))),
  ];
  next.home = {
    order: [...order, ...ids.filter((id) => !order.includes(id))],
    hidden: (value.home?.hidden || []).filter((id) => ids.includes(id)),
  };
  return next;
}
export function guardianKey(userId) {
  return companionAccountKey("guardian-companion:v1", userId);
}
export function readGuardian(storage, userId) {
  try {
    return normalizeGuardianState(
      JSON.parse(storage?.getItem(guardianKey(userId)) || "null"),
    );
  } catch (_) {
    return freshGuardianState();
  }
}
export function saveGuardian(storage, userId, state) {
  const key = guardianKey(userId);
  if (!key) return false;
  try {
    storage.setItem(key, JSON.stringify(state));
    return true;
  } catch (_) {
    return false;
  }
}
export function effort(row) {
  const n = Number(
    row.sourceTask?.estimated_minutes || row.estimated_minutes || 0,
  );
  return n > 20
    ? "Big effort"
    : n > 5
      ? "Some energy"
      : n > 0
        ? "Quick"
        : "At your pace";
}
export function taskSteps(row) {
  const label = String(row?.label || "your task");
  if (/brush.*teeth/i.test(label))
    return [
      "Pick up your toothbrush.",
      "Add toothpaste and brush your teeth.",
      "Rinse and put your toothbrush away.",
    ];
  if (/drink.*water/i.test(label))
    return [
      "Get your cup or bottle.",
      "Fill it with water.",
      "Take a sip, then work toward your own goal.",
    ];
  return [
    smallerStep(row),
    "Do one small part. Pause whenever you need.",
    "Decide whether your goal is met or you want another step.",
  ];
}
export function chooseTask(rows, done, energy = "some") {
  return (
    rows
      .filter(
        (r) =>
          r?.key && !done[r.key] && !r.isBonus && !r.sourceTask?.archived_at,
      )
      .sort((a, b) =>
        energy === "plenty"
          ? Number(b.sourceTask?.estimated_minutes || 5) -
            Number(a.sourceTask?.estimated_minutes || 5)
          : Number(a.sourceTask?.estimated_minutes || 5) -
            Number(b.sourceTask?.estimated_minutes || 5),
      )[0] || null
  );
}
export function gapDays(before, today) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(before || "")) return 0;
  return Math.max(
    0,
    Math.round(
      (Date.parse(today + "T12:00:00") - Date.parse(before + "T12:00:00")) /
        86400000,
    ),
  );
}
export function inQuietHours(prefs, hour = new Date().getHours()) {
  const start = Number(String(prefs.quietStart).split(":")[0]),
    end = Number(String(prefs.quietEnd).split(":")[0]);
  return (
    start === end ||
    (start < end ? hour >= start && hour < end : hour >= start || hour < end)
  );
}
export function buildGuardianPayload(
  state,
  messages,
  rows,
  done,
  mood,
  selectedJournal = "",
) {
  return {
    consent: state.prefs.aiConsent === true,
    messages: messages
      .slice(-12)
      .map(({ role, content }) => ({
        role,
        content: String(content).slice(0, 1200),
      })),
    voice: state.prefs.voice,
    guidance: state.prefs.guidance,
    name: String(state.prefs.name || "").slice(0, 60),
    avoid: String(state.prefs.avoid || "").slice(0, 300),
    phrases: String(state.prefs.phrases || "").slice(0, 300),
    context: {
      tasks: state.prefs.shareTasks
        ? rows
            .filter((r) => !done[r.key] && !r.isBonus)
            .slice(0, 6)
            .map((r) => String(r.label).slice(0, 140))
        : [],
      mood: state.prefs.shareMood ? String(mood?.mood || "").slice(0, 60) : "",
      memories:
        state.prefs.remember && state.prefs.shareMemories
          ? state.memories.slice(0, 8).map((m) => String(m.text).slice(0, 240))
          : [],
      journal: String(selectedJournal || "").slice(0, 1200),
    },
  };
}
export function reflectionPatterns(entries) {
  const groups = new Map();
  for (const entry of entries) {
    if (!entry.helped?.trim()) continue;
    const key = entry.helped.trim().toLocaleLowerCase();
    const old = groups.get(key) || {
      label: entry.helped.trim(),
      count: 0,
      dates: [],
    };
    old.count++;
    old.dates.push(entry.date);
    groups.set(key, old);
  }
  return [...groups.values()].sort((a, b) => b.count - a.count).slice(0, 5);
}
export function openPlushGuardian(page = "guardian", taskKey = null) {
  window.dispatchEvent(
    new CustomEvent(GUARDIAN_EVENT, { detail: { page, taskKey } }),
  );
}
