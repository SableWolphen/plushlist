export type PlushLifeUpdate = {
  id: string;
  releasedAt: string;
  title: string;
  summary: string;
};

export const PLUSHLIFE_UPDATES: PlushLifeUpdate[] = [
  {
    id: "checkin-redesign",
    releasedAt: "2026-09-17",
    title: "Check-in feels like PlushLife now",
    summary: "The daily check-in was rebuilt with cleaner spacing, stronger selected states, theme-aware colors, and your own saved comfort item in the safety prompt.",
  },
  {
    id: "theme-system",
    releasedAt: "2026-09-17",
    title: "Every theme has its own personality",
    summary: "Soft Plush, Soft Light, Twilight, and Meadow now keep distinct palettes in both light and dark mode instead of feeling like recolors of the same screen.",
  },
  {
    id: "calmer-today",
    releasedAt: "2026-09-17",
    title: "Today gets quieter when you need less",
    summary: "Tiny, Recovery, Rest, tired, anxious, and overwhelmed moments can automatically reduce visual noise so the next useful step stays easiest to find.",
  },
  {
    id: "one-overlay",
    releasedAt: "2026-09-17",
    title: "Less stuff fights for your attention",
    summary: "Check-ins, comeback prompts, mascot reactions, and floating controls now coordinate so only the most important interruption gets the screen at once.",
  },
  {
    id: "completed-today",
    releasedAt: "2026-09-17",
    title: "Finished tasks get out of the way",
    summary: "Completed tasks still stay available to undo, but they settle into a quieter Completed Today area instead of crowding the plan you still need.",
  },
  {
    id: "experience-polish-v2",
    releasedAt: "2026-09-17",
    title: "PlushLife is learning when to explain less",
    summary: "Repeated helper text can quiet down with familiarity, touch targets are more consistent, reduced-motion preferences are respected, and Next Step has clearer visual priority.",
  },
  {
    id: "adaptive-capacity",
    releasedAt: "2026-09-15",
    title: "Full, Soft, and Tiny now shape your day",
    summary: "PlushLife can use gentler task versions and a rough energy budget so your plan fits the capacity you actually have.",
  },
  {
    id: "smarter-next-step",
    releasedAt: "2026-09-15",
    title: "Next Step got smarter",
    summary: "Next Step now weighs your current capacity, task size, timing, and what has worked for you before.",
  },
  {
    id: "gentle-comeback",
    releasedAt: "2026-09-15",
    title: "Coming back does not mean catching up",
    summary: "Return and recovery flows are designed to help you restart gently instead of making missed days feel like debt.",
  },
  {
    id: "weekly-adaptation",
    releasedAt: "2026-09-15",
    title: "Weekly progress celebrates adapting",
    summary: "Weekly reflections can now recognize when you chose a softer plan instead of forcing the same routine every day.",
  },
];

function sortedUpdates() {
  return [...PLUSHLIFE_UPDATES].sort((a, b) => b.releasedAt.localeCompare(a.releasedAt));
}

export function newestUpdates(limit = 3) {
  return sortedUpdates().slice(0, Math.max(1, limit));
}

export function updatesForReturn(lastVisitDate: string | null | undefined, limit = 3) {
  const normalized = String(lastVisitDate || "").slice(0, 10);
  const available = sortedUpdates();
  if (!normalized) return available.slice(0, Math.max(1, limit));
  const sinceVisit = available.filter((update) => update.releasedAt > normalized);
  return (sinceVisit.length ? sinceVisit : available).slice(0, Math.max(1, limit));
}
