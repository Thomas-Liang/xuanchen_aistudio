import { DEFAULT_BASE_URL } from '../constants';

interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  branch?: string;
}

export interface FileEntry {
  path: string;
  content: string | ArrayBuffer;
  isBinary: boolean;
  sha?: string; // For diffing
}

export interface RepoInfo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  default_branch: string;
  permissions?: {
      admin: boolean;
      push: boolean;
      pull: boolean;
  }
}

export const parseRepoUrl = (url: string) => {
  try {
    const urlObj = new URL(url);
    const parts = urlObj.pathname.split('/').filter(Boolean);
    if (parts.length >= 2) {
      return {
        owner: parts[0],
        repo: parts[1].replace('.git', ''),
      };
    }
  } catch (e) {
    const parts = url.split('/');
    if (parts.length === 2) {
      return {
        owner: parts[0],
        repo: parts[1],
      };
    }
  }
  return null;
};

// Helper to convert ArrayBuffer to Base64
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// Calculate Git SHA-1 for a file (blob)
// Git header: "blob <size>\0<content>"
export const computeGitSha = async (content: string | ArrayBuffer, isBinary: boolean): Promise<string> => {
    let data: Uint8Array;
    
    if (isBinary) {
        data = new Uint8Array(content as ArrayBuffer);
    } else {
        const encoder = new TextEncoder();
        data = encoder.encode(content as string);
    }

    const header = `blob ${data.length}\0`;
    const headerData = new TextEncoder().encode(header);
    
    // Concatenate header + body
    const fullData = new Uint8Array(headerData.length + data.length);
    fullData.set(headerData);
    fullData.set(data, headerData.length);

    const hashBuffer = await crypto.subtle.digest('SHA-1', fullData);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// --- New API Methods ---

export const getUserRepos = async (token: string): Promise<RepoInfo[]> => {
    // Fetch user repos (sorted by updated, 100 max per page)
    const res = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100&type=all', {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
        }
    });
    
    if (!res.ok) {
        if (res.status === 401) throw new Error("Invalid Token");
        throw new Error("Failed to fetch repositories");
    }
    
    return await res.json();
};

export const createRepository = async (token: string, name: string, isPrivate: boolean): Promise<RepoInfo> => {
    const res = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
            name,
            private: isPrivate,
            auto_init: true, // create README so main branch exists
            description: "Created via Nanobanana Studio"
        })
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create repository");
    }

    return await res.json();
};

export const getBranches = async (token: string, owner: string, repo: string): Promise<string[]> => {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches`, {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
        }
    });
    
    if (!res.ok) return []; // Might be empty repo
    
    const data = await res.json();
    return data.map((b: any) => b.name);
};

// Get the full file tree of the remote branch to compare SHAs
export const getRemoteTree = async (token: string, owner: string, repo: string, branch: string) => {
    // 1. Get branch head
    const refRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${branch}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!refRes.ok) return null; // Branch doesn't exist or empty
    const refData = await refRes.json();
    const commitSha = refData.object.sha;

    // 2. Get tree (recursive)
    const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${commitSha}?recursive=1`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!treeRes.ok) return null;
    const treeData = await treeRes.json();
    
    // Return a map of path -> sha
    const fileMap = new Map<string, string>();
    treeData.tree.forEach((item: any) => {
        if (item.type === 'blob') {
            fileMap.set(item.path, item.sha);
        }
    });
    
    return fileMap;
};

export const uploadToGitHub = async (
  config: GitHubConfig,
  files: FileEntry[],
  message: string,
  onProgress: (current: number, total: number, status: string) => void
) => {
  const { token, owner, repo, branch = 'main' } = config;
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/vnd.github.v3+json',
  };

  const baseUrl = `https://api.github.com/repos/${owner}/${repo}`;

  // 1. Get current commit SHA of the branch
  onProgress(0, files.length, 'Getting latest commit...');
  let latestCommitSha = '';
  let baseTreeSha = '';

  try {
    const refRes = await fetch(`${baseUrl}/git/ref/heads/${branch}`, { headers });
    if (!refRes.ok) {
        if (refRes.status === 404) {
             throw new Error(`Branch '${branch}' not found. Ensure the repository exists and is initialized.`);
        }
        if (refRes.status === 401) {
            throw new Error(`Authentication failed. Please check your GitHub token.`);
        }
        const errorText = await refRes.text();
        throw new Error(`GitHub API Error (${refRes.status}): ${refRes.statusText} - ${errorText}`);
    }
    const refData = await refRes.json();
    latestCommitSha = refData.object.sha;

    // 2. Get the tree SHA of the latest commit
    const commitRes = await fetch(`${baseUrl}/git/commits/${latestCommitSha}`, { headers });
    const commitData = await commitRes.json();
    baseTreeSha = commitData.tree.sha;
  } catch (error: any) {
     throw new Error(`${error.message}`);
  }

  // 3. Create Blobs for each file
  const treeItems = [];
  let processed = 0;

  for (const file of files) {
    processed++;
    onProgress(processed, files.length, `Uploading ${file.path}...`);
    
    let content = '';
    
    if (file.isBinary) {
        content = arrayBufferToBase64(file.content as ArrayBuffer);
    } else {
        content = file.content as string;
    }

    const blobRes = await fetch(`${baseUrl}/git/blobs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        content,
        encoding: file.isBinary ? 'base64' : 'utf-8',
      }),
    });

    if (!blobRes.ok) {
        console.warn(`Failed to upload blob for ${file.path}`);
        continue;
    }

    const blobData = await blobRes.json();
    treeItems.push({
      path: file.path,
      mode: '100644', // standard file mode
      type: 'blob',
      sha: blobData.sha,
    });
  }

  // 4. Create a new Tree
  onProgress(files.length, files.length, 'Creating tree...');
  const treeRes = await fetch(`${baseUrl}/git/trees`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: treeItems,
    }),
  });

  if (!treeRes.ok) {
     const errText = await treeRes.text();
     console.error("Tree creation failed:", errText);
     throw new Error(`Failed to create tree: ${errText}`);
  }
  const treeData = await treeRes.json();

  // 5. Create a new Commit
  onProgress(files.length, files.length, 'Creating commit...');
  const newCommitRes = await fetch(`${baseUrl}/git/commits`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message,
      tree: treeData.sha,
      parents: [latestCommitSha],
    }),
  });

  if (!newCommitRes.ok) throw new Error('Failed to create commit');
  const newCommitData = await newCommitRes.json();

  // 6. Update the Reference
  onProgress(files.length, files.length, 'Updating branch...');
  const updateRefRes = await fetch(`${baseUrl}/git/refs/heads/${branch}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      sha: newCommitData.sha,
    }),
  });

  if (!updateRefRes.ok) throw new Error('Failed to update branch reference');
  
  onProgress(files.length, files.length, 'Done!');
};
