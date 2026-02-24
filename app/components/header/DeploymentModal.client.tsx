import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { classNames } from '~/utils/classNames';

interface DeploymentModalProps {
  onClose: () => void;
}

export function DeploymentModal({ onClose }: DeploymentModalProps) {
  const [projectName, setProjectName] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);

  const handleDeploy = async () => {
    if (!projectName.trim()) {
      alert('Please enter a project name');
      return;
    }

    setIsDeploying(true);

    // Get the current project files from workbench
    const projectData = {
      name: projectName,
      files: await getProjectFiles(),
    };

    // Redirect to Vercel with project data
    const vercelUrl = new URL('https://vercel.com/new/import');
    vercelUrl.searchParams.set('s', encodeURIComponent(window.location.href));
    vercelUrl.searchParams.set('projectName', projectName);
    vercelUrl.searchParams.set('framework', 'vite');

    // Store project data in session storage for Vercel import
    sessionStorage.setItem('foil_export', JSON.stringify(projectData));

    // Open Vercel in new tab
    window.open(vercelUrl.toString(), '_blank');

    setIsDeploying(false);
    onClose();
  };

  async function getProjectFiles() {
    // This will be connected to workbench store to get actual files
    const workbench = (window as any).__WORKBENCH__;
    if (!workbench) return {};

    try {
      const files = await workbench.getFiles();
      return files;
    } catch (error) {
      console.error('Failed to get project files:', error);
      return {};
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-foil-elements-background-depth-2 border border-foil-elements-borderColor rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl"
        >
          <h2 className="text-xl font-semibold text-foil-elements-textPrimary mb-4">
            Deploy to Vercel
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foil-elements-textSecondary mb-2">
                Project Name
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="my-awesome-project"
                className="w-full px-3 py-2 bg-foil-elements-background-depth-1 border border-foil-elements-borderColor rounded-md text-foil-elements-textPrimary placeholder-foil-elements-textTertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                disabled={isDeploying}
              />
            </div>

            <div className="bg-foil-elements-background-depth-1 border border-foil-elements-borderColor rounded-md p-4">
              <h3 className="text-sm font-medium text-foil-elements-textPrimary mb-2">
                What happens next:
              </h3>
              <ol className="text-sm text-foil-elements-textSecondary space-y-1 list-decimal list-inside">
                <li>You'll be redirected to Vercel</li>
                <li>Create or log into your Vercel account</li>
                <li>Your project will be imported automatically</li>
                <li>Configure deployment settings</li>
                <li>Deploy your project live!</li>
              </ol>
            </div>

            <div className="text-xs text-foil-elements-textTertiary">
              Note: You'll need a Vercel account to deploy. It's free for personal projects.
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              disabled={isDeploying}
              className="px-4 py-2 text-sm font-medium text-foil-elements-textSecondary hover:text-foil-elements-textPrimary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeploy}
              disabled={isDeploying || !projectName.trim()}
              className={classNames(
                'px-4 py-2 text-sm font-medium rounded-md transition-all',
                {
                  'bg-accent text-white hover:bg-accent/90': !isDeploying && projectName.trim(),
                  'bg-foil-elements-background-depth-1 text-foil-elements-textTertiary cursor-not-allowed':
                    isDeploying || !projectName.trim(),
                }
              )}
            >
              {isDeploying ? (
                <span className="flex items-center gap-2">
                  <div className="i-svg-spinners:90-ring-with-bg" />
                  Preparing...
                </span>
              ) : (
                'Deploy to Vercel'
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}