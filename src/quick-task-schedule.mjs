// Shared by quick capture and the save path so a short form still saves a
// real, scheduled task. Omitted options keep the existing one-time default.
export function quickTaskSchedule(options = {}) {
  const kind = ["build", "reduce"].includes(options.kind) ? options.kind : "regular";
  const repeat = ["daily", "weekdays"].includes(options.repeat) ? options.repeat : kind !== "regular" ? "daily" : "once";
  return { kind, recurring: repeat !== "once", days: repeat === "weekdays" ? ["mon", "tue", "wed", "thu", "fri"] : [] };
}
