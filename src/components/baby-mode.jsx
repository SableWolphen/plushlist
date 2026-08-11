// Baby Mode / Little Space comfort-mode components — module split
// phase 6 (see docs/module-split-plan.md). MamasCorner receives the
// shared Supabase client as a prop (from src/app-source.jsx) rather than
// creating its own, so it shares the same auth session as the rest of
// the app.

export function BabyArrivalRitual({ comfortItemName, onShowTinyThing, onSoftDay, onShowPlanner }) {
  return (
    <section className="baby-arrival-ritual" aria-label="Little space arrival">
      <div><div className="baby-arrival-kicker">🍼 LITTLE SPACE ARRIVAL</div><div className="baby-arrival-title">Hi baby. You are safe here.</div><div className="baby-arrival-copy">We only need one small thing at a time.{comfortItemName ? ` Is ${comfortItemName} nearby?` : ""}</div></div>
      <div className="baby-arrival-actions">
        <button type="button" onClick={onShowTinyThing}>🧸 Show my tiny thing</button>
        <button type="button" onClick={onSoftDay}>🌼 Make today soft</button>
        <button type="button" onClick={onShowPlanner}>🗓 Show my planner</button>
      </div>
    </section>
  );
}

export function MamasCorner({ userId, incompleteTasks, onConfirmTask, caregiverName = "Mommy", parentVoice = "motherly", supabase }) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [historyLoading, setHistoryLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [taskToConfirm, setTaskToConfirm] = React.useState(null);
  const [lastTaskAsked, setLastTaskAsked] = React.useState(null);
  const [threadId, setThreadId] = React.useState(null);
  const [historyLoaded, setHistoryLoaded] = React.useState(false);
  const messagesEndRef = React.useRef(null);
  const freshMessages = () => [{ role: "assistant", content: `Hi baby. I’m your PlushLife AI ${caregiverName.toLowerCase()} companion. What feels most important to say right now?` }];
  const [messages, setMessages] = React.useState(freshMessages);
  const conversationStarters = [
    "Just chat with me",
    "Tell me a cozy story",
    "Let’s play pretend",
    "I need to vent",
  ];
  const cleanSavedMessages = (value) => Array.isArray(value) ? value.slice(-100).flatMap((message) => {
    if (!message || !["user", "assistant"].includes(message.role) || typeof message.content !== "string") return [];
    const content = message.content.trim().slice(0, 1200);
    return content ? [{ role: message.role, content }] : [];
  }) : [];
  const saveThread = async (nextMessages, targetThreadId = threadId) => {
    if (!userId || !targetThreadId) return;
    const { error: saveError } = await supabase.from("mommy_chat_threads").update({ messages: cleanSavedMessages(nextMessages), caregiver_voice: parentVoice, updated_at: new Date().toISOString() }).eq("id", targetThreadId).eq("user_id", userId);
    if (saveError) throw saveError;
  };
  const createFreshThread = async () => {
    const initial = freshMessages();
    const { data, error: createError } = await supabase.from("mommy_chat_threads").insert({ user_id: userId, caregiver_voice: parentVoice, title: `${caregiverName}'s cozy chat`, messages: initial }).select("id").single();
    if (createError) throw createError;
    setThreadId(data.id);
    setMessages(initial);
    setDraft("");
    setError("");
    setTaskToConfirm(null);
    setLastTaskAsked(null);
    return data.id;
  };
  React.useEffect(() => {
    if (!open || !userId || historyLoaded) return;
    let cancelled = false;
    (async () => {
      setHistoryLoading(true);
      setError("");
      try {
        const { data, error: loadError } = await supabase.from("mommy_chat_threads").select("id, messages").eq("user_id", userId).order("updated_at", { ascending: false }).limit(1).maybeSingle();
        if (loadError) throw loadError;
        if (cancelled) return;
        if (data?.id) {
          const restored = cleanSavedMessages(data.messages);
          setThreadId(data.id);
          setMessages(restored.length ? restored : freshMessages());
        } else {
          await createFreshThread();
        }
        if (!cancelled) setHistoryLoaded(true);
      } catch (loadError) {
        if (!cancelled) setError(`Your private chat history could not load: ${loadError.message || "please try again."}`);
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, userId, historyLoaded]);
  React.useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [open, messages, sending]);
  const checkInOnTasks = async () => {
    const task = (incompleteTasks || [])[0];
    if (!task || sending || historyLoading) return;
    setTaskToConfirm(null);
    setLastTaskAsked(task);
    setError("");
    const nextMessages = [...messages, { role: "assistant", content: `Okay, baby — I see “${task.label}” is still waiting. Did you get it done, or would you like to make it tiny together?` }];
    setMessages(nextMessages);
    try { await saveThread(nextMessages); } catch (saveError) { setError(`That message is visible here, but could not be saved: ${saveError.message}`); }
  };
  const send = async (messageOverride = null, options = {}) => {
    const text = (typeof messageOverride === "string" ? messageOverride : draft).trim();
    if (!text || sending) return;
    const confirmsLastTask = !!lastTaskAsked && /\b(?:yes|yeah|yep|yup|done|finished|i did(?: that| it)?|i think i did(?: that| it)?|pretty sure|probably)\b/i.test(text);
    if (confirmsLastTask) {
      const confirmedMessages = [...messages, { role: "user", content: text }, { role: "assistant", content: `That sounds like a real win, baby. Shall I tuck “${lastTaskAsked.label}” into your done list?` }];
      setMessages(confirmedMessages);
      setDraft("");
      setError("");
      setTaskToConfirm(lastTaskAsked);
      setLastTaskAsked(null);
      try { await saveThread(confirmedMessages); } catch (saveError) { setError(`That reply is visible here, but could not be saved: ${saveError.message}`); }
      return;
    }
    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setDraft("");
    setError("");
    setTaskToConfirm(null);
    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch("/api/mamas-corner", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${session?.access_token || ""}` },
        body: JSON.stringify({ messages: nextMessages, unfinishedTasks: (incompleteTasks || []).slice(0, 6).map((task) => task.label).filter(Boolean), taskCheckIn: !!options.taskCheckIn, parentVoice }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.reply) throw new Error(result.error || "No reply yet.");
      const repliedMessages = [...nextMessages, { role: "assistant", content: result.reply }];
      setMessages(repliedMessages);
      await saveThread(repliedMessages);
      const completedLanguage = /\b(?:i(?:'ve| have)?|we(?:'ve| have)?)\s+(?:did|finished|completed|checked off|took care of)|\b(?:all done|done with|finished with|completed)\b/i.test(text);
      const confirmsAskedTask = !!lastTaskAsked && /^\s*(?:yes|yeah|yep|yup|i did|done|finished)\b/i.test(text);
      if (completedLanguage || confirmsAskedTask) {
        const normalizedText = text.toLowerCase();
        const matchedTask = (incompleteTasks || []).find((task) => {
          const label = (task.label || "").toLowerCase();
          if (label && normalizedText.includes(label)) return true;
          const words = label.split(/[^a-z0-9]+/).filter((word) => word.length >= 4 && !["with", "from", "that", "your", "today"].includes(word));
          return words.length >= 2 && words.filter((word) => normalizedText.includes(word)).length >= 2;
        });
        if (matchedTask || confirmsAskedTask) {
          setTaskToConfirm(matchedTask || lastTaskAsked);
          setLastTaskAsked(null);
        }
      }
    } catch (requestError) {
      setMessages((current) => current.slice(0, -1));
      setDraft(text);
      setError(requestError.message || `${caregiverName}’s Corner could not reply just yet.`);
    } finally {
      setSending(false);
    }
  };
  return (
    <section className="mamas-corner" aria-label={`${caregiverName}'s Corner`}>
      <button type="button" className="mamas-corner-header" onClick={() => setOpen(true)} aria-expanded={open}>
        <span><span className="mamas-corner-kicker">🍼 PRIVATE {caregiverName.toUpperCase()}’S CORNER</span><span className="mamas-corner-title">Cozy private chat</span></span>
        <span aria-hidden="true">›</span>
      </button>
      <div className="mamas-corner-summary">Open your private, saved chat and continue where you left off.</div>
      {open && <div className="mamas-private-window" role="dialog" aria-modal="true" aria-label={`Private ${caregiverName}'s Corner chat`}>
        <div className="mamas-private-card">
        <div className="mamas-private-header"><div><span className="mamas-corner-kicker">🍼 PRIVATE {caregiverName.toUpperCase()}’S CORNER</span><span className="mamas-corner-title">Cozy private chat</span></div><button type="button" onClick={() => setOpen(false)} aria-label={`Close ${caregiverName}'s Corner`}>Close</button></div>
        <div className="mamas-corner-body">
        <p className="mamas-corner-note">Saved privately to your signed-in profile so you can continue later. Guardians cannot see this chat. This is a fictional AI companion, not a person, clinician, or emergency service.</p>
        <div className="mamas-messages" aria-live="polite">
          {historyLoading && <div className="mamas-message">Opening your private chat…</div>}
          {messages.map((message, index) => <div key={`${message.role}-${index}`} className={message.role === "user" ? "mamas-message mamas-message-user" : "mamas-message"}>{message.content}</div>)}
          {sending && <div className="mamas-message">{caregiverName} is thinking…</div>}
          <div ref={messagesEndRef} />
        </div>
        {error && <div className="mamas-corner-error" role="alert">{error}</div>}
        {messages.length === 1 && <div className="mamas-starters" aria-label="Conversation starters">
          {conversationStarters.map((starter) => <button key={starter} type="button" onClick={() => send(starter)} disabled={sending || historyLoading}>{starter}</button>)}
        </div>}
        {taskToConfirm && <div className="mamas-task-confirm"><div>Did you want {caregiverName} to check off <strong>{taskToConfirm.label}</strong>?</div><div><button type="button" onClick={() => { onConfirmTask(taskToConfirm.key); setTaskToConfirm(null); setLastTaskAsked(null); }}>✓ Yes, tuck it in</button><button type="button" onClick={() => setTaskToConfirm(null)}>Not yet</button></div></div>}
        <button type="button" className="mamas-task-checkin" onClick={checkInOnTasks} disabled={sending || historyLoading || !(incompleteTasks || []).length}>{(incompleteTasks || []).length ? `🧸 ${caregiverName}, check in on my tasks` : "🧸 Everything is tucked in"}</button>
        <div className="mamas-compose">
          <textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }} maxLength="1200" placeholder={`Tell ${caregiverName} what is going on…`} aria-label={`Message ${caregiverName}'s Corner`} rows="2" />
          <button type="button" onClick={send} disabled={!draft.trim() || sending || historyLoading}>{sending ? "Thinking…" : "Send"}</button>
        </div>
        <button type="button" className="mamas-reset" onClick={async () => { setHistoryLoading(true); try { await createFreshThread(); } catch (createError) { setError(`A fresh chat could not be created: ${createError.message}`); } finally { setHistoryLoading(false); } }} disabled={sending || historyLoading}>Start a fresh chat</button>
        </div>
        </div>
      </div>}
    </section>
  );
}

function littleSpaceTaskLabel(label) {
  const task = String(label || "").trim();
  const lower = task.toLowerCase();
  const restAfter = (pattern) => task.match(pattern)?.[1]?.trim().replace(/[.!?]+$/, "") || "";
  if (/brush.*teeth|teeth.*brush/.test(lower)) return "Let's make those teeth sparkly";
  if (/drink.*water|water bottle|hydrate/.test(lower)) return "Let's take some little sips";
  if (/refill.*(?:medicine|medication|prescription)|pharmacy|pick up.*prescription/.test(lower)) return "Let's get the helping medicine ready for later";
  if (/medicine|medication|vitamin/.test(lower)) return "Let's take the helping medicine";
  if (/breakfast/.test(lower)) return "Let's have a cozy breakfast";
  if (/lunch/.test(lower)) return "Let's have a cozy lunch";
  if (/dinner|supper/.test(lower)) return "Let's have a cozy dinner";
  if (/appointment|doctor|dentist|therapy|therapist|counselor/.test(lower)) return "Let's get ready for this caring appointment, one step at a time";
  if (/homework|study|studying|schoolwork|assignment|quiz|exam|classwork/.test(lower)) return "Let's do one tiny learning step";
  if (/work meeting|timesheet|work email|work task|admin|administrative/.test(lower)) return "Let's do one small work step, then take a breath";
  if (/laundry|wash clothes|fold clothes|dryer|washing machine/.test(lower)) return "Let's help the clothes get clean and cozy";
  if (/bedsheet|bed sheet|change.*sheets|change.*bedding|make.*bed/.test(lower)) return "Let's make the bed feel fresh and cozy";
  if (/dishes|dishwasher|wash.*plate|wash.*cup|kitchen cleanup|clean.*kitchen/.test(lower)) return "Let's help a few dishes find their clean spot";
  if (/grocery|groceries|shopping|buy |pick up.*(?:food|milk|bread)/.test(lower)) return "Let's gather the things we need, one little item at a time";
  if (/feed.*(?:dog|cat|pet)|walk.*(?:dog|pet)|litter|pet care|give.*pet/.test(lower)) return "Let's take care of our little animal friend";
  if (/trash|garbage|recycling|recycle/.test(lower)) return "Let's help the rubbish go to its outside home";
  if (/bill|budget|banking|pay rent|payment/.test(lower)) return "Let's take care of one important money step";
  if (/form|paperwork|application|document|filing/.test(lower)) return "Let's fill in one little piece of the paperwork";
  if (/shower|bath|wash up|wash-up/.test(lower)) return "Let's get fresh and cozy";
  if (/hair|skincare|skin care|shav|deodorant|floss|hygiene/.test(lower)) return "Let's do one gentle getting-ready step";
  if (/clothes|dress|get dressed/.test(lower)) return "Let's pick some comfy clothes";
  if (/bedtime|go to bed|sleep|wind down|night routine/.test(lower)) return "Let's get our cozy nest ready for sleep";
  if (/pack|backpack|bag|luggage|gather.*things/.test(lower)) return "Let's tuck the things we need into their bag";
  if (/journal|feelings|emotion|mood check|check in with myself/.test(lower)) return "Let's give our feelings one soft little moment";
  if (/draw|paint|color|colour|craft|music|practice.*instrument|hobby|create/.test(lower)) return "Let's have a little creative play time";
  if (/computer|laptop|phone update|software|download|upload|backup|password/.test(lower)) return "Let's help the device with one tiny tech step";
  if (/bus|train|drive|travel|leave the house|go to |head to /.test(lower)) return "Let's get ready for our little trip, one step at a time";
  if (/rest|break|sensory|quiet time|calm down|grounding/.test(lower)) return "Let's take a soft little pause for our body";
  if (/tidy|clean|put away/.test(lower)) return "Let's make one tiny spot cozy";
  if (/stretch|exercise|workout|walk|running|\brun\b/.test(lower)) return "Let's move our body a little";
  if (/prepare.*tomorrow|plan.*tomorrow/.test(lower)) return "Let's get one tiny thing ready for tomorrow";
  if (/^(?:email|e-mail|message|text)\s+/i.test(task)) return `Let's send one little message: ${restAfter(/^(?:email|e-mail|message|text)\s+(.+)$/i)}`;
  if (/^call\s+/i.test(task)) return `Let's make one little call to ${restAfter(/^call\s+(.+)$/i)}`;
  if (/^charge\s+/i.test(task)) return `Let's tuck ${restAfter(/^charge\s+(.+)$/i)} in for a charge`;
  if (/^(?:finish|complete)\s+/i.test(task)) return `Let's do one small part of ${restAfter(/^(?:finish|complete)\s+(.+)$/i)}`;
  if (/^read\s+/i.test(task)) return `Let's read a little bit of ${restAfter(/^read\s+(.+)$/i)}`;
  if (/^write\s+/i.test(task)) return `Let's write a tiny bit of ${restAfter(/^write\s+(.+)$/i)}`;
  if (/^(?:put|place)\s+/i.test(task)) return `Let's help ${restAfter(/^(?:put|place)\s+(.+)$/i)} get to its spot`;
  if (/^(?:make|cook|prepare)\s+/i.test(task)) return `Let's make ${restAfter(/^(?:make|cook|prepare)\s+(.+)$/i)} together, one little step at a time`;
  return `Let's take care of “${task}” together, one tiny step at a time`;
}

export function BabyModeCareSuite({ date, todayDone, todayTotal, activityDays, careDays, caregiverName, comfortItemName, littleJobs, onCompleteTask, onManageTasks, onOpenJournal }) {
  const [windDown, setWindDown] = React.useState([false, false, false]);
  const [comfortOpen, setComfortOpen] = React.useState(null);
  const [open, setOpen] = React.useState(true);
  const [littleJobsExpanded, setLittleJobsExpanded] = React.useState(false);
  const stickers = ["🌈 Rainbow try", "⭐ Brave little star", "🧸 Cozy helper", "🫧 Bubble break", "🌼 Gentle grower"];
  const sticker = stickers[(todayDone + activityDays) % stickers.length];
  const nurseryLevel = activityDays >= 365 ? "a whole yearlight room, filled with keepsakes" : activityDays >= 150 ? "a cozy reading nook and an aurora night-light" : activityDays >= 75 ? "a starry ceiling and a storybook shelf" : activityDays >= 45 ? "a soft star lamp, toy basket, and a tiny plant" : activityDays >= 21 ? "a storybook shelf and rainy-day coat hook" : activityDays >= 10 ? "a soft star lamp and toy basket" : activityDays >= 3 ? "a little cloud mobile" : "a cozy blanket and one tiny teddy";
  const allWindDownDone = windDown.every(Boolean);
  const comfortTools = [
    { id: "sip", label: "Take a sip", text: "One sip of water is enough. You do not have to fix the whole day right now." },
    { id: "breathe", label: "Breathe with me", text: "In for 3… hold for 2… out for 4. Let's do it one more time, nice and slow." },
    { id: "ground", label: "Find your room", text: "Name one soft thing you can see, one sound you can hear, and one place your body is supported." },
  ];
  return (
    <section className="baby-care-suite" aria-label="Baby Mode cozy care">
      <button type="button" className="baby-care-header" onClick={() => setOpen((current) => !current)} aria-expanded={open}>
        <div><div className="baby-care-kicker">🧸 LITTLE CARE CORNER</div><div className="baby-care-title">Tiny things count here.</div></div>
        <div className="baby-care-header-right"><span className="baby-sticker" aria-label={`Today's sticker: ${sticker}`}>{sticker}</span><span className="baby-care-arrow" aria-hidden="true">{open ? "⌃" : "›"}</span></div>
      </button>
      {!open && <div className="baby-care-summary">{todayTotal ? `${todayDone} of ${todayTotal} little jobs tucked in today` : "No must-dos today — rest is allowed"}</div>}
      {open && <>
      {todayTotal === 0 ? (
        <div className="baby-gentle-empty">No must-dos are waiting today. Your only job can be to rest, play, or pick one tiny kind thing for yourself.</div>
      ) : (
        <div className="baby-milestone"><span aria-hidden="true">🎀</span><span><strong>{todayDone} of {todayTotal}</strong> little jobs tucked in today. {todayDone ? "That is real care." : "We can start teeny-tiny."}</span></div>
      )}
      <div className="baby-nursery-unlock"><span aria-hidden="true">🏠</span> Your nursery has {nurseryLevel}. <strong>{activityDays} care {activityDays === 1 ? "day" : "days"}</strong> helped build it.</div>
      <div className="baby-wind-down">
        <div className="baby-section-label">🌙 BEDTIME WIND-DOWN</div>
        <div className="baby-wind-down-copy">A three-little-step landing pad for whenever you are ready to soften the day.</div>
        <div className="baby-wind-down-steps">
          {["Put down one thing", "Get comfy", "Choose tomorrow's tiny first step"].map((label, index) => (
            <button key={label} type="button" onClick={() => setWindDown((current) => current.map((checked, itemIndex) => itemIndex === index ? !checked : checked))} aria-pressed={windDown[index]} className={windDown[index] ? "baby-step baby-step-done" : "baby-step"}>{windDown[index] ? "✓" : index + 1}. {label}</button>
          ))}
        </div>
        {allWindDownDone && <div className="baby-wind-down-finished">All tucked in. You did enough for today. 🌙</div>}
      </div>
      <div className="baby-comfort">
        <div className="baby-section-label">🫧 IF IT FEELS TOO BIG</div>
        <div className="baby-comfort-actions">
          {comfortTools.map((tool) => <button key={tool.id} type="button" onClick={() => setComfortOpen((current) => current === tool.id ? null : tool.id)} aria-expanded={comfortOpen === tool.id}>{tool.label}</button>)}
        </div>
        {comfortOpen && <div className="baby-comfort-note">{comfortTools.find((tool) => tool.id === comfortOpen)?.text}</div>}
      </div>
      <div className="baby-comfort">
        <div className="baby-section-label">🧸 MY LITTLE JOBS</div>
        <div className="baby-wind-down-copy">{caregiverName} made your real tasks softer for Little Space. Tap one when it is tucked in.</div>
        <div className="baby-little-jobs">
          {(littleJobs || []).slice(0, littleJobsExpanded ? undefined : 5).map((task) => {
            const cozyLabel = littleSpaceTaskLabel(task.label);
            return <button key={task.key} type="button" onClick={() => onCompleteTask(task.key)} aria-label={`Complete ${task.label}`}>
              <span className="baby-little-job-check" aria-hidden="true">○</span>
              <span><strong>{cozyLabel}</strong>{cozyLabel !== task.label && <small>{task.label}</small>}</span>
            </button>;
          })}
        </div>
        {!(littleJobs || []).length && <div className="baby-comfort-note">Everything is tucked in. You can rest now. 🧸</div>}
        {(littleJobs || []).length > 5 && <button type="button" className="baby-little-jobs-toggle" onClick={() => setLittleJobsExpanded((expanded) => !expanded)}>{littleJobsExpanded ? "Show fewer little jobs" : `Show all ${(littleJobs || []).length} little jobs`}</button>}
        {onManageTasks && <button type="button" className="baby-little-jobs-toggle" onClick={onManageTasks}>✏️ Change my little jobs</button>}
        {comfortItemName && <div className="baby-comfort-note">🧸 {comfortItemName} can be part of any cozy routine today.</div>}
      </div>
      <button type="button" className="baby-journal-prompt" onClick={onOpenJournal}>📖 Put one little thought in PlushJournal <span>›</span></button>
      <div className="baby-care-footer">{careDays ? `${careDays} gentle-care ${careDays === 1 ? "day" : "days"} collected so far` : `Start your first gentle-care day whenever you are ready`} · {date}</div>
      </>}
    </section>
  );
}
