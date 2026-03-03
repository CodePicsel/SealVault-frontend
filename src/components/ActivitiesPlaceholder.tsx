// src/components/ActivitiesPlaceholder.tsx
import React from 'react';

export const ActivitiesPlaceholder: React.FC = () => {
    return (
        <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/60 shadow p-12 text-center">
            <div className="w-16 h-16 bg-[#a3f7b5]/50 rounded-2xl flex items-center justify-center mx-auto mb-6 border-2 border-white/80 shadow-inner rotate-3">
                <svg className="w-8 h-8 text-teal-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h2 className="text-2xl font-bold text-teal-950 mb-2">Recent Activities</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
                A timeline of your recent document uploads, signatures, and shares will be displayed here soon.
            </p>
            <div className="inline-block px-4 py-2 bg-white/50 backdrop-blur-sm rounded-lg text-sm text-teal-800 font-semibold border border-white/60">
                Coming Soon
            </div>
        </div>
    );
};
