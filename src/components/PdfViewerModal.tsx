// src/components/PdfViewerModal.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Document, Page } from 'react-pdf';
import api from '../api/axios';
import type { FileDoc } from '../types/file';

type Props = {
    open: boolean;
    file: FileDoc | null;
    onClose: () => void;
};

const PdfViewerModal: React.FC<Props> = ({ open, file, onClose }) => {
    const [pdfUrl, setPdfUrl] = useState<string | null>(null); // object URL
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [numPages, setNumPages] = useState<number>(0);
    const [page, setPage] = useState<number>(1);
    const [scale, setScale] = useState<number>(1);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    // fetch signed url -> blob -> objectURL
    useEffect(() => {
        if (!open) return;
        if (!file) return;

        let objectUrl: string | null = null;
        const controller = new AbortController();

        const load = async () => {
            setLoading(true);
            setError(null);
            setPdfUrl(null);
            setNumPages(0);
            setPage(1);

            try {
                // get signed url from backend
                const resp = await api.get<{ url: string }>(`/api/uploads/${file._id}/download`);
                const signedUrl = resp.data?.url;
                if (!signedUrl) throw new Error('No download URL returned');

                // fetch blob and create object URL
                const r = await fetch(signedUrl, { signal: controller.signal });
                if (!r.ok) throw new Error(`Failed to download PDF (${r.status})`);
                const blob = await r.blob();
                objectUrl = URL.createObjectURL(blob);

                if (!mountedRef.current) {
                    if (objectUrl) URL.revokeObjectURL(objectUrl);
                    return;
                }
                setPdfUrl(objectUrl);
            } catch (err: any) {
                if (err.name === 'AbortError') return;
                console.error('PDF load error', err);
                setError(err?.message || 'Could not load PDF');
                // auto-close on error (optional)
                // onClose();
            } finally {
                setLoading(false);
            }
        };

        load();

        return () => {
            controller.abort();
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [open, file, onClose]);

    const onDocumentLoadSuccess = (d: { numPages: number }) => {
        setNumPages(d.numPages);
        setPage(1);
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* modal */}
            <div className="relative z-10 w-[90vw] max-w-5xl max-h-[90vh] bg-white rounded shadow-lg overflow-hidden">
                <div className="flex items-center justify-between p-3 border-b">
                    <div>
                        <div className="font-semibold">{file?.originalName ?? 'Document'}</div>
                        <div className="text-xs text-gray-500">{page} / {numPages || '—'}</div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            className="px-2 py-1 bg-gray-100 rounded text-sm"
                            onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
                            aria-label="Zoom out"
                        >
                            −
                        </button>
                        <button
                            className="px-2 py-1 bg-gray-100 rounded text-sm"
                            onClick={() => setScale((s) => s + 0.25)}
                            aria-label="Zoom in"
                        >
                            +
                        </button>

                        <a
                            className="px-2 py-1 bg-teal-600 text-white rounded text-sm"
                            href={pdfUrl ?? file?.url ?? '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => {
                                // if we have blob url use it instead of re-downloading
                                if (pdfUrl) { e.preventDefault(); window.open(pdfUrl, '_blank', 'noopener'); }
                            }}
                        >
                            Open raw
                        </a>

                        <button className="px-2 py-1 bg-red-100 rounded text-sm" onClick={onClose}>Close</button>
                    </div>
                </div>

                <div className="p-4 overflow-auto" style={{ height: 'calc(90vh - 88px)' }}>
                    {loading && <div className="text-center py-12">Loading PDF…</div>}
                    {error && <div className="text-center text-red-600 py-6">{error}</div>}

                    {!loading && !error && pdfUrl && (
                        <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess} loading="">
                            <div className="flex flex-col items-center">
                                <Page
                                    pageNumber={page}
                                    width={800}
                                    scale={scale}
                                    renderAnnotationLayer={false}
                                    renderTextLayer={false}
                                />
                                <div className="flex items-center gap-2 mt-4">
                                    <button
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        className="px-3 py-1 bg-gray-100 rounded"
                                        disabled={page <= 1}
                                    >
                                        Prev
                                    </button>
                                    <button
                                        onClick={() => setPage((p) => Math.min(numPages, p + 1))}
                                        className="px-3 py-1 bg-gray-100 rounded"
                                        disabled={page >= numPages}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </Document>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PdfViewerModal;