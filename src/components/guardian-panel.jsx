import { CozySharing, SharedCozyCard } from "./cozy-space.jsx";
const LazyTogetherCorner = React.lazy(() => import("./together-corner.jsx").then((module) => ({ default: module.TogetherCorner })));
// The inline Guardian/support ToolPanel — module split phase 7,
// eighth slice, last of the "big four" (see docs/module-split-plan.md).
// Covers both roles of the Guardian relationship: managing Guardians
// who support you, and viewing/supporting someone you're a Guardian
// for (progress, notes, rewards, task suggestions, permissions, care
// agreements). DAYS/COMFORT_TOOLS read from window.PlushLifeContent,
// formatRelativeTime from window.PlushLifeHelpers, daysBetweenDates
// from window.PlushLifeSchedule — all inside this file, same as
// app-source.jsx itself. GUARDIAN_ROLE_PRESETS is passed as a prop
// since it's a plain literal defined in app-source.jsx, not exported
// as a window global.
import { ToolPanel } from "./shared.jsx";
import { CozyScene } from "./theme-world.jsx";

export function GuardianPanel({ client, open, onClose, isGuardianAccount, hasOwnGuardian, supportViewMode, setSupportViewMode, isSupportAdult, selectedSupportName, guardianSupportRequests, supportOwnerId, updateGuardianSupportRequest, pendingSupportInvites, supportPeople, acceptSupportInvitation, declineSupportInvitation, canUseCaretakerDashboard, invitedSupportLinks, loadSupportOwner, loadSupportData, user, supportAchievements, period, ownerIsRestingToday, restDatesSet, todayRequiredDone, supportProgress, activeSupportLink, canViewSupportProgress, canViewSupportTasks, canViewSupportSchedule, canViewSupportMood, supportTrackerTasks = [], supportSchedules = [], supportScheduleExceptions = [], supportMoodSummary, supportProgressView, setSupportProgressView, supportTodayDayLabel, displayedSupportPercent, displayedSupportCompleted, displayedSupportPossible, supportDailyEssentialCompleted, supportDailyEssentialKeys, supportScheduledTodayCompleted, supportScheduledTodayKeys, canSendSupportNotes, newNote, setNewNote, addSupportNote, suggestComfortTool, canAddSupportRewards, rewardTitle, setRewardTitle, rewardDetails, setRewardDetails, rewardTarget, setRewardTarget, rewardTargetPeriod, setRewardTargetPeriod, rewardApprovalRequired, setRewardApprovalRequired, addSupportReward, suggestedTask, setSuggestedTask, suggestedTaskDay, setSuggestedTaskDay, submitTaskSuggestion, inviteEmail, setInviteEmail, inviteSupportAdult, GUARDIAN_ROLE_PRESETS, guardianRolePreset, setGuardianRolePreset, ownedSupportLinks, supportRelationships, setSupportAdultActive, removeSupportAdult, updateCaretakerPermission, updateCareAgreement, supportRequestGuardian, setSupportRequestGuardian, supportRequestType, setSupportRequestType, supportRequestText, setSupportRequestText, sendGuardianSupportRequest, taskSuggestions, suggestionSectionsById, setSuggestionSectionsById, taskSectionsForDay, decideTaskSuggestion, supportMessage, supportRewards, supportWeeklyPercent, supportPercent, updateRewardStatus, supportNotes, setComfortToolOpen, deleteSupportNote, onOpenSettings }) {
  const [checkInDelay, setCheckInDelay] = React.useState("0");
  const [guardianArea, setGuardianArea] = React.useState("overview");
  const [supportAction, setSupportAction] = React.useState("note");
  if (!open) return null;
  const { DAYS, COMFORT_TOOLS } = window.PlushLifeContent;
  const { formatRelativeTime } = window.PlushLifeHelpers;
  const { daysBetweenDates, dayIdForDate, legacyScheduleToEntries, formatTime12 } = window.PlushLifeSchedule;

  // Pending invitations have no expiry in the schema; derive a gentle age
  // from created_at so users know how long an invite has been waiting.
  const formatInviteAge = (iso) => {
    if (!iso) return "recently";
    const diffMs = Date.now() - new Date(iso).getTime();
    if (!Number.isFinite(diffMs) || diffMs < 0) return "recently";
    const days = Math.floor(diffMs / 86400000);
    if (days <= 0) {
      const hours = Math.floor(diffMs / 3600000);
      return hours <= 0 ? "just now" : `${hours} hour${hours === 1 ? "" : "s"} ago`;
    }
    return days === 1 ? "yesterday" : `${days} days ago`;
  };
  const sharedTaskKeys = new Set([...(supportDailyEssentialKeys || []), ...(supportScheduledTodayKeys || [])]);
  const sharedTodayTasks = (supportTrackerTasks || []).filter((task) => sharedTaskKeys.has(task.task_key));
  const supportDayId = dayIdForDate?.(period.date);
  const sharedSchedule = (supportSchedules || []).find((item) => item.day_id === supportDayId) || null;
  const sharedScheduleEntries = [
    ...(sharedSchedule?.entries?.length ? sharedSchedule.entries : (legacyScheduleToEntries?.(sharedSchedule) || [])),
    ...(supportScheduleExceptions || []).flatMap((item) => (item.entries || []).map((entry) => ({ ...entry, isException: true }))),
  ].sort((a, b) => String(a.time || "99:99").localeCompare(String(b.time || "99:99")));
  return (
          <ToolPanel inline title="💛 PlushSupport" displayTitle="Guardians" onClose={onClose}>
          <div className="pl-guardian-content">
          <CozyScene title="Cozy & Guardian" subtitle="You’re the Cozy — this is your space. A Guardian is a partner, parent, friend, caregiver, or other trusted person you choose. Do things together and support each other; you control what gets shared." />
          {canUseCaretakerDashboard && (
            <div className="pl-guardian-person-switcher" role="group" aria-label="Guardian views">
              <button type="button" aria-pressed={supportViewMode === "mine"} onClick={() => setSupportViewMode("mine")}>🧸 My Support</button>
              <button type="button" aria-pressed={supportViewMode === "caretaker"} onClick={() => { setSupportViewMode("caretaker"); if (invitedSupportLinks[0]) loadSupportOwner(invitedSupportLinks[0].owner_user_id); }}>💛 People I Support</button>
            </div>
          )}
          <div className="pl-guardian-switcher" role="group" aria-label="Guardian sections">
            {[["overview","💛",supportViewMode === "mine" ? "My Guardian" : "My Cozy"],["together","🤝","Together"],["support","💌",supportViewMode === "mine" ? "Sharing & privacy" : "Support"]].map(([id,icon,label]) => (
              <button key={id} type="button" aria-pressed={guardianArea === id} onClick={() => setGuardianArea(id)}>
                <span aria-hidden="true">{icon}</span><span>{label}</span>
              </button>
            ))}
          </div>
          <p className="pl-guardian-intro" aria-live="polite">{guardianArea === "together" ? "Spend a little time together, at your pace." : guardianArea === "support" ? (supportViewMode === "mine" ? "Manage invitations, sharing permissions, and requests for support." : "Offer encouragement and practical help within the sharing they chose.") : (supportViewMode === "mine" ? "Your Cozy card and the people you choose to share it with." : "The Cozy card they have chosen to share with you.")}</p>
          {guardianArea === "overview" && (supportViewMode === "mine" ? <CozySharing links={ownedSupportLinks} /> : <SharedCozyCard client={client} ownerId={supportOwnerId} userId={user?.id} />)}
          {guardianArea === "overview" && supportViewMode === "mine" && <section style={{padding:16,borderRadius:16,background:"var(--pl-theme-surface)",border:"1px solid var(--pl-theme-line)"}}>
            <h2 style={{margin:0,fontSize:16,color:"var(--pl-theme-ink)"}}>Your Guardians</h2><p style={{margin:"5px 0 0",fontSize:13,lineHeight:1.45,color:"var(--pl-theme-muted)"}}>Trusted people you choose to support you. Sharing stays off until you allow it.</p>
            {ownedSupportLinks.length ? <ul style={{paddingLeft:20,color:"var(--pl-theme-ink)",overflowWrap:"anywhere"}}>{ownedSupportLinks.map(link=><li key={link.id}>{link.caregiver_email} · {!link.accepted_at ? "Invitation pending" : link.active ? "Active" : "Paused"}</li>)}</ul> : <p style={{color:"var(--pl-theme-muted)"}}>Choose someone you trust when you’re ready.</p>}
            <button type="button" onClick={()=>setGuardianArea("support")} style={{minHeight:44,padding:"8px 12px",borderRadius:12,border:"1px solid var(--pl-theme-line)",background:"var(--pl-theme-surface-2)",color:"var(--pl-theme-ink)",fontWeight:800}}>Manage sharing & invitations</button>
          </section>}
          {guardianArea === "together" && <React.Suspense fallback={<div role="status" style={{padding:14,color:"var(--pl-theme-muted)"}}>Opening Together…</div>}><LazyTogetherCorner
            client={client}
            user={user}
            supportOwnerId={supportOwnerId}
            isSupportAdult={isSupportAdult}
            canSendSupportNotes={canSendSupportNotes}
            activeSupportLink={activeSupportLink}
            ownedSupportLinks={ownedSupportLinks}
            selectedSupportName={selectedSupportName}
            supportNotes={supportNotes}
            loadSupportData={loadSupportData}
            loadSupportOwner={loadSupportOwner}
          /></React.Suspense>}
          {guardianArea === "support" && <div className="pl-guardian-support-card" style={{ marginBottom: 18, padding: 18, borderRadius: 20, background: "var(--pl-theme-surface)", border: "1px solid var(--pl-theme-line,#E9DDF6)", boxShadow: "0 8px 24px rgba(92,57,108,0.07)" }}>
            {supportViewMode === "caretaker" && guardianSupportRequests.filter((request) => request.owner_user_id === supportOwnerId && request.status !== "resolved" && request.status !== "cancelled").length > 0 && (
              <div style={{ marginBottom: 14, padding: 13, borderRadius: 13, background: "var(--pl-theme-surface,#FFF9FD)", border: "1px solid var(--pl-theme-line,#E9DDF6)" }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: "var(--pl-theme-muted,#A65DC1)" }}>♥ SUPPORT REQUESTS</div>
                {guardianSupportRequests.filter((request) => request.owner_user_id === supportOwnerId && request.status !== "resolved" && request.status !== "cancelled").map((request) => (
                  <div key={request.id} style={{ marginTop: 8, padding: 10, borderRadius: 11, background: "var(--pl-theme-surface)", border: "1px solid var(--pl-theme-line,#E9DDF6)" }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: "var(--pl-theme-ink,#5B4B6B)" }}>{request.request_type.replace(/_/g, " ")}</div>
                    {request.message && <div style={{ marginTop: 4, color: "var(--pl-theme-ink,#6B5A7D)", fontSize: 14, lineHeight: 1.45 }}>{request.message}</div>}
                    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                      {request.status === "open" && <button type="button" onClick={() => updateGuardianSupportRequest(request.id, "acknowledged")} style={{ padding: "6px 9px", borderRadius: 8, border: 0, background: "var(--pl-theme-accent,#4C8FE8)", color: "var(--pl-theme-on-accent,#FFFFFF)", fontWeight: 900, fontSize: 14, cursor: "pointer" }}>I saw this</button>}
                      <button type="button" onClick={() => updateGuardianSupportRequest(request.id, "resolved")} style={{ padding: "6px 9px", borderRadius: 8, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: "var(--pl-theme-surface)", color: "var(--pl-theme-ink,#318C79)", fontWeight: 900, fontSize: 14, cursor: "pointer" }}>Mark resolved</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {pendingSupportInvites.length > 0 && (
              <div style={{ marginBottom: 14, display: "grid", gap: 8 }}>
                {pendingSupportInvites.map((invite) => {
                  const inviter = supportPeople.find((person) => person.user_id === invite.owner_user_id);
                  return (
                    <div key={invite.id} style={{ padding: 12, borderRadius: 13, background: "var(--pl-theme-surface-2,#FFF9E9)", border: "1px solid var(--pl-theme-line,#E9DDF6)" }}>
                      <div style={{ fontSize: 14, letterSpacing: "0.1em", fontWeight: 900, color: "var(--pl-theme-ink,#A56D14)" }}>💌 GUARDIAN INVITATION</div>
                      <div style={{ marginTop: 4, fontSize: 14, lineHeight: 1.45, color: "var(--pl-theme-ink,#5B4B6B)" }}>
                        {inviter?.display_name || "Someone"} invited you to be their Guardian. Nothing is shared until you accept.
                      </div>
                      <div style={{ display: "flex", gap: 7, marginTop: 9 }}>
                        <button type="button" onClick={() => acceptSupportInvitation(invite.id)} style={{ padding: "7px 12px", borderRadius: 9, border: 0, background: "var(--pl-theme-accent,#318C79)", color: "var(--pl-theme-on-accent,#FFFFFF)", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>Accept</button>
                        <button type="button" onClick={() => declineSupportInvitation(invite.id)} style={{ padding: "7px 12px", borderRadius: 9, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: "var(--pl-theme-surface)", color: "var(--pl-theme-ink,#A56D14)", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>Decline</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div>
                <div style={{ fontSize: 14, letterSpacing: "0.14em", color: "var(--pl-theme-muted,#4C8FE8)", fontWeight: 800 }}>{isSupportAdult ? "💛 YOUR SUPPORT SPACE" : "🧸 MY GUARDIANS"}</div>
                <div style={{ marginTop: 4, fontSize: 18, fontWeight: 900 }}>{isSupportAdult ? `Supporting ${selectedSupportName}` : "My trusted guardians"}</div>
              </div>
              <button onClick={() => loadSupportData(user)} style={{ padding: "7px 9px", borderRadius: 9, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: "var(--pl-theme-surface,#F5FAFF)", color: "var(--pl-theme-muted,#4C8FE8)", fontWeight: 800, cursor: "pointer" }}>↻ Refresh</button>
            </div>

            {isSupportAdult && <details style={{ marginTop: 12, border: "1px solid var(--pl-theme-line,#E9DDF6)", borderRadius: 12, background: "var(--pl-theme-surface,#FFF9FD)", overflow: "hidden" }}>
              <summary style={{ minHeight: 44, padding: "0 11px", display: "list-item", alignContent: "center", cursor: "pointer", fontSize: 14, fontWeight: 900, color: "var(--pl-theme-muted,#8D5CA5)" }}>What {selectedSupportName} shared with you</summary>
              <div style={{ padding: "0 11px 11px", display: "grid", gap: 8 }}>
                <div style={{ fontSize: 13, lineHeight: 1.45, color: "var(--pl-theme-muted,#806B8D)" }}>Only categories the Cozy chose to share appear here.</div>
              {canViewSupportTasks ? <div style={{ padding: 11, borderRadius: 12, background: "var(--pl-theme-surface,#F7FBFF)", border: "1px solid var(--pl-theme-line,#E9DDF6)" }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: "var(--pl-theme-muted,#4C8FE8)" }}>✓ TODAY'S SHARED TASKS</div>
                {sharedTodayTasks.length ? <div style={{ display: "grid", gap: 5, marginTop: 7 }}>{sharedTodayTasks.slice(0, 8).map((task) => <div key={task.task_key} style={{ padding: "7px 8px", borderRadius: 8, background: "var(--pl-theme-surface)", color: "var(--pl-theme-ink,#5B4B6B)", fontSize: 14, fontWeight: 750 }}>{task.task}</div>)}</div> : <div style={{ marginTop: 6, fontSize: 14, color: "var(--pl-theme-muted,#71839A)" }}>No shared tasks are scheduled for today.</div>}
              </div> : null}
              {canViewSupportSchedule ? <div style={{ padding: 11, borderRadius: 12, background: "var(--pl-theme-surface,#F7FBFF)", border: "1px solid var(--pl-theme-line,#E9DDF6)" }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: "var(--pl-theme-muted,#4C8FE8)" }}>🗓 SHARED SCHEDULE</div>
                {sharedScheduleEntries.length ? <div style={{ display: "grid", gap: 5, marginTop: 7 }}>{sharedScheduleEntries.slice(0, 8).map((entry, index) => <div key={(entry.time || "any") + index} style={{ display: "grid", gridTemplateColumns: entry.time ? "62px 1fr" : "1fr", gap: 6, padding: "7px 8px", borderRadius: 8, background: entry.isException ? "var(--pl-theme-surface-2)" : "var(--pl-theme-surface)", fontSize: 14 }}>
                  {entry.time && <strong style={{ color: "var(--pl-theme-muted,#4C8FE8)" }}>{formatTime12?.(entry.time) || entry.time}</strong>}<span style={{ color: "var(--pl-theme-ink,#5B4B6B)" }}>{entry.text || entry.label || entry.title || "Scheduled item"}</span>
                </div>)}</div> : <div style={{ marginTop: 6, fontSize: 14, color: "var(--pl-theme-muted,#71839A)" }}>No schedule items are shared for today.</div>}
              </div> : null}
              {canViewSupportMood ? <div style={{ padding: 11, borderRadius: 12, background: "var(--pl-theme-surface,#F7FBFF)", border: "1px solid var(--pl-theme-line,#E9DDF6)" }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: "var(--pl-theme-muted,#4C8FE8)" }}>♥ SHARED MOOD SUMMARY</div>
                {supportMoodSummary ? <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.5, color: "var(--pl-theme-ink,#5B4B6B)" }}>{[supportMoodSummary.mood && "Mood: " + supportMoodSummary.mood, supportMoodSummary.energy && "Energy: " + supportMoodSummary.energy, supportMoodSummary.capacity && "Capacity: " + supportMoodSummary.capacity, supportMoodSummary.day_type && "Day: " + supportMoodSummary.day_type, supportMoodSummary.support_preference && "Support: " + supportMoodSummary.support_preference].filter(Boolean).join(" · ")}</div> : <div style={{ marginTop: 6, fontSize: 14, color: "var(--pl-theme-muted,#71839A)" }}>No mood summary shared for today. Private notes are never included.</div>}
              </div> : null}
              </div>
            </details>}

            {isSupportAdult && canViewSupportProgress && supportAchievements?.last_celebrated_date && daysBetweenDates(supportAchievements.last_celebrated_date, period.date) !== null && daysBetweenDates(supportAchievements.last_celebrated_date, period.date) <= 2 && (
              <div style={{ marginTop: 12, padding: "12px 14px", borderRadius: 13, background: "var(--pl-theme-surface-2,#FFF9E9)", border: "1px solid var(--pl-theme-line,#E9DDF6)" }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: "var(--pl-theme-ink,#A56D14)" }}>🎉 {selectedSupportName} just reached a new milestone!</div>
                <div style={{ marginTop: 3, fontSize: 14, color: "var(--pl-theme-ink,#8A6A21)" }}>A little cheer from you could mean a lot right now. 💛</div>
              </div>
            )}

            {isSupportAdult && canViewSupportProgress && ownerIsRestingToday && (
              <div style={{ marginTop: 12, padding: "12px 14px", borderRadius: 13, background: "var(--pl-theme-surface-2,#EAF6F1)", border: "1px solid var(--pl-theme-line,#E9DDF6)" }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: "var(--pl-theme-ink,#268A50)" }}>
                  {restDatesSet.has(period.date) ? `🌴 You're both resting today` : `🌴 ${selectedSupportName} is resting today`}
                </div>
                <div style={{ marginTop: 3, fontSize: 14, color: "var(--pl-theme-ink,#2F6E48)" }}>{restDatesSet.has(period.date) ? "No pressure on either of you today." : "Nothing they do or don't do today needs to worry you — it's a planned rest."}</div>
              </div>
            )}

            {isSupportAdult && canViewSupportProgress && !ownerIsRestingToday && todayRequiredDone > 0 && supportProgress.length > 0 && (
              <div style={{ marginTop: 12, padding: "12px 14px", borderRadius: 13, background: "var(--pl-theme-surface-2,#FFF4E3)", border: "1px solid var(--pl-theme-line,#E9DDF6)" }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: "var(--pl-theme-ink,#A56D14)" }}>🤝 You're both showing up today</div>
                <div style={{ marginTop: 3, fontSize: 14, color: "var(--pl-theme-ink,#8A6A21)" }}>You've taken care of something today too — not a competition, just good company. 💛</div>
              </div>
            )}

            {supportViewMode === "caretaker" && invitedSupportLinks.length > 0 && (
              <label style={{ display: "grid", gap: 5, marginTop: 13, fontSize: 14, fontWeight: 900, color: "var(--pl-theme-muted,#4C8FE8)" }}>
                VIEWING
                <select value={isSupportAdult ? supportOwnerId : invitedSupportLinks[0].owner_user_id} onChange={(event) => loadSupportOwner(event.target.value)} style={{ padding: 9, borderRadius: 10, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: "var(--pl-theme-surface)", color: "var(--pl-theme-ink,#5B4B6B)", fontWeight: 700 }}>
                  {invitedSupportLinks.map((link) => {
                    const person = supportPeople.find((item) => item.user_id === link.owner_user_id);
                    return <option key={link.id} value={link.owner_user_id}>{person?.display_name || link.label || "Their tracker"}</option>;
                  })}
                </select>
              </label>
            )}

            {isSupportAdult ? (
              <div>
                {canViewSupportProgress ? <div style={{ marginTop: 14, padding: 14, borderRadius: 14, background: "var(--pl-theme-surface-2,#F4FAFF)", border: "1px solid var(--pl-theme-line,#E9DDF6)" }}>
                  <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                    {[["daily", "Today"], ["weekly", "This week"]].map(([value, label]) => (
                      <button key={value} type="button" onClick={() => setSupportProgressView(value)} style={{ padding: "6px 10px", borderRadius: 999, border: supportProgressView === value ? "2px solid #4C8FE8" : "1px solid #B9DCF6", background: supportProgressView === value ? "var(--pl-theme-surface-2)" : "var(--pl-theme-surface)", color: "var(--pl-theme-muted,#4C78A8)", fontSize: 14, fontWeight: 900 }}>{label}</button>
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontWeight: 800 }}>{supportProgressView === "weekly" ? "This week's core + scheduled progress" : `Today's essentials + ${supportTodayDayLabel} schedule`}</span>
                    <span style={{ fontSize: 24, fontWeight: 900, color: "var(--pl-theme-muted,#4C8FE8)" }}>{displayedSupportPercent}%</span>
                  </div>
                  <div style={{ height: 10, marginTop: 9, borderRadius: 8, background: "var(--pl-theme-surface-2,#E3F0FA)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${displayedSupportPercent}%`, background: "var(--pl-theme-accent)", transition: "width .3s" }} />
                  </div>
                  <div style={{ marginTop: 6, fontSize: 14, color: "var(--pl-theme-muted,#8C6B9E)" }}>{displayedSupportCompleted}/{displayedSupportPossible} completed · read-only access</div>
                  {supportProgressView === "daily" && <div style={{ marginTop: 5, fontSize: 14, lineHeight: 1.45, color: "var(--pl-theme-muted,#8C6B9E)" }}>Daily essentials: {supportDailyEssentialCompleted}/{supportDailyEssentialKeys.length} · {supportTodayDayLabel} schedule: {supportScheduledTodayCompleted}/{supportScheduledTodayKeys.length} · Bonus groups do not lower this score.</div>}
                </div> : <div style={{ marginTop: 14, padding: 12, borderRadius: 12, background: "var(--pl-theme-surface-2,#F6F3F8)", color: "var(--pl-theme-muted,#75677D)", fontSize: 14 }}>Progress sharing is turned off by {selectedSupportName}.</div>}

                {(canSendSupportNotes || canAddSupportRewards || !!activeSupportLink?.can_suggest_tasks) && (
                  <details style={{ marginTop: 14, borderTop: "1px solid var(--pl-theme-line,#E9DDF6)", paddingTop: 10 }}>
                    <summary style={{ cursor: "pointer", fontSize: 14, fontWeight: 900, color: "var(--pl-theme-muted,#7B6888)" }}>More ways to support</summary>
                    <div style={{ paddingTop: 8 }}>
                      <div className="pl-guardian-action-switcher" role="tablist" aria-label="Support actions">
                        {[
                          ["note","💌","Note",canSendSupportNotes],
                          ["reward","🎁","Reward",canAddSupportRewards],
                          ["task","🌱","Task",!!activeSupportLink?.can_suggest_tasks],
                        ].filter(([, , , enabled]) => enabled).map(([id, icon, label]) => (
                          <button key={id} type="button" aria-pressed={supportAction === id} onClick={() => setSupportAction(id)}>
                            <span aria-hidden="true">{icon}</span><span>{label}</span>
                          </button>
                        ))}
                      </div>
                {supportAction === "note" && canSendSupportNotes && <>
                <div style={{ marginTop: 14, fontSize: 14, fontWeight: 900, color: "var(--pl-theme-muted,#4C8FE8)" }}>SEND AN ENCOURAGING NOTE</div>
                <textarea value={newNote} onChange={(event) => setNewNote(event.target.value)} maxLength={1000} placeholder="How are you doing? I'm proud of your progress…" style={{ width: "100%", boxSizing: "border-box", minHeight: 74, marginTop: 7, padding: 10, borderRadius: 11, border: "1px solid var(--pl-theme-line,#E9DDF6)", color: "var(--pl-theme-ink,#5B4B6B)", resize: "vertical" }} />
                <button onClick={addSupportNote} style={{ marginTop: 7, padding: "8px 12px", borderRadius: 10, border: 0, background: "var(--pl-theme-accent,#4C8FE8)", color: "var(--pl-theme-on-accent,#FFFFFF)", fontWeight: 800, cursor: "pointer" }}>Send note 💛</button>
                <div style={{ marginTop: 12, fontSize: 14, fontWeight: 800, color: "var(--pl-theme-muted,#4C8FE8)" }}>OR SUGGEST A COMFORT TOOL</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginTop: 7 }}>
                  {COMFORT_TOOLS.map((tool) => (
                    <button key={tool.id} type="button" onClick={() => suggestComfortTool(tool.id)} style={{ padding: "8px 4px", borderRadius: 10, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: "var(--pl-theme-surface)", textAlign: "center", cursor: "pointer" }}>
                      <div style={{ fontSize: 16 }}>{tool.icon}</div>
                      <div style={{ marginTop: 2, fontSize: 14, fontWeight: 800, color: "var(--pl-theme-ink,#4C6E8E)" }}>{tool.name}</div>
                    </button>
                  ))}
                </div>
                </>}

                {supportAction === "reward" && canAddSupportRewards && <>
                <div style={{ marginTop: 16, fontSize: 14, fontWeight: 900, color: "var(--pl-theme-muted,#A65DC1)" }}>ADD A REWARD</div>
                <div style={{ display: "grid", gap: 7, marginTop: 7 }}>
                  <input value={rewardTitle} onChange={(event) => setRewardTitle(event.target.value)} maxLength={120} placeholder="Reward, e.g. Favorite dinner" aria-label="Reward title" style={{ padding: 9, borderRadius: 10, border: "1px solid var(--pl-theme-line,#E9DDF6)" }} />
                  <input value={rewardDetails} onChange={(event) => setRewardDetails(event.target.value)} maxLength={500} placeholder="Optional details" aria-label="Reward details" style={{ padding: 9, borderRadius: 10, border: "1px solid var(--pl-theme-line,#E9DDF6)" }} />
                  <label style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 14, color: "var(--pl-theme-muted,#8C6B9E)" }}>
                    Unlock at
                    <input type="number" min="1" max="100" value={rewardTarget} onChange={(event) => setRewardTarget(event.target.value)} style={{ width: 68, padding: 7, borderRadius: 9, border: "1px solid var(--pl-theme-line,#E9DDF6)" }} />
                    %
                    <select value={rewardTargetPeriod} onChange={(event) => setRewardTargetPeriod(event.target.value)} aria-label="Reward progress period" style={{ minWidth: 0, padding: 7, borderRadius: 9, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: "var(--pl-theme-surface)" }}>
                      <option value="daily">Today</option>
                      <option value="weekly">This week</option>
                    </select>
                    progress
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 14, color: "var(--pl-theme-muted,#8C6B9E)" }}><input type="checkbox" checked={rewardApprovalRequired} onChange={(event) => setRewardApprovalRequired(event.target.checked)} /> Guardian approval required before claiming</label>
                </div>
                <button onClick={addSupportReward} style={{ marginTop: 7, padding: "8px 12px", borderRadius: 10, border: 0, background: "var(--pl-theme-accent,#A65DC1)", color: "var(--pl-theme-on-accent,#FFFFFF)", fontWeight: 800, cursor: "pointer" }}>Add reward 🎁</button>
                </>}
                {supportAction === "task" && !!activeSupportLink?.can_suggest_tasks && <>
                  <div style={{ marginTop: 16, fontSize: 14, fontWeight: 900, color: "var(--pl-theme-ink,#318C79)" }}>SUGGEST A TASK</div>
                  <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 7, marginTop: 7 }}>
                    <input value={suggestedTask} onChange={(event) => setSuggestedTask(event.target.value)} maxLength={240} placeholder="A gentle task suggestion" aria-label="Task suggestion" style={{ minWidth: 0, padding: 9, borderRadius: 10, border: "1px solid var(--pl-theme-line,#E9DDF6)" }} />
                    <select value={suggestedTaskDay} onChange={(event) => setSuggestedTaskDay(event.target.value)} style={{ padding: 9, borderRadius: 10, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: "var(--pl-theme-surface)" }}><option value="daily">Daily</option>{DAYS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select>
                  </div>
                  <button onClick={submitTaskSuggestion} style={{ marginTop: 7, padding: "8px 12px", borderRadius: 10, border: 0, background: "var(--pl-theme-accent,#318C79)", color: "var(--pl-theme-on-accent,#FFFFFF)", fontWeight: 800 }}>Send suggestion</button>
                </>}

                    </div>
                  </details>
                )}
              </div>
            ) : (
              <div>
                <p className="pl-guardian-intro">Invite someone you trust. You choose what they see, and can pause access anytime.</p>
                <details open={ownedSupportLinks.length === 0} style={{padding:12,borderRadius:12,border:"1px solid var(--pl-theme-line)",background:"var(--pl-theme-surface-2)"}}>
                  <summary style={{minHeight:44,cursor:"pointer",fontWeight:800,color:"var(--pl-theme-ink)"}}>Invite a Guardian</summary>
                <div className="pl-guardian-invite" style={{ display: "flex", gap: 7, marginTop: 10 }}>
                  <input type="email" aria-label="Guardian email address" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="guardian@example.com" style={{ flex: 1, minWidth: 0, padding: 9, borderRadius: 10, border: "1px solid var(--pl-theme-line,#E9DDF6)" }} />
                  <button onClick={inviteSupportAdult} style={{ padding: "8px 11px", borderRadius: 10, border: 0, background: "var(--pl-theme-accent,#4C8FE8)", color: "var(--pl-theme-on-accent,#FFFFFF)", fontWeight: 800, cursor: "pointer" }}>Invite guardian</button>
                </div>
                <div style={{ marginTop: 9 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "var(--pl-theme-muted,#4C8FE8)" }}>WHAT'S THEIR ROLE?</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(112px, 1fr))", gap: 6, marginTop: 6 }}>
                    {GUARDIAN_ROLE_PRESETS.map((role) => (
                      <button key={role.id} type="button" onClick={() => setGuardianRolePreset(role.id)} aria-pressed={guardianRolePreset === role.id} style={{ padding: "7px 4px", borderRadius: 10, border: guardianRolePreset === role.id ? "2px solid #4C8FE8" : "1px solid #CFE4F5", background: guardianRolePreset === role.id ? "var(--pl-theme-surface-2)" : "var(--pl-theme-surface)", textAlign: "center", cursor: "pointer" }}>
                        <div style={{ fontSize: 14 }}>{role.icon}</div>
                        <div style={{ marginTop: 2, fontSize: 14, fontWeight: 800, color: "var(--pl-theme-ink,#4C6E8E)", lineHeight: 1.2 }}>{role.label}</div>
                      </button>
                    ))}
                  </div>
                  {(() => {
                    const selectedRole = GUARDIAN_ROLE_PRESETS.find((role) => role.id === guardianRolePreset);
                    return selectedRole && <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.4, color: "var(--pl-theme-muted,#6B7E98)" }}>{selectedRole.description}</div>;
                  })()}
                  <div style={{ marginTop: 4, fontSize: 14, color: "var(--pl-theme-muted,#8C6B9E)" }}>You can fine-tune each permission afterward too.</div>
                </div>
                </details>
                <div style={{ marginTop: 12 }}>
                  {ownedSupportLinks.length === 0 ? (
                    <div style={{ padding: "12px 13px", borderRadius: 12, background: "var(--pl-theme-surface,#F5FAFF)", border: "1px solid var(--pl-theme-line,#E9DDF6)", color: "var(--pl-theme-ink,#4C6E8E)" }}>
                      <div style={{ fontSize: 14, fontWeight: 900 }}>No Guardians added yet</div>
                      <div style={{ marginTop: 4, fontSize: 14, lineHeight: 1.5 }}>Invite someone you trust with the email they use for PlushLife. Nothing is shared until they accept, and you choose every permission.</div>
                    </div>
                  ) : ownedSupportLinks.map((link) => {
                    const pending = !link.accepted_at;
                    const mutual = supportRelationships.find((rel) => rel.they_support_me_link_id === link.id && rel.i_support_them);
                    const statusLabel = pending ? "WAITING TO ACCEPT" : link.active ? "ACTIVE" : "PAUSED";
                    const statusColor = "var(--pl-theme-ink)";
                    const statusBg = "var(--pl-theme-surface)";
                    return (
                    <div key={link.id} style={{ padding: "10px", marginTop: 6, borderRadius: 10, background: link.active ? "var(--pl-theme-surface-2)" : "var(--pl-theme-surface-2)", border: "1px solid var(--pl-theme-line)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ fontSize: 14, fontWeight: 700, overflowWrap: "anywhere", minWidth: 0 }}>{link.caregiver_email}</span>
                        <span style={{ padding: "3px 7px", borderRadius: 999, background: statusBg, color: statusColor, fontSize: 14, fontWeight: 900 }}>{statusLabel}</span>
                      </div>
                      {mutual && (
                        <div style={{ marginTop: 6, padding: "7px 9px", borderRadius: 8, background: "var(--pl-theme-surface,#FFF9FD)", border: "1px solid var(--pl-theme-line,#E9DDF6)", fontSize: 14, color: "var(--pl-theme-muted,#8D5CA5)" }}>
                          💛 You're also {mutual.partner_display_name ? `${mutual.partner_display_name}'s` : "their"} Guardian.
                          {mutual.i_support_them_accepted ? (
                            <button type="button" onClick={() => { setSupportViewMode("caretaker"); loadSupportOwner(mutual.partner_user_id); }} style={{ marginLeft: 6, padding: "3px 7px", borderRadius: 7, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: "var(--pl-theme-surface)", color: "var(--pl-theme-muted,#8D5CA5)", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>View</button>
                          ) : (
                            <span style={{ marginLeft: 4, fontStyle: "italic" }}>Waiting on your acceptance of their invite.</span>
                          )}
                        </div>
                      )}
                      {pending && <div style={{ marginTop: 4, fontSize: 14, lineHeight: 1.45, color: "var(--pl-theme-muted,#8C6B9E)" }}>Sent {formatInviteAge(link.created_at)}. You can cancel this invitation and send a fresh one anytime.</div>}
                      {!pending && <div style={{ marginTop: 5, fontSize: 14, fontWeight: 800, color: "var(--pl-theme-ink,#5B3D70)" }}>👀 Last checked in: {formatRelativeTime(link.last_viewed_at)}</div>}
                      {!pending && onOpenSettings && <button type="button" onClick={onOpenSettings} style={{ marginTop: 4, padding: 0, border: 0, background: "transparent", color: "var(--pl-theme-muted,#4C8FE8)", fontSize: 14, fontWeight: 800, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 2 }}>Want quieter alerts? Settings → Notifications → Discreet lock-screen wording</button>}
                      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                        {!pending && <button onClick={() => setSupportAdultActive(link.id, !link.active)} style={{ padding: "6px 9px", borderRadius: 8, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: "var(--pl-theme-surface,#F7FBFF)", color: "var(--pl-theme-muted,#4C8FE8)", fontWeight: 800, cursor: "pointer" }}>{link.active ? "Pause access" : "Resume access"}</button>}
                        <button onClick={() => removeSupportAdult(link.id)} style={{ padding: "6px 9px", borderRadius: 8, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: "var(--pl-theme-surface,#FFF7F9)", color: "var(--pl-theme-muted,#C45D74)", fontWeight: 800, cursor: "pointer" }}>{pending ? "Cancel invitation" : "End relationship"}</button>
                      </div>
                      <div style={{ marginTop: 8, padding: "8px 9px", borderRadius: 9, background: "var(--pl-theme-surface)", border: "1px solid var(--pl-theme-line,#E9DDF6)" }}>
                        <div style={{ fontSize: 14, fontWeight: 900, color: "var(--pl-theme-muted,#4C8FE8)", letterSpacing: ".08em" }}>SHARED ACCESS</div>
                        <div style={{ marginTop: 5, display: "flex", gap: 5, flexWrap: "wrap" }}>
                          {[["can_view_progress","Progress"],["can_view_tasks","Today's tasks"],["can_view_schedule","Schedule"],["can_view_mood","Mood summary"],["can_send_notes","Notes"],["can_add_rewards","Rewards"],["can_suggest_tasks","Task suggestions"],["can_use_together","Do It Together · Plus"]].filter(([key]) => link[key]).map(([key,label]) => <span key={key} style={{ padding: "3px 7px", borderRadius: 999, background: "var(--pl-theme-surface-2,#EEF7FF)", color: "var(--pl-theme-ink,#416D98)", fontSize: 14, fontWeight: 800 }}>{label}</span>)}
                          {![["can_view_progress"],["can_view_tasks"],["can_view_schedule"],["can_view_mood"],["can_send_notes"],["can_add_rewards"],["can_suggest_tasks"],["can_use_together"]].some(([key]) => link[key]) && <span style={{ fontSize: 14, color: "var(--pl-theme-muted,#8C6B9E)" }}>Nothing shared right now.</span>}
                        </div>
                        {!pending && <div style={{ marginTop: 5, fontSize: 14, fontWeight: 800, color: "var(--pl-theme-ink,#5B3D70)" }}>Last Guardian view: {formatRelativeTime(link.last_viewed_at)} · Pause access anytime.</div>}
                      </div>
                      <details className="pl-guardian-permissions">
                        <summary>Sharing & care agreement</summary>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 9, paddingTop: 8, borderTop: "1px solid var(--pl-theme-line,#E9DDF6)" }}>
                        {[
                          ["can_view_progress", "View progress"],
                          ["can_view_tasks", "See today's tasks"],
                          ["can_view_schedule", "See schedule"],
                          ["can_view_mood", "See mood summary"],
                          ["can_send_notes", "Send notes"],
                          ["can_add_rewards", "Add rewards"],
                          ["can_suggest_tasks", "Suggest tasks"],
                          ["can_use_together", "Do It Together · Plus"],
                        ].map(([permission, label]) => (
                          <label key={permission} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 700 }}>
                            <input type="checkbox" checked={!!link[permission]} disabled={!link.active} onChange={(event) => updateCaretakerPermission(link, permission, event.target.checked)} />
                            {label}
                          </label>
                        ))}
                      </div>
                      <label style={{ display: "grid", gap: 5, marginTop: 10, paddingTop: 9, borderTop: "1px solid var(--pl-theme-line,#E9DDF6)", fontSize: 14, fontWeight: 900, color: "var(--pl-theme-muted,#4C8FE8)" }}>
                        CARE AGREEMENT · WHAT HELPS AND WHAT TO AVOID
                        <textarea defaultValue={link.care_agreement || ""} disabled={!link.active} onBlur={(event) => updateCareAgreement(link, event.target.value)} maxLength={1000} placeholder="Example: If I say overwhelmed, send one supportive message and wait. Please offer practical help before advice." style={{ minHeight: 70, padding: 9, borderRadius: 9, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: link.active ? "var(--pl-theme-surface)" : "var(--pl-theme-surface-2)", color: "var(--pl-theme-ink,#5B4B6B)", resize: "vertical" }} />
                        <span style={{ color: "var(--pl-theme-muted,#8C6B9E)", fontWeight: 600 }}>Saved when you leave this field. Only this Guardian relationship uses it.</span>
                      </label>
                      </details>
                    </div>
                    );
                  })}
                </div>
                {ownedSupportLinks.some((link) => link.active && link.accepted_at) && (
                  <div style={{ marginTop: 14, padding: 13, borderRadius: 13, background: "var(--pl-theme-surface,#FFF9FD)", border: "1px solid var(--pl-theme-line,#E9DDF6)" }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: "var(--pl-theme-muted,#A65DC1)" }}>💛 WHAT I NEED RIGHT NOW</div>
                    <div style={{ marginTop: 4, fontSize: 14, lineHeight: 1.45, color: "var(--pl-theme-muted,#7B6888)" }}>Send a clear, consent-based request. This is not an emergency alert and never contacts anyone automatically.</div>
                    <select value={supportRequestGuardian || ownedSupportLinks.find((link) => link.active && link.accepted_at)?.caregiver_email || ""} onChange={(event) => setSupportRequestGuardian(event.target.value)} aria-label="Choose Guardian for support request" style={{ width: "100%", boxSizing: "border-box", marginTop: 8, padding: 8, borderRadius: 9, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: "var(--pl-theme-surface)" }}>
                      {ownedSupportLinks.filter((link) => link.active && link.accepted_at).map((link) => <option key={link.id} value={link.caregiver_email}>{link.caregiver_email}</option>)}
                    </select>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                      {[["encouragement","Encourage me"],["company","Stay with me"],["practical_help","Help me start"],["space","Give me space"],["call","Let’s talk"],["body_double","Quiet company"]].map(([value,label]) => <button key={value} type="button" onClick={() => setSupportRequestType(value)} aria-pressed={supportRequestType === value} style={{ padding: "6px 8px", borderRadius: 999, border: supportRequestType === value ? "2px solid #A65DC1" : "1px solid #E3C9EC", background: supportRequestType === value ? "var(--pl-theme-surface-2)" : "var(--pl-theme-surface)", color: "var(--pl-theme-ink,#76558A)", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>{label}</button>)}
                    </div>
                    <label style={{display:"grid",gap:6,fontSize:14,marginTop:10}}>When would a check-in help?<select value={checkInDelay} onChange={event=>setCheckInDelay(event.target.value)} style={{minHeight:44,padding:9,borderRadius:12,border:"1px solid var(--pl-theme-line)",background:"var(--pl-theme-surface)",color:"var(--pl-theme-ink)"}}><option value="0">Now / whenever they can</option><option value="30">Ask them to check on me in 30 minutes</option><option value="60">Ask them to check on me in an hour</option></select></label><p style={{fontSize:13,color:"var(--pl-theme-muted)"}}>This sends your request now with your preferred time. It doesn’t create an automatic reminder.</p>
                    <textarea value={supportRequestText} onChange={(event) => setSupportRequestText(event.target.value)} maxLength={500} placeholder="Optional note — e.g. I'm safe, but I need quiet company instead of advice." aria-label="Support request note" style={{ width: "100%", boxSizing: "border-box", minHeight: 66, marginTop: 8, padding: 9, borderRadius: 9, border: "1px solid var(--pl-theme-line,#E9DDF6)", resize: "vertical" }} />
                    <button type="button" onClick={() => sendGuardianSupportRequest({delayMinutes:Number(checkInDelay)})} style={{ marginTop: 8, padding: "8px 11px", borderRadius: 9, border: 0, background: "var(--pl-theme-accent,#A65DC1)", color: "var(--pl-theme-on-accent,#FFFFFF)", fontWeight: 900, fontSize: 14, cursor: "pointer" }}>Send support request</button>
                  </div>
                )}
                {taskSuggestions.filter((item) => item.status === "pending").length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: "var(--pl-theme-ink,#318C79)" }}>TASK SUGGESTIONS · YOU DECIDE</div>
                    {taskSuggestions.filter((item) => item.status === "pending").map((suggestion) => (
                      <div key={suggestion.id} style={{ marginTop: 7, padding: 10, borderRadius: 10, background: "var(--pl-theme-surface-2,#F2FFFB)", border: "1px solid var(--pl-theme-line,#E9DDF6)" }}>
                        <div style={{ fontSize: 14, fontWeight: 800 }}>{suggestion.task}</div>
                        <div style={{ marginTop: 3, fontSize: 14, color: "var(--pl-theme-muted,#8C6B9E)" }}>From {suggestion.caregiver_name} · {suggestion.suggested_day_id.toUpperCase()}</div>
                        <label style={{ display: "grid", gap: 4, marginTop: 7, fontSize: 14, fontWeight: 900, color: "var(--pl-theme-ink,#318C79)" }}>
                          PUT ACCEPTED TASK INSIDE
                          <select value={suggestionSectionsById[suggestion.id] || taskSectionsForDay(suggestion.suggested_day_id)[0] || "My tasks"} onChange={(event) => setSuggestionSectionsById((current) => ({ ...current, [suggestion.id]: event.target.value }))} style={{ minWidth: 0, padding: 7, borderRadius: 8, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: "var(--pl-theme-surface)" }}>
                            {taskSectionsForDay(suggestion.suggested_day_id).map((section) => <option key={section} value={section}>{section}</option>)}
                            {taskSectionsForDay(suggestion.suggested_day_id).length === 0 && <option value="My tasks">My tasks</option>}
                          </select>
                        </label>
                        <div style={{ display: "flex", gap: 6, marginTop: 7 }}><button onClick={() => decideTaskSuggestion(suggestion, "accepted")} style={{ padding: "6px 9px", borderRadius: 8, border: 0, background: "var(--pl-theme-accent,#318C79)", color: "var(--pl-theme-on-accent,#FFFFFF)", fontWeight: 800 }}>Accept</button><button onClick={() => decideTaskSuggestion(suggestion, "declined")} style={{ padding: "6px 9px", borderRadius: 8, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: "var(--pl-theme-surface)", color: "var(--pl-theme-ink,#76558A)", fontWeight: 800 }}>Decline</button></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {supportMessage && <div style={{ marginTop: 10, fontSize: 14, color: "var(--pl-theme-muted,#8C6B9E)" }}>{supportMessage}</div>}

            <div style={{ marginTop: 16, fontSize: 14, fontWeight: 900, color: "var(--pl-theme-muted,#A65DC1)" }}>🎁 REWARDS</div>
            {supportRewards.length === 0 ? <div style={{ marginTop: 7, fontSize: 14, color: "var(--pl-theme-muted,#8C6B9E)" }}>No rewards added yet.</div> :
              supportRewards.map((reward) => {
                const rewardUsesWeeklyProgress = !!reward.week_start;
                const rewardProgressPercent = rewardUsesWeeklyProgress ? supportWeeklyPercent : supportPercent;
                const rewardUnlocked = rewardProgressPercent >= reward.target_percent;
                return (
                <div key={reward.id} style={{ marginTop: 7, padding: 11, borderRadius: 11, background: rewardUnlocked ? "var(--pl-theme-surface-2)" : "var(--pl-theme-surface-2)", border: rewardUnlocked ? "1px solid #A9E3BF" : "1px solid #F2DFB0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontWeight: 800 }}>{reward.title}</span>
                    <span style={{ fontSize: 14, fontWeight: 900, color: rewardUnlocked ? "#2A9D5B" : "#C28A19" }}>{rewardUnlocked ? "UNLOCKED ✨" : `AT ${reward.target_percent}% ${rewardUsesWeeklyProgress ? "WEEKLY" : "TODAY"}`}</span>
                  </div>
                  {reward.details && <div style={{ marginTop: 4, fontSize: 14, color: "var(--pl-theme-muted,#8C6B9E)" }}>{reward.details}</div>}
                  {reward.week_start && <div style={{ marginTop: 4, fontSize: 14, color: "var(--pl-theme-muted,#9A86A7)" }}>Goal week: {new Date(`${reward.week_start}T12:00:00`).toLocaleDateString()}</div>}
                  {isSupportAdult && reward.approval_required && !reward.approved_at && rewardUnlocked && <button onClick={() => updateRewardStatus(reward, "approve")} style={{ marginTop: 7, padding: "6px 9px", borderRadius: 8, border: 0, background: "var(--pl-theme-accent,#318C79)", color: "var(--pl-theme-on-accent,#FFFFFF)", fontWeight: 800 }}>Approve reward</button>}
                  {!isSupportAdult && rewardUnlocked && (!reward.approval_required || reward.approved_at) && <button onClick={() => updateRewardStatus(reward, "claim")} style={{ marginTop: 7, padding: "6px 9px", borderRadius: 8, border: 0, background: "var(--pl-theme-accent,#A65DC1)", color: "var(--pl-theme-on-accent,#FFFFFF)", fontWeight: 800 }}>Mark reward claimed 🎁</button>}
                  {!isSupportAdult && reward.approval_required && !reward.approved_at && rewardUnlocked && <div style={{ marginTop: 6, fontSize: 14, color: "var(--pl-theme-ink,#C28A19)", fontWeight: 800 }}>Goal reached · waiting for guardian approval</div>}
                </div>
              )})
            }

            <div style={{ marginTop: 16, fontSize: 14, fontWeight: 900, color: "var(--pl-theme-muted,#4C8FE8)" }}>💌 NOTES</div>
            {supportNotes.filter((note) => !String(note.body || "").startsWith("[Together:")).length === 0 ? <div style={{ marginTop: 7, fontSize: 14, color: "var(--pl-theme-muted,#8C6B9E)" }}>No notes yet.</div> :
              supportNotes.filter((note) => !String(note.body || "").startsWith("[Together:")).map((note) => (
                <div key={note.id} style={{ marginTop: 7, padding: 11, borderRadius: 11, background: note.suggested_tool_id ? "var(--pl-theme-surface-2)" : "var(--pl-theme-surface-2)", border: note.suggested_tool_id ? "1px solid #F0D5E8" : "1px solid #D9ECFA" }}>
                  <div style={{ fontSize: 14, lineHeight: 1.45 }}>{note.body}</div>
                  {note.suggested_tool_id && (
                    <button type="button" onClick={() => setComfortToolOpen(note.suggested_tool_id)} style={{ marginTop: 7, padding: "6px 10px", borderRadius: 8, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: "var(--pl-theme-surface)", color: "var(--pl-theme-muted,#A65DC1)", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>Open this tool</button>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", marginTop: 7, flexWrap: "wrap" }}>
                    <div style={{ fontSize: 14, color: "var(--pl-theme-muted,#9A86A7)" }}>From {note.caregiver_name} · {new Date(note.created_at).toLocaleDateString()}</div>
                    {supportOwnerId === user?.id && (
                      <button onClick={() => deleteSupportNote(note.id)} style={{ padding: "5px 8px", borderRadius: 8, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: "var(--pl-theme-surface,#FFF7F9)", color: "var(--pl-theme-muted,#C45D74)", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>Delete note</button>
                    )}
                  </div>
                </div>
              ))
            }
          </div>}
          </div>
          </ToolPanel>
  );
}
