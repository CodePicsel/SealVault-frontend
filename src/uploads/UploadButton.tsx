// src/uploads/UploadButton.tsx
import React, { useRef, useState } from 'react';
import { Button } from '../ui/Button';
import api from '../api/axios';
import type { FileDoc } from '../types/file';

type Props = {
    onUploaded?: (file: FileDoc) => void;
    maxSizeBytes?: number;
};

export const UploadButton: React.FC<Props> = ({ onUploaded, maxSizeBytes = 10 * 1024 * 1024 }) => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState<number | null>(null);
    const [err, setErr] = useState<string | null>(null);

    const openPicker = () => {
        setErr(null);
        inputRef.current?.click();
    };

    const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setErr(null);
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.type !== 'application/pdf') { setErr('Only PDF allowed'); e.currentTarget.value=''; return; }
        if (file.size > maxSizeBytes) { setErr(`Max ${Math.round(maxSizeBytes/1024/1024)}MB`); e.currentTarget.value=''; return; }

        const fd = new FormData(); fd.append('file', file);
        try {
            setUploading(true); setProgress(0);
            const resp = await api.post('/api/uploads/pdf', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (ev: ProgressEvent) => {
                    if (!ev.lengthComputable) return;
                    setProgress(Math.round((ev.loaded * 100) / ev.total));
                }
            });
            if (resp.data) {
                if (onUploaded) onUploaded(resp.data);
            }
        } catch (err: any) {
            setErr(err?.response?.data?.message ?? 'Upload failed');
        } finally {
            setUploading(false);
            setProgress(null);
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    return (
        <div className="flex flex-col items-end">
            <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={handle} />
            <Button onClick={openPicker} disabled={uploading}>{uploading ? 'Uploading…' : 'Upload PDF'}</Button>
            {progress != null && <div className="w-48 mt-2"><div className="h-2 bg-gray-200 rounded"><div style={{width:`${progress}%`}} className="h-2 bg-teal-500 rounded" /></div><div className="text-sm text-gray-500 mt-1">{progress}%</div></div>}
            {err && <div className="text-sm text-red-500 mt-1">{err}</div>}
        </div>
    );
};