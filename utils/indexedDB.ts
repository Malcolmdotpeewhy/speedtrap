
// Simple Promise-based IndexedDB wrapper
const DB_NAME = 'DriveProDB';
export const STORE_NAME = 'road_intelligence';
export const LOGS_STORE_NAME = 'logs';
const DB_VERSION = 2;

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
      if (!db.objectStoreNames.contains(LOGS_STORE_NAME)) {
        db.createObjectStore(LOGS_STORE_NAME);
      }
    };
  });
};

export const getStore = async (mode: IDBTransactionMode, storeName: string = STORE_NAME): Promise<IDBObjectStore> => {
  const db = await openDB();
  const transaction = db.transaction(storeName, mode);
  return transaction.objectStore(storeName);
};

export const idbGet = async <T>(key: string, storeName: string = STORE_NAME): Promise<T | null> => {
  try {
    const store = await getStore('readonly', storeName);
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

export const idbSet = async (key: string, value: any, storeName: string = STORE_NAME): Promise<void> => {
  try {
    const store = await getStore('readwrite', storeName);
    const request = store.put(value, key);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('IDB Set Error', e);
  }
};

export const idbDel = async (key: string, storeName: string = STORE_NAME): Promise<void> => {
  try {
    const store = await getStore('readwrite', storeName);
    const request = store.delete(key);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('IDB Del Error', e);
  }
};

export const idbGetAllKeys = async (storeName: string = STORE_NAME): Promise<IDBValidKey[]> => {
    try {
        const store = await getStore('readonly', storeName);
        const request = store.getAllKeys();
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.error('IDB GetAllKeys Error', e);
        return [];
    }
};

export const idbGetAll = async <T>(storeName: string = STORE_NAME): Promise<T[]> => {
    try {
        const store = await getStore('readonly', storeName);
        const request = store.getAll();
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result as T[]);
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.error('IDB GetAll Error', e);
        return [];
    }
};

export const idbClear = async (storeName: string = STORE_NAME): Promise<void> => {
    try {
        const store = await getStore('readwrite', storeName);
        const request = store.clear();
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.error('IDB Clear Error', e);
    }
};
