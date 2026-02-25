// src/uploads/FileTable.tsx
import React from 'react';
import type { FileDoc } from '../types/file';
import { Button } from '../ui/Button';
import api from '../api/axios';

export const FileTable: React.FC<{ files: FileDoc[]; onDownloadError?: (msg:string)=>void }> = ({ files, onDownloadError }) => {
    const handleDownload = async (f: FileDoc) => {
        try {
            if (f.url) { window.open(f.url, '_blank'); return; }
            const resp = await api.get<{url:string}>(`/api/uploads/${f._id}/download`);
            if (resp.data?.url) window.open(resp.data.url, '_blank');
            else throw new Error('No url');
        } catch (err: any) {
            const msg = err?.response?.data?.message ?? 'Download failed';
            onDownloadError?.(msg);
        }
    };

    return (
        <div className="overflow-x-auto bg-white shadow rounded">
            <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                    <th className="p-3">Name</th>
                    <th className="p-3">Size</th>
                    <th className="p-3">Uploaded</th>
                    <th className="p-3">Action</th>
                </tr>
                </thead>
                <tbody>
                {files.map(f => (
                    <tr key={f._id} className="border-t">
                        <td className="p-3">{f.originalName}</td>
                        <td className="p-3">{(f.size/1024).toFixed(1)} KB</td>
                        <td className="p-3">{new Date(f.createdAt).toLocaleString()}</td>
                        <td className="p-3">
                            <Button variant="ghost" size="sm" onClick={() => handleDownload(f)}>Download</Button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};