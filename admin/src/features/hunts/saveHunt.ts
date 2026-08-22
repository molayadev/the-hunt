import type { HuntDoc } from '@rastro/schema';
import { collection, db, doc, setDoc } from '@/lib/firebase';

export interface HuntFormValues {
  readonly title: string;
  readonly tagline: string;
  readonly icon: string;
  readonly language: HuntDoc['language'];
  readonly status: HuntDoc['status'];
  readonly visibility: HuntDoc['visibility'];
  readonly joinCode: string;
  readonly stationCount: number;
  readonly maxAttempts: number;
  readonly windowHours: number;
  readonly scope: HuntDoc['attemptPolicy']['scope'];
}

export async function saveHunt(
  id: string | null,
  values: HuntFormValues,
  createdBy: string,
): Promise<string> {
  const ref = id ? doc(db, `hunts/${id}`) : doc(collection(db, 'hunts'));
  const data: HuntDoc = {
    title: values.title,
    ...(values.tagline.trim() !== '' ? { tagline: values.tagline.trim() } : {}),
    ...(values.icon.trim() !== '' ? { icon: values.icon.trim() } : {}),
    status: values.status,
    visibility: values.visibility,
    ...(values.visibility === 'code' && values.joinCode.trim() !== ''
      ? { joinCode: values.joinCode.trim().toUpperCase() }
      : {}),
    stationCount: values.stationCount,
    attemptPolicy: {
      maxAttempts: values.maxAttempts,
      windowHours: values.windowHours,
      scope: values.scope,
    },
    createdBy,
    language: values.language,
  };
  await setDoc(ref, data);
  return ref.id;
}
