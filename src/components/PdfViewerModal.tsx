// src/components/PdfViewerModalSimple.tsx
import React, { useEffect, useState } from 'react';
import { Document, Page } from 'react-pdf';
import type { FileDoc } from '../types/file';
import api from '../api/axios';

type Props = {
    open: boolean;
    file: FileDoc | null;
    onClose: () => void;
    onSign: (file: FileDoc) => void;
};

const PdfViewerModalSimple: React.FC<Props> = ({ open, file, onClose, onSign }) => {
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [numPages, setNumPages] = useState(0);
    const [page, setPage] = useState(1);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        let objectUrl: string | null = null;
        const controller = new AbortController();
        if (!open || !file) return;
        (async () => {
            try {
                setLoading(true);
                const resp = await api.get<{ url: string }>(`/api/uploads/${file._id}/download`);
                const url = resp.data?.url;
                if (!url) throw new Error('No download url');
                const r = await fetch(url, { signal: controller.signal });
                if (!r.ok) throw new Error(`Failed (${r.status})`);
                const blob = await r.blob();
                objectUrl = URL.createObjectURL(blob);
                setPdfUrl(objectUrl);
                setPage(1);
            } catch (err) {
                console.error('preview load error', err);
            } finally {
                setLoading(false);
            }
        })();
        return () => {
            controller.abort();
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [open, file]);

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => setNumPages(numPages);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative z-10 w-[90vw] max-w-5xl max-h-[90vh] bg-white rounded shadow-lg overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b">
                    <div>
                        <div className="font-semibold">{file?.originalName ?? 'Document'}</div>
                        <div className="text-sm text-gray-500">{page} / {numPages || '—'}</div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button className="px-3 py-1 bg-gray-100 rounded" onClick={() => setScale(s => Math.max(0.5, s - 0.25))}>−</button>
                        <button className="px-3 py-1 bg-gray-100 rounded" onClick={() => setScale(s => s + 0.25)}>+</button>

                        <button
                            className="px-4 py-2 bg-emerald-600 text-white rounded shadow"
                            onClick={() => file && onSign(file)}
                            title="Sign this document"
                        >
                            Sign
                        </button>

                        <a
                            className="px-3 py-1 bg-teal-600 text-white rounded"
                            href={pdfUrl ?? file?.url ?? '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => { if (pdfUrl) { e.preventDefault(); window.open(pdfUrl, '_blank', 'noopener'); } }}
                        >
                            Download
                        </a>

                        <button className="px-3 py-1 bg-red-100 rounded" onClick={onClose}>Close</button>
                    </div>
                </div>

                <div className="p-4 overflow-auto" style={{ height: 'calc(90vh - 88px)' }}>
                    {loading && <div className="text-center py-12">Loading PDF…</div>}
                    {!loading && pdfUrl && (
                        <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess} loading="">
                            <div className="flex justify-center">
                                <Page pageNumber={page} width={800 * scale} renderAnnotationLayer={false} renderTextLayer={false} />
                            </div>
                            <div className="flex justify-center gap-2 mt-3">
                                <button className="px-3 py-1 bg-gray-100 rounded" onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
                                <button className="px-3 py-1 bg-gray-100 rounded" onClick={() => setPage(p => Math.min(numPages, p + 1))}>Next</button>
                            </div>
                        </Document>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PdfViewerModalSimple;