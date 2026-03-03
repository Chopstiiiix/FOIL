import { workbenchStore } from '~/lib/stores/workbench';
import type { FileMap, File } from '~/lib/stores/files';
import { WORK_DIR } from '~/utils/constants';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('GitHub');

const GITHUB_API = 'https://api.github.com';
const BATCH_SIZE = 5;

interface GitHubUser {
  login: string;
}

interface GitHubRepo {
  full_name: string;
  html_url: string;
  default_branch: string;
}

interface GitHubBlob {
  sha: string;
}

interface GitHubTree {
  sha: string;
}

interface GitHubCommit {
  sha: string;
}

interface GitHubRef {
  object: { sha: string };
}

interface ProjectFile {
  path: string;
  content: string;
}

async function githubFetch<T>(token: string, endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${GITHUB_API}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error(`GitHub API error: ${response.status}`, errorBody);
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export async function getAuthenticatedUser(token: string): Promise<GitHubUser> {
  return githubFetch<GitHubUser>(token, '/user');
}

export async function createRepo(
  token: string,
  name: string,
  isPrivate: boolean,
): Promise<GitHubRepo> {
  return githubFetch<GitHubRepo>(token, '/user/repos', {
    method: 'POST',
    body: JSON.stringify({
      name,
      private: isPrivate,
      auto_init: true,
    }),
  });
}

export async function getRepo(token: string, owner: string, repo: string): Promise<GitHubRepo> {
  return githubFetch<GitHubRepo>(token, `/repos/${owner}/${repo}`);
}

export function extractProjectFiles(files: FileMap): ProjectFile[] {
  const projectFiles: ProjectFile[] = [];
  const prefix = `${WORK_DIR}/`;

  for (const [path, dirent] of Object.entries(files)) {
    if (!dirent || dirent.type !== 'file') {
      continue;
    }

    const file = dirent as File;

    if (file.isBinary) {
      continue;
    }

    if (!path.startsWith(prefix)) {
      continue;
    }

    const relativePath = path.slice(prefix.length);

    // skip excluded paths
    if (
      relativePath.startsWith('node_modules/') ||
      relativePath.startsWith('.git/') ||
      relativePath === 'package-lock.json' ||
      relativePath === 'yarn.lock' ||
      relativePath === 'pnpm-lock.yaml' ||
      relativePath === 'bun.lockb'
    ) {
      continue;
    }

    projectFiles.push({ path: relativePath, content: file.content });
  }

  return projectFiles;
}

export async function pushFilesToRepo(
  token: string,
  owner: string,
  repo: string,
  files: ProjectFile[],
  message: string,
  onProgress?: (status: string) => void,
): Promise<string> {
  if (files.length === 0) {
    throw new Error('No files to push');
  }

  onProgress?.('Getting repository info...');

  // Get the default branch ref
  let refSha: string;

  try {
    const ref = await githubFetch<GitHubRef>(token, `/repos/${owner}/${repo}/git/ref/heads/main`);
    refSha = ref.object.sha;
  } catch {
    // Try master if main doesn't exist
    const ref = await githubFetch<GitHubRef>(token, `/repos/${owner}/${repo}/git/ref/heads/master`);
    refSha = ref.object.sha;
  }

  // Create blobs in batches
  const treeItems: Array<{ path: string; mode: string; type: string; sha: string }> = [];

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    const batchEnd = Math.min(i + BATCH_SIZE, files.length);
    onProgress?.(`Uploading files ${i + 1}-${batchEnd} of ${files.length}...`);

    const blobPromises = batch.map(async (file) => {
      const blob = await githubFetch<GitHubBlob>(token, `/repos/${owner}/${repo}/git/blobs`, {
        method: 'POST',
        body: JSON.stringify({
          content: btoa(unescape(encodeURIComponent(file.content))),
          encoding: 'base64',
        }),
      });

      return { path: file.path, sha: blob.sha };
    });

    const results = await Promise.all(blobPromises);

    for (const result of results) {
      treeItems.push({
        path: result.path,
        mode: '100644',
        type: 'blob',
        sha: result.sha,
      });
    }
  }

  // Create tree
  onProgress?.('Creating file tree...');

  const tree = await githubFetch<GitHubTree>(token, `/repos/${owner}/${repo}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({
      base_tree: refSha,
      tree: treeItems,
    }),
  });

  // Create commit
  onProgress?.('Creating commit...');

  const commit = await githubFetch<GitHubCommit>(token, `/repos/${owner}/${repo}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({
      message,
      tree: tree.sha,
      parents: [refSha],
    }),
  });

  // Update ref
  onProgress?.('Updating branch...');

  try {
    await githubFetch(token, `/repos/${owner}/${repo}/git/refs/heads/main`, {
      method: 'PATCH',
      body: JSON.stringify({ sha: commit.sha }),
    });
  } catch {
    await githubFetch(token, `/repos/${owner}/${repo}/git/refs/heads/master`, {
      method: 'PATCH',
      body: JSON.stringify({ sha: commit.sha }),
    });
  }

  return `https://github.com/${owner}/${repo}`;
}
