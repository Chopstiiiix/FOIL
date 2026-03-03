import { atom, map } from 'nanostores';

export interface GitHubImportState {
  isLoading: boolean;
  error: string;
  progress: string;
}

export const githubImportStore = map<GitHubImportState>({
  isLoading: false,
  error: '',
  progress: '',
});

export const showImportDialog = atom(false);
