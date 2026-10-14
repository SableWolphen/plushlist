import assert from "node:assert/strict";
import fs from "node:fs";
import { buildSync } from "esbuild";
import { freshGuardianState, normalizeGuardianState, guardianKey, saveGuardian, readGuardian } from "../src/plush-guardian-model.mjs";
import { activateBotMommy, botGuardianDailyPlan, botGuardianName } from "../src/guardian-bot.mjs";
import { virtualGuardianReminderCopy, guardianRoutineCopy, guardianTomorrowCopy } from "../src/guardian-reminders.mjs";

const state = freshGuardianState();
assert.equal(state.prefs.automaticReminders, false, "Bot notifications require opt-in");
assert.equal(state.prefs.aiConsent, false);
assert.equal(botGuardianName("mommy"), "Bot Mommy");
assert.equal(botGuardianName("daddy"), "Bot Daddy");
const enabled = activateBotMommy({ ...state.prefs, voice: "neutral" });
assert.equal(enabled.voice, "mommy");
assert.equal(enabled.automaticReminders, true);
assert.equal(enabled.routineNudges, true);
assert.equal(enabled.tomorrowNudges, true);
for (const key of ["aiConsent","shareTasks","shareMood","shareMemories","keepChat"]) assert.equal(enabled[key], false, "Bot activation must never enable AI context: "+key);
const normalized = normalizeGuardianState({ prefs: {
  aiConsent: true, shareTasks: true, shareMood: true, shareMemories: true, keepChat: true, voice: "mommy"
}, chat: [{ role: "user", content: "An old personal conversation" }] });
for (const key of ["aiConsent","shareTasks","shareMood","shareMemories","keepChat"]) assert.equal(normalized.prefs[key], false, "Old AI consent must never revive: "+key);
assert.equal(normalized.chat.length, 1, "Never delete old chat history without explicit choice");
const storage = new Map();
const adapter = { getItem: key => storage.get(key) || null, setItem: (key,value) => storage.set(key,value) };
const owner = "00000000-0000-4000-8000-000000000001", other = "00000000-0000-4000-8000-000000000002";
assert(saveGuardian(adapter, owner, { ...state, prefs: enabled }));
assert.equal(readGuardian(adapter, owner).prefs.voice, "mommy");
assert.equal(readGuardian(adapter, other).prefs.automaticReminders, false);
assert.notEqual(guardianKey(owner), guardianKey(other));

const rows=[
  { key:"teeth", label:"Brush teeth", sourceTask:{ estimated_minutes: 2 }},
  { key:"habit", label:"Water", sourceTask:{ estimated_minutes: 3 }},
  { key:"bonus", label:"Optional bonus", isBonus:true },
  { key:"archived", label:"Old", sourceTask:{ archived_at:"2026-10-13" } },
];
let day=botGuardianDailyPlan(rows,{teeth:true},"mommy");
assert.equal(day.total,2);
assert.equal(day.completed,1);
assert.equal(day.remaining,1);
assert.equal(day.next.key,"habit");
assert.match(day.encouragement,/Sweetheart/);
day=botGuardianDailyPlan(rows,{teeth:true,habit:true},"mommy");
assert.equal(day.next,null);
assert.match(day.encouragement,/proud/);
assert.equal(botGuardianDailyPlan(rows,{},"mommy",true).next,null, "Rest days must not pressure task completion");
assert.match(botGuardianDailyPlan(rows,{},"daddy").encouragement,/Kiddo/);
assert.match(virtualGuardianReminderCopy("mommy","Brush teeth").body,/Sweetheart.*Brush teeth/);
assert.match(virtualGuardianReminderCopy("daddy","Get dressed").body,/Kiddo.*Get dressed/);
assert.match(guardianRoutineCopy("Bedtime","Wash face","mommy").body,/Mommy.*Wash face/);
assert.match(guardianTomorrowCopy("mommy").body,/Sweetheart/);
assert.match(guardianTomorrowCopy("daddy").body,/Tomorrow/);
const core=fs.readFileSync("src/components/plush-guardian-core.jsx","utf8");
const settings=fs.readFileSync("src/components/plush-guardian-settings.jsx","utf8");
const guardianPanel=fs.readFileSync("src/components/guardian-panel.jsx","utf8");
const worker=fs.readFileSync("src/worker.js","utf8");
const app=fs.readFileSync("src/app-source.jsx","utf8");
const native=fs.readFileSync("src/native-bridge.js","utf8");
assert(core.includes("activateBotMommy(state.prefs)"));
assert(core.includes("botGuardianDailyPlan(rows, viewDone"), "Dashboard must use actual tasks and saved checkmarks");
assert(core.includes("navigate(\"routines\")"), "One-tap routine guidance must remain available");
assert(!core.includes("fetch(") && !core.includes("client.auth") && !core.includes("Talk with my AI companion") && !core.includes("Enable AI chat"), "No AI network calls or chat UI allowed");
assert(!settings.includes('check("aiConsent"') && !settings.includes('check("shareTasks"') && !settings.includes("Enable AI chat"), "No legacy AI consent controls in Bot settings");
assert(settings.includes("activateBotMommy(prefs)") && settings.includes('preference("voice"'), "Guardian setup includes one-tap Mommy with other role options");
assert(settings.includes("Delete old saved chat"), "Old private local conversation remains deletable");
assert(guardianPanel.includes("ownedSupportLinks || []") && guardianPanel.includes("accepted_at") && guardianPanel.includes("Meet my Bot Mommy"), "Guardian tab offers bot when no active human Guardian");
assert(worker.includes('if (url.pathname === "/api/plush-guardian") return json(') && worker.includes(", 410)"), "Retire legacy AI route at Worker boundary");
assert(!worker.includes("handlePlushGuardian(request, env)"), "Legacy API must no longer invoke the AI handler");
assert(app.includes("guardianReminderRevision"), "Guardian preferences keep current scheduler hook");
assert(native.includes("options.virtualGuardian") && native.includes("guardian-routine") && native.includes("guardian-tomorrow"), "Use local native reminders, no new backend service");
buildSync({entryPoints:["src/components/plush-guardian-core.jsx","src/components/plush-guardian-settings.jsx","src/components/guardian-panel.jsx","src/worker.js"],bundle:true,write:false,outdir:"out",format:"esm",platform:"browser",target:"es2022",loader:{".jsx":"jsx"}});
console.log("Bot Mommy passed: opt-in, task progress, voice, no AI requests, legacy chat privacy, no-human Guardian route, and existing Android scheduler.");
