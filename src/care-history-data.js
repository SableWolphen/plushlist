// Fetch complete private history without the server's default row limit.
export async function loadHistoryRows(supabase, table, columns, userId, dateColumn, { ascending = true, through } = {}) {
  const rows = [];
  for (let start = 0; ; start += 500) {
    let query = supabase.from(table).select(columns).eq("user_id", userId);
    if (through) query = query.lte(dateColumn, through);
    const { data, error } = await query.order(dateColumn, { ascending }).range(start, start + 499);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < 500) return rows;
  }
}
