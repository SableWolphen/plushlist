import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const WATCH_GROUPS = [
  { id: "morning", label: "Morning" },
  { id: "habits", label: "Habits" },
  { id: "evening", label: "Evening" },
  { id: "night", label: "Night" },
  { id: "extras", label: "Extras" },
] as const;
const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, content-type",
  "access-control-allow-methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json", "cache-control": "no-store", ...CORS_HEADERS },
});

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function pairingCode() {
  const alphabetLength = CODE_ALPHABET.length;
  const maxUnbiased = Math.floor(256 / alphabetLength) * alphabetLength;
  const chars: string[] = [];

  while (chars.length < 8) {
    const byte = crypto.getRandomValues(new Uint8Array(1))[0];
    if (byte >= maxUnbiased) continue;
    chars.push(CODE_ALPHABET[byte % alphabetLength]);
  }

  return chars.join("");
}

function validDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

async function pairingForSecret(deviceSecret: string) {
  const hash = await sha256(deviceSecret);
  const { data, error } = await admin.from("watch_pairings")
    .select("id,user_id,device_name,revoked_at")
    .eq("device_secret_hash", hash).maybeSingle();
  if (error) throw error;
  if (!data || data.revoked_at) return null;
  return data;
}

function taskOccursToday(task: Record<string, any>, date: string, dayId: string) {
  if (task.archived_at) return false;
  if (task.paused_since && task.paused_since <= date && (!task.paused_until || date <= task.paused_until)) return false;
  if (task.schedule_type === "once") return task.one_time_date === date;
  if (task.schedule_type === "range" && ((task.start_date && date < task.start_date) || (task.end_date && date > task.end_date))) return false;
  const scheduleDays = Array.isArray(task.schedule_days) ? task.schedule_days : [];
  return scheduleDays.length ? scheduleDays.includes(dayId) : task.day_id === "daily" || task.day_id === dayId;
}

function watchGroupForTask(task: Record<string, any>) {
  const section = String(task.section || "").trim().toLowerCase();
  if (task.is_bonus || /\b(extra|extras|bonus|optional)\b/.test(section)) return "extras";
  if (/\b(morning|breakfast|wake|wake-up|am)\b/.test(section)) return "morning";
  if (/\b(night|bed|bedtime|sleep|wind[ -]?down)\b/.test(section)) return "night";
  if (/\b(evening|dinner|pm)\b/.test(section)) return "evening";
  if (/\b(habit|habits|routine|routines|daily|every day|everyday)\b/.test(section)) return "habits";
  return "habits";
}

function smartGroupForHour(hour: number) {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 17 && hour < 21) return "evening";
  if (hour >= 21 || hour < 5) return "night";
  return "habits";
}

function normalizedLimit(value: unknown) {
  const number = Math.floor(Number(value) || 3);
  return Math.min(5, Math.max(1, number));
}

function normalizedDayType(value: unknown) {
  const type = String(value || "full").toLowerCase();
  return ["full", "soft", "tiny", "recovery", "rest"].includes(type) ? type : "full";
}

function labelForDayType(task: Record<string, any>, dayType: string) {
  if (dayType === "tiny" && String(task.tiny_label || "").trim()) return String(task.tiny_label).trim();
  if (["soft", "recovery"].includes(dayType) && String(task.soft_label || "").trim()) return String(task.soft_label).trim();
  return String(task.task || "Task");
}

function visibleTasksForDay(tasks: Record<string, any>[], dayType: string) {
  if (dayType === "rest") return [];
  if (dayType === "tiny") {
    const essentials = tasks.filter((task) => !task.is_bonus && task.essential_on_low_capacity);
    return essentials.length ? essentials : tasks.filter((task) => !task.is_bonus).slice(0, 3);
  }
  if (dayType === "recovery") {
    const essentials = tasks.filter((task) => !task.is_bonus && task.essential_on_low_capacity);
    return essentials.length ? essentials : tasks.filter((task) => !task.is_bonus).slice(0, 5);
  }
  if (dayType === "soft") return tasks.filter((task) => !task.is_bonus);
  return tasks;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "POST required" }, 405);
  try {
    const body = await req.json();
    const action = String(body?.action || "");

    if (action === "claim") {
      const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
      const { data: authData, error: authError } = await admin.auth.getUser(token);
      if (authError || !authData.user) return json({ error: "Sign in before connecting a watch" }, 401);
      const code = String(body?.pairing_code || "").trim().toUpperCase();
      if (!/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/.test(code)) return json({ error: "Invalid or expired code" }, 400);
      const { data: pairing, error } = await admin.from("watch_pairings").update({
        user_id: authData.user.id,
        linked_at: new Date().toISOString(),
        pairing_code: null,
        pairing_expires_at: null,
        revoked_at: null,
      }).eq("pairing_code", code).is("user_id", null).is("revoked_at", null)
        .gt("pairing_expires_at", new Date().toISOString()).select("device_name").maybeSingle();
      if (error) throw error;
      if (!pairing) return json({ error: "Invalid or expired code" }, 400);
      return json({ connected: true, device_name: pairing.device_name });
    }

    const deviceSecret = String(body?.device_secret || "");
    if (deviceSecret.length < 32 || deviceSecret.length > 256) return json({ error: "Invalid watch credential" }, 401);

    if (action === "register") {
      const hash = await sha256(deviceSecret);
      const existing = await pairingForSecret(deviceSecret);
      if (existing?.user_id) {
        await admin.from("watch_pairings").update({ last_seen_at: new Date().toISOString() }).eq("id", existing.id);
        return json({ connected: true, device_name: existing.device_name });
      }
      const code = pairingCode();
      const expiresAt = new Date(Date.now() + 15 * 60_000).toISOString();
      const { error } = await admin.from("watch_pairings").upsert({
        device_secret_hash: hash,
        pairing_code: code,
        pairing_expires_at: expiresAt,
        user_id: null,
        linked_at: null,
        revoked_at: null,
        device_name: String(body?.device_name || "Amazfit watch").slice(0, 80),
      }, { onConflict: "device_secret_hash" });
      if (error) throw error;
      return json({ connected: false, pairing_code: code, expires_at: expiresAt });
    }

    const pairing = await pairingForSecret(deviceSecret);
    if (!pairing?.user_id) return json({ connected: false, error: "Watch is not connected" }, 401);
    await admin.from("watch_pairings").update({ last_seen_at: new Date().toISOString() }).eq("id", pairing.id);

    const date = body?.date;
    const dayId = String(body?.day_id || "").toLowerCase();
    if (!validDate(date) || !["mon", "tue", "wed", "thu", "fri", "sat", "sun"].includes(dayId)) {
      return json({ error: "Invalid phone-local date" }, 400);
    }

    if (action === "sync") {
      const [{ data: tasks, error: taskError }, { data: progress, error: progressError }, { data: checkIn, error: checkInError }] = await Promise.all([
        admin.from("tracker_tasks").select("task_key,day_id,section,task,detail,sort_order,is_bonus,schedule_type,start_date,end_date,one_time_date,schedule_days,archived_at,paused_since,paused_until,soft_label,tiny_label,estimated_minutes,essential_on_low_capacity").eq("user_id", pairing.user_id).order("is_bonus").order("sort_order"),
        admin.from("daily_progress").select("completed_keys").eq("user_id", pairing.user_id).eq("progress_date", date).maybeSingle(),
        admin.from("daily_check_ins").select("day_type,mood,energy").eq("user_id", pairing.user_id).eq("check_date", date).maybeSingle(),
      ]);
      if (taskError) throw taskError;
      if (progressError) throw progressError;
      if (checkInError) throw checkInError;

      const completed = new Set(Array.isArray(progress?.completed_keys) ? progress.completed_keys : []);
      const dayType = normalizedDayType(checkIn?.day_type);
      const allTodayTasks = (tasks || [])
        .filter((task) => taskOccursToday(task, date, dayId))
        .map((task) => ({ ...task, watch_group: watchGroupForTask(task) }));
      const todayTasks = visibleTasksForDay(allTodayTasks, dayType);

      const groups = WATCH_GROUPS
        .map((group) => ({ ...group, count: todayTasks.filter((task) => task.watch_group === group.id).length }))
        .filter((group) => group.count > 0);

      const requestedGroup = String(body?.group || "").toLowerCase();
      const phoneHour = Math.min(23, Math.max(0, Math.floor(Number(body?.phone_hour) || 0)));
      const smartGroup = smartGroupForHour(phoneHour);
      const availableIds = new Set(groups.map((group) => group.id));
      const fallbackOrder = [smartGroup, "habits", "morning", "evening", "night", "extras"];
      const activeGroup = availableIds.has(requestedGroup)
        ? requestedGroup
        : fallbackOrder.find((group) => availableIds.has(group)) || smartGroup;

      const requiredTasks = todayTasks.filter((task) => !task.is_bonus);
      const progressTotal = requiredTasks.length;
      const progressDone = requiredTasks.filter((task) => completed.has(task.task_key)).length;
      const nextStepTask = requiredTasks
        .filter((task) => !completed.has(task.task_key))
        .sort((a, b) => {
          const essentialDelta = Number(!!b.essential_on_low_capacity) - Number(!!a.essential_on_low_capacity);
          if (essentialDelta) return essentialDelta;
          const timeDelta = Number(b.watch_group === smartGroup) - Number(a.watch_group === smartGroup);
          if (timeDelta) return timeDelta;
          const minuteA = Number(a.estimated_minutes) || 999;
          const minuteB = Number(b.estimated_minutes) || 999;
          if (dayType !== "full" && minuteA !== minuteB) return minuteA - minuteB;
          return (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0);
        })[0] || null;

      const limit = normalizedLimit(body?.limit);
      const groupTasks = todayTasks.filter((task) => task.watch_group === activeGroup);
      const maxOffset = Math.max(0, Math.floor((Math.max(1, groupTasks.length) - 1) / limit) * limit);
      const requestedOffset = Math.max(0, Math.floor(Number(body?.offset) || 0));
      const offset = Math.min(requestedOffset, maxOffset);
      const page = groupTasks.slice(offset, offset + limit).map((task) => ({
        key: task.task_key,
        label: labelForDayType(task, dayType),
        detail: task.detail || "",
        section: task.section || "My tasks",
        group: task.watch_group,
        completed: completed.has(task.task_key),
      }));

      return json({
        connected: true,
        date,
        day_id: dayId,
        day_type: dayType,
        mood: checkIn?.mood || null,
        energy: checkIn?.energy || null,
        phone_time: String(body?.phone_time || ""),
        phone_hour: phoneHour,
        timezone_offset_minutes: Number(body?.timezone_offset_minutes) || 0,
        progress_done: progressDone,
        progress_total: progressTotal,
        next_step: nextStepTask ? {
          key: nextStepTask.task_key,
          label: labelForDayType(nextStepTask, dayType),
          group: nextStepTask.watch_group,
          estimated_minutes: Number(nextStepTask.estimated_minutes) || null,
        } : null,
        active_group: activeGroup,
        groups,
        offset,
        limit,
        total: groupTasks.length,
        has_more: offset + limit < groupTasks.length,
        tasks: page,
      });
    }

    if (action === "complete") {
      const taskKey = String(body?.task_key || "");
      if (!taskKey || taskKey.length > 200 || typeof body?.completed !== "boolean") return json({ error: "Invalid task update" }, 400);
      const { data: ownedTask, error: ownedTaskError } = await admin.from("tracker_tasks").select("task_key").eq("user_id", pairing.user_id).eq("task_key", taskKey).maybeSingle();
      if (ownedTaskError) throw ownedTaskError;
      if (!ownedTask) return json({ error: "Task not found" }, 404);
      const { data: progress, error: readError } = await admin.from("daily_progress").select("completed_keys").eq("user_id", pairing.user_id).eq("progress_date", date).maybeSingle();
      if (readError) throw readError;
      const completedKeys = new Set(Array.isArray(progress?.completed_keys) ? progress.completed_keys : []);
      body.completed ? completedKeys.add(taskKey) : completedKeys.delete(taskKey);
      const updatedAt = new Date().toISOString();
      const [legacy, daily] = await Promise.all([
        admin.from("tracker_progress").upsert({ user_id: pairing.user_id, task_key: taskKey, completed: body.completed, updated_at: updatedAt }, { onConflict: "user_id,task_key" }),
        admin.from("daily_progress").upsert({ user_id: pairing.user_id, progress_date: date, completed_keys: [...completedKeys], updated_at: updatedAt }, { onConflict: "user_id,progress_date" }),
      ]);
      if (legacy.error) throw legacy.error;
      if (daily.error) throw daily.error;
      return json({ connected: true, task_key: taskKey, completed: body.completed, date, updated_at: updatedAt });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (error) {
    console.error(error);
    return json({ error: "Watch sync is temporarily unavailable" }, 500);
  }
});
