// src/ui/Button.tsx
import React from 'react';
import clsx from 'clsx';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
};

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', size='md', className, children, ...rest }) => {
    const base = 'rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2';
    const variants: Record<string,string> = {
        primary: 'bg-teal-500 text-white hover:bg-teal-600 focus:ring-teal-300',
        danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-300',
        ghost: 'bg-transparent text-teal-600 hover:bg-teal-50 focus:ring-teal-100'
    };
    const sizes: Record<string,string> = {
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