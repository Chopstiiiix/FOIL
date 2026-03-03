import { webcontainer } from '~/lib/webcontainer';
import { WORK_DIR_NAME } from '~/utils/constants';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('GitHubImport');

const GITHUB_API = 'https://api.github.com';
const BATCH_SIZE = 5;

interface TreeItem {
  path: string;
  type: string;
  sha: string;
  size?: number;
}

interface TreeResponse {
  tree: TreeItem[];
  truncated: boolean;
}

interface RepoResponse {
  default_branch: string;
}

interface BlobResponse {
  content: string;
  encoding: string;
}

export function parseGitHubUrl(input: string): { owner: string; repo: string } {
  const trimmed = input.trim().replace(/\/+$/, '');

  // Handle full URL: https://github.com/owner/repo
  const urlMatch = trimmed.match(/github\.com\/([^/]+)\/([^/]+)/);

  if (urlMatch) {
    return { owner: urlMatch[1], repo: urlMatch[2].replace(/\.git$/, '') };
  }

  // Handle owner/repo format
  const parts = trimmed.split('/');

  if (parts.length === 2 && parts[0] && parts[1]) {
    return { owner: parts[0], repo: parts[1] };
  }

  throw new Error('Invalid GitHub URL. Use https://github.com/owner/repo or owner/repo format.');
}

async function githubFetch<T>(endpoint: string, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${GITHUB_API}${endpoint}`, { headers });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Repository not found. Check the URL or add a GitHub token for private repos.');
    }

    if (response.status === 403) {
      throw new Error('Rate limited. Add a GitHub token to increase limits.');
    }

    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

async function getDefaultBranch(owner: string, repo: string, token?: string): Promise<string> {
  const data = await githubFetch<RepoResponse>(`/repos/${owner}/${repo}`, token);
  return data.default_branch;
}

async function fetchTree(owner: string, repo: string, branch: string, token?: string): Promise<TreeItem[]> {
  const data = await githubFetch<TreeResponse>(
    `/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    token,
  );

  return data.tree.filter((item) => {
    if (item.type !== 'blob') {
      return false;
    }

    // Skip large files (>500KB)
    if (item.size && item.size > 500_000) {
      return false;
    }

    // Skip excluded paths
    if (
      item.path.startsWith('node_modules/') ||
      item.path.startsWith('.git/') ||
      item.path === 'package-lock.json' ||
      item.path === 'yarn.lock' ||
      item.path === 'pnpm-lock.yaml' ||
      item.path === 'bun.lockb'
    ) {
      return false;
    }

    return true;
  });
}

async function fetchFileContent(owner: string, repo: string, sha: string, token?: string): Promise<string> {
  const data = await githubFetch<BlobResponse>(`/repos/${owner}/${repo}/git/blobs/${sha}`, token);

  if (data.encoding === 'base64') {
    return decodeURIComponent(escape(atob(data.content.replace(/\n/g, ''))));
  }

  return data.content;
}

export async function importGitHubRepo(
  repoUrl: string,
  token?: string,
  onProgress?: (status: string) => void,
): Promise<void> {
  const { owner, repo } = parseGitHubUrl(repoUrl);

  onProgress?.('Fetching repository info...');
  const branch = await getDefaultBranch(owner, repo, token);

  onProgress?.('Fetching file tree...');
  const tree = await fetchTree(owner, repo, branch, token);

  if (tree.length === 0) {
    throw new Error('Repository is empty or has no importable files');
  }

  onProgress?.(`Found ${tree.length} files. Downloading...`);

  const wc = await webcontainer;

  // Create directories first
  const dirs = new Set<string>();

  for (const item of tree) {
    const parts = item.path.split('/');

    for (let i = 1; i < parts.length; i++) {
      dirs.add(parts.slice(0, i).join('/'));
    }
  }

  for (const dir of Array.from(dirs).sort()) {
    try {
      await wc.fs.mkdir(`${WORK_DIR_NAME}/${dir}`, { recursive: true });
    } catch {
      // directory may already exist
    }
  }

  // Download and write files in batches
  let completed = 0;

  for (let i = 0; i < tree.length; i += BATCH_SIZE) {
    const batch = tree.slice(i, i + BATCH_SIZE);

    const results = await Promise.all(
      batch.map(async (item) => {
        try {
          const content = await fetchFileContent(owner, repo, item.sha, token);
          return { path: item.path, content };
        } catch (error) {
          logger.warn(`Failed to fetch ${item.path}`, error);
          return null;
        }
      }),
    );

    for (const result of results) {
      if (result) {
        await wc.fs.writeFile(`${WORK_DIR_NAME}/${result.path}`, result.content);
        completed++;
      }
    }

    onProgress?.(`Downloaded ${completed} of ${tree.length} files...`);
  }

  onProgress?.(`Import complete! ${completed} files imported.`);
}
