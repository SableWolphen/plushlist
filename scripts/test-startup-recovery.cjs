const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { transformSync } = require('esbuild');
const { prepareHtml } = require('./sync-www.js');
const html = prepareHtml('index.html', fs.readFileSync('index.html', 'utf8'), 'startup-test');
const recovery = html.match(/<script id="plush-boot-recovery">([\s\S]*?)<\/script>/)[1];
assert.ok(html.indexOf('id="plush-boot-recovery"') < html.indexOf('<script src="./vendor/'), 'Recovery must arm before a blocking vendor fetch');
assert.ok(html.includes('<script type="module" src="./assets/app.bundle.js">'), 'Keep the generated ES module graph');

function recoveryHarness(shellPresent = true) {
  const nodes = new Map();
  const status = {};
  const card = {appendChild(node) { if (node.id) nodes.set(node.id, node); }};
  const shell = {querySelector(selector) { return selector === '.boot-status' ? status : card; }};
  if (shellPresent) nodes.set('plush-boot-shell', shell);
  const timers = [], events = {};
  let reloads = 0;
  vm.runInNewContext(recovery, {
    document: {getElementById:id => nodes.get(id), createElement:() => ({style:{}, addEventListener(name, fn) { this[name] = fn; }})},
    navigator:{onLine:true}, setTimeout(fn, delay) { timers.push({fn, delay}); },
    window:{addEventListener(name, fn) {events[name]=fn;}, location:{reload(){reloads++;}}},
  });
  return {nodes, timers, events, status, reloads:()=>reloads};
}
const stalled = recoveryHarness();
stalled.timers.find(t => t.delay === 15000).fn();
assert.equal(stalled.nodes.get('plush-boot-retry').textContent, 'Retry PlushLife');
stalled.nodes.get('plush-boot-retry').click();
assert.equal(stalled.reloads(), 1, 'Retry is user initiated');
const failed = recoveryHarness();
failed.events.error({target:{tagName:'SCRIPT'}});
failed.timers.find(t => t.delay === 500).fn();
assert.ok(failed.nodes.has('plush-boot-retry'), 'Failed script immediately offers recovery');
const mounted = recoveryHarness(false);
mounted.timers[0].fn();
assert.equal(mounted.nodes.has('plush-boot-retry'), false, 'Never overwrite a mounted app');

const clientModule = {exports:{}};
vm.runInNewContext(transformSync(fs.readFileSync('src/startup-client.js','utf8'), {format:'cjs'}).code, {module:clientModule, console:{error(){}}});
const create = clientModule.exports.createStartupClient;
const options = {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}};
const client = {auth:{}};
assert.equal(create({createClient(url,key,received) {assert.equal(url,'url');assert.equal(key,'key');assert.equal(received,options);return client;}}, 'url','key',options), client);
assert.equal(create(null), null);
assert.equal(create({createClient(){throw new Error('platform unavailable');}}), null, 'SDK construction failure must reach the React retry screen');

const bridge = fs.readFileSync('src/native-bridge.js','utf8').replace(/^import .*;$/gm,''); // VM simulates native setup without module imports
let appStarted=0, pushStarted=0;
const noop=()=>Promise.resolve({});
const Plugins={StatusBar:{setStyle(){throw new Error('native unavailable');}}, App:{addListener(){appStarted++;return Promise.resolve({});}}, PushNotifications:{createChannel(){pushStarted++;return Promise.resolve();},addListener:noop}};
vm.runInNewContext(bridge,{window:{Capacitor:{Plugins},addEventListener(){}},console:{error(){}}});
assert.equal(appStarted,2,'A failing StatusBar must not prevent back/deep-link handlers');
assert.equal(pushStarted,1,'A failing StatusBar must not prevent Guardian push setup');

const workerSetup = html.match(/<script>\s*\/\/ Packaged assets[\s\S]*?<\/script>/)[0].replace(/^<script>|<\/script>$/g,'');
async function checkWorker(native, controlled) {
  let registered=0, ownRemoved=0, otherRemoved=0, reloads=0;
  const listeners={};
  vm.runInNewContext(workerSetup, {
    URL, navigator:{serviceWorker:{controller:controlled ? {} : null, addEventListener(){}, register(){registered++;return Promise.resolve({addEventListener(){}});}, getRegistrations(){return Promise.resolve([
      {scope:'https://localhost/',unregister(){ownRemoved++;return Promise.resolve(true);}},
      {scope:'https://localhost/other/',unregister(){otherRemoved++;return Promise.resolve(true);}},
    ]);}}},
    window:{Capacitor:{isNativePlatform:()=>native}, location:{href:'https://localhost/',reload(){reloads++;}},addEventListener(name,fn){listeners[name]=fn;},setInterval(){}},
    document:{querySelector(){return null;},addEventListener(){}},
  });
  listeners.load?.();
  for(let i=0;i<8;i++) await Promise.resolve();
  assert.equal(registered,native?0:1);
  assert.equal(ownRemoved,native?1:0);
  assert.equal(otherRemoved,0,'Never unregister another app scope');
  assert.equal(reloads,native&&controlled?1:0,'Only reload to release an old native controller');
}
(async()=>{await checkWorker(true,true);await checkWorker(true,false);await checkWorker(false,false);console.log('Startup recovery, native isolation, SDK initialization, and service worker regressions passed.');})().catch(error=>{console.error(error);process.exitCode=1;});
