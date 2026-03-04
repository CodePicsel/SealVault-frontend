// src/components/ProfilePlaceholder.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../ui/Button';

type Props = {
    email?: string;
};

export const ProfilePlaceholder: React.FC<Props> = ({ email }) => {
    const { logout } = useAuth();
    const [isDark, setIsDark] = useState(
        document.documentElement.classList.contains('dark')
    );

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.classList.contains('dark'));
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const toggleDark = () => {
        if (isDark) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            setIsDark(false);
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            setIsDark(true);
        }
    };
    return (
        <div className="bg-white/20 dark:bg-neutral-800/60 backdrop-blur-md rounded-2xl border border-white/60 dark:border-white/10 shadow-2xl p-12 text-center transition-colors duration-300">
            <div className="w-24 h-24 bg-[#a3f7b5]/50 dark:bg-teal-500/20 rounded-full flex flex-col items-center justify-center mx-auto mb-6 border-4 border-white/80 dark:border-white/10 shadow-inner transition-colors duration-300">
                <span className="text-4xl text-teal-800 dark:text-teal-400 font-bold tracking-tighter">
                    {email?.charAt(0).toUpperCase() || '?'}
                </span>
            </div>
            <h2 className="text-2xl font-bold text-teal-950 dark:text-teal-50 mb-2">Profile Details</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
                {email ? `Signed in as ${email}` : 'Profile information will appear here.'}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                    variant="ghost"
                    onClick={toggleDark}
                    className="flex items-center gap-2"
                >
                    {isDark ? (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                            Light Mode
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                            Dark Mode
                        </>
                    )}
                </Button>
                <Button
                    variant="ghost"
                    onClick={() => {
                        logout();
                        window.location.href = '/login';
                    }}
                >
                    Logout
                </Button>
            </div>
        </div>
    );
};
