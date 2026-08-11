(function (root, factory) {
  const deps = typeof module === "object" && module.exports
    ? { content: require("./plush-content.js"), helpers: require("./plush-helpers.js"), care: require("./care-upgrades.js") }
    : { content: (root && root.PlushLifeContent) || {}, helpers: (root && root.PlushLifeHelpers) || {}, care: (root && root.PlushLifeCare) || {} };
  const api = factory(deps.content, deps.helpers, deps.care);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.PlushLifeSchedule = api;
})(typeof window !== "undefined" ? window : globalThis, function (plushContent, plushHelpers, plushCare) {
  // Pure date/schedule/task-shape utilities, moved out of the main
  // app-source script (module split phase 3 — see docs/module-split-plan.md).
  // Depends on assets/plush-content.js (DAYS, PLUSH_PATHS),
  // assets/plush-helpers.js (OPTIONAL_SECTION_MARKERS), and
  // assets/care-upgrades.js (taskTargetsDate).

  const { DAYS, PLUSH_PATHS } = plushContent;
  const { OPTIONAL_SECTION_MARKERS } = plushHelpers;

  const WEEKDAY_PRESET_IDS = ["mon", "tue", "wed", "thu", "fri"];
  const WEEKEND_PRESET_IDS = ["sat", "sun"];
  const WEEKDAY_IDS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const HABIT_META_PATTERN = /^\[\[plushlist-habit:(build|reduce)\]\]\s*/;

  const REFLECTION_PROMPT_ROTATIONS = {
    mon: ["What is one small thing that supported you today?", "What felt a little easier than expected?", "What is one kind thing you did for yourself?", "What do you want to remember from today?"],
    tue: ["What helped you keep going today?", "What is one feeling you want to name without judging it?", "What would make tonight feel a little softer?", "What is one small win from today?"],
    wed: ["Where did you show strength today?", "What are you proud you tried?", "What helped you feel more like yourself today?", "What would you tell a friend who had your day?"],
    thu: ["What do you need more of right now?", "What can you set down for tonight?", "What helped you feel steady today?", "What is one gentle next step for tomorrow?"],
    fri: ["What are you celebrating from this week?", "What helped you get through today?", "What felt fun, comforting, or meaningful?", "What do you want to carry into the weekend?"],
    sat: ["What gave you energy today?", "What comforted you today?", "What did you enjoy, even a little?", "What would make tomorrow kinder?"],
    sun: ["What are three wins from this week?", "What are you ready to leave behind from this week?", "What support would help next week?", "What's one thing about this week you want to remember?"],
  };

  function isQuietTime(preferences) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const nowMinutes = Number(values.hour) * 60 + Number(values.minute);
    const toMinutes = (value) => {
      const [hour, minute] = String(value || "00:00").split(":").map(Number);
      return hour * 60 + minute;
    };
    const start = toMinutes(preferences.quiet_start);
    const end = toMinutes(preferences.quiet_end);
    return start <= end
      ? nowMinutes >= start && nowMinutes < end
      : nowMinutes >= start || nowMinutes < end;
  }

  function taskIsOptional(task) {
    const section = String(task?.section || "").toLowerCase();
    return !!task?.is_bonus || OPTIONAL_SECTION_MARKERS.some((marker) => section.includes(marker));
  }

  function scheduleLabelForTask(task) {
    const days = Array.isArray(task.schedule_days) ? task.schedule_days.filter((id) => DAYS.some((day) => day.id === id)) : [];
    if (days.length) {
      if (days.length === 7) return "Every day";
      if (days.length === WEEKDAY_PRESET_IDS.length && WEEKDAY_PRESET_IDS.every((id) => days.includes(id))) return "Weekdays";
      if (days.length === WEEKEND_PRESET_IDS.length && WEEKEND_PRESET_IDS.every((id) => days.includes(id))) return "Weekend";
      return DAYS.filter((day) => days.includes(day.id)).map((day) => day.label[0] + day.label.slice(1).toLowerCase()).join(", ");
    }
    return task.day_id === "daily" ? "Every day" : (DAYS.find((day) => day.id === task.day_id)?.title || task.day_id);
  }

  function reflectionPromptForDay(dayId, date, fallback) {
    const prompts = REFLECTION_PROMPT_ROTATIONS[dayId];
    if (!prompts?.length) return fallback;
    const monday = new Date(`${date}T12:00:00Z`);
    monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
    const rotation = Math.abs(Math.floor(monday.getTime() / 604800000)) % prompts.length;
    return prompts[rotation];
  }

  function trackerPeriod(now = new Date()) {
    const localDate = new Intl.DateTimeFormat("en-CA", { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });
    const date = localDate.format(now);
    const dateAtNoonUtc = new Date(`${date}T12:00:00Z`);
    const monday = new Date(dateAtNoonUtc);
    monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
    return { date, weekStart: monday.toISOString().slice(0, 10) };
  }

  function dayIdForDate(date) {
    return WEEKDAY_IDS[new Date(`${date}T12:00:00Z`).getUTCDay()];
  }

  function pathOfTheWeekId(weekStart) {
    const weekIndex = Math.floor(new Date(`${weekStart}T12:00:00Z`).getTime() / (7 * 24 * 60 * 60 * 1000));
    return PLUSH_PATHS[((weekIndex % PLUSH_PATHS.length) + PLUSH_PATHS.length) % PLUSH_PATHS.length].id;
  }

  function dateForDayId(dayId, period) {
    if (dayId === "daily") return period.date;
    const dayIndex = DAYS.findIndex((day) => day.id === dayId);
    if (dayIndex < 0) return period.date;
    const date = new Date(`${period.weekStart}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + dayIndex);
    return date.toISOString().slice(0, 10);
  }

  function formatTime12(value24) {
    if (!value24) return "";
    const [hStr, mStr] = value24.split(":");
    let hour = parseInt(hStr, 10);
    if (Number.isNaN(hour)) return "";
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `${hour}:${mStr} ${ampm}`;
  }

  function parseTime24(label12) {
    const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec((label12 || "").trim());
    if (!match) return "";
    let hour = parseInt(match[1], 10);
    const minute = match[2];
    const ampm = match[3].toUpperCase();
    if (ampm === "PM" && hour !== 12) hour += 12;
    if (ampm === "AM" && hour === 12) hour = 0;
    return `${String(hour).padStart(2, "0")}:${minute}`;
  }

  function splitScheduleField(value) {
    const trimmed = (value || "").trim();
    const match = /^(\d{1,2}:\d{2}\s*(?:AM|PM))\s*(?:[·\-–]\s*)?(.*)$/i.exec(trimmed);
    if (match) return { time: parseTime24(match[1]), text: match[2] || "" };
    return { time: "", text: trimmed };
  }

  function legacyScheduleToEntries(schedule) {
    if (!schedule) return [];
    const fields = [
      ["wake", schedule.wake, "Wake up"],
      ["morning", schedule.morning, ""],
      ["work", schedule.work, ""],
      ["workout", schedule.workout, ""],
      ["home", schedule.home, ""],
    ];
    const entries = [];
    fields.forEach(([field, value, fallbackText]) => {
      if (!value) return;
      if (field === "wake") {
        entries.push({ id: `legacy-${field}`, time: parseTime24(value), text: fallbackText });
      } else {
        const split = splitScheduleField(value);
        entries.push({ id: `legacy-${field}`, time: split.time, text: split.text });
      }
    });
    return entries;
  }

  function habitTypeForTask(task) {
    return (task?.detail || "").match(HABIT_META_PATTERN)?.[1] || "regular";
  }

  function cleanTaskDetail(detail = "") {
    return detail.replace(HABIT_META_PATTERN, "").trim();
  }

  function encodeTaskDetail(habitType, detail = "") {
    const cleanDetail = cleanTaskDetail(detail);
    return habitType === "build" || habitType === "reduce"
      ? `[[plushlist-habit:${habitType}]]${cleanDetail ? ` ${cleanDetail}` : ""}`
      : cleanDetail;
  }

  function offsetDate(date, dayOffset) {
    const value = new Date(`${date}T12:00:00Z`);
    value.setUTCDate(value.getUTCDate() + dayOffset);
    return value.toISOString().slice(0, 10);
  }

  function monthKeyOffset(date, monthOffset) {
    const value = new Date(`${date}T12:00:00Z`);
    value.setUTCDate(1); // pin to day 1 first so shifting months never overflows into a different month
    value.setUTCMonth(value.getUTCMonth() + monthOffset);
    return value.toISOString().slice(0, 7); // "YYYY-MM"
  }

  function daysInCalendarMonth(monthKey) {
    const [year, month] = monthKey.split("-").map(Number);
    return new Date(Date.UTC(year, month, 0)).getUTCDate();
  }

  function datesInMonthThrough(monthKey, throughDate) {
    const count = daysInCalendarMonth(monthKey);
    const dates = Array.from({ length: count }, (_, index) => `${monthKey}-${String(index + 1).padStart(2, "0")}`);
    return throughDate ? dates.filter((date) => date <= throughDate) : dates;
  }

  function daysBetweenDates(earlierDate, laterDate) {
    if (!earlierDate || !laterDate) return null;
    const a = new Date(`${earlierDate}T12:00:00Z`);
    const b = new Date(`${laterDate}T12:00:00Z`);
    return Math.round((b.getTime() - a.getTime()) / 86400000);
  }

  function taskOccursOn(task, date) {
    if (task.schedule_type === "once") return task.one_time_date === date;
    if (task.schedule_type === "range") {
      if (task.start_date && date < task.start_date) return false;
      if (task.end_date && date > task.end_date) return false;
    }
    return true;
  }

  function taskIsScheduledForDate(task, date) {
    return plushCare.taskTargetsDate(task, date, dayIdForDate) && taskOccursOn(task, date);
  }

  function datesThroughToday(period) {
    const dates = [];
    const cursor = new Date(`${period.weekStart}T12:00:00Z`);
    const end = new Date(`${period.date}T12:00:00Z`);
    while (cursor <= end) {
      dates.push(cursor.toISOString().slice(0, 10));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return dates;
  }

  return {
    WEEKDAY_PRESET_IDS,
    WEEKEND_PRESET_IDS,
    WEEKDAY_IDS,
    HABIT_META_PATTERN,
    REFLECTION_PROMPT_ROTATIONS,
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
  };
});
