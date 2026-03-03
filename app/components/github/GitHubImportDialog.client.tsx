import { useStore } from '@nanostores/react';
import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Dialog, DialogButton, DialogDescription, DialogRoot, DialogTitle } from '~/components/ui/Dialog';
import { githubImportStore, showImportDialog } from '~/lib/stores/github-import';
import { githubStore } from '~/lib/stores/github';
import { importGitHubRepo } from '~/lib/github/github-import';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('GitHubImport');

export function GitHubImportDialog() {
  const dialogOpen = useStore(showImportDialog);
  const importState = useStore(githubImportStore);
  const github = useStore(githubStore);

  const [repoUrl, setRepoUrl] = useState('');

  const closeDialog = useCallback(() => {
    showImportDialog.set(false);
    githubImportStore.setKey('error', '');
    githubImportStore.setKey('progress', '');
  }, []);

  const handleImport = useCallback(async () => {
    if (!repoUrl.trim()) {
      githubImportStore.setKey('error', 'Repository URL is required');
      return;
    }

    githubImportStore.setKey('isLoading', true);
    githubImportStore.setKey('error', '');
    githubImportStore.setKey('progress', '');

    try {
      await importGitHubRepo(
        repoUrl.trim(),
        github.token || undefined,
        (status) => githubImportStore.setKey('progress', status),
      );

      toast.success('Repository imported successfully!');
      closeDialog();
    } catch (error: any) {
      logger.error('Import failed', error);
      githubImportStore.setKey('error', error.message || 'Import failed');
      githubImportStore.setKey('progress', '');
      toast.error('Import failed');
    } finally {
      githubImportStore.setKey('isLoading', false);
    }
  }, [repoUrl, github.token, closeDialog]);

  return (
    <DialogRoot open={dialogOpen}>
      <Dialog onBackdrop={closeDialog} onClose={closeDialog}>
        <DialogTitle>Import from GitHub</DialogTitle>
        <DialogDescription asChild>
          <div className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm text-foil-elements-textSecondary">
                Enter a GitHub repository URL or owner/repo to import its files into the workspace.
              </p>
              <input
                type="text"
                placeholder="https://github.com/owner/repo or owner/repo"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleImport()}
                className="w-full px-3 py-2 rounded-lg border border-foil-elements-borderColor bg-foil-elements-background-depth-1 text-foil-elements-textPrimary text-sm focus:outline-none focus:border-foil-elements-button-primary-background"
              />
              {!github.token && (
                <p className="text-xs text-foil-elements-textTertiary">
                  For private repos, connect your GitHub token first via the GitHub deploy button.
                </p>
              )}

              {importState.error && (
                <p className="text-sm text-red-500">{importState.error}</p>
              )}

              {importState.progress && (
                <p className="text-sm text-foil-elements-textSecondary animate-pulse">
                  {importState.progress}
                </p>
              )}

              <div className="flex justify-end gap-2">
                <DialogButton type="secondary" onClick={closeDialog}>
                  Cancel
                </DialogButton>
                <DialogButton type="primary" onClick={handleImport}>
                  {importState.isLoading ? 'Importing...' : 'Import'}
                </DialogButton>
              </div>
            </div>
          </div>
        </DialogDescription>
      </Dialog>
    </DialogRoot>
  );
}
