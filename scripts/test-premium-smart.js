const assert = require('assert');
const smart = require('../assets/premium-smart.js');

assert.equal(smart.normalizeMood('rough'), 2);
assert.equal(smart.normalizeEnergy('steady'), 4);

const progress = smart.summarizeProgress([
  { date: '2026-08-01', completedTasks: 2, plannedTasks: 4, focusMinutes: 15, journaled: true, mood: 'okay', energy: 'low' },
  { date: '2026-08-02', completedTasks: 3, plannedTasks: 4, focusMinutes: 25, journaled: false, mood: 'good', energy: 'steady' },
]);
assert.equal(progress.completionRate, 63);
assert.equal(progress.focusMinutes, 40);
assert.equal(progress.journalDays, 1);

const focus = smart.analyzeFocus([
  { startedAt: '2026-08-01T19:00:00', minutes: 25, completed: true },
  { startedAt: '2026-08-02T19:30:00', minutes: 30, completed: true },
  { startedAt: '2026-08-03T09:00:00', minutes: 15, completed: true },
]);
assert.equal(focus.bestHour, 19);
assert.equal(focus.totalSessions, 3);

const reminder = smart.buildReminderPlan({ mood: 'rough', energy: 'low', style: 'gentle', followUpMinutes: 45 });
assert.equal(reminder.followUpMinutes, 45);
assert.ok(reminder.body.toLowerCase().includes('tiny'));

const routine = smart.buildAdaptiveRoutine({ mood: 'rough', energy: 'low', availableMinutes: 10 }, [
  { id: 1, label: 'Full shower', tinyLabel: 'Wash face', estimatedMinutes: 15, tinyMinutes: 3, essential: true },
  { id: 2, label: 'Long walk', tinyLabel: 'Step outside', estimatedMinutes: 30, tinyMinutes: 4 },
]);
assert.equal(routine.mode, 'gentle');
assert.ok(routine.plannedMinutes <= 10);
assert.ok(routine.steps.length >= 1);

const calm = smart.recommendCalm({ mood: 'rough', energy: 'low' }, []);
assert.equal(calm.type, 'grounding-5-4-3-2-1');

const journal = smart.journalInsights([
  { text: 'Work was stressful today and I am tired.' },
  { text: 'Another hard work meeting. I need better sleep.' },
  { text: 'Work calmed down after a walk.' },
]);
assert.ok(journal.recurringThemes.some((x) => x.theme === 'work'));
assert.ok(journal.disclaimer.includes('not a diagnosis'));

const recs = smart.rankRecommendations({ mood: 'rough', energy: 'low', missedTasks: 4, availableMinutes: 10 });
assert.ok(['rescue', 'tiny-step'].includes(recs[0].id));
assert.ok(recs.slice(0, 2).some((x) => x.id === 'rescue'));

const guide = smart.guideMessage({ mood: 'rough', energy: 'low' });
assert.equal(guide.action, 'rescue');

const memory = new Map();
const fakeStorage = {
  getItem(key) { return memory.has(key) ? memory.get(key) : null; },
  setItem(key, value) { memory.set(key, value); },
  removeItem(key) { memory.delete(key); }
};
const store = smart.createStore(fakeStorage);
store.setPreferences({ reminderStyle: 'gentle' });
store.addFocusSession({ minutes: 20 });
assert.equal(store.get().preferences.reminderStyle, 'gentle');
assert.equal(store.get().focusSessions.length, 1);

console.log('premium-smart tests passed');
