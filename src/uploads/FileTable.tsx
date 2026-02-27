// src/uploads/FileTable.tsx
import React from 'react';
import type { FileDoc } from '../types/file';
import { Button } from '../ui/Button';

type Props = {
    files: FileDoc[];
    onDownloadError?: (msg: string | null) => void; // kept for compatibility
    onPreview?: (f: FileDoc) => void;
    onSign?: (f: FileDoc) => void;
};

export const FileTable: React.FC<Props> = ({ files, onPreview, onSign }) => {
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
                {files.map((f) => (
                    <tr key={f._id} className="border-t">
                        <td className="p-3">{f.originalName}</td>
                        <td className="p-3">{(f.size / 1024).toFixed(1)} KB</td>
                        <td className="p-3">{new Date(f.createdAt).toLocaleString()}</td>

                        <td className="p-3 flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onPreview?.(f)}
                            >
                                Preview
                            </Button>

                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => onSign?.(f)}
                            >
                                Sign
                            </Button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default FileTable;