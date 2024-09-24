import { openDB } from 'idb';

const DB_NAME = 'WhiteboardDB';
const DB_VERSION = 1;
const STORE_NAME = 'drawings';

const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    },
  });
};

export const saveDrawingOffline = async (drawing) => {
  const db = await initDB();
  await db.add(STORE_NAME, drawing);
};

export const getOfflineDrawings = async () => {
  const db = await initDB();
  return await db.getAll(STORE_NAME);
};

export const clearOfflineDrawings = async () => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.store.clear();
  await tx.done;
};
