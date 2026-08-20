export function normalizeJoinCode(raw: string): string {
  return raw.trim().replace(/\s+/g, '').toUpperCase();
}
