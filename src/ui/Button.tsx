// src/ui/Button.tsx
import React from 'react';
import clsx from 'clsx';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
};

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', className, children, ...rest }) => {
    const base = 'rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:-translate-y-0 disabled:hover:shadow-none';
    const variants: Record<string, string> = {
        primary: 'bg-linear-to-r from-[#a3f7b5]/80 to-[#80eb9f]/80 backdrop-blur-md border border-white/60 text-teal-950 hover:from-[#a3f7b5] hover:to-[#80eb9f] hover:shadow-[0_8px_20px_rgba(163,247,181,0.4)] hover:-translate-y-0.5',
        danger: 'bg-linear-to-r from-red-500/80 to-rose-500/80 backdrop-blur-md border border-white/60 text-white hover:from-red-500 hover:to-rose-500 hover:shadow-[0_8px_20px_rgba(239,68,68,0.4)] hover:-translate-y-0.5',
        ghost: 'bg-white/40 backdrop-blur-md border border-white/60 text-teal-800 hover:bg-white/70 hover:shadow-lg hover:-translate-y-0.5'
    };
    const sizes: Record<string, string> = {
        sm: 'px-3 py-1 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-5 py-3 text-lg'
    };
    return (
        <button className={clsx(base, variants[variant], sizes[size], className)} {...rest}>
            {children}
        </button>
    );
};