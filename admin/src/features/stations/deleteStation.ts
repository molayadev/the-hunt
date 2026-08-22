import { db, deleteDoc, doc } from '@/lib/firebase';
import { syncStationCount } from './saveStation';

export async function deleteStation(huntId: string, stationId: string): Promise<void> {
  await deleteDoc(doc(db, `hunts/${huntId}/stations/${stationId}/secret/answer`));
  await deleteDoc(doc(db, `hunts/${huntId}/stations/${stationId}`));
  await syncStationCount(huntId);
}
