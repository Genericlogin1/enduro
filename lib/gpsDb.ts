// IndexedDB helper for offline GPS point buffering.
// Points are stored when offline and flushed to the server when connection returns.

const DB_NAME = 'enduro-gps';
const STORE = 'pending_points';
const DB_VERSION = 1;

export type OfflinePoint = {
  sessionId: string;
  lat: number;
  lng: number;
  altitude: number;
  speed: number;
  recorded_at: string;
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function savePointOffline(point: OfflinePoint): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).add(point);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPendingPoints(): Promise<{ key: IDBValidKey; point: OfflinePoint }[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const results: { key: IDBValidKey; point: OfflinePoint }[] = [];
    const cursor = store.openCursor();
    cursor.onsuccess = (e) => {
      const c = (e.target as IDBRequest<IDBCursorWithValue>).result;
      if (c) {
        results.push({ key: c.key, point: c.value });
        c.continue();
      } else {
        resolve(results);
      }
    };
    cursor.onerror = () => reject(cursor.error);
  });
}

export async function deletePoints(keys: IDBValidKey[]): Promise<void> {
  if (!keys.length) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    keys.forEach(k => store.delete(k));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function countPendingPoints(): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
