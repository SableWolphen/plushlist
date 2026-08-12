const fs = require("fs");
const path = require("path");

function patch(relativePath, edits) {
  const file = path.join(__dirname, "..", relativePath);
  let source = fs.readFileSync(file, "utf8");
  let changed = false;
  for (const edit of edits) {
    if (edit.already && source.includes(edit.already)) continue;
    if (!source.includes(edit.from)) throw new Error(`${relativePath}: missing patch target: ${edit.label}`);
    source = source.replace(edit.from, edit.to);
    changed = true;
  }
  if (changed) fs.writeFileSync(file, source);
  return changed;
}

let changed = false;
changed = patch("src/components/daily-companion-core.jsx", [
  {
    label: "first week elapsed",
    already: "const firstWeekElapsed = dateDiffDays(firstSeen, dateKey) + 1;",
    from: "  const firstWeekDay = Math.min(7, dateDiffDays(firstSeen, dateKey) + 1);",
    to: "  const firstWeekElapsed = dateDiffDays(firstSeen, dateKey) + 1;\n  const firstWeekDay = Math.min(7, firstWeekElapsed);\n  const inFirstWeek = firstWeekElapsed <= 7;",
  },
  {
    label: "first week guide visibility",
    already: "{inFirstWeek && sectionButton(`First-week guide · Day ${firstWeekDay}`",
    from: "{firstWeekDay <= 7 && sectionButton(`First-week guide · Day ${firstWeekDay}`",
    to: "{inFirstWeek && sectionButton(`First-week guide · Day ${firstWeekDay}`",
  },
  {
    label: "first week guide body visibility",
    already: "{inFirstWeek && openSection === \"firstweek\" && (",
    from: "{firstWeekDay <= 7 && openSection === \"firstweek\" && (",
    to: "{inFirstWeek && openSection === \"firstweek\" && (",
  },
]) || changed;

changed = patch("src/components/today-panel-core.jsx", [
  {
    label: "next step reason prop",
    already: "nextStepTask, nextStepReason, FeatureTip",
    from: "nextStepTask, FeatureTip",
    to: "nextStepTask, nextStepReason, FeatureTip",
  },
  {
    label: "next step reason display",
    already: "{nextStepReason && <div style={{ marginTop: 4, fontSize: 11.5, lineHeight: 1.45, color: \"#806B8D\" }}>{nextStepReason}</div>}",
    from: "              <div style={{ marginTop: 4, fontSize: 18, fontWeight: 800, color: \"#5B4B6B\" }}>{nextStepTask.sourceTask && <HabitTypeIcon task={nextStepTask.sourceTask} />}{nextStepTask.label}</div>",
    to: "              <div style={{ marginTop: 4, fontSize: 18, fontWeight: 800, color: \"#5B4B6B\" }}>{nextStepTask.sourceTask && <HabitTypeIcon task={nextStepTask.sourceTask} />}{nextStepTask.label}</div>\n              {nextStepReason && <div style={{ marginTop: 4, fontSize: 11.5, lineHeight: 1.45, color: \"#806B8D\" }}>{nextStepReason}</div>}",
  },
  {
    label: "welcome back copy",
    already: "No catching up. We're only looking at today.",
    from: "                  We're only looking at today. {voice.welcomeBack(returnGapDays)}",
    to: "                  No catching up. We're only looking at today. {voice.welcomeBack(returnGapDays)}",
  },
  {
    label: "resume normally wording",
    already: ">Resume normally</button>",
    from: ">Start fresh</button>",
    to: ">Resume normally</button>",
  },
  {
    label: "essentials wording",
    already: ">Essentials only</button>",
    from: ">Choose 3 essentials</button>",
    to: ">Essentials only</button>",
  },
  {
    label: "lighter routine wording",
    already: ">Lighter routine</button>",
    from: ">Start a Soft Day</button>",
    to: ">Lighter routine</button>",
  },
]) || changed;

changed = patch("src/components/organized-settings.jsx", [
  {
    label: "simple mode theme description",
    already: "Reduce visual decisions, ambient theme effects, and extra decoration.",
    from: "[\"simple_mode\", \"Simpler, quieter layout\", \"Reduce visual decisions and extra decoration.\"]",
    to: "[\"simple_mode\", \"Simpler, quieter layout\", \"Reduce visual decisions, ambient theme effects, and extra decoration.\"]",
  },
  {
    label: "reminder load guidance",
    already: "REMINDER LOAD",
    from: "        {(preferences.reminder_times || []).length < 8 && <button type=\"button\" onClick={() => updatePreference({ reminder_times: [...(preferences.reminder_times || []), \"12:00\"] })} style={{ ...secondaryButton, marginTop: 10 }}>＋ Add reminder</button>}",
    to: "        {(preferences.reminder_times || []).length < 8 && <button type=\"button\" onClick={() => updatePreference({ reminder_times: [...(preferences.reminder_times || []), \"12:00\"] })} style={{ ...secondaryButton, marginTop: 10 }}>＋ Add reminder</button>}\n        {(preferences.reminder_times || []).length >= 5 && <div style={{ marginTop: 10, padding: \"9px 10px\", borderRadius: 10, background: \"#FFF9E9\", border: \"1px solid #F0D99E\", color: \"#6B5A3D\", fontSize: 11.5, lineHeight: 1.45 }}><strong>REMINDER LOAD:</strong> You have {(preferences.reminder_times || []).length} daily reminders. If they start blending into the background, keeping fewer high-value times usually makes each one easier to notice.</div>}",
  },
  {
    label: "reminder evidence copy",
    already: "This suggestion comes from your own recent check-in timing.",
    from: "            💡 You tend to check in around <strong>{smartReminderSuggestion.label}</strong>.",
    to: "            💡 You tend to check in around <strong>{smartReminderSuggestion.label}</strong>. <span style={{ opacity: .82 }}>This suggestion comes from your own recent check-in timing.</span>",
  },
]) || changed;

console.log(changed ? "Applied v1 finish patch." : "V1 finish patch already applied.");
