import { atom, computed } from 'nanostores';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

export const showLoginDialog = atom(false);
export const currentUser = atom<AuthUser | null>(null);
export const isAuthenticated = computed(currentUser, (user) => user !== null);
