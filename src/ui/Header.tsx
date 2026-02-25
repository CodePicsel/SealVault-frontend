// src/ui/Header.tsx
import React from 'react';

export const Header: React.FC<{ title?: string; subtitle?: string; actions?: React.ReactNode }> = ({ title='Dashboard', subtitle, actions }) => (
    <div className="flex items-center justify-between mb-6">
        <div>
            <h1 className="text-2xl font-semibold">{title}</h1>
            {subtitle && <div className="text-sm text-gray-500 mt-1">{subtitle}</div>}
        </div>
        <div className="flex items-center gap-3">{actions}</div>
    </div>
);