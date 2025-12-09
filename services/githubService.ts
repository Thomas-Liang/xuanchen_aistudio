import { DEFAULT_BASE_URL } from '../constants';

interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  branch?: string;
}

interface FileEntry {
  path: string;
  content: string | ArrayBuffer;
  isBinary: boolean;
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
    // Try parsing user/repo format
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
        const errorText = await refRes.text();
        // Branch might not exist, try to create it or error? 
        // For simplicity, assume main exists or handle error
        if (refRes.status === 404) {
             throw new Error(`Branch '${branch}' not found. Ensure the repository exists and is initialized (e.g. has a README).`);
        }
        if (refRes.status === 401) {
            throw new Error(`Authentication failed. Please check your GitHub token.`);
        }
        throw new Error(`GitHub API Error (${refRes.status}): ${refRes.statusText} - ${errorText}`);
    }
    const refData = await refRes.json();
    latestCommitSha = refData.object.sha;

    // 2. Get the tree SHA of the latest commit
    const commitRes = await fetch(`${baseUrl}/git/commits/${latestCommitSha}`, { headers });
    const commitData = await commitRes.json();
    baseTreeSha = commitData.tree.sha;
  } catch (error: any) {
     throw new Error(`Connection failed: ${error.message}`);
  }

  // 3. Create Blobs for each file
  const treeItems = [];
  let processed = 0;

  for (const file of files) {
    processed++;
    onProgress(processed, files.length, `Uploading ${file.path}...`);
    
    // For text files, we can use content directly, but for binary or safety, base64 is often better for the API
    // The blob API takes content and encoding.
    
    let content = '';
    let encoding = 'utf-8';

    if (file.isBinary) {
        content = arrayBufferToBase64(file.content as ArrayBuffer);
        encoding = 'base64';
    } else {
        content = file.content as string;
        // GitHub Blob API expects utf-8 string or base64
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

