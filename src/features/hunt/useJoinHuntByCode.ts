import { useMutation } from '@tanstack/react-query';
import { normalizeJoinCode } from '../../domain/hunt/joinCode';
import { collection, db, getDocs, limit, query, where } from '../../shared/lib/firebase';
import type { HuntSummary } from '../../shared/types/hunt';

export class HuntNotFoundError extends Error {
  constructor() {
    super('No hunt matches that join code.');
    this.name = 'HuntNotFoundError';
  }
}

async function findHuntByCode(rawCode: string): Promise<HuntSummary> {
  const code = normalizeJoinCode(rawCode);
  const huntsQuery = query(
    collection(db, 'hunts'),
    where('status', '==', 'live'),
    where('visibility', '==', 'code'),
    where('joinCode', '==', code),
    limit(1),
  );
  const snapshot = await getDocs(huntsQuery);
  const found = snapshot.docs[0];
  if (!found) throw new HuntNotFoundError();
  return { id: found.id, ...found.data() } as HuntSummary;
}

export function useJoinHuntByCode() {
  return useMutation({ mutationFn: findHuntByCode });
}
