// src/ui/Input.tsx
import React from 'react';
import clsx from 'clsx';

export type InputProps = {
    id?: string;
    label?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string;
    placeholder?: string;
    name?: string;
    autoComplete?: string;
    required?: boolean;
    error?: string | null;
    className?: string;
    autoFocus?: boolean;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>((props, ref) => {
    const {
        id,
        label,
        value,
        onChange,
        type = 'text',
        placeholder,
        name,
        autoComplete,
        required = false,
        error = null,
        className,
        autoFocus = false,
    } = props;

    const baseInputCls = 'block w-full rounded-xl border px-4 py-3 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-md placeholder-gray-500 dark:placeholder-gray-400 text-teal-950 dark:text-teal-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:bg-white dark:focus:bg-neutral-800 transition-all duration-300';
    const errorCls = error ? 'border-red-400 dark:border-red-500 focus:ring-red-500' : 'border-white/80 dark:border-white/10 hover:border-white dark:hover:border-white/20 focus:border-white dark:focus:border-white/20';

    return (
        <div className={clsx('mb-4', className)}>
            {label && (
                <label htmlFor={id || name} className="block text-sm font-semibold text-teal-900 dark:text-teal-100 mb-1.5 px-1 transition-colors duration-300">
                    {label} {required ? <span className="text-red-500">*</span> : null}
                </label>
            )}

            <input
                ref={ref}
                id={id || name}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                autoComplete={autoComplete}
                required={required}
                autoFocus={autoFocus}
                className={clsx(baseInputCls, errorCls)}
                aria-invalid={!!error}
                aria-describedby={error ? `${id || name}-error` : undefined}
            />

            {error && (
                <p id={`${id || name}-error`} className="mt-1 text-sm text-red-600">
                    {error}
                </p>
            )}
        </div>
    );
});

Input.displayName = 'Input';