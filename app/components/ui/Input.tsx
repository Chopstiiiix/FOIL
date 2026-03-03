import * as React from 'react';
import { cn } from '~/utils/cn';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded-lg border border-foil-elements-borderColor bg-foil-elements-background-depth-3 px-3 py-2 text-sm text-foil-elements-textPrimary shadow-sm shadow-black/5 transition-shadow placeholder:text-foil-elements-textTertiary focus-visible:border-foil-elements-borderColorActive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/20 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
