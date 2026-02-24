import React, {useEffect, useRef, useState} from 'react'
import {useAuth} from "../contexts/AuthContext.tsx";
import {useNavigate} from "react-router-dom";
import type {FileDoc} from "../types/file.ts";
import api from "../api/axios.ts";

const Dashboard : React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [files, setFiles] = useState<FileDoc[]>([]);
    const[loadingFiles, setLoadingFiles] = useState(false);

    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const fetchFiles = async () => {
        try {
            setLoadingFiles(true);
            const resp = await api.get<FileDoc[]>('/api/uploads');
            setFiles(resp.data);
        } catch (err: any) {
            console.error('Failed to fetch files', err);
        } finally {
            setLoadingFiles(false);
        }
    };
    useEffect(() => {
        fetchFiles();
    }, []);
    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };
    const openFilePicker = () => {
        setUploadError(null);
        setUploadSuccess(null);
        if(fileInputRef.current) fileInputRef.current.click();
    };

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

            // success: server returns metadata including storageName/url
            setUploadSuccess('Upload successful');
            // optional: add new file to list (if server returns created file)
            // if server returned file metadata:
            if (resp.data && resp.data.id) {
                // Try to fetch full list, or push resp.data into files depending on API shape.
                fetchFiles();
            } else {
                fetchFiles();
            }
        } catch (err: any) {
            console.error('Upload error', err);
            const msg = err?.response?.data?.message ?? 'Upload failed. Try again.';
            setUploadError(msg);
        } finally {
            setUploading(false);
            setUploadProgress(null);
            // clear input so same file can be reselected
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };


    return (
        <div style={{maxWidth: 900, margin: "2rem auto", padding: 16}}>
            <header className="flex bg-gray-100 p-5 gap-5 flex-col">
                <div className="flex flex-col gap-.5">
                    <h1 className={"font-semibold"} style={{margin: 0}}>Dashboard</h1>
                    <div style={{color:'#666', fontSize: 14}}>
                        Signed In as <strong>{user?.email ?? "-"}</strong>
                    </div>
                </div>
                <div style={{display: 'flex', gap:8}}>
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
                        title="Upload PDF">
                        {uploading ? 'Uploading…' : 'Upload'}
                    </button>
                    <button
                        onClick={handleLogout}
                        style={{
                            padding: '8px 12px',
                            background: '#ef6060',
                            color: 'white',
                            border: 'none',
                            borderRadius: 6,
                            cursor: 'pointer'
                        }}
                        title="Logout">
                        Logout
                    </button>
                </div>
            </header>
            <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            style={{ display: 'none' }}/>
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
                                    {/* if server serves static files at /uploads/<storageName> */}
                                    <a
                                        href={f.path.startsWith('http') ? f.path : `/uploads/${f.storageName}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: '#0ea5a4' }}>
                                        Download
                                    </a>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </section>
        </div>
    )
}
export default Dashboard
