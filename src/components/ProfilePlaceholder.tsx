// src/components/ProfilePlaceholder.tsx
import React from 'react';

type Props = {
    email?: string;
};

export const ProfilePlaceholder: React.FC<Props> = ({ email }) => {
    return (
        <div className="bg-white/20 backdrop-blur-md rounded-2xl border border-white/60 shadow-2xl p-12 text-center">
            <div className="w-24 h-24 bg-[#a3f7b5]/50 rounded-full flex flex-col items-center justify-center mx-auto mb-6 border-4 border-white/80 shadow-inner">
                <span className="text-4xl text-teal-800 font-bold tracking-tighter">
                    {email?.charAt(0).toUpperCase() || '?'}
                </span>
            </div>
            <h2 className="text-2xl font-bold text-teal-950 mb-2">Profile Details</h2>
            <p className="text-gray-600 mb-8">
                {email ? `Signed in as ${email}` : 'Profile information will appear here.'}
            </p>
            <div className="inline-block px-4 py-2 bg-white/50 backdrop-blur-sm rounded-lg text-sm text-teal-800 font-semibold border border-white/60">
                Coming Soon
            </div>
        </div>
    );
};
