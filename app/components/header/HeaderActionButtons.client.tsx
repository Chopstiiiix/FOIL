import { useStore } from '@nanostores/react';
import { useState } from 'react';
import { chatStore } from '~/lib/stores/chat';
import { workbenchStore } from '~/lib/stores/workbench';
import { classNames } from '~/utils/classNames';
import { DeploymentModal } from './DeploymentModal.client';
import { GitHubModal } from './GitHubModal.client';

interface HeaderActionButtonsProps {}

export function HeaderActionButtons({}: HeaderActionButtonsProps) {
  const showWorkbench = useStore(workbenchStore.showWorkbench);
  const { showChat } = useStore(chatStore);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [showGitHubModal, setShowGitHubModal] = useState(false);

  const canHideChat = showWorkbench || !showChat;

  return (
    <>
      <div className="flex gap-2">
        {/* Deployment CTAs */}
        <div className="flex border border-foil-elements-borderColor rounded-md overflow-hidden">
          <Button
            onClick={() => setShowGitHubModal(true)}
            title="Push to GitHub"
          >
            <div className="i-ph:github-logo" />
          </Button>
          <div className="w-[1px] bg-foil-elements-borderColor" />
          <Button
            onClick={() => setShowDeployModal(true)}
            title="Deploy to Vercel"
          >
            <div className="i-ph:rocket-launch" />
          </Button>
        </div>

        {/* Chat/Code View Toggle */}
        <div className="flex border border-foil-elements-borderColor rounded-md overflow-hidden">
        <Button
          active={showChat}
          disabled={!canHideChat}
          onClick={() => {
            if (canHideChat) {
              chatStore.setKey('showChat', !showChat);
            }
          }}
        >
          <div className="i-foil:chat text-sm" />
        </Button>
        <div className="w-[1px] bg-foil-elements-borderColor" />
        <Button
          active={showWorkbench}
          onClick={() => {
            if (showWorkbench && !showChat) {
              chatStore.setKey('showChat', true);
            }

            workbenchStore.showWorkbench.set(!showWorkbench);
          }}
        >
          <div className="i-ph:code-bold" />
        </Button>
        </div>
      </div>

      {/* Modals */}
      {showDeployModal && (
        <DeploymentModal onClose={() => setShowDeployModal(false)} />
      )}
      {showGitHubModal && (
        <GitHubModal onClose={() => setShowGitHubModal(false)} />
      )}
    </>
  );
}

interface ButtonProps {
  active?: boolean;
  disabled?: boolean;
  children?: any;
  onClick?: VoidFunction;
  title?: string;
}

function Button({ active = false, disabled = false, children, onClick, title }: ButtonProps) {
  return (
    <button
      title={title}
      className={classNames('flex items-center p-1.5 transition-colors', {
        'bg-foil-elements-item-backgroundDefault hover:bg-foil-elements-item-backgroundActive text-foil-elements-textTertiary hover:text-foil-elements-textPrimary':
          !active,
        'bg-foil-elements-item-backgroundAccent text-foil-elements-item-contentAccent': active && !disabled,
        'bg-foil-elements-item-backgroundDefault text-alpha-gray-20 dark:text-alpha-white-20 cursor-not-allowed':
          disabled,
      })}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
