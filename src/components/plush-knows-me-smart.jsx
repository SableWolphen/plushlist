import { profileContext, recordRecommendationOutcome } from "../plush-profile.js";
import { recordCompletionSequence, recordRecoverySnapshot, recoveryFingerprint, rescueRecipe, sequenceSuggestion } from "../plush-smart-adaptation.js";
import { hasGoldFeature } from "../plush-gold.js";

const card = { borderRadius: 14, border: "1px solid #D8DCEB", background: "linear-gradient(145deg,#F9FAFF,#FFFFFF)", padding: "10px 11px", boxShadow: "0 3px 10px rgba(84,91,130,.05)" };
const button = { minHeight: 44, padding: "7px 10px", borderRadius: 10, border: "1px solid #D2D8EA", background: "white", color: "#626A91", fontWeight: 900, fontSize: 10.3, cursor: "pointer" };

export function SmartAdaptationPanel(props) {
  const userId = props.user?.id || "local";
  const gold = hasGoldFeature("advanced_growth_insights");
  const rows = props.rows || [];
  const viewDone = props.viewDone || {};
  const context = profileContext({ dailyCheckIn: props.dailyCheckIn || {}, rows, viewDone });
  const doneSignature = rows.filter((row) => !row?.isBonus && viewDone?.[row.key]).map((row) => row.key).join("|");
  const [version, setVersion] = React.useState(0);
  const [recipeFeedbackOpen, setRecipeFeedbackOpen] = React.useState(false);
  void version;

  React.useEffect(() => {
    recordCompletionSequence(userId, rows, viewDone);
    recordRecoverySnapshot(userId, context);
    setVersion((value) => value + 1);
  }, [userId, doneSignature, context.energy, context.capacity, context.mood, context.load, context.time]);

  const sequence = sequenceSuggestion(userId, rows, viewDone);
  const recovery = recoveryFingerprint(userId, context);
  const recipe = rescueRecipe(userId, context);

  const applyRecipe = () => {
    try {
      document.getElementById("plushlife-gentle-launcher")?.click();
      window.setTimeout(() => {
        const action = document.querySelector(`#plushlife-gentle-panel [data-action="${recipe.action}"]`);
        action?.click();
      }, 80);
    } catch (_error) {}
    setRecipeFeedbackOpen(true);
  };

  const saveRecipeFeedback = (feedback) => {
    recordRecommendationOutcome(userId, "rescue_recipe", recipe.id, feedback, context);
    setRecipeFeedbackOpen(false);
    setVersion((value) => value + 1);
  };

  const jumpToSequenceTask = () => {
    try {
      const escaped = typeof CSS !== "undefined" && CSS.escape ? CSS.escape(sequence.toKey) : sequence.toKey.replace(/"/g, "\\\"");
      const node = document.querySelector(`[data-task-key="${escaped}"]`);
      node?.scrollIntoView?.({ behavior: "smooth", block: "center" });
      node?.focus?.({ preventScroll: true });
    } catch (_error) {}
  };

  if (props.quiet) return null;

  if (!gold) return null;
  return <section data-smart-recommendations="true" aria-label="Suggestions you can use now" style={{ display: "grid", gap: 8, margin: "0 0 10px" }}>
    {sequence && <div style={{ ...card, borderColor: "#CFE8E1", background: "linear-gradient(145deg,#F3FFFB,#FFFFFF)" }}>
      <div style={{ fontSize: 11.2, fontWeight: 900, color: "#3E8878" }}>🔗 A useful next step</div>
      <div style={{ marginTop: 4, fontSize: 10.5, lineHeight: 1.45, color: "#617A73" }}>{sequence.text}</div>
      <button type="button" onClick={jumpToSequenceTask} style={{ ...button, marginTop: 7, borderColor: "#BFDCD3", color: "#397968" }}>Show me that next step</button>
      {sequence.count >= 2 && <details style={{ marginTop: 5 }}><summary style={{ minHeight: 44, display: "flex", alignItems: "center", cursor: "pointer", fontSize: 9.8, color: "#6F8D86", fontWeight: 800 }}>Why this?</summary><div style={{ fontSize: 9.5, lineHeight: 1.4, color: "#84958F" }}>You completed these steps in this order {sequence.count} times. It is a suggestion, not a rule.</div></details>}
    </div>}

    {recovery && <div style={{ ...card, borderColor: "#DDD0E9", background: "linear-gradient(145deg,#FAF5FD,#FFFFFF)" }}>
      <div style={{ padding: "8px 9px", borderRadius: 10, background: "white", border: "1px solid #E8DFEE" }}>
        <div style={{ marginTop: 1, fontSize: 11, fontWeight: 900, color: "#62536C" }}>{recipe.icon} Try {recipe.label}</div>
        <div style={{ marginTop: 3, fontSize: 10, lineHeight: 1.42, color: "#7E7086" }}>{recipe.description}</div>
        <button type="button" onClick={applyRecipe} style={{ ...button, marginTop: 7, border: 0, background: "#8E69B1", color: "white" }}>Use {recipe.label}</button>
        {recovery.count >= 2 && <details style={{ marginTop: 5 }}><summary style={{ minHeight: 44, display: "flex", alignItems: "center", cursor: "pointer", fontSize: 9.8, color: "#927AA0", fontWeight: 800 }}>Why this?</summary><div style={{ fontSize: 9.5, lineHeight: 1.4, color: "#998AA0" }}>{recovery.text} {recipe.reason}</div></details>}
        {recipeFeedbackOpen && <div style={{ marginTop: 7 }}><div style={{ fontSize: 9.5, fontWeight: 900, color: "#806B8D" }}>Did this recipe fit today?</div><div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 4 }}><button type="button" onClick={() => saveRecipeFeedback("helped")} style={button}>💜 Yes</button><button type="button" onClick={() => saveRecipeFeedback("neutral")} style={button}>🙂 Not sure</button><button type="button" onClick={() => saveRecipeFeedback("not_helpful")} style={button}>🪶 Not really</button></div></div>}
      </div>
    </div>}
  </section>;
}
