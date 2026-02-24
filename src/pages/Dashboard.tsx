// src/pages/Dashboard.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import type { FileDoc } from '../types/file';

export const Dashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // uploads list
    const [files, setFiles] = useState<FileDoc[]>([]);
    const [loadingFiles, setLoadingFiles] = useState(false);

    // upload state
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

    // hidden file input ref
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // fetch user's uploaded files
    const fetchFiles = async () => {
        try {
            setLoadingFiles(true);
            const resp = await api.get<FileDoc[]>('/api/uploads');
            setFiles(resp.data);
        } catch (err: any) {
            console.error('Failed to fetch files', err);
            setUploadError('Unable to load files. Try again later.');
        } finally {
            setLoadingFiles(false);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, []);

    // logout handler: call context and redirect to /login
    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    // open file picker
    const openFilePicker = () => {
        setUploadError(null);
        setUploadSuccess(null);
        if (fileInputRef.current) fileInputRef.current.click();
    };

    // handle user-picked file
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setUploadError(null);
        setUploadSuccess(null);
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic client-side validation for PDF and size (mirrors server)
        if (file.type !== 'application/pdf') {
            setUploadError('Only PDF files are allowed.');
            e.currentTarget.value = '';
            return;
        }

        const maxSize = Number(import.meta.env.VITE_MAX_UPLOAD_SIZE ?? 10 * 1024 * 1024);
        if (file.size > maxSize) {
            setUploadError(`File too large. Max ${Math.round(maxSize / 1024 / 1024)} MB.`);
            e.currentTarget.value = '';
            return;
        }

        // Prepare form data
        const fd = new FormData();
        fd.append('file', file);

        try {
            setUploading(true);
            setUploadProgress(0);

            const resp = await api.post('/api/uploads/pdf', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent: ProgressEvent) => {
                    if (!progressEvent.lengthComputable) return;
                    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percent);
                }
            });

            // If backend returns created file metadata with a signed url, use it
            const created = resp.data;
            setUploadSuccess('Upload successful');
            // If server returns the created file object with id and url then:
            if (created && created.id) {
                // Option A: optimistically prepend the returned item if server returned full metadata
                // But many servers return minimal; fetching full list is safest
                await fetchFiles();
                // Optionally open returned url:
                if (created.url) {
                    window.open(created.url, '_blank', 'noopener');
                }
            } else {
                await fetchFiles();
            }
        } catch (err: any) {
            console.error('Upload error', err);
            const msg = err?.response?.data?.message ?? 'Upload failed. Try again.';
            setUploadError(msg);
        } finally {
            setUploading(false);
            setUploadProgress(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

        // download handler: uses returned url if present, otherwise requests signed url
        const handleDownload = async (file: FileDoc) => {
        setUploadError(null);
        try {
            // If backend already returned a signed url with the file, open it
            if (file.url) {
                window.open(file.url, '_blank', 'noopener');
                return;
            }

            // Otherwise, request a signed url from the backend (this endpoint checks ownership)
            const resp = await api.get<{ url: string }>(`/api/uploads/${file._id}/download`);
            const signedUrl = resp.data?.url;
            if (!signedUrl) throw new Error('No download URL returned');
            window.open(signedUrl, '_blank', 'noopener');
        } catch (err: any) {
            console.error('Download error', err);
            const msg = err?.response?.data?.message ?? 'Could not get download link.';
            setUploadError(msg);
        }
    };

    return (
        <div style={{ maxWidth: 900, margin: '2rem auto', padding: 16 }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ margin: 0 }}>Dashboard</h1>
                    <div style={{ color: '#666', fontSize: 14 }}>
                        Signed in as <strong>{user?.email ?? '—'}</strong>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        onClick={openFilePicker}
                        disabled={uploading}
                        style={{
                            padding: '8px 12px',
                            background: '#06b6d4',
                            color: 'white',
                            border: 'none',
                            borderRadius: 6,
                            cursor: 'pointer'
                        }}
                        title="Upload PDF"
                    >
                        {uploading ? 'Uploading…' : 'Upload'}
                    </button>

                    <button
                        onClick={handleLogout}
                        style={{
                            padding: '8px 12px',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: 6,
                            cursor: 'pointer'
                        }}
                        title="Logout"
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />

            {/* upload status */}
            <div style={{ marginTop: 16 }}>
                {uploadError && <div style={{ color: 'crimson' }}>{uploadError}</div>}
                {uploadSuccess && <div style={{ color: 'green' }}>{uploadSuccess}</div>}
                {uploadProgress != null && (
                    <div style={{ marginTop: 8 }}>
                        <div style={{ height: 8, background: '#e5e7eb', borderRadius: 4 }}>
                            <div
                                style={{
                                    width: `${uploadProgress}%`,
                                    height: 8,
                                    background: '#06b6d4',
                                    borderRadius: 4,
                                }}
                            />
                        </div>
                        <div style={{ fontSize: 12, color: '#444', marginTop: 6 }}>{uploadProgress}%</div>
                    </div>
                )}
            </div>

            {/* uploaded files list */}
            <section style={{ marginTop: 28 }}>
                <h2 style={{ marginBottom: 8 }}>Your files</h2>

                {loadingFiles ? (
                    <div>Loading files…</div>
                ) : files.length === 0 ? (
                    <div style={{ color: '#666' }}>You have not uploaded any files yet.</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                            <th style={{ padding: '8px 6px' }}>Name</th>
                            <th style={{ padding: '8px 6px' }}>Size</th>
                            <th style={{ padding: '8px 6px' }}>Uploaded</th>
                            <th style={{ padding: '8px 6px' }}>Action</th>
                        </tr>
                        </thead>
                        <tbody>
                        {files.map((f) => (
                            <tr key={f._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                <td style={{ padding: '10px 6px' }}>{f.originalName}</td>
                                <td style={{ padding: '10px 6px' }}>{(f.size / 1024).toFixed(1)} KB</td>
                                <td style={{ padding: '10px 6px' }}>{new Date(f.createdAt).toLocaleString()}</td>
                                <td style={{ padding: '10px 6px' }}>
                                    <button
                                        onClick={() => handleDownload(f)}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#0ea5a4',
                                            cursor: 'pointer',
                                            padding: 0
                                        }}
                                    >
                                        Download
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </section>
        </div>
    );
};