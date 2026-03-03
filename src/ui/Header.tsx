// src/ui/Header.tsx
import React from 'react';

export const Header: React.FC<{ title?: React.ReactNode; subtitle?: string; actions?: React.ReactNode; variant?: 'default' | 'auth' }> = ({ title = <><span className="text-3xl font-bold tracking-tight text-gray-800">SealValut</span></>, subtitle, actions, variant = 'default' }) => (
    <div className={`flex flex-col sm:flex-row items-center sm:items-center justify-center sm:justify-between gap-3 sm:gap-0 mb-6 px-4 py-4 sm:px-6 sm:py-5 bg-white/25 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg ${variant === 'auth' ? 'border-white/60 text-center sm:text-left' : 'bg-white/80 backdrop-blur-md border border-white/60 text-left'}`}>
        <div className="w-full">
            <div className="text-2xl font-semibold">{title}</div>
            {subtitle && <div className="text-sm text-gray-600 mt-1">{subtitle}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0">{actions}</div>}
    </div>
);