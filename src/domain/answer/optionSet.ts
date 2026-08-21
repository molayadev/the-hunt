export function isCorrectOptionSet(
  selected: readonly string[],
  correct: readonly string[],
): boolean {
  if (selected.length === 0) return false;
  const selectedSet = new Set(selected);
  const correctSet = new Set(correct);
  if (selectedSet.size !== correctSet.size) return false;
  for (const id of selectedSet) {
    if (!correctSet.has(id)) return false;
  }
  return true;
}
