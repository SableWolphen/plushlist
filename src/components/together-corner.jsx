import { hasGoldFeature } from "../plush-gold.js";

const TOGETHER_PREFIX = "[Together:";

const TYPES = [
  { id: "activity", icon: "🤝", label: "Activity", hint: "Something to do together", coOp: true },
  { id: "note", icon: "💌", label: "Note", hint: "A little message" },
  { id: "task", icon: "✨", label: "Together task", hint: "A shared thing to try", coOp: true },
  { id: "checkin", icon: "🌷", label: "Check-in", hint: "A question or check-in", coOp: true },
  { id: "promise", icon: "🤍", label: "Promise", hint: "Something you'll do for each other", coOp: true },
  { id: "comfort", icon: "🧸", label: "Comfort", hint: "Something that helps" },
  { id: "idea", icon: "💡", label: "Idea", hint: "Save an idea for later" },
  { id: "memory", icon: "📷", label: "Memory", hint: "Keep a sweet little moment" },
];

export function parseTogetherNote(note) {
  const body = String(note?.body || "");
  const match = body.match(/^\[Together:([a-z]+)\]\s*([\s\S]*)$/i);
  if (!match) return null;
  const type = TYPES.find((item) => item.id === match[1].toLowerCase()) || TYPES[1];
  return { type, text: match[2].trim() };
}

function localDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function weekKey(date = new Date()) {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = copy.getDay();
  copy.setDate(copy.getDate() - ((day + 6) % 7));
  return localDateKey(copy);
}

export function occurrenceKeyFor(item, now = new Date()) {
  if (item?.recurrence === "weekly") return weekKey(now);
  if (!item?.recurrence && item?.scheduled_for) {
    const scheduled = new Date(item.scheduled_for);
    if (!Number.isNaN(scheduled.getTime())) return localDateKey(scheduled);
  }
  return localDateKey(now);
}

function remainingSeconds(item, nowMs) {
  if (!item?.timer_started_at || !item?.timer_minutes) return null;
  const started = new Date(item.timer_started_at).getTime();
  if (!Number.isFinite(started)) return null;
  return Math.max(0, Math.ceil((started + Number(item.timer_minutes) * 60000 - nowMs) / 1000));
}

function clockText(seconds) {
  if (seconds == null) return "";
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
}

export function TogetherCorner({
  client,
  user,
  supportOwnerId,
  isSupportAdult,
  activeSupportLink,
  ownedSupportLinks = [],
  selectedSupportName,
}) {
  const activeOwned = ownedSupportLinks.filter((link) => link.active && link.accepted_at);
  const defaultLinkId = isSupportAdult ? activeSupportLink?.id : activeOwned[0]?.id;
  const [selectedLinkId, setSelectedLinkId] = React.useState(defaultLinkId || "");
  const [open, setOpen] = React.useState(false);
  const [typeId, setTypeId] = React.useState("activity");
  const [draft, setDraft] = React.useState("");
  const [scheduledFor, setScheduledFor] = React.useState("");
  const [recurrence, setRecurrence] = React.useState("");
  const [timerMinutes, setTimerMinutes] = React.useState("10");
  const [items, setItems] = React.useState([]);
  const [participation, setParticipation] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [nowMs, setNowMs] = React.useState(Date.now());

  React.useEffect(() => {
    const next = isSupportAdult ? activeSupportLink?.id : activeOwned[0]?.id;
    if (next && (!selectedLinkId || (isSupportAdult && selectedLinkId !== next))) setSelectedLinkId(next);
  }, [isSupportAdult, activeSupportLink?.id, activeOwned.map((link) => link.id).join("|")]);

  const selectedLink = isSupportAdult
    ? activeSupportLink
    : activeOwned.find((link) => link.id === selectedLinkId) || activeOwned[0] || null;
  const ownerId = isSupportAdult ? supportOwnerId : user?.id;
  const plusEnabled = hasGoldFeature("guardian_together");
  const togetherEnabled = plusEnabled && !!selectedLink?.can_use_together;
  const showCorner = isSupportAdult ? !!activeSupportLink : activeOwned.length > 0;
  const canWrite = !!user?.id && !!ownerId && !!selectedLink?.id && togetherEnabled;

  const load = React.useCallback(async () => {
    if (!selectedLink?.id || !togetherEnabled) {
      setItems([]);
      setParticipation([]);
      return;
    }
    setLoading(true);
    const { data, error } = await client
      .from("together_items")
      .select("*")
      .eq("caregiver_link_id", selectedLink.id)
      .order("created_at", { ascending: false })
      .limit(12);
    if (error) {
      setMessage("Couldn't load your Cozy Corner yet.");
      setLoading(false);
      return;
    }
    const nextItems = data || [];
    setItems(nextItems);
    if (nextItems.length) {
      const ids = nextItems.map((item) => item.id);
      const { data: rows } = await client
        .from("together_item_participation")
        .select("*")
        .in("item_id", ids);
      setParticipation(rows || []);
    } else {
      setParticipation([]);
    }
    setLoading(false);
  }, [client, selectedLink?.id, togetherEnabled]);

  React.useEffect(() => { load(); }, [load]);

  React.useEffect(() => {
    const hasTimer = items.some((item) => {
      const left = remainingSeconds(item, Date.now());
      return left != null && left > 0;
    });
    if (!hasTimer) return undefined;
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [items]);

  if (!showCorner) return null;

  const selectedType = TYPES.find((item) => item.id === typeId) || TYPES[0];

  const save = async () => {
    const text = draft.trim();
    if (!text || !canWrite || saving) return;
    setSaving(true);
    setMessage("");
    const payload = {
      caregiver_link_id: selectedLink.id,
      owner_user_id: ownerId,
      created_by_user_id: user.id,
      created_by_role: isSupportAdult ? "guardian" : "cozy",
      kind: typeId,
      body: text,
      scheduled_for: scheduledFor ? new Date(scheduledFor).toISOString() : null,
      recurrence: recurrence || null,
    };
    const { error } = await client.from("together_items").insert(payload);
    setSaving(false);
    if (error) {
      setMessage("Couldn't add that right now.");
      return;
    }
    setDraft("");
    setScheduledFor("");
    setRecurrence("");
    setOpen(false);
    setMessage("Added to your Cozy Corner 💛");
    await load();
  };

  const setParticipationState = async (item, joined, done) => {
    const occurrence = occurrenceKeyFor(item);
    setMessage("");
    const { error } = await client.rpc("set_together_participation", {
      p_item_id: item.id,
      p_occurrence_date: occurrence,
      p_joined: joined,
      p_done: done,
    });
    if (error) {
      setMessage("Couldn't update that together activity.");
      return;
    }
    await load();
  };

  const startTimer = async (item) => {
    const minutes = Math.max(1, Math.min(120, Number(timerMinutes) || 10));
    const { error } = await client.rpc("start_together_timer", {
      p_item_id: item.id,
      p_minutes: minutes,
    });
    if (error) {
      setMessage("Couldn't start the shared timer.");
      return;
    }
    setNowMs(Date.now());
    await load();
  };

  const deleteItem = async (item) => {
    const { error } = await client.from("together_items").delete().eq("id", item.id);
    if (error) {
      setMessage("Couldn't remove that item.");
      return;
    }
    setMessage("Removed from your Cozy Corner.");
    await load();
  };

  return (
    <section
      aria-label="Do It Together"
      style={{
        marginBottom: 14,
        padding: 14,
        borderRadius: 18,
        background: "linear-gradient(145deg,var(--pl-theme-surface,#FFF9FD),var(--pl-theme-surface-2,#F7F1FF))",
        border: "1px solid var(--pl-theme-line,#E9DDF6)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: "var(--pl-theme-ink,#5B4B6B)" }}>🤝 Do It Together <span style={{ fontSize: 10.5, fontWeight: 900, padding: "2px 6px", borderRadius: 999, background: "var(--pl-theme-surface-2,#F7F1FF)", color: "var(--pl-theme-muted,#8D5CA5)" }}>PLUS</span></div>
          <div style={{ marginTop: 2, fontSize: 13, lineHeight: 1.35, color: "var(--pl-theme-muted,#806B8D)" }}>
            {isSupportAdult ? `Do little things side by side with ${selectedSupportName || "your Cozy"}.` : "Plan little things with your Guardian and do them side by side."}
          </div>
        </div>
        {canWrite && (
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            style={{ flex: "0 0 auto", minHeight: 38, padding: "7px 11px", borderRadius: 12, border: 0, background: "var(--pl-theme-accent,#A65DC1)", color: "var(--pl-theme-on-accent,#FFF)", fontWeight: 900, cursor: "pointer" }}
          >
            {open ? "Close" : "+ Add"}
          </button>
        )}
      </div>

      {!isSupportAdult && activeOwned.length > 1 && (
        <label style={{ display: "grid", gap: 4, marginTop: 9, fontSize: 12, fontWeight: 800, color: "var(--pl-theme-muted,#806B8D)" }}>
          Cozy Corner with
          <select value={selectedLink?.id || ""} onChange={(event) => setSelectedLinkId(event.target.value)} style={{ minHeight: 40, padding: "7px 9px", borderRadius: 10 }}>
            {activeOwned.map((link) => <option key={link.id} value={link.id}>{link.label || link.caregiver_email || "Guardian"}</option>)}
          </select>
        </label>
      )}

      {!togetherEnabled ? (
        <div style={{ marginTop: 10, padding: "10px 11px", borderRadius: 12, background: "var(--pl-theme-surface,#FFF)", border: "1px solid var(--pl-theme-line,#E9DDF6)", fontSize: 13, lineHeight: 1.4, color: "var(--pl-theme-muted,#806B8D)" }}>
          {!plusEnabled
            ? <><strong style={{color:"var(--pl-theme-ink,#5B4B6B)"}}>PlushLife Plus · Together</strong><div style={{marginTop:4}}>This shared activity space is a Plus feature and is not enabled here yet. Regular Guardian invitations, sharing controls, and support stay available.</div></>
            : isSupportAdult
              ? "This Cozy hasn’t turned on Together sharing for this relationship."
              : "Turn on “Together space” in this Guardian’s Sharing & care agreement when you’re ready to use this shared space."}
        </div>
      ) : (
        <>
          {open && (
            <div style={{ marginTop: 11, paddingTop: 11, borderTop: "1px solid var(--pl-theme-line,#E9DDF6)" }}>
              <div aria-label="Cozy Corner item types" style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
                {TYPES.map((type) => (
                  <button key={type.id} type="button" onClick={() => setTypeId(type.id)} aria-pressed={typeId === type.id} title={type.hint} style={{ flex: "0 0 auto", padding: "6px 9px", borderRadius: 999, border: typeId === type.id ? "2px solid var(--pl-theme-accent,#A65DC1)" : "1px solid var(--pl-theme-line,#E9DDF6)", background: typeId === type.id ? "var(--pl-theme-surface-2,#F7F1FF)" : "var(--pl-theme-surface,#FFF)", color: "var(--pl-theme-ink,#5B4B6B)", fontSize: 13, fontWeight: 800, whiteSpace: "nowrap", cursor: "pointer" }}>
                    {type.icon} {type.label}
                  </button>
                ))}
              </div>
              <textarea value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={500} placeholder={selectedType.hint} aria-label={`Write a ${selectedType.label.toLowerCase()}`} style={{ width: "100%", boxSizing: "border-box", minHeight: 68, marginTop: 8, padding: 10, borderRadius: 12, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: "var(--pl-theme-surface,#FFF)", color: "var(--pl-theme-ink,#5B4B6B)", resize: "vertical" }} />
              {selectedType.coOp && (
                <details style={{ marginTop: 8 }}>
                  <summary style={{ cursor: "pointer", fontSize: 12.5, fontWeight: 850, color: "var(--pl-theme-muted,#806B8D)" }}>When & repeat (optional)</summary>
                  <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 7, marginTop: 7 }}>
                    <input type="datetime-local" value={scheduledFor} onChange={(event) => setScheduledFor(event.target.value)} aria-label="Together activity time" style={{ minHeight: 40, padding: "7px 9px", borderRadius: 10 }} />
                    <select value={recurrence} onChange={(event) => setRecurrence(event.target.value)} aria-label="Repeat together activity" style={{ minHeight: 40, padding: "7px 9px", borderRadius: 10 }}>
                      <option value="">One time</option>
                      <option value="daily">Repeat daily</option>
                      <option value="weekly">Repeat weekly</option>
                    </select>
                  </div>
                </details>
              )}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 7 }}>
                <span style={{ fontSize: 12, color: "var(--pl-theme-muted,#8C6B9E)" }}>Both of you can add things here.</span>
                <button type="button" onClick={save} disabled={!draft.trim() || saving} style={{ minHeight: 38, padding: "7px 12px", borderRadius: 10, border: 0, background: "var(--pl-theme-accent,#A65DC1)", color: "var(--pl-theme-on-accent,#FFF)", fontWeight: 900, opacity: !draft.trim() || saving ? 0.55 : 1, cursor: !draft.trim() || saving ? "default" : "pointer" }}>
                  {saving ? "Adding…" : "Add to corner"}
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ marginTop: 10, fontSize: 13, color: "var(--pl-theme-muted,#8C6B9E)" }}>Loading your shared corner…</div>
          ) : items.length > 0 ? (
            <div style={{ display: "grid", gap: 7, marginTop: 11 }}>
              {items.slice(0, 6).map((item) => {
                const type = TYPES.find((entry) => entry.id === item.kind) || TYPES[0];
                const occurrence = occurrenceKeyFor(item);
                const rows = participation.filter((row) => row.item_id === item.id && row.occurrence_date === occurrence);
                const cozy = rows.find((row) => row.role === "cozy");
                const guardian = rows.find((row) => row.role === "guardian");
                const mine = isSupportAdult ? guardian : cozy;
                const bothDone = !!cozy?.done_at && !!guardian?.done_at;
                const seconds = remainingSeconds(item, nowMs);
                return (
                  <article key={item.id} style={{ padding: "10px 11px", borderRadius: 13, background: "var(--pl-theme-surface,#FFF)", border: bothDone ? "1px solid color-mix(in srgb,var(--pl-theme-accent) 55%,#BEE8D2)" : "1px solid var(--pl-theme-line,#E9DDF6)" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <span aria-hidden="true" style={{ fontSize: 17 }}>{type.icon}</span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                          <span style={{ fontSize: 12.5, fontWeight: 900, color: "var(--pl-theme-muted,#8D5CA5)" }}>{type.label}</span>
                          <span style={{ fontSize: 11.5, color: "var(--pl-theme-muted,#9A86A7)" }}>From {item.created_by_role === "guardian" ? "Guardian 💛" : "Cozy 🧸"}</span>
                        </div>
                        <div style={{ marginTop: 2, fontSize: 14, lineHeight: 1.4, color: "var(--pl-theme-ink,#5B4B6B)", overflowWrap: "anywhere" }}>{item.body}</div>
                        {(item.scheduled_for || item.recurrence) && (
                          <div style={{ marginTop: 4, fontSize: 11.5, color: "var(--pl-theme-muted,#8C6B9E)" }}>
                            {item.scheduled_for ? new Date(item.scheduled_for).toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" }) : "Any time"}
                            {item.recurrence ? ` · ${item.recurrence === "daily" ? "Daily" : "Weekly"}` : ""}
                          </div>
                        )}
                        {type.coOp && (
                          <>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                              <span style={{ padding: "4px 7px", borderRadius: 999, background: cozy?.done_at ? "var(--pl-theme-surface-2,#EAF8F0)" : "var(--pl-theme-surface-2,#F6F1F8)", fontSize: 11.5, fontWeight: 800 }}>🧸 Cozy {cozy?.done_at ? "✓" : cozy?.joined_at ? "joined" : "—"}</span>
                              <span style={{ padding: "4px 7px", borderRadius: 999, background: guardian?.done_at ? "var(--pl-theme-surface-2,#EAF8F0)" : "var(--pl-theme-surface-2,#F6F1F8)", fontSize: 11.5, fontWeight: 800 }}>💛 Guardian {guardian?.done_at ? "✓" : guardian?.joined_at ? "joined" : "—"}</span>
                              {bothDone && <span style={{ padding: "4px 7px", borderRadius: 999, background: "var(--pl-theme-surface-2,#FFF4D8)", fontSize: 11.5, fontWeight: 900 }}>✨ Did it together</span>}
                            </div>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 7 }}>
                              {!mine?.joined_at && <button type="button" onClick={() => setParticipationState(item, true, false)} style={{ minHeight: 34, padding: "5px 9px", borderRadius: 9, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: "var(--pl-theme-surface)", color: "var(--pl-theme-ink,#5B4B6B)", fontWeight: 850, fontSize: 12.5 }}>I’m doing this too</button>}
                              {mine?.joined_at && !mine?.done_at && <button type="button" onClick={() => setParticipationState(item, true, true)} style={{ minHeight: 34, padding: "5px 9px", borderRadius: 9, border: 0, background: "var(--pl-theme-accent,#A65DC1)", color: "var(--pl-theme-on-accent,#FFF)", fontWeight: 850, fontSize: 12.5 }}>Done with mine ✓</button>}
                              {mine?.done_at && <button type="button" onClick={() => setParticipationState(item, true, false)} style={{ minHeight: 34, padding: "5px 9px", borderRadius: 9, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: "var(--pl-theme-surface)", color: "var(--pl-theme-muted,#806B8D)", fontWeight: 800, fontSize: 12 }}>Undo my check</button>}
                            </div>
                            <details style={{ marginTop: 7 }}>
                              <summary style={{ cursor: "pointer", fontSize: 12, fontWeight: 800, color: "var(--pl-theme-muted,#806B8D)" }}>{seconds != null && seconds > 0 ? `⏱ Together timer · ${clockText(seconds)}` : "⏱ Start a together timer"}</summary>
                              <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginTop: 6 }}>
                                <select value={timerMinutes} onChange={(event) => setTimerMinutes(event.target.value)} aria-label="Together timer minutes" style={{ minHeight: 36, padding: "5px 8px", borderRadius: 9 }}>
                                  {[5,10,15,20,25,30].map((minutes) => <option key={minutes} value={String(minutes)}>{minutes} min</option>)}
                                </select>
                                <button type="button" onClick={() => startTimer(item)} style={{ minHeight: 36, padding: "5px 9px", borderRadius: 9, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: "var(--pl-theme-surface)", fontWeight: 850, fontSize: 12.5 }}>{seconds != null && seconds > 0 ? "Restart" : "Start together"}</button>
                              </div>
                            </details>
                          </>
                        )}
                        {(item.created_by_user_id === user?.id || ownerId === user?.id) && (
                          <button type="button" onClick={() => deleteItem(item)} style={{ marginTop: 7, padding: 0, border: 0, background: "transparent", color: "var(--pl-theme-muted,#A77887)", fontSize: 11.5, fontWeight: 750, cursor: "pointer" }}>Remove</button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.4, color: "var(--pl-theme-muted,#8C6B9E)" }}>Nothing here yet. Add a note, plan, comfort, or little thing to do together.</div>
          )}
        </>
      )}
      {message && <div role="status" style={{ marginTop: 7, fontSize: 12.5, color: "var(--pl-theme-muted,#7B6888)" }}>{message}{message.startsWith("Couldn\'t load") && <button type="button" onClick={load} style={{marginLeft:8,minHeight:36,padding:"5px 9px",borderRadius:9,border:"1px solid var(--pl-theme-line)",background:"var(--pl-theme-surface)",color:"var(--pl-theme-ink)",fontWeight:800}}>Try again</button>}</div>}
    </section>
  );
}
