const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('assets/login-theme.js', 'utf8');
const themes = require('../assets/plush-theme-copy.js').worlds;
function appearance(hint, mode, supporting = false, blocked = false) {
  const values = {}, body = { dataset: {}, style: { setProperty: (k,v) => values[k] = v }, classList: { contains: () => supporting } };
  const context = { window: { PlushLifeThemeCopy: { worlds: themes, forWorld: () => ({}) } }, document: { body, documentElement: { style: {} }, querySelector: s => s === '.auth-card' && !supporting ? {} : null }, localStorage: { getItem: k => { if (blocked) throw Error('blocked'); return k === 'plushlife-login-theme' ? hint : mode; } } };
  vm.runInNewContext(source, context);
  return {values,body,scheme:context.document.documentElement.style.colorScheme};
}
const dark = appearance(JSON.stringify({world:'dino'}), 'dark');
assert.equal(dark.body.dataset.loginWorld, 'dino');
assert.equal(dark.values['--pl-theme-surface'], '#2D2933');
assert.equal(dark.values['--pl-theme-accent'], themes.dino.accent);
assert.equal(dark.scheme, 'dark');
assert.equal(appearance(JSON.stringify({world:'dino'}),'light').values['--pl-theme-surface'],themes.dino.surface);
const support = appearance(JSON.stringify({world:'pink'}),'dark',true);
assert.equal(support.body.dataset.supportingWorld,'pink');
assert.equal(support.body.dataset.loginWorld,undefined);
assert.equal(appearance('{bad','light').body.dataset.loginWorld,'soft');
assert.equal(appearance('{}','light',false,true).body.dataset.loginWorld,'soft');
console.log('Appearance restoration, themed dark variants and supporting page tests passed.');

const os = require('node:os'), path = require('node:path');
const React = require('react'), Renderer = require('react-test-renderer');
global.React = React;
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'presentation-hooks-'));
require('esbuild').buildSync({ entryPoints: ['src/hooks/use-calendar-navigation.js','src/hooks/use-journal-presentation.js','src/hooks/use-appearance-mode.js'], bundle:true, platform:'node', format:'cjs', outdir:temp });
const {useCalendarNavigation} = require(path.join(temp,'use-calendar-navigation.js'));
const {useJournalPresentation} = require(path.join(temp,'use-journal-presentation.js'));
const {useAppearanceMode} = require(path.join(temp,'use-appearance-mode.js'));
const saved = {'plushlist-calendar-view':'2'};
global.window = {localStorage:{getItem:k=>saved[k],setItem:(k,v)=>saved[k]=v}};
global.document = {documentElement:{dataset:{},style:{}},querySelector:()=>null};
let calendar, journal, tree;
function Screen({dark}) {
  calendar = useCalendarNavigation(()=>({date:'2026-10-03'}));
  journal = useJournalPresentation(()=>({date:'2026-10-03'}));
  useAppearanceMode(dark);
  return null;
}
Renderer.act(()=>{tree=Renderer.create(React.createElement(Screen,{dark:true}));});
assert.equal(calendar.weekCardIndex,2);
assert.equal(calendar.dayViewDate,'2026-10-03');
assert.equal(journal.reflectionCalendarMonth,'2026-10');
assert.equal(saved['plushlife:appearance-mode:v1'],'dark');
Renderer.act(()=>{calendar.setWeekCardIndex(0);journal.setReflectionViewerDate('2026-10-01');tree.update(React.createElement(Screen,{dark:false}));});
assert.equal(saved['plushlist-calendar-view'],'0');
assert.equal(journal.reflectionViewerDate,'2026-10-01');
assert.equal(document.documentElement.style.colorScheme,'light');
Renderer.act(()=>tree.unmount());
saved['plushlist-calendar-view']='invalid';
window.localStorage.setItem=()=>{throw Error('blocked');};
Renderer.act(()=>{tree=Renderer.create(React.createElement(Screen,{dark:true}));});
assert.equal(calendar.weekCardIndex,1);
Renderer.act(()=>tree.unmount());
console.log('Calendar persistence, journal viewer state and appearance hook behavior passed.');
