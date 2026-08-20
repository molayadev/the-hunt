export function normalizeAnswer(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '') // quita tildes: "café" → "cafe" (marcas diacríticas combinantes)
    .replace(/[^\p{L}\p{N}\s]/gu, '') // quita puntuación: "¡Sí!" → "si"
    .replace(/\s+/g, ' '); // colapsa espacios
}

export function isCorrectAnswer(raw: string, acceptedAnswers: readonly string[]): boolean {
  const normalized = normalizeAnswer(raw);
  if (normalized === '') return false;
  return acceptedAnswers.some((accepted) => normalizeAnswer(accepted) === normalized);
}
