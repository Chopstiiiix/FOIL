import { useStore } from '@nanostores/react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import { showLoginDialog } from '~/lib/stores/auth';
import { AuthForm } from '~/components/ui/AuthForm';
import { cubicEasingFn } from '~/utils/easings';

const transition = {
  duration: 0.15,
  ease: cubicEasingFn,
};

export function LoginDialog() {
  const dialogOpen = useStore(showLoginDialog);

  const closeDialog = () => {
    showLoginDialog.set(false);
  };

  return (
    <RadixDialog.Root open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay asChild>
          <motion.div
            className="bg-black/60 backdrop-blur-sm fixed inset-0 z-max"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={transition}
            onClick={closeDialog}
          />
        </RadixDialog.Overlay>
        <RadixDialog.Content asChild>
          <motion.div
            className="fixed top-[50%] left-[50%] z-max w-[90vw] max-w-sm focus:outline-none"
            initial={{ opacity: 0, scale: 0.96, x: '-50%', y: '-45%' }}
            animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
            transition={transition}
          >
            <RadixDialog.Title className="sr-only">Sign In</RadixDialog.Title>
            <AuthForm onClose={closeDialog} />
          </motion.div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
