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
        <div className="flex flex-col gap-3">
            {files.length === 0 && (
                <div className="p-8 text-center text-gray-500 bg-white/20 backdrop-blur-md rounded-2xl border border-white/60 shadow-2xl">
                    No files available.
                </div>
            )}
            {files.map((f) => (
                <div key={f._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-3 bg-white/40 backdrop-blur-sm border border-white/60 rounded-2xl shadow-sm hover:shadow-md hover:bg-white/60 transition-all gap-4 sm:gap-0">
                    <div className="flex-1 text-gray-700 font-semibold text-sm truncate px-0 sm:px-4 w-full sm:w-auto text-center sm:text-left">{f.originalName}</div>

                    <div className="flex items-center justify-center sm:justify-start gap-4 sm:gap-0 w-full sm:w-auto">
                        <div className="w-auto sm:w-24 text-gray-600 text-center font-semibold text-sm shrink-0">{(f.size / 1024).toFixed(1)} KB</div>
                        <div className="hidden sm:block w-px h-4 bg-gray-300 mx-2"></div>
                        <div className="w-auto sm:w-32 text-gray-600 text-center font-semibold text-sm shrink-0">{new Date(f.createdAt).toLocaleDateString()}</div>
                    </div>

                    <div className="flex items-center justify-center sm:justify-end gap-3 shrink-0 sm:ml-4 sm:pr-1 w-full sm:w-auto">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-10 px-5 font-bold"
                            onClick={() => onPreview?.(f)}
                        >
                            Preview
                        </Button>

                        <Button
                            variant="primary"
                            size="sm"
                            className="flex flex-col items-center justify-center p-0 w-28 h-12"
                            onClick={() => onSign?.(f)}
                        >
                            <span className="font-bold text-base leading-none">Sign</span>
                            <span className="text-[10px] font-semibold opacity-70 mt-0.5">this document</span>
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default FileTable;