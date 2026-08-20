const stripCombiningDiacritics = (value: string): string =>
  value.normalize('NFD').replace(/\p{Mn}/gu, '');

const stripPunctuation = (value: string): string => value.replace(/[^\p{L}\p{N}\s]/gu, '');

const collapseWhitespace = (value: string): string => value.replace(/\s+/g, ' ');

export function normalizeAnswer(raw: string): string {
  return collapseWhitespace(stripPunctuation(stripCombiningDiacritics(raw.trim().toLowerCase())));
}

export function isCorrectAnswer(raw: string, acceptedAnswers: readonly string[]): boolean {
  const normalized = normalizeAnswer(raw);
  if (normalized === '') return false;
  return acceptedAnswers.some((accepted) => normalizeAnswer(accepted) === normalized);
}
