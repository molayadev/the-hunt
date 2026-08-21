import { useCallback, useState } from 'react';
import { parseProfile } from '../../domain/profile/profile';
import type { Profile } from '../../domain/profile/profile';

const STORAGE_KEY = 'rastro:profile';

export interface LocalProfile {
  readonly profile: Profile | null;
  readonly saveProfile: (name: string) => void;
}

export function useLocalProfile(): LocalProfile {
  const [profile, setProfile] = useState<Profile | null>(() =>
    parseProfile(localStorage.getItem(STORAGE_KEY)),
  );

  const saveProfile = useCallback((name: string) => {
    const next: Profile = { name: name.trim() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setProfile(next);
  }, []);

  return { profile, saveProfile };
}
