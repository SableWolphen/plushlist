import { VOICES, HOME_CARDS } from "../plush-guardian-model.mjs";
import { GuardianPortableBackup } from "./guardian-portable-backup.jsx";
export function GuardianSettings({ userId, state, update, onForget, onDeleteChat }) {
  const [memory, setMemory] = React.useState("");
  const [confirm, setConfirm] = React.useState(false);
  const prefs = state.prefs;
  const preference = (key, value) =>
    update({
      prefs: { ...prefs, [key]: value },
      ...(key === "keepChat" && !value ? { chat: [] } : {}),
    });
  const check = (key, label) => (
    <label className="pl-companion-check">
      <input
        type="checkbox"
        checked={!!prefs[key]}
        onChange={(e) => preference(key, e.target.checked)}
      />
      {label}
    </label>
  );
  const reorder = (id, offset) => {
    const order = [...state.home.order];
    const index = order.indexOf(id),
      target = index + offset;
    if (target < 0 || target >= order.length) return;
    order.splice(index, 1);
    order.splice(target, 0, id);
    update({ home: { ...state.home, order } });
  };
  return (
    <section>
      <h2>My companion, my choices</h2>
      <p>
        These choices and memories are saved privately on this device for your
        account.
      </p>
      <label>
        Voice
        <select
          aria-label="Voice"
          value={prefs.voice}
          onChange={(e) => preference("voice", e.target.value)}
        >
          {Object.entries(VOICES).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Guidance
        <select
          aria-label="Guidance"
          value={prefs.guidance}
          onChange={(e) => preference("guidance", e.target.value)}
        >
          <option value="gentle">Gentle suggestions</option>
          <option value="structured">Clear, structured steps</option>
        </select>
      </label>
      <label>
        Call me
        <input
          maxLength={60}
          value={prefs.name}
          onChange={(e) => preference("name", e.target.value)}
          placeholder="Your chosen name, or leave blank"
        />
      </label>
      <label>
        Words or topics to avoid
        <textarea
          maxLength={300}
          value={prefs.avoid}
          onChange={(e) => preference("avoid", e.target.value)}
        />
      </label>
      <label>
        Encouragement I like
        <textarea
          maxLength={300}
          value={prefs.phrases}
          onChange={(e) => preference("phrases", e.target.value)}
        />
      </label>
      <section className="pl-virtual-guardian-options" aria-label="Virtual Guardian reminders">
        <h3>Automatic Virtual Guardian</h3>
        <p>Gentle rule-based reminders for your real tasks, even when the Android app is closed. No AI chat needed.</p>
        {check("automaticReminders", "Let my Virtual Guardian guide existing reminders")}
        {prefs.automaticReminders && <>
          {check("routineNudges", "Remind me about an unfinished routine")}
          {prefs.routineNudges && <label>Routine reminder time <input type="time" value={prefs.routineReminderTime} onChange={event => preference("routineReminderTime", event.target.value)} /></label>}
          {check("tomorrowNudges", "Offer a gentle tomorrow-preparation reminder")}
          {prefs.tomorrowNudges && <label>Tomorrow preview time <input type="time" value={prefs.tomorrowReminderTime} onChange={event => preference("tomorrowReminderTime", event.target.value)} /></label>}
        </>}
        <p>To receive reminders, first enable notifications and choose times under Settings → Notifications & Reminders. PlushLife respects those quiet hours, rest days, and discreet lock-screen settings. You can turn this off anytime.</p>
      </section>
      <details>
        <summary>AI access & conversation privacy</summary>
        <p>
          Cloudflare Workers AI receives only the chat and context in each send
          preview. Photos are never sent. Journals require a manually selected
          excerpt for each message. This app does not store chat on its server.
        </p>
        {check("aiConsent", "Enable AI chat with Cloudflare")}
        {check("shareTasks", "Include up to six unfinished task names")}
        {check("shareMood", "Include my current mood label")}
        {check("shareMemories", "Include my explicitly saved memories")}
        {check("keepChat", "Keep conversation history on this device")}
        <button onClick={onDeleteChat}>Delete saved conversation</button>
        <p>
          Deleting local data does not retract messages already processed by
          Cloudflare.
        </p>
      </details>
      <details>
        <summary>What I remember</summary>
        {check("remember", "Use memories I explicitly save")}
        <p>
          No automatic memory extraction. Add only what you want the companion
          to remember.
        </p>
        <label>
          A preference or goal
          <input
            maxLength={240}
            value={memory}
            onChange={(e) => setMemory(e.target.value)}
          />
        </label>
        <button
          disabled={!prefs.remember || !memory.trim()}
          onClick={() => {
            if (
              update({
                memories: [
                  { id: crypto.randomUUID(), text: memory.trim() },
                  ...state.memories,
                ].slice(0, 30),
              })
            )
              setMemory("");
          }}
        >
          Remember this
        </button>
        {state.memories.map((m) => (
          <div key={m.id}>
            <input
              aria-label="Edit memory"
              value={m.text}
              maxLength={240}
              onChange={(e) =>
                update({
                  memories: state.memories.map((x) =>
                    x.id === m.id ? { ...x, text: e.target.value } : x,
                  ),
                })
              }
            />
            <button
              onClick={() =>
                update({
                  memories: state.memories.filter((x) => x.id !== m.id),
                })
              }
            >
              Forget
            </button>
          </div>
        ))}
        <button onClick={() => setConfirm(true)}>
          Forget memories and turn off AI
        </button>
        {confirm && (
          <div className="pl-companion-review">
            <p>
              Delete saved conversations and memories, and disable AI access?
              Your tasks, routines, photos, and reflections remain.
            </p>
            <button
              onClick={() => {
                onForget();
                setConfirm(false);
              }}
            >
              Confirm forget
            </button>
            <button onClick={() => setConfirm(false)}>Cancel</button>
          </div>
        )}
      </details>
      <details>
        <summary>Make Home mine</summary>
        <p>
          Choose which main Home cards appear and their order. Tasks remain
          accessible from the Tasks tab.
        </p>
        {state.home.order.map((id, i) => (
          <div className="pl-companion-home-setting" key={id}>
            <label>
              <input
                type="checkbox"
                checked={!state.home.hidden.includes(id)}
                onChange={(e) =>
                  update({
                    home: {
                      ...state.home,
                      hidden: e.target.checked
                        ? state.home.hidden.filter((x) => x !== id)
                        : [...state.home.hidden, id],
                    },
                  })
                }
              />
              {HOME_CARDS.find((x) => x[0] === id)?.[1]}
            </label>
            <button
              aria-label={"Move " + id + " up"}
              disabled={i === 0}
              onClick={() => reorder(id, -1)}
            >
              ↑
            </button>
            <button
              aria-label={"Move " + id + " down"}
              disabled={i === state.home.order.length - 1}
              onClick={() => reorder(id, 1)}
            >
              ↓
            </button>
          </div>
        ))}
      </details>
      <GuardianPortableBackup userId={userId} state={state} update={update} />
      <details>
        <summary>Comfort & accessibility</summary>
        {check("motion", "Allow animations")}
        {check("sound", "Play a gentle sound after routine steps")}
        {check("haptics", "Vibrate after routine steps when supported")}
        <label>
          Companion text size
          <select
            value={prefs.textSize}
            onChange={(e) => preference("textSize", e.target.value)}
          >
            <option value="normal">Standard</option>
            <option value="large">Larger</option>
          </select>
        </label>
        {check("reminders", "Show an optional check-in prompt on Home")}
        <p>
          This prompt appears only when you open Home. Device notifications stay
          in the existing reminder settings.
        </p>
        <label>
          Quiet hours start
          <input
            type="time"
            value={prefs.quietStart}
            onChange={(e) => preference("quietStart", e.target.value)}
          />
        </label>
        <label>
          Quiet hours end
          <input
            type="time"
            value={prefs.quietEnd}
            onChange={(e) => preference("quietEnd", e.target.value)}
          />
        </label>
      </details>
    </section>
  );
}
