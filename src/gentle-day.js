export function smallerStep(row = {}) {
  const task = row.sourceTask || row;
  const custom = task.tiny_label || row.tiny_label || task.soft_label || row.soft_label;
  if (custom?.trim()) return custom.trim();
  const label = String(row.label || task.task || 'this task');
  if (/clean|tidy|organize|laundry/i.test(label)) return 'Put away three things, then decide whether to continue.';
  if (/walk|run|exercise|workout|stretch/i.test(label)) return 'Get ready and try two gentle minutes. You can stop there.';
  if (/study|read|write|work|email/i.test(label)) return 'Open what you need and try one line or two minutes.';
  return `Get one thing ready for “${label}”. Starting is enough for now.`;
}

export function nextLocalDate(date) {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + 1);
  return `${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,'0')}-${String(value.getDate()).padStart(2,'0')}`;
}

export function readGentleDay(storage, key) {
  try {
    const value = JSON.parse(storage.getItem(key) || '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch (_) { return {}; }
}

export function saveGentleDay(storage, key, value) {
  try { storage.setItem(key, JSON.stringify(value)); return true; }
  catch (_) { return false; }
}
