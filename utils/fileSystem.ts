// Type definitions for File System Access API

export interface FileSystemHandle {
  kind: 'file' | 'directory';
  name: string;
  isSameEntry(other: FileSystemHandle): Promise<boolean>;
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

