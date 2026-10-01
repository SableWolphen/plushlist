const TOGETHER_PREFIX = "[Together:";

const TYPES = [
  { id: "activity", icon: "🤝", label: "Activity", hint: "Something to do together" },
  { id: "note", icon: "💌", label: "Note", hint: "A little message" },
  { id: "task", icon: "✨", label: "Together task", hint: "A shared thing to try" },
  { id: "checkin", icon: "🌷", label: "Check-in", hint: "A question or check-in" },
  { id: "promise", icon: "🤍", label: "Promise", hint: "Something you'll do for each other" },
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

export function TogetherCorner({
  client,
  user,
  supportOwnerId,
  isSupportAdult,
  canSendSupportNotes,
  ownedSupportLinks = [],
  selectedSupportName,
  supportNotes = [],
  loadSupportData,
  loadSupportOwner,
}) {
  const [open, setOpen] = React.useState(false);
  const [typeId, setTypeId] = React.useState("activity");
  const [draft, setDraft] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState("");

  const hasActiveGuardian = ownedSupportLinks.some((link) => link.active && link.accepted_at);
  const canWrite = !!user?.id && !!supportOwnerId && (
    supportOwnerId === user.id ||
    (isSupportAdult && canSendSupportNotes)
  );
  const showCorner = isSupportAdult ? !!supportOwnerId : hasActiveGuardian;
  const items = supportNotes
    .map((note) => ({ note, parsed: parseTogetherNote(note) }))
    .filter((item) => item.parsed)
    .slice(0, 4);

  if (!showCorner) return null;

  const selectedType = TYPES.find((item) => item.id === typeId) || TYPES[0];

  const save = async () => {
    const text = draft.trim();
    if (!text || !canWrite || saving) return;
    setSaving(true);
    setMessage("");
    const authorName = isSupportAdult ? "Guardian" : "Cozy";
    const { error } = await client.from("support_notes").insert({
      owner_user_id: supportOwnerId,
      caregiver_user_id: user.id,
      caregiver_name: authorName,
      body: `[Together:${typeId}] ${text}`,
    });
    setSaving(false);
    if (error) {
      setMessage("Couldn't add that right now.");
      return;
    }
    setDraft("");
    setOpen(false);
    setMessage("Added to your Cozy Corner 💛");
    if (isSupportAdult) await loadSupportOwner?.(supportOwnerId);
    else await loadSupportData?.(user);
  };

  return (
    <section
      aria-label="Our Cozy Corner"
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
          <div style={{ fontSize: 14, fontWeight: 900, color: "var(--pl-theme-ink,#5B4B6B)" }}>🤝 Our Cozy Corner</div>
          <div style={{ marginTop: 2, fontSize: 13, lineHeight: 1.35, color: "var(--pl-theme-muted,#806B8D)" }}>
            {isSupportAdult ? `A shared little space with ${selectedSupportName || "your Cozy"}.` : "A shared little space for you and your Guardian."}
          </div>
        </div>
        {canWrite && (
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            style={{
              flex: "0 0 auto",
              minHeight: 38,
              padding: "7px 11px",
              borderRadius: 12,
              border: 0,
              background: "var(--pl-theme-accent,#A65DC1)",
              color: "var(--pl-theme-on-accent,#FFF)",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            {open ? "Close" : "+ Add"}
          </button>
        )}
      </div>

      {open && (
        <div style={{ marginTop: 11, paddingTop: 11, borderTop: "1px solid var(--pl-theme-line,#E9DDF6)" }}>
          <div aria-label="Cozy Corner item types" style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
            {TYPES.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setTypeId(type.id)}
                aria-pressed={typeId === type.id}
                title={type.hint}
                style={{
                  flex: "0 0 auto",
                  padding: "6px 9px",
                  borderRadius: 999,
                  border: typeId === type.id ? "2px solid var(--pl-theme-accent,#A65DC1)" : "1px solid var(--pl-theme-line,#E9DDF6)",
                  background: typeId === type.id ? "var(--pl-theme-surface-2,#F7F1FF)" : "var(--pl-theme-surface,#FFF)",
                  color: "var(--pl-theme-ink,#5B4B6B)",
                  fontSize: 13,
                  fontWeight: 800,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                }}
              >
                {type.icon} {type.label}
              </button>
            ))}
          </div>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={500}
            placeholder={selectedType.hint}
            aria-label={`Write a ${selectedType.label.toLowerCase()}`}
            style={{
              width: "100%",
              boxSizing: "border-box",
              minHeight: 68,
              marginTop: 8,
              padding: 10,
              borderRadius: 12,
              border: "1px solid var(--pl-theme-line,#E9DDF6)",
              background: "var(--pl-theme-surface,#FFF)",
              color: "var(--pl-theme-ink,#5B4B6B)",
              resize: "vertical",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 7 }}>
            <span style={{ fontSize: 12, color: "var(--pl-theme-muted,#8C6B9E)" }}>
              {isSupportAdult ? "Your Cozy sees this in the shared corner." : "Your Guardian sees this in the shared corner."}
            </span>
            <button
              type="button"
              onClick={save}
              disabled={!draft.trim() || saving}
              style={{
                minHeight: 38,
                padding: "7px 12px",
                borderRadius: 10,
                border: 0,
                background: "var(--pl-theme-accent,#A65DC1)",
                color: "var(--pl-theme-on-accent,#FFF)",
                fontWeight: 900,
                opacity: !draft.trim() || saving ? 0.55 : 1,
                cursor: !draft.trim() || saving ? "default" : "pointer",
              }}
            >
              {saving ? "Adding…" : "Add to corner"}
            </button>
          </div>
        </div>
      )}

      {items.length > 0 ? (
        <div style={{ display: "grid", gap: 6, marginTop: 11 }}>
          {items.map(({ note, parsed }) => (
            <div
              key={note.id}
              style={{
                padding: "9px 10px",
                borderRadius: 12,
                background: "var(--pl-theme-surface,#FFF)",
                border: "1px solid var(--pl-theme-line,#E9DDF6)",
              }}
            >
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span aria-hidden="true" style={{ fontSize: 16 }}>{parsed.type.icon}</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: "var(--pl-theme-muted,#8D5CA5)" }}>{parsed.type.label}</div>
                  <div style={{ marginTop: 2, fontSize: 14, lineHeight: 1.4, color: "var(--pl-theme-ink,#5B4B6B)", overflowWrap: "anywhere" }}>{parsed.text}</div>
                  <div style={{ marginTop: 3, fontSize: 12, color: "var(--pl-theme-muted,#9A86A7)" }}>From {note.caregiver_name || "Cozy Corner"}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.4, color: "var(--pl-theme-muted,#8C6B9E)" }}>
          Nothing here yet. Add a note, plan, comfort, or little thing to do together.
        </div>
      )}
      {message && <div role="status" style={{ marginTop: 7, fontSize: 12.5, color: "var(--pl-theme-muted,#7B6888)" }}>{message}</div>}
    </section>
  );
}
