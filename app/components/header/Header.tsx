import { useStore } from '@nanostores/react';
import { ClientOnly } from 'remix-utils/client-only';
import { chatStore } from '~/lib/stores/chat';
import { classNames } from '~/utils/classNames';
import { HeaderActionButtons } from './HeaderActionButtons.client';
import { ChatDescription } from '~/lib/persistence/ChatDescription.client';
import { GetStartedButton } from '~/components/ui/GetStartedButton';
import { LoginDialog } from '~/components/auth/LoginDialog.client';
import { isAuthenticated, currentUser } from '~/lib/stores/auth';
import { UserAvatarMenu } from './UserAvatarMenu';

export function Header() {
  const chat = useStore(chatStore);
  const loggedIn = useStore(isAuthenticated);
  const user = useStore(currentUser);

  return (
    <header
      className={classNames(
        'flex items-center bg-foil-elements-background-depth-1 p-5 border-b h-[var(--header-height)]',
        {
          'border-transparent': !chat.started,
          'border-foil-elements-borderColor': chat.started,
        },
      )}
    >
      <div className="flex items-center gap-2 z-logo text-foil-elements-textPrimary cursor-pointer">
        <div className="i-ph:sidebar-simple-duotone text-xl" />
        <a href="/" className="text-2xl font-semibold text-accent flex items-center">
          LAB
        </a>
      </div>
      <span className="flex-1 px-4 truncate text-center text-foil-elements-textPrimary">
        <ClientOnly>{() => <ChatDescription />}</ClientOnly>
      </span>
      {chat.started ? (
        <ClientOnly>
          {() => (
            <div className="mr-1">
              <HeaderActionButtons />
            </div>
          )}
        </ClientOnly>
      ) : loggedIn && user ? (
        <UserAvatarMenu user={user} />
      ) : (
        <GetStartedButton />
      )}
      <ClientOnly>{() => <LoginDialog />}</ClientOnly>
    </header>
  );
}
