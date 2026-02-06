"use client";

type PendingAvatarRecord = {
  file: Blob;
  name: string;
  type: string;
  lastModified: number;
};

const DB_NAME = "localpath";
const DB_VERSION = 1;
const STORE_NAME = "pending_avatars";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
  });
}

function emailKey(email: string) {
  return email.trim().toLowerCase();
}

export async function savePendingAvatar(email: string, file: File) {
  const key = emailKey(email);
  if (!key) return;

  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const record: PendingAvatarRecord = {
        file,
        name: file.name,
        type: file.type,
        lastModified: file.lastModified,
      };
      store.put(record, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("IndexedDB transaction failed"));
      tx.onabort = () => reject(tx.error ?? new Error("IndexedDB transaction aborted"));
    });
  } finally {
    db.close();
  }
}

export async function loadPendingAvatar(email: string): Promise<File | null> {
  const key = emailKey(email);
  if (!key) return null;

  const db = await openDb();
  try {
    const record = await new Promise<PendingAvatarRecord | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result as PendingAvatarRecord | undefined);
      request.onerror = () => reject(request.error ?? new Error("IndexedDB get failed"));
    });

    if (!record) return null;
    return new File([record.file], record.name, {
      type: record.type,
      lastModified: record.lastModified,
    });
  } finally {
    db.close();
  }
}

export async function clearPendingAvatar(email: string) {
  const key = emailKey(email);
  if (!key) return;

  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("IndexedDB delete failed"));
      tx.onabort = () => reject(tx.error ?? new Error("IndexedDB delete aborted"));
    });
  } finally {
    db.close();
  }
}

