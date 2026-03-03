import { memo, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { type AuthUser, currentUser } from '~/lib/stores/auth';

interface UserAvatarMenuProps {
  user: AuthUser;
}

export const UserAvatarMenu = memo(({ user }: UserAvatarMenuProps) => {
  const initial = (user.name || user.email).charAt(0).toUpperCase();
  const [open, setOpen] = useState(false);

  function handleSignOut() {
    setOpen(false);
    currentUser.set(null);
    document.cookie = 'foil_session=; Path=/; Max-Age=0';
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-sm font-medium text-foil-elements-textPrimary cursor-pointer hover:bg-white/20 transition-colors"
          title={user.name || user.email}
        >
          {initial}
        </button>
      </Popover.Trigger>
      <AnimatePresence>
        {open && (
          <Popover.Portal forceMount>
            <Popover.Content
              align="end"
              sideOffset={8}
              asChild
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                className="z-50 w-56 rounded-lg border border-white/10 bg-foil-elements-background-depth-2 shadow-lg outline-none origin-top-right"
              >
                {/* Header */}
                <div className="border-b border-white/10 px-3 py-2.5">
                  <p className="text-sm font-medium text-foil-elements-textPrimary truncate">
                    {user.name || 'User'}
                  </p>
                  <p className="text-xs text-white/40 truncate">
                    {user.email}
                  </p>
                </div>

                {/* Menu items */}
                <div className="p-1.5">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer bg-transparent border-none"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </motion.div>
            </Popover.Content>
          </Popover.Portal>
        )}
      </AnimatePresence>
    </Popover.Root>
  );
});
