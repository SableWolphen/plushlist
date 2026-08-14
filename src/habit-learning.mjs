export const LEARNING_THRESHOLDS = Object.freeze({
  timingSamples: 6,
  timingAgreement: 0.7,
  timingShiftMinutes: 45,
  skipOpportunities: 7,
  skipRate: 0.55,
  sequenceSamples: 5,
  sequenceAgreement: 0.7,
  sequenceWindowMinutes: 90,
  tinyUses: 3,
  reminderOpens: 5,
  reminderWeakRate: 0.25,
});

function minutes(hour, minute = 0) {
  const value = Number(hour) * 60 + Number(minute || 0);
  return Number.isFinite(value) ? value : null;
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

function clockMinutes(value) {
  const match = String(value || "").match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const result = Number(match[1]) * 60 + Number(match[2]);
  return result >= 0 && result < 1440 ? result : null;
}

function circularDifference(a, b) {
  const difference = Math.abs(a - b);
  return Math.min(difference, 1440 - difference);
}

function formatClock(value) {
  const normalized = ((Math.round(value) % 1440) + 1440) % 1440;
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
}

function choiceFor(choices, fingerprint) {
  return choices?.[fingerprint]?.decision || "";
}

function suggestion(type, habitId, patch) {
  const fingerprint = [type, habitId, patch.anchorHabitId || patch.suggestedTime || patch.routineKey || ""].join(":");
  return { type, habitId, fingerprint, ...patch };
}

export function buildHabitLearning({ rows = [], history = {}, completionEvents = [], retention = {}, reminderEvents = [], userChoices = {} } = {}) {
  const rowById = new Map(rows.map((row) => [String(row.id), row]));
  const events = completionEvents
    .filter((event) => event?.habitId && event?.date)
    .map((event) => ({ ...event, habitId: String(event.habitId), atMinutes: minutes(event.hour, event.minute) }))
    .filter((event) => event.atMinutes !== null)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)) || a.atMinutes - b.atMinutes);
  const byHabit = new Map();
  const byDate = new Map();
  events.forEach((event) => {
    if (!byHabit.has(event.habitId)) byHabit.set(event.habitId, []);
    if (!byDate.has(event.date)) byDate.set(event.date, []);
    byHabit.get(event.habitId).push(event);
    byDate.get(event.date).push(event);
  });

  const timing = {};
  for (const [id, habitEvents] of byHabit) {
    const scheduled = clockMinutes(rowById.get(id)?.reminderTime);
    if (scheduled === null || habitEvents.length < LEARNING_THRESHOLDS.timingSamples) continue;
    const observed = median(habitEvents.slice(-20).map((event) => event.atMinutes));
    const close = habitEvents.slice(-20).filter((event) => circularDifference(event.atMinutes, observed) <= 45).length;
    const agreement = close / Math.min(20, habitEvents.length);
    const shift = circularDifference(observed, scheduled);
    if (agreement >= LEARNING_THRESHOLDS.timingAgreement && shift >= LEARNING_THRESHOLDS.timingShiftMinutes) {
      timing[id] = { samples: Math.min(20, habitEvents.length), agreement, scheduledTime: formatClock(scheduled), observedTime: formatClock(observed), shiftMinutes: shift };
    }
  }

  const skips = {};
  for (const row of rows) {
    const id = String(row.id);
    const observations = Object.values(history).map((day) => day?.[id]).filter(Boolean).slice(-21);
    if (observations.length < LEARNING_THRESHOLDS.skipOpportunities) continue;
    const missed = observations.filter((item) => !item.done).length;
    if (missed / observations.length >= LEARNING_THRESHOLDS.skipRate) skips[id] = { opportunities: observations.length, missed, rate: missed / observations.length };
  }

  const pairCounts = new Map();
  const sourceCounts = new Map();
  for (const dayEvents of byDate.values()) {
    const seenSources = new Set();
    for (let index = 0; index < dayEvents.length - 1; index += 1) {
      const first = dayEvents[index];
      const second = dayEvents[index + 1];
      if (first.habitId === second.habitId || second.atMinutes - first.atMinutes > LEARNING_THRESHOLDS.sequenceWindowMinutes) continue;
      const key = `${first.habitId}>${second.habitId}`;
      pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
      seenSources.add(first.habitId);
    }
    seenSources.forEach((id) => sourceCounts.set(id, (sourceCounts.get(id) || 0) + 1));
  }
  const sequences = [];
  for (const [key, count] of pairCounts) {
    const [anchorHabitId, habitId] = key.split(">");
    const opportunities = sourceCounts.get(anchorHabitId) || 0;
    const agreement = opportunities ? count / opportunities : 0;
    if (count >= LEARNING_THRESHOLDS.sequenceSamples && agreement >= LEARNING_THRESHOLDS.sequenceAgreement) sequences.push({ anchorHabitId, habitId, count, opportunities, agreement });
  }
  sequences.sort((a, b) => b.count - a.count || b.agreement - a.agreement);

  const tiny = {};
  const completionStates = retention?.completionStates || {};
  for (const row of rows) {
    const id = String(row.id);
    const states = Object.entries(completionStates).filter(([key]) => key.endsWith(`:${id}`)).map(([, value]) => value);
    const tinyUses = states.filter((value) => value === "tiny").length;
    if (tinyUses >= LEARNING_THRESHOLDS.tinyUses && row.tinyLabel) tiny[id] = { uses: tinyUses, totalMarked: states.length, useful: true };
  }

  const reminderEffectiveness = {};
  for (const row of rows) {
    const id = String(row.id);
    const opened = reminderEvents.filter((event) => String(event.taskKey || "") === id && event.action === "opened").slice(-20);
    if (opened.length < LEARNING_THRESHOLDS.reminderOpens) continue;
    const completions = byHabit.get(id) || [];
    const helped = opened.filter((openEvent) => completions.some((doneEvent) => {
      const openedAt = Date.parse(openEvent.at || "");
      const doneAt = Date.parse(doneEvent.completedAt || "") || Date.parse(`${doneEvent.date}T${formatClock(doneEvent.atMinutes)}:00`);
      return Number.isFinite(openedAt) && Number.isFinite(doneAt) && doneAt >= openedAt && doneAt - openedAt <= 90 * 60000;
    })).length;
    reminderEffectiveness[id] = { opens: opened.length, helped, rate: helped / opened.length };
  }

  const candidates = [];
  Object.entries(timing).forEach(([id, value]) => candidates.push(suggestion("move_time", id, { priority: 90, suggestedTime: value.observedTime, evidence: value })));
  sequences.forEach((value) => candidates.push(suggestion("attach_anchor", value.habitId, { priority: 85, anchorHabitId: value.anchorHabitId, evidence: value })));
  Object.entries(tiny).forEach(([id, value]) => { if (skips[id]) candidates.push(suggestion("use_tiny", id, { priority: 80, evidence: { ...value, ...skips[id] } })); });
  Object.entries(reminderEffectiveness).forEach(([id, value]) => { if (value.rate <= LEARNING_THRESHOLDS.reminderWeakRate) candidates.push(suggestion("adjust_reminder", id, { priority: 75, evidence: value })); });
  Object.entries(skips).forEach(([id, value]) => candidates.push(suggestion("pause_or_keep", id, { priority: 60, evidence: value })));
  if (sequences.length >= 2) {
    const chain = sequences.slice(0, 3);
    const ids = [...new Set(chain.flatMap((item) => [item.anchorHabitId, item.habitId]))];
    if (ids.length >= 3) candidates.push(suggestion("group_routine", ids[0], { priority: 70, routineKey: ids.join("-"), habitIds: ids, evidence: { links: chain.length } }));
  }
  const suggestions = candidates
    .filter((item) => !choiceFor(userChoices, item.fingerprint))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 5);

  return { timing, skips, sequences, tiny, reminderEffectiveness, suggestions };
}
