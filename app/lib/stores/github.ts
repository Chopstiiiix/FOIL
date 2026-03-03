import { atom, map } from 'nanostores';

export const kGitHubToken = 'foil_github_token';

export interface GitHubState {
  token: string;
  username: string;
  isLoading: boolean;
  error: string;
  repoUrl: string;
  deployProgress: string;
}

export const githubStore = map<GitHubState>({
  token: initToken(),
  username: '',
  isLoading: false,
  error: '',
  repoUrl: '',
  deployProgress: '',
});

export const showGitHubDialog = atom(false);

function initToken(): string {
  if (!import.meta.env.SSR) {
    return localStorage.getItem(kGitHubToken) ?? '';
  }

  return '';
}

export function setGitHubToken(token: string) {
  githubStore.setKey('token', token);

  if (!import.meta.env.SSR) {
    localStorage.setItem(kGitHubToken, token);
  }
}

export function clearGitHubToken() {
  githubStore.setKey('token', '');
  githubStore.setKey('username', '');

  if (!import.meta.env.SSR) {
    localStorage.removeItem(kGitHubToken);
  }
}
