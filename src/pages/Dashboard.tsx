// src/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { Header } from '../ui/Header';
import { UploadButton } from '../uploads/UploadButton';
import { FileTable } from '../uploads/FileTable';
import { Button } from '../ui/Button';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import type { FileDoc } from '../types/file';
import PdfViewerModal from "../components/PdfViewerModal.tsx";

export const Dashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const [files, setFiles] = useState<FileDoc[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [activeFile, setActiveFile] = useState<FileDoc | null>(null);

    const openViewer = (f: FileDoc) => {
        setActiveFile(f);
        setViewerOpen(true);
    };

    const fetchFiles = async () => {
        setLoading(true); setError(null);
        try {
            const resp = await api.get<FileDoc[]>('/api/uploads');
            setFiles(resp.data);
        } catch (err: any) {
            setError(err?.response?.data?.message ?? 'Could not load files');
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchFiles(); }, []);

    return (
        <div className="max-w-5xl mx-auto p-6">
            <Header title="Your Dash" subtitle={`Signed in as ${user?.email ?? '—'}`} actions={
                <>
                    <UploadButton onUploaded={async () => { await fetchFiles(); }} />
                    <Button variant="danger" onClick={() => { logout(); window.location.href='/login'; }}>Logout</Button>
                </>
            } />
            <PdfViewerModal open={viewerOpen} file={activeFile} onClose={() => setViewerOpen(false)} />
            {error && <div className="text-red-500 mb-4">{error}</div>}
            {loading ? <div>Loading…</div> : <FileTable files={files} onDownloadError={setError} onPreview={openViewer} />}
        </div>
    );
};