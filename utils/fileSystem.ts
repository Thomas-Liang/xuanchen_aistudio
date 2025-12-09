// Type definitions for File System Access API

export interface FileSystemHandle {
  kind: 'file' | 'directory';
  name: string;
  isSameEntry(other: FileSystemHandle): Promise<boolean>;
  requestPermission(descriptor: { mode: 'read' | 'readwrite' }): Promise<'granted' | 'denied' | 'prompt'>;
  queryPermission(descriptor: { mode: 'read' | 'readwrite' }): Promise<'granted' | 'denied' | 'prompt'>;
}

export interface FileSystemFileHandle extends FileSystemHandle {
  kind: 'file';
  getFile(): Promise<File>;
}

export interface FileSystemDirectoryHandle extends FileSystemHandle {
  kind: 'directory';
  entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
  values(): AsyncIterableIterator<FileSystemHandle>;
  keys(): AsyncIterableIterator<string>;
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FileSystemDirectoryHandle>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
}

export async function getFilesFromDirectoryHandle(
  dirHandle: FileSystemDirectoryHandle,
  path: string = ''
): Promise<Array<{ path: string; file: File }>> {
  const files: Array<{ path: string; file: File }> = [];

  for await (const entry of dirHandle.values()) {
    const entryPath = path ? `${path}/${entry.name}` : entry.name;
    
    // Skip hidden/system folders
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'build') {
      continue;
    }

    if (entry.kind === 'file') {
      const file = await (entry as FileSystemFileHandle).getFile();
      files.push({ path: entryPath, file });
    } else if (entry.kind === 'directory') {
      const subFiles = await getFilesFromDirectoryHandle(entry as FileSystemDirectoryHandle, entryPath);
      files.push(...subFiles);
    }
  }

  return files;
}

// --- IndexedDB Helper for Persistence ---

const DB_NAME = 'NanobananaStudioDB';
const STORE_NAME = 'handles';

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveDirectoryHandle = async (handle: FileSystemDirectoryHandle) => {
  const db = await initDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(handle, 'project_root');
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
};

export const getSavedDirectoryHandle = async (): Promise<FileSystemDirectoryHandle | null> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get('project_root');
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
};

// Verify permission for a directory handle (request if needed)
export const verifyPermission = async (
  handle: FileSystemDirectoryHandle,
  readWrite: boolean = false
): Promise<boolean> => {
  const options: { mode: 'read' | 'readwrite' } = { mode: readWrite ? 'readwrite' : 'read' };
  
  // Check if permission was already granted
  if ((await handle.queryPermission(options)) === 'granted') {
    return true;
  }
  
  // Request permission if not granted
  if ((await handle.requestPermission(options)) === 'granted') {
    return true;
  }
  
  return false;
};
