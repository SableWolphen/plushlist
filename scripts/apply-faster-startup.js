const fs = require("fs");

function read(path) { return fs.readFileSync(path, "utf8"); }
function write(path, value) { fs.writeFileSync(path, value); }
function replaceOnce(source, needle, replacement, label) {
  if (!source.includes(needle)) throw new Error(`Missing marker: ${label}`);
  return source.replace(needle, replacement);
}

{
  const path = "assets/plush-runtime.js";
  let source = read(path);
  source = replaceOnce(
    source,
    '  var lazyStarts = Object.create(null);\n',
    '  var lazyStarts = Object.create(null);\n  var PREFETCH_DELAY_MS = 8000;\n  var PREFETCH_LIMIT = 2;\n',
    "prefetch constants",
  );
  source = replaceOnce(
    source,
    '        files.slice(0, 3).forEach(addModulePreload);\n        recordMetric("idle-prefetch-count", Math.min(files.length, 3));',
    '        files.slice(0, PREFETCH_LIMIT).forEach(addModulePreload);\n        recordMetric("idle-prefetch-count", Math.min(files.length, PREFETCH_LIMIT));',
    "prefetch limit",
  );
  source = replaceOnce(
    source,
    '  function scheduleIdlePrefetch() {\n    var run = function () { prefetchLikelyPanels(); };\n    if (typeof requestIdleCallback === "function") {\n      requestIdleCallback(run, { timeout: 3500 });\n    } else {\n      setTimeout(run, 1600);\n    }\n  }',
    '  function scheduleIdlePrefetch() {\n    var run = function () {\n      if (document.visibilityState === "hidden") return;\n      if (typeof requestIdleCallback === "function") {\n        requestIdleCallback(function () { prefetchLikelyPanels(); }, { timeout: 5000 });\n      } else {\n        prefetchLikelyPanels();\n      }\n    };\n    setTimeout(run, PREFETCH_DELAY_MS);\n  }',
    "deferred prefetch",
  );
  write(path, source);
}

{
  const path = "src/device-backup.js";
  let source = read(path);
  source = replaceOnce(
    source,
    'const MAX_DEVICE_SNAPSHOTS = 3;\n',
    'const MAX_DEVICE_SNAPSHOTS = 3;\nconst AUTO_BACKUP_START_DELAY_MS = 30000;\nconst BACKUP_QUERY_BATCH_SIZE = 4;\n',
    "backup performance constants",
  );
  const oldQueries = '  const results = await Promise.all(DEVICE_BACKUP_TABLES.map(async ([key, table, ownerColumn]) => {\n    const { data, error } = await supabase.from(table).select("*").eq(ownerColumn, user.id);\n    if (error) throw new Error(`Could not back up ${table}: ${error.message}`);\n    return [key, data || []];\n  }));';
  const newQueries = '  const results = [];\n  for (let index = 0; index < DEVICE_BACKUP_TABLES.length; index += BACKUP_QUERY_BATCH_SIZE) {\n    const batch = DEVICE_BACKUP_TABLES.slice(index, index + BACKUP_QUERY_BATCH_SIZE);\n    const batchResults = await Promise.all(batch.map(async ([key, table, ownerColumn]) => {\n      const { data, error } = await supabase.from(table).select("*").eq(ownerColumn, user.id);\n      if (error) throw new Error(`Could not back up ${table}: ${error.message}`);\n      return [key, data || []];\n    }));\n    results.push(...batchResults);\n    if (index + BACKUP_QUERY_BATCH_SIZE < DEVICE_BACKUP_TABLES.length) {\n      await new Promise((resolve) => window.setTimeout(resolve, 0));\n    }\n  }';
  source = replaceOnce(source, oldQueries, newQueries, "batched backup queries");
  source = replaceOnce(
    source,
    '  if (typeof window.requestIdleCallback === "function") {\n    idleId = window.requestIdleCallback(() => { void run(); }, { timeout: 8000 });\n  } else {\n    timerId = window.setTimeout(() => { void run(); }, 4000);\n  }',
    '  timerId = window.setTimeout(() => {\n    if (cancelled || document.visibilityState === "hidden") return;\n    if (typeof window.requestIdleCallback === "function") {\n      idleId = window.requestIdleCallback(() => { void run(); }, { timeout: 15000 });\n    } else {\n      void run();\n    }\n  }, AUTO_BACKUP_START_DELAY_MS);',
    "deferred automatic backup",
  );
  source = replaceOnce(
    source,
    '  maxSnapshots: MAX_DEVICE_SNAPSHOTS,\n  cloudDataDeleted: false,',
    '  maxSnapshots: MAX_DEVICE_SNAPSHOTS,\n  autoStartDelayMs: AUTO_BACKUP_START_DELAY_MS,\n  queryBatchSize: BACKUP_QUERY_BATCH_SIZE,\n  cloudDataDeleted: false,',
    "backup policy performance metadata",
  );
  write(path, source);
}

{
  const path = "scripts/test-product-quality.js";
  let source = read(path);
  source = replaceOnce(
    source,
    '  [deviceBackup.includes("MAX_DEVICE_SNAPSHOTS = 3") && deviceBackup.includes("verifyDeviceBackup") && deviceBackup.includes("SHA-256"), "device backup keeps verified recovery snapshots"],\n',
    '  [deviceBackup.includes("MAX_DEVICE_SNAPSHOTS = 3") && deviceBackup.includes("verifyDeviceBackup") && deviceBackup.includes("SHA-256"), "device backup keeps verified recovery snapshots"],\n  [deviceBackup.includes("AUTO_BACKUP_START_DELAY_MS = 30000") && deviceBackup.includes("BACKUP_QUERY_BATCH_SIZE = 4"), "automatic device backup stays off the critical startup window and avoids a network burst"],\n  [runtime.includes("PREFETCH_DELAY_MS = 8000") && runtime.includes("PREFETCH_LIMIT = 2"), "lazy-panel prefetch waits until after startup and limits background competition"],\n',
    "performance regression checks",
  );
  write(path, source);
}

console.log("Focused startup performance patch applied.");
