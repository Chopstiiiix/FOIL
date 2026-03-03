import { atom, map } from 'nanostores';

export const kVercelToken = 'foil_vercel_token';

export interface VercelState {
  token: string;
  username: string;
  isLoading: boolean;
  error: string;
  deploymentUrl: string;
  deployProgress: string;
}

export const vercelStore = map<VercelState>({
  token: initToken(),
  username: '',
  isLoading: false,
  error: '',
  deploymentUrl: '',
  deployProgress: '',
});

export const showVercelDialog = atom(false);

function initToken(): string {
  if (!import.meta.env.SSR) {
    return localStorage.getItem(kVercelToken) ?? '';
  }

  return '';
}

export function setVercelToken(token: string) {
  vercelStore.setKey('token', token);

  if (!import.meta.env.SSR) {
    localStorage.setItem(kVercelToken, token);
  }
}

export function clearVercelToken() {
  vercelStore.setKey('token', '');
  vercelStore.setKey('username', '');

  if (!import.meta.env.SSR) {
    localStorage.removeItem(kVercelToken);
  }
}
