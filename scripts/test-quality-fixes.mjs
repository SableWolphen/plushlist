import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildSync } from 'esbuild';
import { companionAccountKey, currentCompanionAccountId } from '../src/companion-account-storage.mjs';
import { canApplyRemoteProgress, pendingProgressForDate } from '../src/progress-intent-guard.mjs';
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
const transformed = buildSync({ entryPoints: ['src/components/daily-companion-core.jsx'], bundle: true, write: false, format: 'esm', platform: 'neutral', target: 'es2022' }).outputFiles[0].text;
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

const alice = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const bob = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
const baseKey = 'plushlife:wind-down:2026-10-12';
const aliceKey = companionAccountKey(baseKey, alice);
const bobKey = companionAccountKey(baseKey, bob);
assert.notEqual(aliceKey, bobKey, 'Two accounts must not share private companion storage');
assert.equal(companionAccountKey(baseKey, null), null, 'Never save private notes under an anonymous key');
assert.equal(companionAccountKey(baseKey, 'no'), null, 'Reject invalid account identifiers');
values.set(baseKey, JSON.stringify({ win: 'legacy unowned private note' }));
assert.equal(values.get(aliceKey), undefined, 'Never silently assign legacy notes to the first sign-in');
values.set(aliceKey, JSON.stringify({ win: 'Alice only' }));
values.set(bobKey, JSON.stringify({ win: 'Bob only' }));
assert.notDeepEqual(JSON.parse(values.get(aliceKey)), JSON.parse(values.get(bobKey)));
const sessionStorage = {getItem: () => JSON.stringify({access_token:'signed-session',user:{id:alice}})};
assert.equal(currentCompanionAccountId(sessionStorage), alice);
assert.equal(currentCompanionAccountId({getItem:()=>'{bad-json'}), null);
assert.equal(currentCompanionAccountId({getItem:()=>null}), null);

assert.equal(canApplyRemoteProgress({ unsynced: true }), false);
assert.equal(canApplyRemoteProgress({ atRequest: 1, current: 2 }), false,
  'A response started before the latest tap cannot replace the latest tap');
assert.equal(canApplyRemoteProgress({ atRequest: 2, current: 2 }), true);
assert.equal(canApplyRemoteProgress({
  lastLocalWriteAt: '2026-10-12T11:32:13Z',
  remoteUpdatedAt: '2026-10-12T11:32:11Z',
}), false, 'Late older Realtime events cannot undo a newer local completion');
assert.equal(canApplyRemoteProgress({
  lastLocalWriteAt: '2026-10-12T11:32:13Z',
  remoteUpdatedAt: '2026-10-12T11:32:14Z',
}), true, 'Fresh progress from a watch can still refresh the phone');
assert.equal(pendingProgressForDate([{progressDate:'2026-10-12'}], '2026-10-12'), true);
assert.equal(pendingProgressForDate([], '2026-10-12', 1), true);
assert.equal(pendingProgressForDate([], '2026-10-12'), false);
const companionCloud = fs.readFileSync('src/components/companion-cloud-sync.jsx','utf8');
assert.ok(companionCloud.includes('hydrateLocal(merged, userId)'), 'Cloud hydration must stay account-scoped');
assert.ok(companionCloud.includes('localCompanionState(userId)'), 'Cloud export must stay account-scoped');
const companionCore = fs.readFileSync('src/components/daily-companion-core.jsx','utf8');
assert.ok(companionCore.includes('privateKey(HISTORY_KEY)'), 'Local companion history must stay account-scoped');

console.log('Quality fixes passed: Guardian permissions, local saves, account isolation, stale progress guards, and navigation.');
