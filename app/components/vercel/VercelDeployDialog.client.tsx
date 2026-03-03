import { useStore } from '@nanostores/react';
import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Dialog, DialogButton, DialogDescription, DialogRoot, DialogTitle } from '~/components/ui/Dialog';
import { vercelStore, showVercelDialog, setVercelToken, clearVercelToken } from '~/lib/stores/vercel';
import { workbenchStore } from '~/lib/stores/workbench';
import { getVercelUser, deployToVercel } from '~/lib/vercel/vercel-api';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('Vercel');

export function VercelDeployDialog() {
  const dialogOpen = useStore(showVercelDialog);
  const vercel = useStore(vercelStore);

  const [tokenInput, setTokenInput] = useState('');
  const [projectName, setProjectName] = useState('');

  const closeDialog = useCallback(() => {
    showVercelDialog.set(false);
    vercelStore.setKey('error', '');
    vercelStore.setKey('deploymentUrl', '');
    vercelStore.setKey('deployProgress', '');
  }, []);

  const handleConnect = useCallback(async () => {
    const token = tokenInput.trim();

    if (!token) {
      return;
    }

    vercelStore.setKey('isLoading', true);
    vercelStore.setKey('error', '');

    try {
      const username = await getVercelUser(token);
      setVercelToken(token);
      vercelStore.setKey('username', username);
      toast.success(`Connected as ${username}`);
    } catch (error) {
      logger.error('Token validation failed', error);
      vercelStore.setKey('error', 'Invalid token. Check your Vercel access token.');
    } finally {
      vercelStore.setKey('isLoading', false);
    }
  }, [tokenInput]);

  const handleDisconnect = useCallback(() => {
    clearVercelToken();
    setTokenInput('');
  }, []);

  const handleDeploy = useCallback(async () => {
    if (!projectName.trim()) {
      vercelStore.setKey('error', 'Project name is required');
      return;
    }

    vercelStore.setKey('isLoading', true);
    vercelStore.setKey('error', '');
    vercelStore.setKey('deploymentUrl', '');

    try {
      const files = workbenchStore.files.get();
      const url = await deployToVercel(
        vercel.token,
        projectName.trim(),
        files,
        (status) => vercelStore.setKey('deployProgress', status),
      );

      vercelStore.setKey('deploymentUrl', url);
      vercelStore.setKey('deployProgress', '');
      toast.success('Successfully deployed to Vercel!');
    } catch (error: any) {
      logger.error('Deploy failed', error);
      vercelStore.setKey('error', error.message || 'Deploy failed');
      vercelStore.setKey('deployProgress', '');
      toast.error('Deploy failed');
    } finally {
      vercelStore.setKey('isLoading', false);
    }
  }, [vercel.token, projectName]);

  const isConnected = !!vercel.username;

  return (
    <DialogRoot open={dialogOpen}>
      <Dialog onBackdrop={closeDialog} onClose={closeDialog}>
        <DialogTitle>Deploy to Vercel</DialogTitle>
        <DialogDescription asChild>
          <div className="space-y-4">
            {!isConnected ? (
              <div className="space-y-3">
                <p className="text-sm text-foil-elements-textSecondary">
                  Enter a Vercel access token. Create one at{' '}
                  <a
                    href="https://vercel.com/account/tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foil-elements-button-primary-background hover:underline"
                  >
                    vercel.com/account/tokens
                  </a>
                </p>
                <input
                  type="password"
                  placeholder="vercel_xxxxxxxxxxxx"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                  className="w-full px-3 py-2 rounded-lg border border-foil-elements-borderColor bg-foil-elements-background-depth-1 text-foil-elements-textPrimary text-sm focus:outline-none focus:border-foil-elements-button-primary-background"
                />
                {vercel.error && (
                  <p className="text-sm text-red-500">{vercel.error}</p>
                )}
                <div className="flex justify-end">
                  <DialogButton type="primary" onClick={handleConnect}>
                    {vercel.isLoading ? 'Connecting...' : 'Connect'}
                  </DialogButton>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foil-elements-textSecondary">
                    Connected as <strong className="text-foil-elements-textPrimary">{vercel.username}</strong>
                  </span>
                  <button
                    onClick={handleDisconnect}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Disconnect
                  </button>
                </div>

                {vercel.deploymentUrl ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <p className="text-sm text-green-400 mb-1">Successfully deployed!</p>
                      <a
                        href={vercel.deploymentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-foil-elements-button-primary-background hover:underline break-all"
                      >
                        {vercel.deploymentUrl}
                      </a>
                    </div>
                    <div className="flex justify-end">
                      <DialogButton type="secondary" onClick={closeDialog}>
                        Close
                      </DialogButton>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Project name"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-foil-elements-borderColor bg-foil-elements-background-depth-1 text-foil-elements-textPrimary text-sm focus:outline-none focus:border-foil-elements-button-primary-background"
                    />

                    {vercel.error && (
                      <p className="text-sm text-red-500">{vercel.error}</p>
                    )}

                    {vercel.deployProgress && (
                      <p className="text-sm text-foil-elements-textSecondary animate-pulse">
                        {vercel.deployProgress}
                      </p>
                    )}

                    <div className="flex justify-end gap-2">
                      <DialogButton type="secondary" onClick={closeDialog}>
                        Cancel
                      </DialogButton>
                      <DialogButton type="primary" onClick={handleDeploy}>
                        {vercel.isLoading ? 'Deploying...' : 'Deploy'}
                      </DialogButton>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogDescription>
      </Dialog>
    </DialogRoot>
  );
}
