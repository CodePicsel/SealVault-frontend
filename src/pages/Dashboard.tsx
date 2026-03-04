// src/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { Header } from '../ui/Header';
import { UploadButton } from '../uploads/UploadButton';
import { FileTable } from '../uploads/FileTable';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import type { FileDoc } from '../types/file';

import PdfViewerModalSimple from '../components/PdfViewerModal';
import SignFlowModal from '../components/SignFlowModal';
import { Tabs, type TabItem } from '../ui/Tabs';
import { ProfilePlaceholder } from '../components/ProfilePlaceholder';
import { ActivitiesPlaceholder } from '../components/ActivitiesPlaceholder';

export const Dashboard: React.FC = () => {
    const { user } = useAuth();

    const [files, setFiles] = useState<FileDoc[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Preview modal state
    const [previewOpen, setPreviewOpen] = useState(false);
    const [activeFile, setActiveFile] = useState<FileDoc | null>(null);

    // Sign flow modal state
    const [signFlowOpen, setSignFlowOpen] = useState(false);

    // Tabs state
    const [activeTab, setActiveTab] = useState('uploads');

    const tabs: TabItem[] = [
        { id: 'uploads', label: 'Uploads' },
        { id: 'profile', label: 'Profile' },
        { id: 'activities', label: 'Activities' },
    ];

    const fetchFiles = async () => {
        setLoading(true);
        setError(null);
        try {
            const resp = await api.get<FileDoc[]>('/api/uploads');
            setFiles(resp.data);
        } catch (err: any) {
            setError(err?.response?.data?.message ?? 'Could not load files');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, []);

    // Open preview modal
    const openPreview = (file: FileDoc) => {
        setActiveFile(file);
        setPreviewOpen(true);
    };

    // Triggered when user clicks "Sign" in the table or in preview modal
    const handleSignFromPreview = (file: FileDoc) => {
        setPreviewOpen(false);
        setActiveFile(file);
        setSignFlowOpen(true);
    };

    return (
        <div className="min-h-screen bg-[#f8fbf9] dark:bg-neutral-900 bg-[linear-gradient(to_right,#e5f5eb_1px,transparent_1px),linear-gradient(to_bottom,#e5f5eb_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[24px_24px] p-6 lg:p-8 transition-colors duration-300">
            <div className="max-w-6xl mx-auto">
                <Header
                    subtitle={`logged in as ${user?.email ?? '—'}`}
                    actions={
                        <div className="flex w-full sm:w-auto mt-4 sm:mt-0 justify-end">
                            <UploadButton onUploaded={async () => { await fetchFiles(); }} />
                        </div>
                    }
                />

                {/* Preview Modal */}
                <PdfViewerModalSimple
                    open={previewOpen}
                    file={activeFile}
                    onClose={() => setPreviewOpen(false)}
                    onSign={handleSignFromPreview}
                />

                {/* Sign Flow Modal (Step 1 & 2) */}
                <SignFlowModal
                    open={signFlowOpen}
                    file={activeFile}
                    onClose={() => setSignFlowOpen(false)}
                />

                <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

                {error && <div className="text-red-500 mb-4 bg-white/40 dark:bg-neutral-800/60 backdrop-blur-sm p-4 rounded-xl border border-white/60 dark:border-white/10">{error}</div>}

                {activeTab === 'uploads' && (
                    loading ? (
                        <div className="bg-white/20 dark:bg-neutral-800/60 backdrop-blur-md rounded-2xl border border-white/60 dark:border-white/10 p-12 text-center text-gray-500 dark:text-gray-400 shadow-2xl transition-colors duration-300">Loading…</div>
                    ) : (
                        <div className="bg-white/20 dark:bg-neutral-800/60 backdrop-blur-md rounded-2xl border border-white/60 dark:border-white/10 shadow-2xl p-6 transition-colors duration-300">
                            <FileTable
                                files={files}
                                onDownloadError={setError}
                                onPreview={openPreview}
                                onSign={(f) => handleSignFromPreview(f)}
                            />
                        </div>
                    )
                )}

                {activeTab === 'profile' && (
                    <ProfilePlaceholder email={user?.email} />
                )}

                {activeTab === 'activities' && (
                    <ActivitiesPlaceholder />
                )}
            </div>
        </div>
    );
};

export default Dashboard;