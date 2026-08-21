import { useMutation } from '@tanstack/react-query';
import { normalizeJoinCode } from '../../domain/hunt/joinCode';
import { startHunt } from '../../shared/lib/callables';
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

  // Joining unlocks the hunt's first station right away: a player has no
  // way to know where a physical QR code is until something reveals it.
  await startHunt({ huntId: found.id, clientRequestId: crypto.randomUUID() });

  return { id: found.id, ...found.data() } as HuntSummary;
}

export function useJoinHuntByCode() {
  return useMutation({ mutationFn: findHuntByCode });
}
