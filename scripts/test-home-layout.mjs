import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const source = fs.readFileSync(new URL('../src/home-layout.js', import.meta.url), 'utf8');
const { normalizeHomeLayout, moveHomeSection, homeDisplayGroups } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const defaults = normalizeHomeLayout();
assert.deepEqual(homeDisplayGroups(),[['tiny'],['schedule','tasks'],['habits']]);
assert.deepEqual(homeDisplayGroups({hidden:['schedule']}),[['tiny'],['tasks'],['habits']]);
assert.deepEqual(homeDisplayGroups({hidden:['tasks']}),[['tiny'],['habits'],['schedule']]);
assert.deepEqual(homeDisplayGroups({order:['schedule','tiny','tasks','habits']}),[['schedule','tasks'],['tiny'],['habits']]);
assert.deepEqual(defaults.order, ['tiny','tasks','habits','schedule','shortcuts','noticed']);
const invalid = normalizeHomeLayout({order:['habits','habits','missing'],hidden:['tasks','missing','tasks']});
assert.deepEqual(invalid.order, ['habits','tiny','tasks','schedule','shortcuts','noticed']);
assert.deepEqual(invalid.hidden, ['tasks']);
assert.deepEqual(normalizeHomeLayout({order:'bad',hidden:null}),defaults);
const moved = moveHomeSection(defaults,'habits',-1);
assert.deepEqual(moved.order, ['tiny','habits','tasks','schedule','shortcuts','noticed']);
assert.deepEqual(defaults.order, ['tiny','tasks','habits','schedule','shortcuts','noticed']);
assert.deepEqual(moveHomeSection(defaults,'tiny',-1),defaults);
assert.deepEqual(moveHomeSection(defaults,'unknown',1),defaults);
assert.deepEqual(normalizeHomeLayout(JSON.parse(JSON.stringify(moved))),moved);
const require = createRequire(import.meta.url);
const { forWorld, worlds } = require('../assets/plush-theme-copy.js');
for (const world of ['baby','baby-night']) {
  assert.match(forWorld(world,'motherly')['A little counts.'],/Mommy/);
  assert.match(forWorld(world,'fatherly')['A little counts.'],/Daddy/);
  assert.doesNotMatch(JSON.stringify(forWorld(world,'fatherly')),/Mommy/);
}
for(const world of ['soft','pink','meadow','peach','twilight','strawberry','soft-light']) {
  assert.equal(worlds[world].asset,'soft');
  assert.doesNotMatch(JSON.stringify(forWorld(world,'motherly')),/Mommy|Daddy|stomp/);
}
assert.equal(worlds.dino.asset,'signature-dino');
assert.equal(worlds.baby.asset,'signature-nursery');
console.log('Home layout and theme voice checks passed.');
