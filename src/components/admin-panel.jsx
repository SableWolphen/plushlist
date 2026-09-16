// The Admin ToolPanel — module split phase 7, fifth slice, first of
// the "big four" (see docs/module-split-plan.md). Owner-only tooling:
// site stats, feature usage, onboarding funnel, Supporter status
// grant/revoke, Google Play review-account management, feedback
// inbox, error logs, and the dev-only PlushPlus entitlement preview.
// SUPPORTER_FEATURES_ENABLED is passed as a prop rather than
// duplicated here (it's a plain literal in app-source.jsx, not a
// window global) so there's exactly one source of truth for the
// billing gate — see CLAUDE.md's Checkpoints on billing/entitlements.
// window.PlushLifeEntitlements is read directly since it's already a
// global.
import { ToolPanel } from "./shared.jsx";

const OVERALL_ONBOARDING_STAGES = ["Profile & welcome", "Setup choices", "Starting point", "Goals & support", "Preferences", "Ready to begin"];
const COZY_ONBOARDING_STAGES = ["Choose setup", "Comfort detail", "Starting point", "Goals & support", "Preferences", "Ready to begin"];
const GUARDIAN_ONBOARDING_STAGES = ["Choose setup", "Add Guardian", "Comfort detail", "Starting point", "Goals & support", "Ready to begin"];

function biggestDropoff(rows = [], labels = []) {
  return rows.reduce((best, row) => {
    const count = Number(row?.abandoned_here || 0);
    if (!count || (best && best.count >= count)) return best;
    const index = Math.max(0, Number(row?.step || 1) - 1);
    return { count, label: labels[index] || `Step ${row?.step || "?"}` };
  }, null);
}

export function AdminPanel({ open, onClose, loadAdminData, adminMessage, adminStats, adminOnline, adminFunnel, SUPPORTER_FEATURES_ENABLED, supporterEmailDraft, setSupporterEmailDraft, setSupporterStatus, supporterGrantMessage, reviewAccountRole, setReviewAccountRole, reviewAccountEmail, setReviewAccountEmail, reviewAccountPassword, setReviewAccountPassword, createOrUpdateReviewAccount, reviewAccountMessage, adminFeedback, resolveFeedback, adminErrors, clearAllErrors, devPreviewPlan, setDevPreviewPlan }) {
  if (!open) return null;
  const funnelStarted = Number(adminFunnel?.started || 0);
  const funnelCompleted = Number(adminFunnel?.completed || 0);
  const funnelCompletionPct = funnelStarted ? Math.round((funnelCompleted / funnelStarted) * 100) : 0;
  const funnelBiggestDropoff = biggestDropoff(adminFunnel?.by_step || [], OVERALL_ONBOARDING_STAGES);

  return (
          <ToolPanel title="🛠️ Admin" onClose={onClose}>
          <div style={{ marginBottom: 14 }}>
            <button type="button" onClick={loadAdminData} style={{ padding: "7px 11px", borderRadius: 9, border: "1px solid #C45D7455", background: "#FFF7F9", color: "#C45D74", fontWeight: 800, cursor: "pointer" }}>↻ Refresh admin data</button>
            {adminMessage && <span style={{ marginLeft: 10, fontSize: 12, color: "#8C6B9E" }}>{adminMessage}</span>}
          </div>

          {adminStats && (
            <div style={{ marginBottom: 16, padding: 16, borderRadius: 16, background: "rgba(255,255,255,0.82)", border: "1px solid #F0D5DB" }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: "#C45D74" }}>SITE STATS</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 8, marginTop: 10 }}>
                {[
                  ["Accounts", adminStats.total_accounts],
                  ["Tasks", adminStats.total_tasks],
                  ["Active guardian links", adminStats.total_guardian_links],
                  ["Feedback (open)", adminStats.total_feedback],
                  ["Errors (24h)", adminStats.total_errors_24h],
                  ["Progress rows logged", adminStats.total_daily_progress_rows],
                ].map(([label, value]) => (
                  <div key={label} style={{ padding: "9px 8px", borderRadius: 10, textAlign: "center", background: "#FFF7F9" }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: "#C45D74" }}>{value ?? "—"}</div>
                    <div style={{ marginTop: 2, fontSize: 10, color: "#8C6B9E" }}>{label.toUpperCase()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {adminStats && (
            <div style={{ marginBottom: 16, padding: 16, borderRadius: 16, background: "rgba(255,255,255,0.82)", border: "1px solid #F0D5DB" }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: "#4C8FE8" }}>FEATURE USAGE</div>
              <div style={{ marginTop: 4, fontSize: 10.5, color: "#8C6B9E" }}>How many accounts have each feature on, out of {adminStats.total_accounts ?? "—"} total.</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 8, marginTop: 10 }}>
                {[
                  ["Using Focus Mode", adminStats.using_focus_mode],
                  ["Using Baby Mode", adminStats.using_baby_mode],
                  ["Using Dino Theme", adminStats.using_dino_theme],
                  ["Notifications on", adminStats.using_notifications],
                  ["Habit-type tasks", adminStats.total_habit_tasks],
                  ["Badges earned (all)", adminStats.total_badges_earned],
                  ["Reflections written", adminStats.total_reflections],
                ].map(([label, value]) => (
                  <div key={label} style={{ padding: "9px 8px", borderRadius: 10, textAlign: "center", background: "#F7FBFF" }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: "#4C8FE8" }}>{value ?? "—"}</div>
                    <div style={{ marginTop: 2, fontSize: 10, color: "#8C6B9E" }}>{label.toUpperCase()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 16, padding: 16, borderRadius: 16, background: "rgba(255,255,255,0.82)", border: "1px solid #F0D5DB" }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: "#318C79" }}>🟢 ONLINE NOW</div>
            <div style={{ marginTop: 4, fontSize: 10.5, color: "#8C6B9E" }}>Active in the last 5 minutes.</div>
            <div style={{ marginTop: 10, padding: "14px 8px", borderRadius: 12, textAlign: "center", background: "#F1FFF9" }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: "#318C79" }}>{adminOnline}</div>
              <div style={{ marginTop: 2, fontSize: 10.5, color: "#8C6B9E" }}>{adminOnline === 1 ? "PERSON ONLINE" : "PEOPLE ONLINE"}</div>
            </div>
          </div>

          {adminFunnel && (
            <div style={{ marginBottom: 16, padding: 16, borderRadius: 16, background: "rgba(255,255,255,0.82)", border: "1px solid #F0D5DB" }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: "#4C8FE8" }}>🚦 ONBOARDING</div>
              <div style={{ marginTop: 4, fontSize: 11, color: "#8C6B9E", lineHeight: 1.5 }}>This shows how many people make it through setup and exactly where people stop. Someone only counts as dropped after they have been gone for at least 24 hours.</div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8, marginTop: 11 }}>
                {[
                  ["Started", funnelStarted, "Opened onboarding", "#4C8FE8", "#F2F7FF"],
                  ["Finished", funnelCompleted, `${funnelCompletionPct}% completion rate`, "#318C79", "#F1FFF9"],
                  ["Dropped", Number(adminFunnel.abandoned || 0), "Gone 24h+ without finishing", "#B06A7A", "#FFF5F7"],
                  ["Came back", Number(adminFunnel.returned_later || 0), "Left, then returned later", "#8E4EAA", "#FCF7FE"],
                ].map(([label, value, note, color, background]) => (
                  <div key={label} style={{ padding: "10px 11px", borderRadius: 12, background, border: `1px solid ${color}2A` }}>
                    <div style={{ fontSize: 19, lineHeight: 1, fontWeight: 900, color }}>{value}</div>
                    <div style={{ marginTop: 5, fontSize: 10.8, fontWeight: 900, color: "#5B4B6B" }}>{label}</div>
                    <div style={{ marginTop: 2, fontSize: 9.5, lineHeight: 1.35, color: "#8C6B9E" }}>{note}</div>
                  </div>
                ))}
              </div>

              {Number(adminFunnel.recent_unfinished || 0) > 0 && (
                <div style={{ marginTop: 8, padding: "8px 10px", borderRadius: 10, background: "#FFF9E9", border: "1px solid #F0D99E", color: "#7A653C", fontSize: 10.5, lineHeight: 1.4 }}>
                  ⏳ <b>{adminFunnel.recent_unfinished}</b> {Number(adminFunnel.recent_unfinished) === 1 ? "person is" : "people are"} still in the first 24 hours, so {Number(adminFunnel.recent_unfinished) === 1 ? "they are" : "they are"} not counted as dropped yet.
                </div>
              )}

              {funnelBiggestDropoff && (
                <div style={{ marginTop: 8, padding: "9px 10px", borderRadius: 11, background: "#FFF5F7", border: "1px solid #F1D1D9", color: "#76505B", fontSize: 10.8, lineHeight: 1.4 }}>
                  <b>Biggest drop-off:</b> {funnelBiggestDropoff.label} — {funnelBiggestDropoff.count} {funnelBiggestDropoff.count === 1 ? "person stopped" : "people stopped"} here.
                </div>
              )}

              <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
                <div style={{ fontSize: 11.5, fontWeight: 900, color: "#5B4B6B" }}>Overall setup path</div>
                <div style={{ fontSize: 10, color: "#8C6B9E" }}>{funnelCompleted} of {funnelStarted} finished</div>
              </div>
              <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
                {(adminFunnel.by_step || []).map((row) => {
                  const pct = funnelStarted ? Math.round((Number(row.reached || 0) / funnelStarted) * 100) : 0;
                  const abandonedHere = Number(row.abandoned_here || 0);
                  const recentHere = Number(row.recent_here || 0);
                  const stageName = OVERALL_ONBOARDING_STAGES[Math.max(0, Number(row.step || 1) - 1)] || `Step ${row.step}`;
                  return (
                    <div key={row.step} style={{ padding: "7px 0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 11, color: "#6B5A7D", marginBottom: 4, gap: 10 }}>
                        <span style={{ minWidth: 0 }}><span style={{ display: "inline-block", minWidth: 42, fontSize: 9.5, fontWeight: 900, color: "#9A86A7" }}>STEP {row.step}</span><b>{stageName}</b></span>
                        <span style={{ flexShrink: 0, fontWeight: 800 }}>{row.reached} reached</span>
                      </div>
                      <div style={{ height: 9, borderRadius: 6, background: "#EAF4FF", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${Math.max(0, Math.min(100, pct))}%`, background: "#4C8FE8", borderRadius: 6 }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 4, fontSize: 9.8 }}>
                        <span style={{ color: "#8C6B9E" }}>{pct}% of starters made it here</span>
                        <span style={{ textAlign: "right", color: abandonedHere > 0 ? "#B06A7A" : recentHere > 0 ? "#A37A27" : "#7B9B8F", fontWeight: abandonedHere > 0 || recentHere > 0 ? 800 : 600 }}>
                          {abandonedHere > 0 ? `${abandonedHere} dropped here` : recentHere > 0 ? `${recentHere} still here (<24h)` : "0 confirmed drop-offs"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 12, padding: "10px 11px", borderRadius: 12, background: "#F7FBFF", border: "1px solid #DCEEFF" }}>
                <div style={{ fontSize: 10.2, fontWeight: 900, color: "#5B4B6B" }}>How to read this</div>
                <div style={{ marginTop: 4, fontSize: 9.8, color: "#7C6B88", lineHeight: 1.55 }}><b>Reached</b> = opened that step · <b>Dropped</b> = did not finish or return within 24h · <b>Came back</b> = left and returned later · <b>Recent</b> = still inside the 24-hour window.</div>
              </div>

              <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #E6D4F2" }}>
                <div style={{ fontSize: 11.5, fontWeight: 900, color: "#5B4B6B" }}>Compare setup choices</div>
                <div style={{ marginTop: 3, fontSize: 10, color: "#8C6B9E" }}>Completion and drop-off for people choosing their own Cozy space versus setting up with a Guardian.</div>
                <div style={{ display: "grid", gap: 10, marginTop: 9 }}>
                  {(adminFunnel.by_mode || []).filter((mode) => Number(mode.started || 0) > 0).map((mode) => {
                    const modeStarted = Number(mode.started || 0);
                    const modeCompleted = Number(mode.completed || 0);
                    const modePct = modeStarted ? Math.round((modeCompleted / modeStarted) * 100) : 0;
                    const guardian = mode.mode === "guardian";
                    const labels = guardian ? GUARDIAN_ONBOARDING_STAGES : COZY_ONBOARDING_STAGES;
                    const modeBiggestDropoff = biggestDropoff(mode.by_step || [], labels);
                    return (
                      <div key={mode.mode} style={{ padding: "11px 12px", borderRadius: 13, background: guardian ? "#F4FAFF" : "#FCF7FE", border: guardian ? "1px solid #D9ECFA" : "1px solid #E8D8EF" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
                          <b style={{ fontSize: 11.5, color: guardian ? "#4C8FE8" : "#8E4EAA" }}>{guardian ? "💛 Guardian setup" : "🧸 Cozy setup"}</b>
                          <span style={{ fontSize: 11, fontWeight: 900, color: "#5B4B6B" }}>{modeCompleted} of {modeStarted} finished · {modePct}%</span>
                        </div>
                        <div style={{ marginTop: 4, fontSize: 9.8, color: "#8C6B9E", lineHeight: 1.4 }}>{mode.abandoned || 0} dropped · {mode.returned_later || 0} came back later{Number(mode.recent_unfinished || 0) ? ` · ${mode.recent_unfinished} still recent` : ""}</div>
                        {modeBiggestDropoff && <div style={{ marginTop: 5, fontSize: 9.8, color: "#B06A7A", fontWeight: 800 }}>Biggest drop-off: {modeBiggestDropoff.label} ({modeBiggestDropoff.count})</div>}
                        <div style={{ display: "grid", gap: 6, marginTop: 9 }}>
                          {(mode.by_step || []).filter((row) => Number(row.reached || 0) > 0 || Number(row.abandoned_here || 0) > 0 || Number(row.recent_here || 0) > 0).map((row) => {
                            const dropped = Number(row.abandoned_here || 0);
                            const recent = Number(row.recent_here || 0);
                            return (
                              <div key={row.step} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 8, alignItems: "baseline", fontSize: 10.2, color: "#6B5A7D" }}>
                                <span>{labels[Math.max(0, Number(row.step || 1) - 1)] || `Step ${row.step}`}</span>
                                <span style={{ textAlign: "right" }}><b>{row.reached}</b> reached{dropped ? ` · ${dropped} dropped` : recent ? ` · ${recent} recent` : ""}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {SUPPORTER_FEATURES_ENABLED && <div style={{ marginBottom: 16, padding: 16, borderRadius: 16, background: "rgba(255,255,255,0.82)", border: "1px solid #F0D5DB" }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: "#C9954A" }}>🌟 SUPPORTER STATUS {!SUPPORTER_FEATURES_ENABLED && <span style={{ fontWeight: 700, color: "#8C6B9E" }}>(gate is currently OFF for everyone)</span>}</div>
            <div style={{ marginTop: 4, fontSize: 10.5, color: "#8C6B9E" }}>Manually grant or revoke Supporter status for an account — for comping testers or recording a payment before real billing exists.</div>
            <div style={{ display: "flex", gap: 7, marginTop: 8, flexWrap: "wrap" }}>
              <input type="email" value={supporterEmailDraft} onChange={(event) => setSupporterEmailDraft(event.target.value)} placeholder="person@example.com" style={{ flex: "1 1 190px", minWidth: 0, padding: "8px 10px", borderRadius: 9, border: "1px solid #E8D4B6" }} />
              <button type="button" onClick={() => setSupporterStatus(true)} style={{ padding: "8px 12px", borderRadius: 9, border: 0, background: "#C9954A", color: "white", fontWeight: 900, cursor: "pointer" }}>Grant</button>
              <button type="button" onClick={() => setSupporterStatus(false)} style={{ padding: "8px 12px", borderRadius: 9, border: "1px solid #E8D4B6", background: "white", color: "#C9954A", fontWeight: 800, cursor: "pointer" }}>Revoke</button>
            </div>
            {supporterGrantMessage && <div style={{ marginTop: 6, fontSize: 11.5, color: "#8C6B9E" }}>{supporterGrantMessage}</div>}
          </div>}

          <div style={{ marginBottom: 16, padding: 16, borderRadius: 16, background: "rgba(255,255,255,0.82)", border: "1px solid #F0D5DB" }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: "#5F8CC4" }}>🤖 GOOGLE PLAY REVIEW ACCOUNT</div>
            <div style={{ marginTop: 4, fontSize: 10.5, color: "#8C6B9E" }}>Create or update a Cozy/Guardian review account for Play Console. Passwords are sent straight to a secure Edge Function and never stored anywhere in this codebase.</div>
            <div style={{ display: "flex", gap: 7, marginTop: 8, flexWrap: "wrap" }}>
              <select value={reviewAccountRole} onChange={(event) => setReviewAccountRole(event.target.value)} style={{ padding: "8px 10px", borderRadius: 9, border: "1px solid #E8D4B6" }}>
                <option value="cozy">Cozy reviewer</option>
                <option value="guardian">Guardian reviewer</option>
              </select>
              <input type="email" value={reviewAccountEmail} onChange={(event) => setReviewAccountEmail(event.target.value)} placeholder="googleplay-cozy@yourdomain.com" aria-label="Review account email" style={{ flex: "1 1 190px", minWidth: 0, padding: "8px 10px", borderRadius: 9, border: "1px solid #E8D4B6" }} />
              <input type="password" value={reviewAccountPassword} onChange={(event) => setReviewAccountPassword(event.target.value)} placeholder="password (min 8 chars)" aria-label="Review account password" style={{ flex: "1 1 190px", minWidth: 0, padding: "8px 10px", borderRadius: 9, border: "1px solid #E8D4B6" }} />
              <button type="button" onClick={createOrUpdateReviewAccount} style={{ padding: "8px 12px", borderRadius: 9, border: 0, background: "#5F8CC4", color: "white", fontWeight: 900, cursor: "pointer" }}>Save</button>
            </div>
            {reviewAccountMessage && <div style={{ marginTop: 6, fontSize: 11.5, color: "#8C6B9E" }}>{reviewAccountMessage}</div>}
          </div>

          <div style={{ marginBottom: 16, padding: 16, borderRadius: 16, background: "rgba(255,255,255,0.82)", border: "1px solid #F0D5DB" }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: "#C45D74" }}>💌 FEEDBACK INBOX ({adminFeedback.length})</div>
            {adminFeedback.length === 0 ? (
              <div style={{ marginTop: 8, fontSize: 12, color: "#8C6B9E" }}>No feedback waiting. 🎉</div>
            ) : (
              <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                {adminFeedback.map((item) => (
                  <div key={item.id} style={{ padding: "10px 12px", borderRadius: 11, background: "#FFF9FD", border: "1px solid #EADDE2" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 10.5, color: "#8C6B9E" }}>
                      <span>{item.email || "unknown"}</span>
                      <span>{new Date(item.created_at).toLocaleString()}</span>
                    </div>
                    <div style={{ marginTop: 5, fontSize: 13, color: "#5B4B6B", whiteSpace: "pre-wrap" }}>{item.message}</div>
                    <button type="button" onClick={() => resolveFeedback(item)} style={{ marginTop: 7, padding: "4px 9px", borderRadius: 8, border: "1px solid #D7C3E2", background: "white", color: "#8D5CA5", fontWeight: 800, fontSize: 11, cursor: "pointer" }}>✓ Resolved</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 16, padding: 16, borderRadius: 16, background: "rgba(255,255,255,0.82)", border: "1px solid #F0D5DB" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: "#C45D74" }}>⚠️ ERROR LOGS (last 100)</div>
              {adminErrors.length > 0 && <button type="button" onClick={clearAllErrors} style={{ padding: "5px 9px", borderRadius: 8, border: "1px solid #F0B8C4", background: "#FFF7F9", color: "#C45D74", fontWeight: 800, fontSize: 11, cursor: "pointer" }}>🗑️ Clear all errors</button>}
            </div>
            {adminErrors.length === 0 ? (
              <div style={{ marginTop: 8, fontSize: 12, color: "#8C6B9E" }}>No errors logged. 🎉</div>
            ) : (
              <div style={{ display: "grid", gap: 8, marginTop: 10, maxHeight: 400, overflowY: "auto" }}>
                {adminErrors.map((item) => (
                  <div key={item.id} style={{ padding: "10px 12px", borderRadius: 11, background: "#FFF9FD", border: "1px solid #EADDE2" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 10.5, color: "#8C6B9E" }}>
                      <span>{item.user_id ? item.user_id.slice(0, 8) : "anonymous"}</span>
                      <span>{new Date(item.created_at).toLocaleString()}</span>
                    </div>
                    <div style={{ marginTop: 5, fontSize: 13, fontWeight: 800, color: "#C45D74" }}>{item.message}</div>
                    {item.url && <div style={{ marginTop: 2, fontSize: 10.5, color: "#8C6B9E", overflowWrap: "anywhere" }}>{item.url}</div>}
                    {item.stack && <details style={{ marginTop: 5 }}><summary style={{ fontSize: 10.5, color: "#8D5CA5", cursor: "pointer" }}>Stack trace</summary><pre style={{ marginTop: 5, fontSize: 10, whiteSpace: "pre-wrap", color: "#6B5A7D", overflowWrap: "anywhere" }}>{item.stack}</pre></details>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 16, padding: 16, borderRadius: 16, background: "rgba(255,255,255,0.82)", border: "1px solid #F0D5DB" }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: "#8D5CA5" }}>🔮 PLUSHPLUS PREVIEW (dev only)</div>
            <div style={{ marginTop: 4, fontSize: 10.5, color: "#8C6B9E" }}>
              Simulates a future plan for this admin session only — nothing here touches your account, anyone else's account, or real billing.
              Every real user gets full access regardless of this toggle.
            </div>
            <div style={{ marginTop: 10, padding: "8px 10px", borderRadius: 9, background: "#F7ECFB", border: "1px solid #E3C9EC", fontSize: 11.5, fontWeight: 800, color: "#7A3D93" }}>
              Currently previewing: {devPreviewPlan ? { [window.PlushLifeEntitlements.PLUSH_PLANS.FREE]: "Free", [window.PlushLifeEntitlements.PLUSH_PLANS.PLUSHPLUS]: "PlushPlus", [window.PlushLifeEntitlements.PLUSH_PLANS.PLUSHFAMILY]: "PlushFamily" }[devPreviewPlan] : "Full access (real state)"}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
              {[
                { key: null, label: "Full access (real state)" },
                { key: window.PlushLifeEntitlements.PLUSH_PLANS.FREE, label: "Preview: Free" },
                { key: window.PlushLifeEntitlements.PLUSH_PLANS.PLUSHPLUS, label: "Preview: PlushPlus" },
                { key: window.PlushLifeEntitlements.PLUSH_PLANS.PLUSHFAMILY, label: "Preview: PlushFamily" },
              ].map((option) => (
                <button
                  key={String(option.key)}
                  type="button"
                  onClick={() => setDevPreviewPlan(option.key)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 8,
                    border: devPreviewPlan === option.key ? "1px solid #8D5CA5" : "1px solid #E4D3EA",
                    background: devPreviewPlan === option.key ? "#8D5CA5" : "#FBF7FD",
                    color: devPreviewPlan === option.key ? "#fff" : "#8D5CA5",
                    fontWeight: 800,
                    fontSize: 11,
                    cursor: "pointer",
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <details style={{ marginTop: 12 }}>
              <summary style={{ cursor: "pointer", fontSize: 11, fontWeight: 800, color: "#8D5CA5" }}>Feature flags ({window.PlushLifeEntitlements.PLUSH_FEATURE_FLAGS.length})</summary>
              <div style={{ display: "grid", gap: 4, marginTop: 8 }}>
                {window.PlushLifeEntitlements.PLUSH_FEATURE_FLAGS.map((flag) => {
                  const wouldHaveAccess = window.PlushLifeEntitlements.hasPlushFeature(flag, {
                    enforced: true,
                    plan: window.PlushLifeEntitlements.PLUSH_PLANS.FREE,
                    devPreviewPlan,
                  });
                  const humanized = flag.replace(/^plush/, "").replace(/([A-Z])/g, " $1").trim();
                  return (
                    <div key={flag} style={{ display: "flex", justifyContent: "space-between", padding: "5px 8px", borderRadius: 7, background: "#FBF7FD", fontSize: 11 }}>
                      <span style={{ color: "#6B5A7D" }} title={flag}>{humanized}</span>
                      <span style={{ fontWeight: 800, color: wouldHaveAccess ? "#318C79" : "#B0576B" }}>{wouldHaveAccess ? "included" : "not included"}</span>
                    </div>
                  );
                })}
              </div>
            </details>
          </div>
          </ToolPanel>
  );
}
