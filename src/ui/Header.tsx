// src/ui/Header.tsx
import React from 'react';

export const Header: React.FC<{ title?: React.ReactNode; subtitle?: string; actions?: React.ReactNode; variant?: 'default' | 'auth' }> = ({ title = <><span className="text-3xl font-bold tracking-tight text-gray-800 dark:text-white transition-colors duration-300">SealValut</span></>, subtitle, actions, variant = 'default' }) => {
    const toggleDarkMode = () => {
        document.documentElement.classList.toggle('dark');
    };
    return (
        <div className={`flex flex-col sm:flex-row items-center sm:items-center justify-center sm:justify-between gap-3 sm:gap-0 mb-6 px-4 py-4 sm:px-6 sm:py-5 bg-white/20 dark:bg-neutral-900/60 backdrop-blur-md rounded-2xl border border-white/60 dark:border-white/10 shadow-2xl transition-colors duration-300 ${variant === 'auth' ? 'text-center sm:text-left' : 'text-left'}`}>
            <div className="w-full">
                <div className="text-2xl font-semibold dark:text-white transition-colors duration-300">{title}</div>
                {subtitle && <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 transition-colors duration-300">{subtitle}</div>}
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                {actions}
                {variant === 'auth' && (
                    <button type="button" onClick={toggleDarkMode} className="p-2 rounded-xl bg-white/40 dark:bg-neutral-800/70 hover:bg-white/60 dark:hover:bg-neutral-700/70 transition-colors border border-white/50 dark:border-white/10" title="Toggle Dark Mode">
                        <span className="dark:hidden">🌙</span>
                        <span className="hidden dark:inline">☀️</span>
                    </button>
                )}
            </div>
        </div>
    );
};