// src/pages/SignedResult.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Document, Page } from 'react-pdf';
import { Button } from '../ui/Button';

const SignedResult: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const loc = useLocation();
    const navigate = useNavigate();
    const state = loc.state as { url?: string, expiresIn?: number } | undefined;

    const [url, setUrl] = useState<string | null>(state?.url ?? null);
    const [expiresIn] = useState<number | null>(state?.expiresIn ?? null);
    const [loading, setLoading] = useState(false);
    const [numPages, setNumPages] = useState<number>(0);
    const [containerWidth, setContainerWidth] = useState<number>(800);
    const [showMenu, setShowMenu] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
    };

    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.clientWidth);
            }
        };
        updateWidth();
        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    useEffect(() => {
        if (url) return;
        // fetch signed file url from server if not provided in state
        (async () => {
            try {
                setLoading(true);
                const resp = await api.get<{ url: string }>(`/api/uploads/${id}/download`);
                setUrl(resp.data.url);
            } catch (err) {
                console.error('Could not fetch signed url', err);
            } finally {
                setLoading(false);
            }
        })();
    }, [id, url]);

    const onDownload = () => {
        if (!url) return;
        window.open(url, '_blank');
    };

    const onGmail = () => {
        if (!url) return;
        const subject = encodeURIComponent('Signed document');
        const body = encodeURIComponent(`Hi,\n\nPlease find the signed document here:\n\n${url}\n\nLink expires in ${expiresIn ? `${Math.floor(expiresIn / 60)} minutes` : '1 hour'}.`);
        window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`, '_blank', 'noopener,noreferrer');
    };

    const onShare = async () => {
        if (!url) return;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Signed document',
                    text: 'Signed document — link below',
                    url
                });
            } catch (err) {
                console.warn('Share cancelled or failed', err);
            }
        } else {
            // fallback copy link
            await navigator.clipboard.writeText(url);
            alert('Link copied to clipboard');
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fbf9] dark:bg-neutral-900 bg-[linear-gradient(to_right,#e5f5eb_1px,transparent_1px),linear-gradient(to_bottom,#e5f5eb_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[24px_24px] py-6 px-4 transition-colors duration-300">
            <div className="w-full max-w-4xl mx-auto bg-white/20 dark:bg-neutral-800/60 backdrop-blur-md rounded-2xl border border-white/60 dark:border-white/10 p-4 sm:p-6 relative shadow-2xl transition-colors duration-300">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <h2 className="text-xl font-semibold text-teal-900 dark:text-teal-50">Signed document</h2>
                    {/* Desktop Actions */}
                    <div className="hidden sm:flex items-center gap-2">
                        <Button variant="ghost" onClick={onDownload}>
                            <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            Download
                        </Button>
                        <Button variant="ghost" onClick={onGmail}>
                            <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            Gmail
                        </Button>
                        <Button variant="ghost" onClick={onShare}>
                            <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                            Share
                        </Button>
                        <div className="w-px h-8 bg-white/40 dark:bg-white/10 mx-1"></div>
                        <Button
                            variant="primary"
                            className="bg-white/60 dark:bg-neutral-700/60 hover:bg-white dark:hover:bg-neutral-600/60 text-teal-900 dark:text-teal-100 border-teal-500/20 dark:border-white/10 shadow-[0_0_15px_-3px_rgba(45,212,191,0.3)] hover:shadow-[0_0_20px_0_rgba(45,212,191,0.5)] transition-all duration-300"
                            onClick={() => navigate('/dashboard')}
                        >
                            <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                            Dashboard
                        </Button>
                    </div>

                    {/* Mobile Actions Dropdown */}
                    <div className="sm:hidden flex items-center gap-2 relative">
                        <Button
                            variant="primary"
                            className="bg-white/60 dark:bg-neutral-700/60 hover:bg-white dark:hover:bg-neutral-600/60 text-teal-900 dark:text-teal-100 border-teal-500/20 dark:border-white/10 shadow-[0_0_15px_-3px_rgba(45,212,191,0.3)] min-w-[40px] min-[460px]:min-w-[120px]"
                            onClick={() => navigate('/dashboard')}
                        >
                            <svg className="w-4 h-4 min-[460px]:mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                            <span className="hidden min-[460px]:inline">Dashboard</span>
                        </Button>
                        <Button variant="ghost" className="px-2" onClick={() => setShowMenu(!showMenu)}>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                        </Button>

                        {showMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}></div>
                                <div className="absolute top-12 right-0 w-48 bg-white/20 dark:bg-neutral-800/80 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col py-1 transition-colors duration-300">
                                    <button className="flex items-center w-full px-4 py-3 text-left hover:bg-white/50 dark:hover:bg-neutral-700/50 transition-colors text-teal-900 dark:text-teal-100 font-medium" onClick={() => { onDownload(); setShowMenu(false); }}>
                                        <svg className="w-4 h-4 mr-3 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        Download
                                    </button>
                                    <button className="flex items-center w-full px-4 py-3 text-left hover:bg-white/50 dark:hover:bg-neutral-700/50 transition-colors text-teal-900 dark:text-teal-100 font-medium border-t border-white/40 dark:border-white/10" onClick={() => { onGmail(); setShowMenu(false); }}>
                                        <svg className="w-4 h-4 mr-3 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                        Gmail
                                    </button>
                                    <button className="flex items-center w-full px-4 py-3 text-left hover:bg-white/50 dark:hover:bg-neutral-700/50 transition-colors text-teal-900 dark:text-teal-100 font-medium border-t border-white/40 dark:border-white/10" onClick={() => { onShare(); setShowMenu(false); }}>
                                        <svg className="w-4 h-4 mr-3 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                                        Share Link
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div style={{ position: 'relative' }}>
                    {loading && <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading viewer…</div>}
                    {!loading && url ? (
                        <div ref={containerRef} className="flex justify-center w-full">
                            <div className="w-full max-w-[800px] shadow-sm flex flex-col gap-4 rounded-xl">
                                <Document file={url} onLoadSuccess={onDocumentLoadSuccess} loading={<div className="text-gray-500 dark:text-gray-400 py-4 text-center">Loading PDF…</div>}>
                                    {Array.from(new Array(numPages), (_, index) => (
                                        <div key={`page_container_${index}`} className="shadow-lg mb-4 rounded-xl overflow-hidden border border-white/60 dark:border-white/10 dark:opacity-90">
                                            <Page
                                                pageNumber={index + 1}
                                                width={Math.min(containerWidth, 800)}
                                                renderAnnotationLayer={false}
                                                renderTextLayer={false}
                                                className="bg-white"
                                            />
                                        </div>
                                    ))}
                                </Document>
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">Preview not available</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SignedResult;
