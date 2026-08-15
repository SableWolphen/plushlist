const PROFILE_PREFIX = "plushlife:profile:v2";

function key(userId, part) { return `${PROFILE_PREFIX}:${userId || "local"}:${part}`; }
function read(userId, part, fallback) { try { const value = JSON.parse(localStorage.getItem(key(userId, part)) || "null"); return value == null ? fallback : value; } catch { return fallback; } }
function write(userId, part, value) { try { localStorage.setItem(key(userId, part), JSON.stringify(value)); } catch {} return value; }

export function profileContext({ dailyCheckIn = {}, rows = [], viewDone = {} } = {}) {
  const required = rows.filter((row) => !row?.isBonus);
  const unfinished = required.filter((row) => !viewDone?.[row.key]).length;
  const hour = new Date().getHours();
  return {
    mood: dailyCheckIn?.mood || "unknown",
    energy: dailyCheckIn?.energy || "unknown",
    capacity: dailyCheckIn?.capacity || "unknown",
    dayType: dailyCheckIn?.day_type || "unknown",
    load: required.length ? (unfinished / required.length >= .7 ? "high" : unfinished / required.length >= .35 ? "medium" : "light") : "unknown",
    time: hour < 11 ? "morning" : hour < 17 ? "afternoon" : "evening",
  };
}

function sameContext(a = {}, b = {}) {
  const fields = ["mood", "energy", "capacity", "dayType", "load", "time"];
  let matches = 0; let known = 0;
  fields.forEach((field) => {
    if (a[field] !== "unknown" && b[field] !== "unknown") { known += 1; if (a[field] === b[field]) matches += 1; }
  });
  return known ? matches / known : 0;
}

function normalizeFeedback(value) {
  if (["helped", "yes", "good"].includes(value)) return "helped";
  if (["a_little", "neutral", "not_sure"].includes(value)) return "neutral";
  if (["too_much", "didnt_help", "not_helpful", "no"].includes(value)) return "not_helpful";
  return null;
}

export function beginRecommendation(userId, kind, recommendationId, context = {}) {
  const pending = read(userId, "pending", {});
  pending[`${kind}:${recommendationId}`] = { kind, recommendationId, context, startedAt: Date.now() };
  write(userId, "pending", pending);
}

export function recordRecommendationOutcome(userId, kind, recommendationId, feedback, context = {}, fingerprint = "") {
  const normalized = normalizeFeedback(feedback);
  if (!normalized) return [];
  const outcomes = read(userId, "outcomes", []);
  const safeFingerprint = fingerprint || `${kind}:${recommendationId}:${Date.now()}`;
  if (outcomes.some((item) => item.fingerprint === safeFingerprint)) return outcomes;
  const next = [...outcomes, { fingerprint: safeFingerprint, kind, recommendationId, feedback: normalized, context, at: Date.now() }].slice(-240);
  write(userId, "outcomes", next);
  return next;
}

export function syncSessionOutcomes(userId, history = []) {
  const pending = read(userId, "pending", {});
  if (!Object.keys(pending).length) return;
  let changed = false;
  (Array.isArray(history) ? history : []).forEach((entry) => {
    const kind = entry?.session_kind === "sleep" ? "sleep" : "care";
    const pendingKey = `${kind}:${entry?.session_id}`;
    const item = pending[pendingKey];
    const feedback = normalizeFeedback(entry?.outcome);
    if (!item || !feedback) return;
    const fingerprint = `session:${entry?.id || entry?.created_at || entry?.completed_at || `${entry.session_id}:${entry.outcome}`}`;
    recordRecommendationOutcome(userId, kind, entry.session_id, feedback, item.context, fingerprint);
    delete pending[pendingKey]; changed = true;
  });
  if (changed) write(userId, "pending", pending);
}

export function recommendationFit(userId, kind, recommendationId, context = {}) {
  const forgotten = new Set(read(userId, "forgotten", []));
  if (forgotten.has(`${kind}:${recommendationId}`)) return { confidence: "learning", score: 0, positive: 0, total: 0, contextual: 0 };
  const all = read(userId, "outcomes", []).filter((item) => item.kind === kind && item.recommendationId === recommendationId);
  if (!all.length) return { confidence: "learning", score: 0, positive: 0, total: 0, contextual: 0 };
  const weighted = all.map((item) => ({ ...item, weight: .65 + sameContext(item.context, context) * .85 }));
  const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);
  const positiveWeight = weighted.reduce((sum, item) => sum + (item.feedback === "helped" ? item.weight : item.feedback === "neutral" ? item.weight * .35 : 0), 0);
  const score = totalWeight ? positiveWeight / totalWeight : 0;
  const contextual = weighted.filter((item) => sameContext(item.context, context) >= .5).length;
  const confidence = all.length >= 5 && score >= .7 ? "strong" : all.length >= 2 && score >= .55 ? "growing" : "learning";
  return { confidence, score, positive: all.filter((item) => item.feedback === "helped").length, total: all.length, contextual };
}

export function forgetPattern(userId, kind, recommendationId) {
  const values = new Set(read(userId, "forgotten", [])); values.add(`${kind}:${recommendationId}`); write(userId, "forgotten", [...values].slice(-80));
}

export function restorePattern(userId, kind, recommendationId) {
  const values = read(userId, "forgotten", []).filter((value) => value !== `${kind}:${recommendationId}`); write(userId, "forgotten", values);
}

export function plushProfileSummary(userId) {
  const outcomes = read(userId, "outcomes", []);
  const forgotten = new Set(read(userId, "forgotten", []));
  const groups = new Map();
  outcomes.forEach((item) => {
    const id = `${item.kind}:${item.recommendationId}`;
    if (forgotten.has(id)) return;
    const group = groups.get(id) || { id, kind: item.kind, recommendationId: item.recommendationId, helped: 0, neutral: 0, notHelpful: 0, total: 0, contexts: {} };
    group.total += 1;
    if (item.feedback === "helped") group.helped += 1;
    else if (item.feedback === "neutral") group.neutral += 1;
    else group.notHelpful += 1;
    const contextKey = [item.context?.energy, item.context?.time, item.context?.load].filter((value) => value && value !== "unknown").join(" · ");
    if (contextKey) group.contexts[contextKey] = (group.contexts[contextKey] || 0) + 1;
    groups.set(id, group);
  });
  const patterns = [...groups.values()].map((group) => {
    const score = (group.helped + group.neutral * .35) / Math.max(1, group.total);
    const confidence = group.total >= 5 && score >= .7 ? "Strong fit" : group.total >= 2 && score >= .55 ? "Growing clue" : "Still learning";
    const context = Object.entries(group.contexts).sort((a,b)=>b[1]-a[1])[0]?.[0] || "";
    return { ...group, score, confidence, context };
  }).sort((a,b) => (b.score * Math.min(5,b.total)) - (a.score * Math.min(5,a.total)));
  return { working: patterns.filter((item) => item.confidence !== "Still learning" && item.score >= .55).slice(0,4), learning: patterns.filter((item) => item.confidence === "Still learning").slice(0,4) };
}

export function weeklyMemoryUpdate(userId) {
  const cutoff = Date.now() - 7 * 86400000;
  const recent = read(userId, "outcomes", []).filter((item) => Number(item.at) >= cutoff);
  if (!recent.length) return { count: 0, lines: ["No new recommendation outcomes yet. PlushLife is still learning without inventing a pattern."] };
  const groups = new Map();
  recent.forEach((item) => { const id = `${item.kind}:${item.recommendationId}`; const group = groups.get(id) || { id, kind: item.kind, recommendationId: item.recommendationId, helped: 0, total: 0 }; group.total += 1; if (item.feedback === "helped") group.helped += 1; groups.set(id, group); });
  const lines = [...groups.values()].sort((a,b)=>b.total-a.total).slice(0,3).map((item) => item.helped ? `${item.recommendationId} helped ${item.helped} of ${item.total} time${item.total === 1 ? "" : "s"} you answered this week.` : `${item.recommendationId} is still being tested; PlushLife will not treat it as a rule yet.`);
  return { count: recent.length, lines };
}

export function getBoundaries(userId) { return read(userId, "boundaries", { noCatchUpPressure: true, gentlerFirstLowEnergy: true, avoidAddingOnLowEnergy: true }); }
export function setBoundary(userId, name, enabled) { const current = getBoundaries(userId); current[name] = Boolean(enabled); return write(userId, "boundaries", current); }
