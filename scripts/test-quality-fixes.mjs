import assert from 'node:assert/strict';
import fs from 'node:fs';
import { transformSync } from 'esbuild';
import { resolveSupportAction } from '../src/guardian-action-selection.mjs';

// These are real behavior tests, not searches for marker strings.
assert.equal(resolveSupportAction('note', { note: true, reward: true }), 'note');
assert.equal(resolveSupportAction('note', { note: false, reward: true }), 'reward',
  'Revoking note permission must show the first allowed action, not a blank panel');
assert.equal(resolveSupportAction('reward', { note: true, reward: true }), 'reward',
  'Keep an explicitly selected action while permission remains active');
assert.equal(resolveSupportAction('reward', { note: false, reward: false, task: true }), 'task');
assert.equal(resolveSupportAction('task', { note: true, task: true }), 'task');
assert.equal(resolveSupportAction('unknown', { note: true, reward: true }), 'note');
assert.equal(resolveSupportAction('note', {}), null);
assert.equal(resolveSupportAction('note', { note: 1, reward: 'yes' }), null,
  'Permissions must be explicit booleans');

globalThis.React = { useState() {}, useEffect() {} };
const source = fs.readFileSync('src/components/daily-companion-core.jsx', 'utf8');
const transformed = transformSync(source, { loader: 'jsx', format: 'esm', target: 'es2022' }).code;
const { safeWrite } = await import('data:text/javascript;base64,' + Buffer.from(transformed).toString('base64'));
const values = new Map();
globalThis.localStorage = {
  setItem(key, value) { values.set(key, value); },
  getItem(key) { return values.get(key) || null; },
};
assert.equal(safeWrite('wind-down:test', { win: 'A tiny step' }), true);
assert.deepEqual(JSON.parse(values.get('wind-down:test')), { win: 'A tiny step' });
globalThis.localStorage.setItem = () => { throw new Error('QuotaExceededError'); };
assert.equal(safeWrite('wind-down:test', { win: 'Unsaved' }), false,
  'A failed device write must not be reported as saved');
const cyclic = {};
cyclic.self = cyclic;
assert.equal(safeWrite('wind-down:test', cyclic), false,
  'Serialization failures must not be reported as saved');
assert.deepEqual(JSON.parse(values.get('wind-down:test')), { win: 'A tiny step' },
  'A failed write must not destroy the last durable value');

const navDoc = fs.readFileSync('docs/plushlife-ui-source-of-truth.md', 'utf8');
const app = fs.readFileSync('src/app-source.jsx', 'utf8');
assert.ok(navDoc.includes('Home · Tasks · Care · Progress · Plush'));
for (const tab of ['Home', 'Tasks', 'Care', 'Progress', 'Plush']) {
  assert.ok(app.includes(`<span>${tab}</span>`), `Live navigation is missing ${tab}`);
}
console.log('Quality fixes passed: permission-aware Guardian actions, honest local saves, and navigation source-of-truth.');
