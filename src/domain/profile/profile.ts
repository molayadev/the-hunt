export interface Profile {
  readonly name: string;
}

export function parseProfile(raw: string | null): Profile | null {
  return { name: raw ?? '' };
}
