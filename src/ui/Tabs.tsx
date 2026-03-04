// src/ui/Tabs.tsx
import React from 'react';
import clsx from 'clsx';

export type TabItem = {
    id: string;
    label: string;
};

type Props = {
    tabs: TabItem[];
    activeTab: string;
    onChange: (id: string) => void;
};

export const Tabs: React.FC<Props> = ({ tabs, activeTab, onChange }) => {
    return (
        <div className="flex flex-wrap items-center gap-2 mb-6">
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onChange(tab.id)}
                        className={clsx(
                            'px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300',
                            isActive
                                ? 'bg-[#a3f7b5] dark:bg-teal-500 text-teal-950 dark:text-white shadow-sm border border-[#a3f7b5]/50 dark:border-teal-500/50'
                                : 'bg-white/40 dark:bg-neutral-800/60 backdrop-blur-md text-teal-800 dark:text-teal-100 border border-white/60 dark:border-white/10 hover:bg-white/70 dark:hover:bg-neutral-700/60 hover:shadow-sm'
                        )}
                    >
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
};
