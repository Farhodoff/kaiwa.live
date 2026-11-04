/**
 * Lightweight, zero-dependency asynchronous IndexedDB Key-Value storage.
 * Provides high-capacity, non-blocking local persistence for heavy assets
 * like Whiteboard canvases, large history collections, and rich flashcards.
 */

const DB_NAME = 'study_planner_idb';
const DB_VERSION = 1;
const STORE_NAME = 'app_keyval';

let dbPromise: Promise<IDBDatabase> | null = null;

function getIDBFactory(): IDBFactory | undefined {
  if (typeof window !== 'undefined' && window.indexedDB) {
    return window.indexedDB;
  }
  if (typeof globalThis !== 'undefined' && (globalThis as any).indexedDB) {
    return (globalThis as any).indexedDB;
  }
  return undefined;
}

export function openIDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const idb = getIDBFactory();
    if (!idb) {
      return reject(new Error('IndexedDB is not supported in this environment'));
    }

    const request = idb.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onerror = (event) => {
      dbPromise = null;
      reject((event.target as IDBOpenDBRequest).error);
    };
  });

  return dbPromise;
}

// In-memory fallback map for environments without IndexedDB (e.g., SSR or tests)
const fallbackMemoryMap = new Map<string, any>();

export async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openIDB();
    return new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result !== undefined ? (request.result as T) : null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    return fallbackMemoryMap.has(key) ? (fallbackMemoryMap.get(key) as T) : null;
  }
}

export async function idbSet<T>(key: string, value: T): Promise<void> {
  try {
    const db = await openIDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(value, key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    fallbackMemoryMap.set(key, value);
  }
}

export async function idbDelete(key: string): Promise<void> {
  try {
    const db = await openIDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    fallbackMemoryMap.delete(key);
  }
}

export async function idbClear(): Promise<void> {
  try {
    const db = await openIDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    fallbackMemoryMap.clear();
  }
}
