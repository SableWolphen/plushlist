// An unavailable/denied summary is unknown, never an empty 0/0 day.
export function summarizeGuardianProgress(rows, today) {
  if (!Array.isArray(rows) || !rows.length || rows.length > 7) return null;
  const dates = new Set();
  const clean = [];
  for (const row of rows) {
    if (!row || !/^\d{4}-\d{2}-\d{2}$/.test(row.progress_date) || dates.has(row.progress_date)) return null;
    dates.add(row.progress_date);
    const counts = Object.fromEntries(["total_count", "completed_count", "daily_count", "daily_completed", "scheduled_count", "scheduled_completed"].map(key => [key, Number(row[key])]));
    if (Object.keys(counts).some(key => row[key] == null) ||
      Object.values(counts).some(value => !Number.isSafeInteger(value) || value < 0) ||
      counts.daily_count + counts.scheduled_count !== counts.total_count ||
      counts.daily_completed + counts.scheduled_completed !== counts.completed_count ||
      counts.daily_completed > counts.daily_count || counts.scheduled_completed > counts.scheduled_count) return null;
    clean.push({ ...counts, date: row.progress_date });
  }
  const current = clean.find(row => row.date === today);
  if (!current) return null;
  const percent = (done, total) => total ? Math.round(done / total * 100) : 0;
  const total = clean.reduce((sum, row) => sum + row.total_count, 0);
  const done = clean.reduce((sum, row) => sum + row.completed_count, 0);
  return {
    today: { ...current, percent: percent(current.completed_count, current.total_count) },
    weekly: { total_count: total, completed_count: done, percent: percent(done, total) },
  };
}
