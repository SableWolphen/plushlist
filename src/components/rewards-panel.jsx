// The Rewards ToolPanel — module split phase 7, fourth slice (see
// docs/module-split-plan.md). FeatureTip and BADGE_DEFS are passed as
// props rather than moved, since both are defined inside GlowUpTracker
// as closures over other state (BADGE_DEFS's check() functions close
// over a dozen-plus state variables) — passing the reference through
// is safe and doesn't require touching either. PlushMascot is imported
// directly since it's already its own module (phase 6); MASCOT_OUTFITS
// is read from window.PlushLifeContent, same as app-source.jsx itself.
import { ToolPanel } from "./shared.jsx";
import { PlushMascot } from "./mascot.jsx";

export function RewardsPanel({ open, onClose, FeatureTip, selectedOutfit, mascotMood, activityDaysTotal, preferences, mascotGrowth, careDaysTotal, unlockedOutfits, earnedBadgeIdSet, BADGE_DEFS, unlockedIdSet, mascotRequirementProgress, saveMascotCollection, mascotCollection, savedBestStreak, collectionTab, setCollectionTab, winsJarEntries }) {
  if (!open) return null;
  const { MASCOT_OUTFITS } = window.PlushLifeContent;
  return (
          <ToolPanel title="Rewards" onClose={onClose}>
          <FeatureTip id="rewards_panel" text="Everything here is earned from all kinds of care, not just streaks — and once unlocked, nothing is ever taken away." />
          <div style={{ marginBottom: 18, padding: 17, borderRadius: 20, background: "linear-gradient(145deg,rgba(255,255,255,.88),rgba(255,245,218,.8))", border: "1px solid #E9C96E", boxShadow: "0 10px 28px rgba(166,109,20,.11)" }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
              <PlushMascot outfit={selectedOutfit} size={132} mood={mascotMood} activityDays={activityDaysTotal} darkMode={preferences.dark_mode} />
              <div style={{ flex: "1 1 190px" }}>
                <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: ".16em", color: "#A56D14" }}>MASCOT CLOSET + BADGES</div>
                <div style={{ marginTop: 4, fontSize: 20, fontWeight: 900, color: "#5B4B6B" }}>{selectedOutfit.name}</div>
                {mascotGrowth.label !== "new" && <div style={{ marginTop: 2, fontSize: 12, fontWeight: 800, color: "#A65DC1" }}>Your companion is {mascotGrowth.label} ✨</div>}
                <div style={{ marginTop: 7, fontSize: 12.5, lineHeight: 1.5, color: "#7B6888" }}>
                  Your collection follows your signed-in account. Rewards can come from showing up, completing care, building a helpful habit, or gently reducing a habit. Once unlocked, each reward stays yours.
                </div>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 9 }}>
                  <span style={{ padding: "5px 9px", borderRadius: 999, background: "#FFF4CF", color: "#94600D", fontWeight: 900, fontSize: 11.5 }}>👋 Active days: {activityDaysTotal}</span>
                  <span style={{ padding: "5px 9px", borderRadius: 999, background: "#F3E8FA", color: "#8E4EAA", fontWeight: 900, fontSize: 11.5 }}>♥ Essential-care days: {careDaysTotal}</span>
                  <span style={{ padding: "5px 9px", borderRadius: 999, background: "#EAF8F4", color: "#318C79", fontWeight: 900, fontSize: 11.5 }}>✨ {unlockedOutfits.length}/{MASCOT_OUTFITS.length} outfits · {earnedBadgeIdSet.size}/{BADGE_DEFS.length} badges</span>
                </div>
                <div style={{ marginTop: 7, fontSize: 10.5, color: "#8C6B9E" }}>These are lifetime totals. Taking time away never lowers them, and every unlocked reward remains yours.</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
              <button type="button" onClick={() => setCollectionTab("mascot")} style={{ flex: 1, padding: "8px 6px", borderRadius: 10, border: collectionTab === "mascot" ? "2px solid #A65DC1" : "1px solid #E4D7B4", background: collectionTab === "mascot" ? "#F8ECFC" : "white", color: "#5B4B6B", fontWeight: 800, cursor: "pointer" }}>🧸 Closet</button>
              <button type="button" onClick={() => setCollectionTab("badges")} style={{ flex: 1, padding: "8px 10px", borderRadius: 10, border: collectionTab === "badges" ? "2px solid #A65DC1" : "1px solid #E4D7B4", background: collectionTab === "badges" ? "#F8ECFC" : "white", color: "#5B4B6B", fontWeight: 800, cursor: "pointer" }}>🏅 Badges</button>
              <button type="button" onClick={() => setCollectionTab("wins")} style={{ flex: 1, padding: "8px 6px", borderRadius: 10, border: collectionTab === "wins" ? "2px solid #A65DC1" : "1px solid #E4D7B4", background: collectionTab === "wins" ? "#F8ECFC" : "white", color: "#5B4B6B", fontWeight: 800, cursor: "pointer" }}>🫙 Jar</button>
            </div>

            {collectionTab === "mascot" && (
            <div style={{ marginTop: 14 }}>
              {[
                { id: "unlocked", title: `✨ UNLOCKED · ${unlockedOutfits.length}`, subtitle: "Tap an outfit to wear it.", items: MASCOT_OUTFITS.filter((outfit) => unlockedIdSet.has(outfit.id)) },
                { id: "locked", title: `🔒 STILL TO UNLOCK · ${MASCOT_OUTFITS.length - unlockedOutfits.length}`, subtitle: "Your progress is shown on each reward—nothing already earned can disappear.", items: MASCOT_OUTFITS.filter((outfit) => !unlockedIdSet.has(outfit.id)) },
              ].map((section) => (
              <div key={section.id} style={{ marginTop: section.id === "unlocked" ? 0 : 18 }}>
                <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: ".1em", color: section.id === "unlocked" ? "#318C79" : "#8C6B9E" }}>{section.title}</div>
                <div style={{ marginTop: 3, fontSize: 10.5, color: "#8C6B9E" }}>{section.subtitle}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(132px,1fr))", gap: 8, marginTop: 8 }}>
              {section.items.map((outfit) => {
                const unlocked = unlockedIdSet.has(outfit.id);
                const selected = selectedOutfit.id === outfit.id;
                const progress = Math.min(outfit.unlock.count, mascotRequirementProgress(outfit));
                return (
                  <button key={outfit.id} type="button" disabled={!unlocked} onClick={() => {
                    if (!unlocked) return;
                    saveMascotCollection({
                      ...mascotCollection,
                      bestStreak: savedBestStreak,
                      unlockedIds: [...unlockedIdSet],
                      selectedId: outfit.id,
                    });
                  }} style={{ minHeight: 96, padding: "10px 8px", borderRadius: 13, border: selected ? "2px solid #A65DC1" : "1px solid #E4D7B4", background: selected ? "#F8ECFC" : unlocked ? "#FFFFFFC9" : "#F1ECEF", color: unlocked ? "#5B4B6B" : "#9B919F", textAlign: "center", cursor: unlocked ? "pointer" : "not-allowed", opacity: unlocked ? 1 : .68 }}>
                    <div style={{ fontSize: 27 }}>{unlocked ? outfit.badge : "🔒"}</div>
                    <div style={{ marginTop: 3, fontSize: 12, fontWeight: 900 }}>{outfit.name}</div>
                    <div style={{ marginTop: 3, fontSize: 9.5, lineHeight: 1.35 }}>{outfit.hint}</div>
                    {unlocked && <div style={{ marginTop: 3, fontSize: 9.5, fontWeight: 900, color: selected ? "#A65DC1" : "#318C79" }}>{selected ? "Wearing now" : "✓ Unlocked · tap to wear"}</div>}
                    {!unlocked && outfit.unlock.count > 0 && (
                      <div style={{ marginTop: 4, fontSize: 9, fontWeight: 900, color: "#A65DC1" }}>{progress}/{outfit.unlock.count}</div>
                    )}
                  </button>
                );
              })}
                </div>
              </div>
              ))}
            </div>
            )}

            {collectionTab === "badges" && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11.5, lineHeight: 1.5, color: "#7B6888" }}>Earned for all kinds of caring, not just streaks — showing up, reflecting, connecting, organizing, and growing habits. Once earned, a badge is yours forever.</div>
              {[
                { id: "earned", title: `✨ EARNED · ${earnedBadgeIdSet.size}`, items: BADGE_DEFS.filter((item) => earnedBadgeIdSet.has(item.id)) },
                { id: "locked", title: `🔒 STILL TO UNLOCK · ${BADGE_DEFS.length - earnedBadgeIdSet.size}`, items: BADGE_DEFS.filter((item) => !earnedBadgeIdSet.has(item.id)) },
              ].map((section) => (
              <div key={section.id} style={{ marginTop: section.id === "earned" ? 12 : 18 }}>
                <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: ".1em", color: section.id === "earned" ? "#318C79" : "#8C6B9E" }}>{section.title}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(112px,1fr))", gap: 8, marginTop: 8 }}>
                {section.items.map((item) => {
                  const unlocked = earnedBadgeIdSet.has(item.id);
                  return (
                    <div key={item.id} style={{ minHeight: 88, padding: "10px 8px", borderRadius: 13, border: unlocked ? "1px solid #E4D7B4" : "1px solid #E9E4E7", background: unlocked ? "#FFFFFFC9" : "#F1ECEF", color: unlocked ? "#5B4B6B" : "#9B919F", textAlign: "center", opacity: unlocked ? 1 : .68 }}>
                      <div style={{ fontSize: 24 }}>{unlocked ? item.badge : "🔒"}</div>
                      <div style={{ marginTop: 3, fontSize: 11, fontWeight: 900 }}>{item.name}</div>
                      <div style={{ marginTop: 3, fontSize: 9, lineHeight: 1.35 }}>{item.hint}</div>
                      {unlocked && <div style={{ marginTop: 3, fontSize: 9.5, fontWeight: 900, color: "#318C79" }}>✓ Earned</div>}
                    </div>
                  );
                })}
                </div>
              </div>
              ))}
            </div>
            )}

            {collectionTab === "wins" && (
            <div style={{ marginTop: 14 }}>
              <div style={{ padding: "12px 13px", borderRadius: 14, background: "linear-gradient(135deg,#F4F9FF,#FFF5FB)", border: "1px solid #D9D4F2" }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: "#76558A" }}>🫙 YOUR WINS JAR</div>
                <div style={{ marginTop: 4, fontSize: 12, lineHeight: 1.5, color: "#7B6888" }}>Little care is worth keeping. These are gentle notes from days you showed up—no streaks to protect, no points to lose.</div>
              </div>
              <div style={{ marginTop: 10, padding: "10px 11px", borderRadius: 13, background: "#FFFDFE", border: "1px solid #E7D8ED" }}>
                <div style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: ".1em", color: "#9A62AB" }}>🏠 NURSERY KEEPSAKE WALL</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 7 }}>
                  {winsJarEntries.length ? winsJarEntries.slice(0, 8).map((entry) => <span key={`keepsake-${entry.date}`} title={entry.title} aria-label={entry.title} style={{ display: "grid", placeItems: "center", width: 31, height: 31, borderRadius: 10, background: "#F8EEFC", border: "1px solid #E4CDEB", fontSize: 17 }}>{entry.emoji}</span>) : <span style={{ color: "#9A86A7", fontSize: 11.5 }}>Your first little win will become a keepsake here.</span>}
                </div>
              </div>
              {winsJarEntries.length === 0 ? (
                <div style={{ marginTop: 10, padding: 14, borderRadius: 13, border: "1px dashed #D9C8E4", background: "#FFFCFF", color: "#8C6B9E", fontSize: 12.5, lineHeight: 1.5, textAlign: "center" }}>Your jar is waiting for its first tiny win. Whenever you finish something that helps, it will have a place here. 🌱</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))", gap: 8, marginTop: 10 }}>
                  {winsJarEntries.map((entry) => (
                    <article key={entry.date} style={{ minHeight: 116, padding: "11px 10px", borderRadius: 14, background: "#FFFFFFD6", border: "1px solid #E7D8ED", boxShadow: "0 4px 12px rgba(120,80,145,.08)" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}><span style={{ fontSize: 23 }}>{entry.emoji}</span><span style={{ color: "#9A86A7", fontSize: 9.5, fontWeight: 800 }}>{new Date(`${entry.date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span></div>
                      <div style={{ marginTop: 5, color: "#68446F", fontSize: 12.5, fontWeight: 900 }}>{entry.title}</div>
                      <div style={{ marginTop: 4, color: "#7B6888", fontSize: 10.5, lineHeight: 1.42 }}>{entry.text}</div>
                      <div style={{ marginTop: 6, color: "#318C79", fontSize: 9.5, fontWeight: 900 }}>{entry.count} {entry.count === 1 ? "care thing" : "care things"} that day</div>
                    </article>
                  ))}
                </div>
              )}
            </div>
            )}

            <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 13, paddingTop: 12, borderTop: "1px solid #EADDB8", fontSize: 12.5, fontWeight: 800 }}>
              <input type="checkbox" checked={mascotCollection.celebrationSound} onChange={(event) => saveMascotCollection({ ...mascotCollection, bestStreak: savedBestStreak, unlockedIds: [...unlockedIdSet], celebrationSound: event.target.checked })} />
              Play a soft chime at 100% (automatically silent during quiet hours)
            </label>
            <div style={{ marginTop: 6, fontSize: 10.5, color: "#8C6B9E" }}>Reduce animation in Settings also keeps the 100% celebration still and calm.</div>
          </div>
          </ToolPanel>
  );
}
