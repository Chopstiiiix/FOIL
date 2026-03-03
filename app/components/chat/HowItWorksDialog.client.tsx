import { useStore } from '@nanostores/react';
import { atom } from 'nanostores';
import { Dialog, DialogButton, DialogRoot, DialogTitle } from '~/components/ui/Dialog';

export const showHowItWorksDialog = atom<boolean>(false);

const steps = [
  {
    icon: 'i-ph:chat-circle-text',
    title: 'Describe what you want to build',
    description: 'Type a prompt in the chat box — describe an app, a component, or a feature in plain English.',
  },
  {
    icon: 'i-ph:code',
    title: 'FOIL generates your code',
    description: 'The AI writes the code, installs dependencies, and sets up your project automatically.',
  },
  {
    icon: 'i-ph:eye',
    title: 'Preview in real time',
    description: 'See your app running live in the preview panel — no local setup required.',
  },
  {
    icon: 'i-ph:pencil-simple',
    title: 'Iterate and refine',
    description: 'Ask follow-up questions, request changes, or edit files directly in the built-in editor.',
  },
  {
    icon: 'i-ph:rocket-launch',
    title: 'Deploy instantly',
    description: 'Push to GitHub or deploy to Vercel with one click using the buttons below the chat.',
  },
];

export function HowItWorksDialog() {
  const open = useStore(showHowItWorksDialog);

  return (
    <DialogRoot open={open}>
      <Dialog onClose={() => showHowItWorksDialog.set(false)} onBackdrop={() => showHowItWorksDialog.set(false)}>
        <DialogTitle>How FOIL works</DialogTitle>

        <div className="flex flex-col gap-4 mt-4">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-foil-elements-background-depth-3 flex items-center justify-center text-foil-elements-textPrimary">
                <div className={step.icon} />
              </div>
              <div>
                <p className="text-sm font-medium text-foil-elements-textPrimary">{step.title}</p>
                <p className="text-xs text-foil-elements-textSecondary mt-0.5">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-6">
          <DialogButton type="primary" onClick={() => showHowItWorksDialog.set(false)}>
            Got it
          </DialogButton>
        </div>
      </Dialog>
    </DialogRoot>
  );
}
