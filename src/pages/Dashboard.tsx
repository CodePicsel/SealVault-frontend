// src/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { Header } from '../ui/Header';
import { UploadButton } from '../uploads/UploadButton';
import { FileTable } from '../uploads/FileTable';
import { Button } from '../ui/Button';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import type { FileDoc } from '../types/file';

import PdfViewerModalSimple from '../components/PdfViewerModal';
import SignFlowModal from '../components/SignFlowModal';

export const Dashboard: React.FC = () => {
    const { user, logout } = useAuth();

    const [files, setFiles] = useState<FileDoc[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Preview modal state
    const [previewOpen, setPreviewOpen] = useState(false);
    const [activeFile, setActiveFile] = useState<FileDoc | null>(null);

    // Sign flow modal state
    const [signFlowOpen, setSignFlowOpen] = useState(false);

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
        <div className="max-w-5xl mx-auto p-6">
            <Header
                title="Your Dashboard"
                subtitle={`Signed in as ${user?.email ?? '—'}`}
                actions={
                    <>
                        <UploadButton onUploaded={async () => { await fetchFiles(); }} />
                        <Button
                            variant="danger"
                            onClick={() => {
                                logout();
                                window.location.href = '/login';
                            }}
                        >
                            Logout
                        </Button>
                    </>
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

            {error && <div className="text-red-500 mb-4">{error}</div>}

            {loading ? (
                <div>Loading…</div>
            ) : (
                <FileTable
                    files={files}
                    onDownloadError={setError}
                    onPreview={openPreview}
                    onSign={(f) => handleSignFromPreview(f)}
                />
            )}
        </div>
    );
};

export default Dashboard;