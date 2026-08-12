const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "src", "app-source.jsx");
let source = fs.readFileSync(file, "utf8");

if (source.includes("const WARM_START_CACHE_VERSION = 1;")) {
  console.log("Warm-start performance patch is already applied.");
  process.exit(0);
}

function replaceOnce(label, from, to) {
  const first = source.indexOf(from);
  if (first < 0) throw new Error(`${label}: source pattern not found`);
  if (source.indexOf(from, first + from.length) >= 0) throw new Error(`${label}: source pattern is not unique`);
  source = source.slice(0, first) + to + source.slice(first + from.length);
}

function replaceAfter(label, anchor, from, to) {
  const anchorIndex = source.indexOf(anchor);
  if (anchorIndex < 0) throw new Error(`${label}: anchor not found`);
  const first = source.indexOf(from, anchorIndex + anchor.length);
  if (first < 0) throw new Error(`${label}: source pattern not found after anchor`);
  source = source.slice(0, first) + to + source.slice(first + from.length);
}

replaceOnce(
  "warm cache helpers",
  'const SUPABASE_AUTH_STORAGE_KEY = "sb-pvitdhixycegmcovapyh-auth-token";\n',
  `const SUPABASE_AUTH_STORAGE_KEY = "sb-pvitdhixycegmcovapyh-auth-token";\nconst WARM_START_CACHE_VERSION = 1;\nconst WARM_START_CACHE_MAX_AGE_MS = 2 * 60 * 60 * 1000;\n\nfunction warmStartCacheKey(userId, date) {\n  return \`plushlife:warm-start:v1:\${userId}:\${date}\`;\n}\n\nfunction readWarmStartCache(userId, date) {\n  if (!userId || !date) return null;\n  try {\n    const parsed = JSON.parse(window.localStorage.getItem(warmStartCacheKey(userId, date)) || "null");\n    if (!parsed || parsed.version !== WARM_START_CACHE_VERSION || parsed.date !== date) return null;\n    if (!Number.isFinite(parsed.savedAt) || Date.now() - parsed.savedAt > WARM_START_CACHE_MAX_AGE_MS) return null;\n    if (!Array.isArray(parsed.tasks) || !Array.isArray(parsed.schedules) || !Array.isArray(parsed.exceptions) || !Array.isArray(parsed.snoozes)) return null;\n    if (!parsed.done || typeof parsed.done !== "object" || Array.isArray(parsed.done)) return null;\n    return parsed;\n  } catch (_error) {\n    return null;\n  }\n}\n\nfunction writeWarmStartCache(userId, date, value) {\n  if (!userId || !date) return;\n  try {\n    window.localStorage.setItem(warmStartCacheKey(userId, date), JSON.stringify({\n      version: WARM_START_CACHE_VERSION, date, savedAt: Date.now(), ...value,\n    }));\n  } catch (_error) {}\n}\n`
);

replaceOnce(
  "hydrate warm cache before network",
  `    let active = true;\n    setDone({});\n    setSyncStatus("syncing");\n    Promise.all([`,
  `    let active = true;\n    const warmCache = readWarmStartCache(user.id, period.date);\n    if (warmCache) {\n      setDone(warmCache.done || {});\n      setTrackerProfile(warmCache.profile || null);\n      setDisplayNameDraft(warmCache.profile?.display_name || "");\n      setComfortItemDraft(warmCache.profile?.comfort_item_name || "");\n      setTrackerTasks(warmCache.tasks || []);\n      setTaskSnoozes(warmCache.snoozes || []);\n      setPersonalSchedules(warmCache.schedules || []);\n      setScheduleExceptions(warmCache.exceptions || []);\n      try { window.PlushLifeRuntime?.metric("warm-cache-hydrated", performance.now(), String(warmCache.tasks?.length || 0) + " tasks"); } catch (_error) {}\n    } else {\n      setDone({});\n    }\n    setSyncStatus("syncing");\n    Promise.all([`
);

replaceAfter(
  "persist warm cache after server load",
  `        const hasDatedProgress = Boolean(dailyResult.data);`,
  `        setDone(Object.fromEntries(completedKeys.map((key) => [key, true])));\n        setWeeklyHistory((entries) => [\n          ...entries.filter((entry) => entry.progress_date !== period.date),\n          { progress_date: period.date, completed_keys: completedKeys },\n        ]);`,
  `        const serverDone = Object.fromEntries(completedKeys.map((key) => [key, true]));\n        setDone(serverDone);\n        setWeeklyHistory((entries) => [\n          ...entries.filter((entry) => entry.progress_date !== period.date),\n          { progress_date: period.date, completed_keys: completedKeys },\n        ]);\n        writeWarmStartCache(user.id, period.date, {\n          done: serverDone,\n          profile: profileResult.data || null,\n          tasks: tasksResult.data || [],\n          snoozes: snoozesResult.data || [],\n          schedules: schedulesResult.data || [],\n          exceptions: exceptionsResult.data || [],\n        });\n        try { window.PlushLifeRuntime?.metric("tracker-sync-ready", performance.now(), String((tasksResult.data || []).length) + " tasks"); } catch (_error) {}`
);

replaceOnce(
  "memoize history maps",
  `  const historyByDate = new Map(\n    weeklyHistory.map((entry) => [entry.progress_date, new Set(entry.completed_keys || [])])\n  );\n  const habitHistoryByDate = new Map(\n    habitHistory.map((entry) => [entry.progress_date, new Set(entry.completed_keys || [])])\n  );\n  habitHistoryByDate.set(period.date, new Set(Object.keys(done).filter((key) => done[key])));`,
  `  const historyByDate = React.useMemo(() => new Map(\n    weeklyHistory.map((entry) => [entry.progress_date, new Set(entry.completed_keys || [])])\n  ), [weeklyHistory]);\n  const habitHistoryByDate = React.useMemo(() => {\n    const map = new Map(\n      habitHistory.map((entry) => [entry.progress_date, new Set(entry.completed_keys || [])])\n    );\n    map.set(period.date, new Set(Object.keys(done).filter((key) => done[key])));\n    return map;\n  }, [habitHistory, period.date, done]);`
);

replaceOnce(
  "memoize habit stats",
  `  const habitTasks = trackerTasks\n    .filter((task) => habitTypeForTask(task) !== "regular")\n    .map((task) => ({ ...task, habitType: habitTypeForTask(task), stats: habitStatsForTask(task) }));`,
  `  const habitTasks = React.useMemo(() => trackerTasks\n    .filter((task) => habitTypeForTask(task) !== "regular")\n    .map((task) => ({ ...task, habitType: habitTypeForTask(task), stats: habitStatsForTask(task) })),\n  [trackerTasks, habitHistory, done, period.date]);`
);

replaceOnce(
  "cache repeated scheduled key lookups per render",
  `  const requiredKeysForDate = (date) => {\n    return trackerTasks\n      .filter((task) =>\n        taskIsScheduledForDate(task, date) &&\n        !taskIsOptional(task) &&\n        !task.archived_at &&\n        !isTaskPausedOnDate(task, date)\n      )\n      .map((task) => task.task_key);\n  };`,
  `  const requiredKeysCache = new Map();\n  const requiredKeysForDate = (date) => {\n    if (requiredKeysCache.has(date)) return requiredKeysCache.get(date);\n    const keys = trackerTasks\n      .filter((task) =>\n        taskIsScheduledForDate(task, date) &&\n        !taskIsOptional(task) &&\n        !task.archived_at &&\n        !isTaskPausedOnDate(task, date)\n      )\n      .map((task) => task.task_key);\n    requiredKeysCache.set(date, keys);\n    return keys;\n  };`
);

fs.writeFileSync(file, source);
console.log("Applied warm-start and render-cost performance patch.");
