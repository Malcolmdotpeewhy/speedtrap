
// Simple Promise-based IndexedDB wrapper
const DB_NAME = 'DriveProDB';
const STORE_NAME = 'road_intelligence';
const DB_VERSION = 1;

export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => reject('IndexedDB error: ' + (event.target as IDBOpenDBRequest).error);

    request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

export const getStore = async (mode: IDBTransactionMode): Promise<IDBObjectStore> => {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, mode);
  return transaction.objectStore(STORE_NAME);
};

export const idbGet = async <T>(key: string): Promise<T | null> => {
  try {
    const store = await getStore('readonly');
    const request = store.get(key);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as T);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('IDB Get Error', e);
    return null;
  }
};

export const idbSet = async (key: string, value: any): Promise<void> => {
  try {
    const store = await getStore('readwrite');
    const request = store.put(value, key);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('IDB Set Error', e);
  }
};

export const idbDel = async (key: string): Promise<void> => {
  try {
    const store = await getStore('readwrite');
    const request = store.delete(key);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('IDB Del Error', e);
  }
};
