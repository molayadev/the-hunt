export interface Profile {
  readonly name: string;
}

function isProfileShaped(value: unknown): value is { name: unknown } {
  return typeof value === 'object' && value !== null && 'name' in value;
}

export function parseProfile(raw: string | null): Profile | null {
  if (raw === null) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isProfileShaped(parsed) || typeof parsed.name !== 'string') return null;

  const name = parsed.name.trim();
  return name === '' ? null : { name };
}
