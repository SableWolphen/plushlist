export type PlushLifeUpdate = {
  id: string;
  releasedAt: string;
  title: string;
  summary: string;
};

export const PLUSHLIFE_UPDATES: PlushLifeUpdate[] = [
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

export function newestUpdates(limit = 3) {
  return [...PLUSHLIFE_UPDATES]
    .sort((a, b) => b.releasedAt.localeCompare(a.releasedAt))
    .slice(0, Math.max(1, limit));
}
