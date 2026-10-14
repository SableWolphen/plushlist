import { VOICES, HOME_CARDS, localDate } from "../plush-guardian-model.mjs";
import { SURPRISE_BOX_CHOICES } from "../guardian-smart-care.mjs";
import { GuardianPortableBackup } from "./guardian-portable-backup.jsx";
import { activateBotMommy } from "../guardian-bot.mjs";
import { guardianBotDisplayName } from "../guardian-mode.mjs";
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
      <h2>Guardian settings</h2>
      <p>
        Give your automatic Guardian a name and choose how they encourage you.
        The automatic option uses device rules, not conversations. A connected person always takes priority.
      </p>
      <label>
        Guardian style
        <select
          aria-label="Guardian style"
          value={prefs.voice}
          onChange={(e) => preference("voice", e.target.value)}
        >
          {Object.entries(VOICES).map(([id, label]) => (
            <option key={id} value={id}>
              {label.replace(/^Bot /, "")}
            </option>
          ))}
        </select>
      </label>
      <label>
        Guardian's name
        <input
          aria-label="Guardian's name"
          maxLength={36}
          value={prefs.guardianName || ""}
          onChange={event=>preference("guardianName",event.target.value)}
          placeholder={guardianBotDisplayName({voice:prefs.voice})}
        />
      </label>
      <section className="pl-virtual-guardian-options" aria-label="Guardian caretaker options">
        <h3>🍼 Guardian Care Mode</h3>
        <p>Choose how nurturing your Guardian feels. Care routines are optional and stay on this device. No chat or automatic personal-care tracking.</p>
        <h3>🎁 Guardian's Surprise Box</h3>
        <p>Choose your favorite activities once. Guardian occasionally picks one as a free surprise, without requiring chores or manual claiming.</p>
        {check("surpriseBox","Let Guardian offer occasional activity surprises")}
        {prefs.surpriseBox && SURPRISE_BOX_CHOICES.map(item=><label key={item.id} className="pl-companion-check">
          <input type="checkbox" checked={(prefs.surpriseBoxChoices||[]).includes(item.id)} onChange={e=>preference("surpriseBoxChoices",e.target.checked?[...(prefs.surpriseBoxChoices||[]),item.id]:(prefs.surpriseBoxChoices||[]).filter(id=>id!==item.id))}/>
          {item.label}
        </label>)}
        <h3>💌 Surprise Letters</h3>
        <p>Receive an occasional private, supportive letter when your automatic Guardian is active. No AI or messages to other people.</p>
        <label className="pl-companion-check"><input type="checkbox" checked={!!prefs.surpriseLetters} onChange={e=>update({prefs:{...prefs,surpriseLetters:e.target.checked,lettersEnabledOn:e.target.checked ? localDate() : ""}})} />Enable surprise letters</label>
        <h3>🎁 Guardian surprises</h3>
        <p>Once your automatic Guardian is enabled, it picks and awards little surprises automatically. You never need to make a reward or claim one. These are virtual celebrations, not purchases or essential care.</p>
        {check("automaticGifts", "Let Guardian choose and unlock rewards automatically")}
        {prefs.automaticGifts && <div aria-label="Allowed Guardian surprise types">
          {["stickers","celebrations","trophies","activities","babyDays"].map(category=><label className="pl-companion-check" key={category}>
            <input type="checkbox" checked={(prefs.giftCategories || []).includes(category)}
              onChange={event=>preference("giftCategories",event.target.checked ? [...new Set([...(prefs.giftCategories||[]),category])] : (prefs.giftCategories||[]).filter(x=>x!==category))}/>
            {category === "babyDays" ? "Optional cozy baby day (Saturdays, never earned through chores)" : category === "activities" ? "Free-time surprises (movies, stories, coloring, games)" : category.charAt(0).toUpperCase()+category.slice(1)}
          </label>)}
        </div>}
        {check("careMode", "Enable nurturing caretaker routines")}
        {prefs.careMode && <>
          {check("littleMode", "Little Mode: simple choices and larger controls throughout the app")} 
          {check("careReminders", "Optional morning and bedtime caretaker notifications")} 
          {prefs.careReminders && <><label>Morning care time <input type="time" value={prefs.careMorningTime} onChange={e=>preference("careMorningTime",e.target.value)}/></label><label>Bedtime care time <input type="time" value={prefs.careBedtimeTime} onChange={e=>preference("careBedtimeTime",e.target.value)}/></label></>}
          <label>Caretaker personality
            <select aria-label="Caretaker personality" value={prefs.careStyle || "gentle"} onChange={event => preference("careStyle",event.target.value)}>
              <option value="gentle">Gentle and nurturing</option>
              <option value="baby">Extra babyish and affectionate</option>
              <option value="structured">Structured and reassuring</option>
            </select>
          </label>
          <label>Guardian can call me
            <input aria-label="Caretaker pet name" maxLength={40} value={prefs.petName || ""} onChange={event => preference("petName",event.target.value)} placeholder="Little one, pup, baby…" />
          </label>
          <p>You control every step. Changing, potty and bath checks are suggestions only; skip anything that doesn't fit. No points are deducted for resting.</p>
        </>}
      </section>
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
        Words or topics to avoid (personal note)
        <textarea
          maxLength={300}
          value={prefs.avoid}
          onChange={(e) => preference("avoid", e.target.value)}
        />
      </label>
      <label>
        A phrase I want to see on my Guardian dashboard
        <textarea
          maxLength={300}
          value={prefs.phrases}
          onChange={(e) => preference("phrases", e.target.value)}
        />
      </label>
      <section className="pl-virtual-guardian-options" aria-label="Virtual Guardian reminders">
        <h3>Guardian reminders</h3>
        <p>Automatic reminders follow your real tasks and routines when no person is connected. No AI or sharing is needed.</p>
        {!prefs.automaticReminders && <button type="button" className="pl-companion-primary" onClick={() => update({prefs:activateBotMommy(prefs)})}>Enable automatic Guardian 🧸</button>}
        {check("automaticReminders", "Enable automatic Guardian reminders")}
        {prefs.automaticReminders && <>
          {check("routineNudges", "Remind me about an unfinished routine")}
          {prefs.routineNudges && <label>Routine reminder time <input type="time" value={prefs.routineReminderTime} onChange={event => preference("routineReminderTime", event.target.value)} /></label>}
          {check("tomorrowNudges", "Offer a gentle tomorrow-preparation reminder")}
          {prefs.tomorrowNudges && <label>Tomorrow preview time <input type="time" value={prefs.tomorrowReminderTime} onChange={event => preference("tomorrowReminderTime", event.target.value)} /></label>}
        </>}
        <p>To receive reminders while the app is closed, enable notifications under Settings → Notifications & Reminders. PlushLife respects quiet hours, rest days and discreet lock-screen text. You can turn this off anytime. Without notification permission, your bot still helps when you open the app.</p>
      </section>
      {state.chat.length > 0 && <details>
        <summary>Old saved chat history</summary>
        <p>PlushLife no longer offers AI chat in the Guardian. These older messages stay on this device until you choose to delete them.</p>
        <button type="button" onClick={onDeleteChat}>Delete old saved chat</button>
      </details>}
      <details>
        <summary>What I remember</summary>
        {check("remember", "Use memories I explicitly save")}
        <p>
          No automatic memory extraction. These are your own notes and stay on this device.
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
          Clear my saved Guardian memories
        </button>
        {confirm && (
          <div className="pl-companion-review">
            <p>
              Delete old saved conversations and Guardian memories?
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
          Guardian text size
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
