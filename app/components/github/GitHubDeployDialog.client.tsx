import { useStore } from '@nanostores/react';
import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Dialog, DialogButton, DialogDescription, DialogRoot, DialogTitle } from '~/components/ui/Dialog';
import { githubStore, showGitHubDialog, setGitHubToken, clearGitHubToken } from '~/lib/stores/github';
import { workbenchStore } from '~/lib/stores/workbench';
import {
  getAuthenticatedUser,
  createRepo,
  getRepo,
  extractProjectFiles,
  pushFilesToRepo,
} from '~/lib/github/github-api';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('GitHub');

type RepoMode = 'create' | 'existing';

export function GitHubDeployDialog() {
  const dialogOpen = useStore(showGitHubDialog);
  const github = useStore(githubStore);

  const [tokenInput, setTokenInput] = useState('');
  const [repoMode, setRepoMode] = useState<RepoMode>('create');
  const [repoName, setRepoName] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [commitMessage, setCommitMessage] = useState('Deploy from Foil');
  const [existingOwner, setExistingOwner] = useState('');
  const [existingRepo, setExistingRepo] = useState('');

  const closeDialog = useCallback(() => {
    showGitHubDialog.set(false);
    githubStore.setKey('error', '');
    githubStore.setKey('repoUrl', '');
    githubStore.setKey('deployProgress', '');
  }, []);

  const handleConnect = useCallback(async () => {
    const token = tokenInput.trim();

    if (!token) {
      return;
    }

    githubStore.setKey('isLoading', true);
    githubStore.setKey('error', '');

    try {
      const user = await getAuthenticatedUser(token);
      setGitHubToken(token);
      githubStore.setKey('username', user.login);
      setExistingOwner(user.login);
      toast.success(`Connected as ${user.login}`);
    } catch (error) {
      logger.error('Token validation failed', error);
      githubStore.setKey('error', 'Invalid token. Make sure it has repo scope.');
    } finally {
      githubStore.setKey('isLoading', false);
    }
  }, [tokenInput]);

  const handleDisconnect = useCallback(() => {
    clearGitHubToken();
    setTokenInput('');
  }, []);

  const handleDeploy = useCallback(async () => {
    githubStore.setKey('isLoading', true);
    githubStore.setKey('error', '');
    githubStore.setKey('repoUrl', '');
    githubStore.setKey('deployProgress', 'Preparing files...');

    try {
      const files = workbenchStore.files.get();
      const projectFiles = extractProjectFiles(files);

      if (projectFiles.length === 0) {
        throw new Error('No project files found to deploy');
      }

      const token = github.token;
      let owner: string;
      let repo: string;

      if (repoMode === 'create') {
        if (!repoName.trim()) {
          throw new Error('Repository name is required');
        }

        githubStore.setKey('deployProgress', 'Creating repository...');

        const newRepo = await createRepo(token, repoName.trim(), isPrivate);
        const [repoOwner, repoSlug] = newRepo.full_name.split('/');
        owner = repoOwner;
        repo = repoSlug;
      } else {
        if (!existingOwner.trim() || !existingRepo.trim()) {
          throw new Error('Owner and repository name are required');
        }

        // Verify the repo exists
        githubStore.setKey('deployProgress', 'Verifying repository...');
        await getRepo(token, existingOwner.trim(), existingRepo.trim());
        owner = existingOwner.trim();
        repo = existingRepo.trim();
      }

      const repoUrl = await pushFilesToRepo(
        token,
        owner,
        repo,
        projectFiles,
        commitMessage || 'Deploy from Foil',
        (status) => githubStore.setKey('deployProgress', status),
      );

      githubStore.setKey('repoUrl', repoUrl);
      githubStore.setKey('deployProgress', '');
      toast.success('Successfully deployed to GitHub!');
    } catch (error: any) {
      logger.error('Deploy failed', error);
      githubStore.setKey('error', error.message || 'Deploy failed');
      githubStore.setKey('deployProgress', '');
      toast.error('Deploy failed');
    } finally {
      githubStore.setKey('isLoading', false);
    }
  }, [github.token, repoMode, repoName, isPrivate, commitMessage, existingOwner, existingRepo]);

  const isConnected = !!github.username;

  return (
    <DialogRoot open={dialogOpen}>
      <Dialog onBackdrop={closeDialog} onClose={closeDialog}>
        <DialogTitle>Deploy to GitHub</DialogTitle>
        <DialogDescription asChild>
          <div className="space-y-4">
            {/* Step 1: Token */}
            {!isConnected ? (
              <div className="space-y-3">
                <p className="text-sm text-foil-elements-textSecondary">
                  Enter a GitHub Personal Access Token with <code className="text-xs bg-foil-elements-background-depth-3 px-1 py-0.5 rounded">repo</code> scope.
                </p>
                <input
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxx"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                  className="w-full px-3 py-2 rounded-lg border border-foil-elements-borderColor bg-foil-elements-background-depth-1 text-foil-elements-textPrimary text-sm focus:outline-none focus:border-foil-elements-button-primary-background"
                />
                {github.error && (
                  <p className="text-sm text-red-500">{github.error}</p>
                )}
                <div className="flex justify-end">
                  <DialogButton type="primary" onClick={handleConnect}>
                    {github.isLoading ? 'Connecting...' : 'Connect'}
                  </DialogButton>
                </div>
              </div>
            ) : (
              <>
                {/* Connected state */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foil-elements-textSecondary">
                    Connected as <strong className="text-foil-elements-textPrimary">{github.username}</strong>
                  </span>
                  <button
                    onClick={handleDisconnect}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Disconnect
                  </button>
                </div>

                {/* Success state */}
                {github.repoUrl ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <p className="text-sm text-green-400 mb-1">Successfully deployed!</p>
                      <a
                        href={github.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-foil-elements-button-primary-background hover:underline break-all"
                      >
                        {github.repoUrl}
                      </a>
                    </div>
                    <div className="flex justify-end">
                      <DialogButton type="secondary" onClick={closeDialog}>
                        Close
                      </DialogButton>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Step 2: Repo config */}
                    <div className="space-y-3">
                      {/* Mode toggle */}
                      <div className="flex border border-foil-elements-borderColor rounded-lg overflow-hidden">
                        <button
                          onClick={() => setRepoMode('create')}
                          className={`flex-1 px-3 py-1.5 text-sm transition-colors ${
                            repoMode === 'create'
                              ? 'bg-foil-elements-button-primary-background text-foil-elements-button-primary-text'
                              : 'text-foil-elements-textSecondary hover:text-foil-elements-textPrimary'
                          }`}
                        >
                          Create new
                        </button>
                        <button
                          onClick={() => setRepoMode('existing')}
                          className={`flex-1 px-3 py-1.5 text-sm transition-colors ${
                            repoMode === 'existing'
                              ? 'bg-foil-elements-button-primary-background text-foil-elements-button-primary-text'
                              : 'text-foil-elements-textSecondary hover:text-foil-elements-textPrimary'
                          }`}
                        >
                          Push to existing
                        </button>
                      </div>

                      {repoMode === 'create' ? (
                        <>
                          <input
                            type="text"
                            placeholder="Repository name"
                            value={repoName}
                            onChange={(e) => setRepoName(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-foil-elements-borderColor bg-foil-elements-background-depth-1 text-foil-elements-textPrimary text-sm focus:outline-none focus:border-foil-elements-button-primary-background"
                          />
                          <label className="flex items-center gap-2 text-sm text-foil-elements-textSecondary cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isPrivate}
                              onChange={(e) => setIsPrivate(e.target.checked)}
                              className="rounded"
                            />
                            Private repository
                          </label>
                        </>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Owner"
                            value={existingOwner}
                            onChange={(e) => setExistingOwner(e.target.value)}
                            className="flex-1 px-3 py-2 rounded-lg border border-foil-elements-borderColor bg-foil-elements-background-depth-1 text-foil-elements-textPrimary text-sm focus:outline-none focus:border-foil-elements-button-primary-background"
                          />
                          <span className="self-center text-foil-elements-textTertiary">/</span>
                          <input
                            type="text"
                            placeholder="Repository"
                            value={existingRepo}
                            onChange={(e) => setExistingRepo(e.target.value)}
                            className="flex-1 px-3 py-2 rounded-lg border border-foil-elements-borderColor bg-foil-elements-background-depth-1 text-foil-elements-textPrimary text-sm focus:outline-none focus:border-foil-elements-button-primary-background"
                          />
                        </div>
                      )}

                      <input
                        type="text"
                        placeholder="Commit message"
                        value={commitMessage}
                        onChange={(e) => setCommitMessage(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-foil-elements-borderColor bg-foil-elements-background-depth-1 text-foil-elements-textPrimary text-sm focus:outline-none focus:border-foil-elements-button-primary-background"
                      />
                    </div>

                    {github.error && (
                      <p className="text-sm text-red-500">{github.error}</p>
                    )}

                    {github.deployProgress && (
                      <p className="text-sm text-foil-elements-textSecondary animate-pulse">
                        {github.deployProgress}
                      </p>
                    )}

                    <div className="flex justify-end gap-2">
                      <DialogButton type="secondary" onClick={closeDialog}>
                        Cancel
                      </DialogButton>
                      <DialogButton
                        type="primary"
                        onClick={handleDeploy}
                      >
                        {github.isLoading ? 'Deploying...' : 'Deploy'}
                      </DialogButton>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </DialogDescription>
      </Dialog>
    </DialogRoot>
  );
}
