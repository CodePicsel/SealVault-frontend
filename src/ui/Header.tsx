// src/ui/Header.tsx
import React from 'react';

export const Header: React.FC<{ title?: React.ReactNode; subtitle?: string; actions?: React.ReactNode; variant?: 'default' | 'auth' }> = ({ title = <><span className="text-3xl font-bold tracking-tight text-gray-800">SealValut</span></>, subtitle, actions, variant = 'default' }) => (
    <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mb-6 px-6 py-5 rounded-xl shadow-sm ${variant === 'auth' ? 'border-white/60' : 'bg-white/40 backdrop-blur-md border border-white/60'}`}>
        <div>
            <div className="text-2xl font-semibold">{title}</div>
            {subtitle && <div className="text-sm text-gray-600 mt-1">{subtitle}</div>}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
);