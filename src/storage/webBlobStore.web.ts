const DB_NAME = 'photolab-assets';
const DB_VERSION = 1;
const STORE = 'images';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const request = run(tx.objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
    tx.oncomplete = () => db.close();
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error('IndexedDB transaction failed'));
    };
  });
}

export async function persistImageBlob(id: string, uri: string): Promise<void> {
  if (!('indexedDB' in window)) return;
  const response = await fetch(uri);
  const blob = await response.blob();
  await withStore('readwrite', (store) => store.put(blob, id));
}

export async function restoreImageBlobUrl(id: string): Promise<string | null> {
  if (!('indexedDB' in window)) return null;
  const blob = await withStore<Blob | undefined>('readonly', (store) => store.get(id));
  return blob ? URL.createObjectURL(blob) : null;
}

export async function deleteImageBlob(id: string): Promise<void> {
  if (!('indexedDB' in window)) return;
  await withStore('readwrite', (store) => store.delete(id));
}
