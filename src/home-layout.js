export const HOME_SECTIONS = [
  { id: "tiny", label: "One tiny thing" },
  { id: "tasks", label: "Today tasks" },
  { id: "habits", label: "Habits" },
  { id: "schedule", label: "Today's plan" },
  { id: "shortcuts", label: "Little Jobs & support" },
  { id: "noticed", label: "PlushLife noticed" },
];

export function normalizeHomeLayout(value) {
  const ids = HOME_SECTIONS.map(section => section.id);
  const order = [...new Set(Array.isArray(value?.order) ? value.order.filter(id => ids.includes(id)) : [])];
  return {
    order: [...order, ...ids.filter(id => !order.includes(id))],
    hidden: [...new Set(Array.isArray(value?.hidden) ? value.hidden.filter(id => ids.includes(id)) : [])],
  };
}

export function moveHomeSection(layout, id, offset) {
  const next = normalizeHomeLayout(layout);
  const index = next.order.indexOf(id);
  const target = Math.max(0, Math.min(next.order.length - 1, index + offset));
  if (index < 0 || target === index) return next;
  next.order.splice(index, 1);
  next.order.splice(target, 0, id);
  return next;
}

export function homeDisplayGroups(layout) {
  const normalized = normalizeHomeLayout(layout);
  const visible = normalized.order.filter(id => !normalized.hidden.includes(id) && !['shortcuts','noticed'].includes(id));
  const paired = visible.includes('schedule') && visible.includes('tasks');
  let placed = false;
  return visible.flatMap(id => {
    if (!paired || !['schedule','tasks'].includes(id)) return [[id]];
    if (placed) return [];
    placed = true;
    return [['schedule','tasks']];
  });
}
