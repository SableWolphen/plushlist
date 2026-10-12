// Resolve the visible Guardian action from the permissions that are currently active.
// Losing permission to send notes must not leave an empty panel selected.
export function resolveSupportAction(selected, allowed = {}) {
  const available = ["note", "reward", "task"].filter((action) => allowed[action] === true);
  return available.includes(selected) ? selected : (available[0] || null);
}
