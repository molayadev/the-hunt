import type { QueuedScan } from '../../domain/scan/queue';
import type { ScanQueueStore } from '../../features/scan/useOfflineScanQueue';

const DB_NAME = 'rastro-scan-queue';
const STORE_NAME = 'scans';
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME, { keyPath: 'clientRequestId' });
    };
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(new Error('Failed to open the scan queue database.'));
    };
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const request = run(transaction.objectStore(STORE_NAME));
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(new Error('Scan queue database operation failed.'));
    };
  });
}

export const indexedDbScanQueueStore: ScanQueueStore = {
  getAll: () =>
    withStore<QueuedScan[]>('readonly', (store) => store.getAll() as IDBRequest<QueuedScan[]>),
  add: async (scan) => {
    await withStore('readwrite', (store) => store.put(scan));
  },
  remove: async (clientRequestId) => {
    await withStore('readwrite', (store) => store.delete(clientRequestId));
  },
};
