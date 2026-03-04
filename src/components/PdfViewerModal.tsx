// src/components/PdfViewerModalSimple.tsx
import React, { useEffect, useState } from 'react';
import { Document, Page } from 'react-pdf';
import type { FileDoc } from '../types/file';
import api from '../api/axios';
import { Button } from '../ui/Button';

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
    const [showMenu, setShowMenu] = useState(false);

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
            <div className="absolute inset-0 bg-slate-900/5 dark:bg-black/60 transition-colors duration-300" onClick={onClose} />
            <div className="relative z-10 w-[95vw] sm:w-[90vw] max-w-5xl max-h-[90vh] bg-white/20 dark:bg-neutral-800/80 backdrop-blur-md border border-white/60 dark:border-white/10 shadow-2xl rounded-2xl overflow-hidden flex flex-col transition-colors duration-300">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-white/40 dark:border-white/10 gap-4 sm:gap-0">
                    <div>
                        <div className="font-semibold break-all text-gray-800 dark:text-gray-100">{file?.originalName ?? 'Document'}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{page} / {numPages || '—'}</div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start">
                        {/* Desktop Actions */}
                        <div className="hidden sm:flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="font-bold text-lg" onClick={() => setScale(s => Math.max(0.5, s - 0.25))}>−</Button>
                            <Button variant="ghost" size="sm" className="font-bold text-lg" onClick={() => setScale(s => s + 0.25)}>+</Button>

                            <Button
                                variant="primary"
                                size="sm"
                                className="shadow-md"
                                onClick={() => file && onSign(file)}
                                title="Sign this document"
                            >
                                Sign
                            </Button>

                            <Button
                                variant="primary"
                                size="sm"
                                className="text-center shadow-md bg-linear-to-r from-teal-400/80 to-teal-500/80 hover:from-teal-400 hover:to-teal-500 hover:shadow-[0_8px_20px_rgba(45,212,191,0.4)] border-white/60 text-teal-950"
                                onClick={() => {
                                    if (pdfUrl) {
                                        window.open(pdfUrl, '_blank', 'noopener');
                                    } else if (file?.url) {
                                        window.open(file.url, '_blank', 'noopener');
                                    }
                                }}
                            >
                                Download
                            </Button>

                            <Button variant="danger" size="sm" onClick={onClose}>Close</Button>
                        </div>

                        {/* Mobile Actions Dropdown */}
                        <div className="sm:hidden flex items-center gap-2 relative">
                            <Button variant="ghost" size="sm" className="font-bold text-lg px-2" onClick={() => setScale(s => Math.max(0.5, s - 0.25))}>−</Button>
                            <Button variant="ghost" size="sm" className="font-bold text-lg px-2" onClick={() => setScale(s => s + 0.25)}>+</Button>

                            <Button
                                variant="primary"
                                size="sm"
                                className="shadow-md"
                                onClick={() => file && onSign(file)}
                            >
                                Sign
                            </Button>
                            <Button variant="ghost" size="sm" className="px-2" onClick={() => setShowMenu(!showMenu)}>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                            </Button>

                            {showMenu && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}></div>
                                    <div className="absolute top-12 right-0 w-48 bg-white/70 dark:bg-neutral-800/80 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col py-1 transition-colors duration-300">
                                        <button className="flex items-center w-full px-4 py-3 text-left hover:bg-white/50 dark:hover:bg-neutral-700/50 transition-colors text-teal-900 dark:text-teal-100 font-medium" onClick={() => {
                                            if (pdfUrl) {
                                                window.open(pdfUrl, '_blank', 'noopener');
                                            } else if (file?.url) {
                                                window.open(file.url, '_blank', 'noopener');
                                            }
                                            setShowMenu(false);
                                        }}>
                                            <svg className="w-4 h-4 mr-3 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                            Download
                                        </button>
                                        <button className="flex items-center w-full px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors text-red-600 dark:text-red-400 font-medium border-t border-white/40 dark:border-white/10" onClick={() => { onClose(); setShowMenu(false); }}>
                                            <svg className="w-4 h-4 mr-3 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                            Close
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex-1 relative flex flex-col overflow-hidden" style={{ height: 'calc(90vh - 88px)' }}>
                    {loading && <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading PDF…</div>}
                    {!loading && pdfUrl && (
                        <>
                            {/* Navigation Arrows positioned absolutely */}
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-white/60 dark:bg-neutral-800/90 backdrop-blur-xl border border-white/60 dark:border-white/20 shadow-xl disabled:opacity-0 disabled:pointer-events-none hover:bg-white/80 dark:hover:bg-neutral-700/90 transition-all text-teal-900 dark:text-teal-100"
                            >
                                <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(numPages, p + 1))}
                                disabled={page >= numPages || numPages === 0}
                                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-white/60 dark:bg-neutral-800/90 backdrop-blur-xl border border-white/60 dark:border-white/20 shadow-xl disabled:opacity-0 disabled:pointer-events-none hover:bg-white/80 dark:hover:bg-neutral-700/90 transition-all text-teal-900 dark:text-teal-100"
                            >
                                <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                            </button>

                            <div className="w-full h-full overflow-auto custom-scrollbar relative z-10 pt-4 pb-8">
                                <div className="min-w-fit w-full flex justify-center px-4 sm:px-20">
                                    <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess} loading="">
                                        <div className="pb-8">
                                            <Page pageNumber={page} width={Math.max(800 * scale, 320)} renderAnnotationLayer={false} renderTextLayer={false} className="shadow-lg dark:opacity-90 transition-opacity" />
                                        </div>
                                    </Document>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PdfViewerModalSimple;