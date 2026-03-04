// src/components/ActivitiesPlaceholder.tsx
import React from 'react';

export const ActivitiesPlaceholder: React.FC = () => {
    return (
        <div className="bg-white/20 dark:bg-neutral-800/60 backdrop-blur-md rounded-2xl border border-white/60 dark:border-white/10 shadow-2xl p-12 text-center transition-colors duration-300">
            <div className="w-16 h-16 bg-[#a3f7b5]/50 dark:bg-teal-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border-2 border-white/80 dark:border-white/10 shadow-inner rotate-3 transition-colors duration-300">
                <svg className="w-8 h-8 text-teal-800 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h2 className="text-2xl font-bold text-teal-950 dark:text-teal-50 mb-2">Recent Activities</h2>
        </div>
    );
};
