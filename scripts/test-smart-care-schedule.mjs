import assert from 'node:assert/strict';
import { buildSmartCareSchedule, careMinute } from '../src/smart-care-schedule.mjs';
import { buildSync } from 'esbuild';
import React from 'react';
import renderer from 'react-test-renderer';
import { createRequire } from 'node:module';

const base = { now: new Date('2026-10-14T14:00:00Z'), timezone: 'America/Chicago', date: '2026-10-14' };
const ideas = input => buildSmartCareSchedule({ ...base, ...input }).items.filter(item => item.kind === 'optional');
const entries = [{ time: '09:30', end_time: '10:30', text: 'Appointment' }, { time: '10:00', estimated_minutes: 60, text: 'Overlap' }, { time: '11:03', estimated_minutes: 20, text: 'Short gap' }];
assert.deepEqual(ideas({ entries }).map(item => item.start), [540, 683]);
assert.equal(ideas({ entries: [{ time: '09:00' }] }).length, 0, 'Unknown duration cannot be assumed free');
assert.equal(ideas({ rows: [{ key: 'a', label: 'Untimed' }] }).length, 0);
assert.ok(ideas({ rows: [{ key: 'a' }], viewDone: { a: true } }).length);
const completed = { key: 'a', sourceTask: { reminder_time: '09:00', estimated_minutes: 60 } };
assert.equal(ideas({ rows: [completed], viewDone: { a: true } })[0].start, 600, 'Completed slots remain reserved');
assert.equal(ideas({ restDay: true })[0].end, 550);
assert.match(ideas({ restDay: true })[0].label, /rest/);
assert.equal(ideas({ energy: 'empty' })[0].end, 550);
assert.equal(ideas({ date: '2026-10-13' }).length, 0);
assert.equal(ideas({ date: '2026-10-15' }).length, 0);
assert.equal(ideas({ now: new Date('2026-10-15T04:58:00Z') }).length, 0);
assert.equal(careMinute('25:00'), null);
assert.equal(careMinute('09:30:00'), 570);
const input = { ...base, entries, rows: [completed], viewDone: { a: true }, restDay: true };
const snapshot = JSON.stringify(input);
const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
freeze(input);
const model = buildSmartCareSchedule(input);
assert.equal(JSON.stringify(input), snapshot, 'All schedule and completion inputs are unchanged');
model.items[0].label = 'Changed derived copy';
assert.equal(JSON.stringify(input), snapshot, 'Output does not alias source records');
// Mount the real view with frozen inputs and storage that rejects writes.
const build = buildSync({ entryPoints: ['src/components/smart-care-schedule.jsx'], bundle: true, write: false, format: 'cjs', platform: 'node' });
const module = { exports: {} };
globalThis.React = React;
let listeners = 0;
globalThis.window = {
  addEventListener() { listeners++; }, removeEventListener() { listeners--; },
  localStorage: { setItem() { assert.fail('Read-only care view must not persist changes'); } },
};
new Function('module', 'exports', 'require', build.outputFiles[0].text)(module, module.exports, createRequire(import.meta.url));
let view;
renderer.act(() => { view = renderer.create(React.createElement(module.exports.SmartCareSchedule, { ...input, dailyCheckIn: { energy: 'low' }, babyMode: true })); });
assert.equal(view.root.findAllByType('button').length, 0, 'Timeline has no mutation controls');
assert.ok(JSON.stringify(view.toJSON()).includes('Smart Care Schedule'));
assert.equal(JSON.stringify(input), snapshot, 'Mount does not change task or schedule state');
renderer.act(() => view.unmount());
assert.equal(listeners, 0, 'Clock listeners are cleaned up');
console.log('Smart Care Schedule: gaps, overlap, unknown timing, rest, energy, clock, and no mutation passed');
