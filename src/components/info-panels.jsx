// Small, externally-toggled ToolPanel modals — module split phase 7
// (see docs/module-split-plan.md). Each takes the boolean that used to
// gate its inline `{xOpen && (...)}` render, plus onClose, plus whatever
// other state/handlers its body reads — same explicit-prop pattern as
// MamasCorner's `supabase` prop in phase 6, just applied inside
// GlowUpTracker's own render tree instead of at its top level.
import { ToolPanel } from "./shared.jsx";

export function ProfilePanel({ open, onClose, pendingSupportInvites, hasOwnGuardian, goToDashboard, setSettingsOpen, setSafetyOpen, setHelpOpen, goToFeedback, isAdminUser, setAdminOpen, loadAdminData, nativeBuildInfo }) {
  if (!open) return null;
  return (
          <ToolPanel title="Profile" onClose={onClose}>
          <div style={{ display: "grid", gap: 8 }}>
            <button type="button" onClick={() => { onClose(); goToDashboard("guardian"); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 14px", borderRadius: 14, border: "1px solid #4C8FE855", background: "#FFFFFFAA", color: "#4C6E8E", fontWeight: 800, fontSize: 13.5, cursor: "pointer", textAlign: "left" }}>
              <span aria-hidden="true" style={{ fontSize: 18 }}>💛</span> {pendingSupportInvites.length ? `Guardian invitation${pendingSupportInvites.length === 1 ? "" : "s"}` : (hasOwnGuardian ? "Guardian" : "Add a Guardian")} <span style={{ marginLeft: "auto", fontSize: 12, color: "#9A86A7" }}>{pendingSupportInvites.length ? `${pendingSupportInvites.length} waiting ›` : "Trusted support ›"}</span>
            </button>
            <button type="button" onClick={() => setSettingsOpen(true)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 14px", borderRadius: 14, border: "1px solid #73B7A855", background: "#FFFFFFAA", color: "#318C79", fontWeight: 800, fontSize: 13.5, cursor: "pointer", textAlign: "left" }}>
              <span aria-hidden="true" style={{ fontSize: 18 }}>⚙️</span> Settings <span style={{ marginLeft: "auto", fontSize: 12, color: "#9A86A7" }}>Accessibility, notifications, account ›</span>
            </button>
            <button type="button" onClick={() => setSafetyOpen(true)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 14px", borderRadius: 14, border: "1px solid #4C8FE855", background: "#FFFFFFAA", color: "#2D6BB5", fontWeight: 800, fontSize: 13.5, cursor: "pointer", textAlign: "left" }}>
              <span aria-hidden="true" style={{ fontSize: 18 }}>💙</span> PlushSafety <span style={{ marginLeft: "auto", fontSize: 12, color: "#9A86A7" }}>Crisis & support resources ›</span>
            </button>
            <button type="button" onClick={() => setHelpOpen(true)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 14px", borderRadius: 14, border: "1px solid #D9A64C66", background: "#FFFFFFAA", color: "#A56D14", fontWeight: 800, fontSize: 13.5, cursor: "pointer", textAlign: "left" }}>
              <span aria-hidden="true" style={{ fontSize: 18 }}>❓</span> Help & FAQ <span style={{ marginLeft: "auto", fontSize: 12, color: "#9A86A7" }}>How this app works ›</span>
            </button>
            <button type="button" onClick={() => { onClose(); goToFeedback(); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 14px", borderRadius: 14, border: "1px solid #4C8FE855", background: "#FFFFFFAA", color: "#4C8FE8", fontWeight: 800, fontSize: 13.5, cursor: "pointer", textAlign: "left" }}>
              <span aria-hidden="true" style={{ fontSize: 18 }}>💌</span> Send feedback <span style={{ marginLeft: "auto", fontSize: 12, color: "#9A86A7" }}>Report a bug or suggest something ›</span>
            </button>
            {isAdminUser && (
              <button type="button" onClick={() => { setAdminOpen(true); loadAdminData(); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 14px", borderRadius: 14, border: "1px solid #C45D7455", background: "#FFFFFFAA", color: "#C45D74", fontWeight: 800, fontSize: 13.5, cursor: "pointer", textAlign: "left" }}>
                <span aria-hidden="true" style={{ fontSize: 18 }}>🛠️</span> Admin <span style={{ marginLeft: "auto", fontSize: 12, color: "#9A86A7" }}>›</span>
              </button>
            )}
            {nativeBuildInfo && (
              <div title={`Commit ${nativeBuildInfo.gitSha}`} style={{ marginTop: 4, textAlign: "center", fontSize: 10.5, color: "#B49FC7" }}>
                App v{nativeBuildInfo.version} · build {nativeBuildInfo.build} · {String(nativeBuildInfo.gitSha).slice(0, 7)}
              </div>
            )}
          </div>
          </ToolPanel>
  );
}

export function SafetyPanel({ open, onClose }) {
  if (!open) return null;
  return (
          <ToolPanel title="💙 PlushSafety" onClose={onClose}>
          <div style={{ marginBottom: 18, padding: 16, borderRadius: 18, background: "#F7FBFF", border: "1px solid #B9DCF6", boxShadow: "0 8px 22px rgba(76,143,232,.08)" }}>
            <div style={{ fontSize: 12.5, lineHeight: 1.55, color: "#3C5C82" }}>
              PlushLife is a gentle self-care tool. It is <strong>not</strong> emergency care, crisis support, or a substitute for professional medical or mental health treatment.
            </div>
          </div>

          <div style={{ marginBottom: 18, padding: 16, borderRadius: 18, background: "#FFF5F6", border: "1px solid #F0B8C4", boxShadow: "0 8px 22px rgba(196,93,116,.08)" }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: "#C45D74" }}>IF YOU OR SOMEONE ELSE IS IN IMMEDIATE DANGER</div>
            <div style={{ marginTop: 6, fontSize: 13, fontWeight: 800, color: "#6B3040" }}>Call your local emergency number right away (911 in the US).</div>
          </div>

          <div style={{ marginBottom: 18, padding: 16, borderRadius: 18, background: "rgba(255,255,255,0.82)", border: "1px solid #B9DCF6" }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: "#4C8FE8" }}>UNITED STATES</div>
            <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
              <div style={{ padding: "10px 12px", borderRadius: 12, background: "#F7FBFF", border: "1px solid #DCEBFA" }}>
                <div style={{ fontWeight: 900, color: "#2D6BB5", fontSize: 13 }}>988 Suicide & Crisis Lifeline</div>
                <div style={{ marginTop: 3, fontSize: 12, color: "#5F718B" }}>Call or text 988 — free, confidential, available 24/7.</div>
              </div>
              <div style={{ padding: "10px 12px", borderRadius: 12, background: "#F7FBFF", border: "1px solid #DCEBFA" }}>
                <div style={{ fontWeight: 900, color: "#2D6BB5", fontSize: 13 }}>Crisis Text Line</div>
                <div style={{ marginTop: 3, fontSize: 12, color: "#5F718B" }}>Text HOME to 741741 — free, confidential, available 24/7.</div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 18, padding: 16, borderRadius: 18, background: "rgba(255,255,255,0.82)", border: "1px solid #B9DCF6" }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: "#4C8FE8" }}>OUTSIDE THE UNITED STATES</div>
            <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.5, color: "#5F718B" }}>
              findahelpline.com lists free, confidential crisis lines by country.
            </div>
          </div>

          <div style={{ padding: 16, borderRadius: 18, background: "rgba(255,255,255,0.82)", border: "1px solid #B9DCF6" }}>
            <div style={{ fontSize: 12.5, lineHeight: 1.55, color: "#5F718B" }}>
              This page is always free and never requires a subscription to view. If PlushLife has said anything that worried you about how you're doing, it's never a diagnosis — please reach out to a real person or professional.
            </div>
          </div>
          </ToolPanel>
  );
}

export function HelpPanel({ open, onClose, babyMode, goToFeedback }) {
  if (!open) return null;
  return (
          <ToolPanel title="Help" onClose={onClose}>
          <div style={{ marginBottom: 18, padding: 16, borderRadius: 18, background: "#FFFDF4", border: "1px solid #E9C96E", boxShadow: "0 8px 22px rgba(166,109,20,.08)" }}>
            <div style={{ display: "grid", gap: 7, marginTop: 9, fontSize: 12.5, lineHeight: 1.45, color: "#5B4B6B" }}>
              <div><strong>{babyMode ? "NURSERY" : "TODAY"}:</strong> shows today’s everyday tasks and today’s schedule.</div>
              <div><strong>{babyMode ? "PLUSHCALENDAR" : "CALENDAR"}:</strong> lets you preview or change a particular day.</div>
              <div><strong>Required:</strong> counts toward your main score. <strong>Bonus:</strong> is optional and never lowers it.</div>
              <div><strong>Guardian (in Profile):</strong> is where you invite, pause, or remove a trusted guardian, and where you view anyone you support.</div>
              <div><strong>People I Support:</strong> read-only. You can encourage, but you can't check off or change someone else's tasks, and their private reflections are never shown to you.</div>
              <div><strong>Private reflection:</strong> belongs only to you and stays with the date you wrote it on.</div>
            </div>
          </div>

          <div style={{ marginBottom: 18, padding: 16, borderRadius: 18, background: "#FFFDF4", border: "1px solid #E9C96E", boxShadow: "0 8px 22px rgba(166,109,20,.08)" }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: "#A56D14" }}>💛 FREQUENTLY ASKED QUESTIONS</div>
            <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
              {[
                ["What can a Guardian actually see?", "Only what you turn on for them, one setting at a time — your progress percentage, specific sections, or nothing at all. They can never see your private reflections, and you can pause or fully remove their access at any moment."],
                ["Can a Guardian edit or complete my tasks?", "No. A Guardian can only view what you've allowed, send an encouraging note, or suggest a task for you to approve. They cannot check anything off or change your tasks."],
                ["What happens if I miss a day?", "Nothing is lost. Care days and activity days are lifetime totals, so they never reset. Every badge and outfit you've earned stays yours forever."],
                ["What's the difference between Required and Bonus tasks?", "Required tasks count toward your daily percentage. Bonus tasks are extras — completing them never lowers your score, and skipping them never counts against you."],
                ["What are Full, Soft, Tiny, and Recovery Days?", "They are four ways to size today around your real capacity. Full shows your usual versions, Soft uses gentler versions and hides bonuses, Tiny keeps the smallest essentials, and Recovery helps you restart without a backlog."],
                ["How do mood and energy patterns work?", "Your check-ins stay private and appear in your PlushGrowth calendar. With pattern suggestions on, PlushLife may notice a repeated day-of-week pattern and offer a small routine change. It never diagnoses you, assumes a cause, or changes anything without your approval."],
                ["Is PlushCare free?", "Yes. PlushCare, PlushPaths, PlushSleep, mood and energy tracking, adaptive habits, accessibility tools, and Guardian support are all free right now."],
                ["What is PlushFocus?", "Instead of your full checklist, PlushFocus shows just your next task, one at a time — good for when a long list feels like too many decisions."],
                ["Who can see my private reflections?", "Only you, always. They're never shown to a Guardian, never included in any shared summary, and stored separately from anything else."],
                ["Can I get my data, or delete my account?", "Yes to both, anytime — Settings → Your Data has a full export, and Settings → Account has the Delete account button. Deletion is permanent and requires confirmation."],
                ["How do badges and the Mascot Closet work?", "Badges and outfits unlock from all kinds of care — showing up, reflecting, building or reducing a habit, connecting a Guardian. Once unlocked, nothing is ever taken away."],
              ].map(([q, a]) => (
                <details key={q} style={{ padding: "9px 11px", borderRadius: 12, background: "white", border: "1px solid #F0E4C2" }}>
                  <summary style={{ fontSize: 13, fontWeight: 800, color: "#5B4B6B", cursor: "pointer" }}>{q}</summary>
                  <div style={{ marginTop: 7, fontSize: 12.5, lineHeight: 1.55, color: "#6B5A7D" }}>{a}</div>
                </details>
              ))}
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: "#8C6B9E" }}>Still stuck on something? <button type="button" onClick={() => { onClose(); goToFeedback(); }} style={{ color: "#A56D14", background: "none", border: 0, textDecoration: "underline", cursor: "pointer", fontWeight: 800, fontSize: 12, padding: 0 }}>Send feedback</button> and I'll help directly.</div>
          </div>
          </ToolPanel>
  );
}

export function CalmPanel({ open, onClose, currentCopingOption, reshuffle, setCareSection, goToDashboard }) {
  if (!open) return null;
  return (
          <ToolPanel title="PlushCalm" onClose={onClose}>
            <div style={{ padding: "15px 16px", borderRadius: 16, background: "rgba(255,255,255,0.28)", border: "1px solid #F3D9EC" }}>
              <div style={{ padding: "12px 14px", borderRadius: 12, background: "#C77DD622", border: "1px solid #C77DD655", marginBottom: 10 }}>
                <div style={{ fontSize: 10, letterSpacing: "0.18em", color: "#C77DD6", fontWeight: 700, marginBottom: 4 }}>TRY THIS RIGHT NOW</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#5B4B6B" }}>{currentCopingOption}</div>
              </div>
              <button onClick={reshuffle} style={{
                padding: "7px 14px", borderRadius: 10, border: "1px solid #C77DD655",
                background: "rgba(255,255,255,0.4)", color: "#C77DD6", fontWeight: 700,
                fontSize: 12.5, cursor: "pointer", marginBottom: 12,
              }}>
                🎲 Give me something else
              </button>

              <div style={{ fontSize: 13.5, lineHeight: 1.7, color: "#8C6B9E" }}>
                And always: reach out and tell someone I'm struggling if I need to.
              </div>

              <div style={{ marginTop: 14, paddingTop: 13, borderTop: "1px solid #F3D9EC" }}>
                <button type="button" onClick={() => { onClose(); setCareSection("quick"); goToDashboard("care"); }} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 13px", borderRadius: 12, border: "1px solid #E6D4F2", background: "rgba(255,255,255,0.55)", color: "#6B5A7D", fontWeight: 800, fontSize: 12.5, cursor: "pointer" }}>
                  <span>🧰 Open the Comfort Toolkit</span>
                  <span style={{ color: "#C77DD6" }}>on the PlushCare tab ›</span>
                </button>
              </div>
              <div style={{ marginTop: 10, fontSize: 13.5, fontStyle: "italic", color: "#C77DD6" }}>
                "My feelings are real. I don't have to hurt myself to prove they exist."
              </div>
            </div>
          </ToolPanel>
  );
}
