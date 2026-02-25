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

    const baseInputCls = 'block w-full rounded-md border px-3 py-2 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1';
    const errorCls = error ? 'border-red-300 focus:ring-red-300' : 'border-gray-200 focus:ring-teal-300';

    return (
        <div className={clsx('mb-4', className)}>
            {label && (
                <label htmlFor={id || name} className="block text-sm font-medium text-gray-700 mb-1">
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