// Postgres jsonb does not preserve object-key order. Compare the ordered
// schedule items, not the serializer's choice of keys within each item.
export function sameScheduleEntries(actual, expected) {
  return Array.isArray(actual) && Array.isArray(expected) &&
    actual.length === expected.length && actual.every((entry, index) => {
      const wanted = expected[index];
      return entry && wanted && typeof entry === "object" && typeof wanted === "object" &&
        (entry.time ?? "") === (wanted.time ?? "") &&
        (entry.text ?? "") === (wanted.text ?? "");
    });
}
