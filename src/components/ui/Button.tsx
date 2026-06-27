import { ButtonHTMLAttributes, forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  asChild?: boolean;
}

// Helper to convert regular props to motion props if we wanted to
const motionProps = {
  whileHover: { y: -2, x: -2, boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)' },
  whileTap: { y: 2, x: 2, boxShadow: '0px 0px 0px 0px rgba(0,0,0,1)' },
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: 'bg-primary text-black',
      secondary: 'bg-secondary text-white',
      accent: 'bg-accent text-white',
      success: 'bg-success text-black',
      outline: 'bg-white text-black hover:bg-slate-50',
      ghost: 'border-transparent shadow-none hover:bg-slate-100',
    };

    const sizes = {
      sm: 'px-3 py-2 text-sm min-h-[48px]',
      md: 'px-4 py-3 text-base min-h-[48px]',
      lg: 'px-8 py-4 text-lg md:text-xl min-h-[56px] md:min-h-[64px]',
      icon: 'p-3 min-w-[48px] min-h-[48px]',
    };

    const baseClasses = 'inline-flex items-center justify-center font-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none brutal-border brutal-shadow-sm rounded-xl';

    return (
      <button
        className={cn(baseClasses, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
