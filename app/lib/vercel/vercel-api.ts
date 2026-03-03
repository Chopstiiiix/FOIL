import type { FileMap, File } from '~/lib/stores/files';
import { WORK_DIR } from '~/utils/constants';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('Vercel');

const VERCEL_API = 'https://api.vercel.com';

interface VercelUser {
  user: {
    username: string;
  };
}

interface VercelDeployment {
  id: string;
  url: string;
  readyState: string;
}

interface DeployFile {
  file: string;
  data: string;
}

async function vercelFetch<T>(token: string, endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${VERCEL_API}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error(`Vercel API error: ${response.status}`, errorBody);
    throw new Error(`Vercel API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export async function getVercelUser(token: string): Promise<string> {
  const data = await vercelFetch<VercelUser>(token, '/v2/user');
  return data.user.username;
}

export function extractProjectFiles(files: FileMap): DeployFile[] {
  const deployFiles: DeployFile[] = [];
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

    deployFiles.push({ file: relativePath, data: file.content });
  }

  return deployFiles;
}

export async function deployToVercel(
  token: string,
  projectName: string,
  files: FileMap,
  onProgress?: (status: string) => void,
): Promise<string> {
  onProgress?.('Preparing files...');

  const deployFiles = extractProjectFiles(files);

  if (deployFiles.length === 0) {
    throw new Error('No project files found to deploy');
  }

  onProgress?.(`Deploying ${deployFiles.length} files...`);

  const deployment = await vercelFetch<VercelDeployment>(token, '/v13/deployments', {
    method: 'POST',
    body: JSON.stringify({
      name: projectName,
      files: deployFiles,
      projectSettings: {
        framework: null,
      },
    }),
  });

  onProgress?.('Deployment created!');

  return `https://${deployment.url}`;
}
