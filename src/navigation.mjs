export const MAIN_DESTINATIONS = [
  { id: "today", label: "Today", icon: "home" },
  { id: "tasks", label: "Plan", icon: "tasks" },
  { id: "care", label: "Care", icon: "care" },
  { id: "progress", label: "Progress", icon: "progress" },
  { id: "guardian", label: "Guardian", icon: "guardian" },
];

export const PLAN_VIEWS = [["today", "Today"], ["habits", "Habits"], ["later", "Later"], ["calendar", "Calendar"]];

export function mainDestination(dashboard) {
  return dashboard === "week" ? "tasks" : dashboard;
}

export function adjacentDestination(dashboard, direction) {
  const current = Math.max(0, MAIN_DESTINATIONS.findIndex(item => item.id === mainDestination(dashboard)));
  return MAIN_DESTINATIONS[Math.max(0, Math.min(MAIN_DESTINATIONS.length - 1, current + direction))].id;
}

export function guardianLanding(viewMode, hasInvitations = false) {
  return viewMode === "caretaker" || hasInvitations ? "support" : "overview";
}
