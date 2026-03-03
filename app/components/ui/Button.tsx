import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from '@radix-ui/react-slot';
import { classNames } from '~/utils/classNames';

const buttonVariants = cva(
  'cursor-pointer group whitespace-nowrap focus-visible:outline-none inline-flex items-center justify-center text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-60',
  {
    variants: {
      variant: {
        primary:
          'bg-foil-elements-button-primary-background text-foil-elements-button-primary-text hover:bg-foil-elements-button-primary-backgroundHover shadow-sm shadow-black/5',
        secondary:
          'bg-foil-elements-button-secondary-background text-foil-elements-button-secondary-text hover:bg-foil-elements-button-secondary-backgroundHover shadow-sm shadow-black/5',
        destructive:
          'bg-foil-elements-button-danger-background text-foil-elements-button-danger-text hover:bg-foil-elements-button-danger-backgroundHover shadow-sm shadow-black/5',
        outline:
          'bg-foil-elements-background-depth-1 text-foil-elements-textPrimary border border-foil-elements-borderColor hover:bg-foil-elements-item-backgroundActive shadow-sm shadow-black/5',
        ghost:
          'text-foil-elements-textPrimary hover:bg-foil-elements-item-backgroundActive',
        dim:
          'text-foil-elements-textTertiary hover:text-foil-elements-textPrimary',
      },
      size: {
        lg: 'h-10 rounded-md px-4 text-sm gap-1.5',
        md: 'h-8 rounded-md px-3 gap-1.5 text-sm',
        sm: 'h-7 rounded-md px-2.5 gap-1 text-xs',
        icon: 'h-8 w-8 rounded-md',
      },
      shape: {
        default: '',
        circle: 'rounded-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      shape: 'default',
    },
  },
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, shape, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        className={classNames(
          buttonVariants({ variant, size, shape }),
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);

Button.displayName = 'Button';

export { Button, buttonVariants };
export type { ButtonProps };
