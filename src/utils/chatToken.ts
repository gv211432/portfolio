const DB_NAME = "gaurav_chat";
const STORE_NAME = "session";
const TOKEN_KEY = "token";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbGet(db: IDBDatabase, key: string): Promise<string | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result as string | undefined);
    req.onerror = () => reject(req.error);
  });
}

function idbSet(db: IDBDatabase, key: string, value: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const req = tx.objectStore(STORE_NAME).put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/** Returns the existing token, or null if not yet created. */
export async function getChatToken(): Promise<string | null> {
  try {
    const db = await openDB();
    return (await idbGet(db, TOKEN_KEY)) ?? null;
  } catch {
    return null;
  }
}

/** Returns the existing token, creating and persisting a new one if absent. */
export async function getOrCreateChatToken(): Promise<string> {
  try {
    const db = await openDB();
    let token = await idbGet(db, TOKEN_KEY);
    if (!token) {
      token = crypto.randomUUID();
      await idbSet(db, TOKEN_KEY, token);
    }
    return token;
  } catch {
    // Fallback: return a session-only token if IndexedDB is unavailable
    return crypto.randomUUID();
  }
}
