export const MAIN_DESTINATIONS = [
  { id: "today", label: "Today", icon: "home" },
  { id: "tasks", label: "Plan", icon: "tasks" },
  { id: "care", label: "Care", icon: "care" },
  { id: "progress", label: "Progress", icon: "progress" },
];

export const PLAN_VIEWS = [["today", "Today"], ["habits", "Habits"], ["later", "Later"], ["calendar", "Calendar"]];

// Calendar lives under Plan, and Guardian (your trusted person) lives under Care.
export function mainDestination(dashboard) {
  return dashboard === "week" ? "tasks" : dashboard === "guardian" ? "care" : dashboard;
}

export function adjacentDestination(dashboard, direction) {
  const current = Math.max(0, MAIN_DESTINATIONS.findIndex(item => item.id === mainDestination(dashboard)));
  return MAIN_DESTINATIONS[Math.max(0, Math.min(MAIN_DESTINATIONS.length - 1, current + direction))].id;
}

export function guardianLanding(viewMode, hasInvitations = false) {
  return "support";
}
