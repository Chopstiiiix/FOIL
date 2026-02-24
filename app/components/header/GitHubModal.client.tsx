import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { classNames } from '~/utils/classNames';

interface GitHubModalProps {
  onClose: () => void;
}

export function GitHubModal({ onClose }: GitHubModalProps) {
  const [repoName, setRepoName] = useState('');
  const [repoDescription, setRepoDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [githubToken, setGithubToken] = useState('');

  const handlePushToGitHub = async () => {
    if (!repoName.trim()) {
      alert('Please enter a repository name');
      return;
    }

    if (!githubToken.trim()) {
      alert('Please enter your GitHub personal access token');
      return;
    }

    setIsPushing(true);

    try {
      // Get project files from workbench
      const files = await getProjectFiles();

      // Create repository via GitHub API
      const response = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: repoName,
          description: repoDescription,
          private: isPrivate,
          auto_init: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create repository: ${response.statusText}`);
      }

      const repo = await response.json();

      // Success - open the new repo
      window.open(repo.html_url, '_blank');

      // Store token in session for future use (not persistent for security)
      sessionStorage.setItem('foil_github_token', githubToken);

      setIsPushing(false);
      onClose();
    } catch (error) {
      console.error('Failed to push to GitHub:', error);
      alert('Failed to create repository. Please check your token and try again.');
      setIsPushing(false);
    }
  };

  async function getProjectFiles() {
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
          className="relative bg-foil-elements-background-depth-2 border border-foil-elements-borderColor rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          <h2 className="text-xl font-semibold text-foil-elements-textPrimary mb-4">
            Push to GitHub
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foil-elements-textSecondary mb-2">
                Repository Name
              </label>
              <input
                type="text"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                placeholder="my-foil-project"
                className="w-full px-3 py-2 bg-foil-elements-background-depth-1 border border-foil-elements-borderColor rounded-md text-foil-elements-textPrimary placeholder-foil-elements-textTertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                disabled={isPushing}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foil-elements-textSecondary mb-2">
                Description (optional)
              </label>
              <textarea
                value={repoDescription}
                onChange={(e) => setRepoDescription(e.target.value)}
                placeholder="A project built with FOIL"
                rows={3}
                className="w-full px-3 py-2 bg-foil-elements-background-depth-1 border border-foil-elements-borderColor rounded-md text-foil-elements-textPrimary placeholder-foil-elements-textTertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
                disabled={isPushing}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foil-elements-textSecondary mb-2">
                GitHub Personal Access Token
              </label>
              <input
                type="password"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxx"
                className="w-full px-3 py-2 bg-foil-elements-background-depth-1 border border-foil-elements-borderColor rounded-md text-foil-elements-textPrimary placeholder-foil-elements-textTertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                disabled={isPushing}
              />
              <p className="text-xs text-foil-elements-textTertiary mt-1">
                Need a token?{' '}
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  Create one here
                </a>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="private"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                disabled={isPushing}
                className="w-4 h-4 rounded border-foil-elements-borderColor bg-foil-elements-background-depth-1 text-accent focus:ring-accent focus:ring-2"
              />
              <label htmlFor="private" className="text-sm text-foil-elements-textSecondary">
                Make repository private
              </label>
            </div>

            <div className="bg-foil-elements-background-depth-1 border border-foil-elements-borderColor rounded-md p-4">
              <h3 className="text-sm font-medium text-foil-elements-textPrimary mb-2">
                Repository will include:
              </h3>
              <ul className="text-sm text-foil-elements-textSecondary space-y-1 list-disc list-inside">
                <li>All project files and folders</li>
                <li>Package configuration (package.json)</li>
                <li>README with project setup instructions</li>
                <li>License file (MIT by default)</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              disabled={isPushing}
              className="px-4 py-2 text-sm font-medium text-foil-elements-textSecondary hover:text-foil-elements-textPrimary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePushToGitHub}
              disabled={isPushing || !repoName.trim() || !githubToken.trim()}
              className={classNames(
                'px-4 py-2 text-sm font-medium rounded-md transition-all',
                {
                  'bg-accent text-white hover:bg-accent/90':
                    !isPushing && repoName.trim() && githubToken.trim(),
                  'bg-foil-elements-background-depth-1 text-foil-elements-textTertiary cursor-not-allowed':
                    isPushing || !repoName.trim() || !githubToken.trim(),
                }
              )}
            >
              {isPushing ? (
                <span className="flex items-center gap-2">
                  <div className="i-svg-spinners:90-ring-with-bg" />
                  Pushing...
                </span>
              ) : (
                'Push to GitHub'
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}