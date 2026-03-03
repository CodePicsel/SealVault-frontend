// src/pages/SignedResult.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { Document, Page } from 'react-pdf';

const SignedResult: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const loc = useLocation();
    const state = loc.state as { url?: string, expiresIn?: number } | undefined;

    const [url, setUrl] = useState<string | null>(state?.url ?? null);
    const [expiresIn] = useState<number | null>(state?.expiresIn ?? null);
    const [loading, setLoading] = useState(false);

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

    const onEmail = () => {
        if (!url) return;
        const subject = encodeURIComponent('Signed document');
        const body = encodeURIComponent(`Hi,\n\nPlease find the signed document here:\n\n${url}\n\nLink expires in ${expiresIn ? `${Math.floor(expiresIn / 60)} minutes` : '1 hour'}.`);
        // mailto cannot attach file automatically. We include the direct URL in the body.
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
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
        <div className="min-h-screen bg-[#f8fbf9] bg-[linear-gradient(to_right,#e5f5eb_1px,transparent_1px),linear-gradient(to_bottom,#e5f5eb_1px,transparent_1px)] bg-size-[24px_24px] py-6 px-4">
            <div className="max-w-4xl mx-auto p-6 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-teal-900">Signed document</h2>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 bg-white/50 backdrop-blur-md border border-white/60 hover:bg-white/80 transition-colors rounded text-teal-900" onClick={onDownload}>Download</button>
                        <button className="px-3 py-1 bg-white/50 backdrop-blur-md border border-white/60 hover:bg-white/80 transition-colors rounded text-teal-900" onClick={onEmail}>Email</button>
                        <button className="px-3 py-1 bg-[#a3f7b5] text-teal-950 hover:bg-white/40 hover:backdrop-blur-md hover:border-white/60 border border-transparent transition-all rounded" onClick={onShare}>Share</button>
                    </div>
                </div>

                <div className="bg-white/60 backdrop-blur-md p-4 rounded-xl border border-white/60 shadow">
                    {loading && <div className="p-8 text-center text-gray-500">Loading viewer…</div>}
                    {!loading && url ? (
                        <div className="flex justify-center">
                            <Document file={url}>
                                <Page pageNumber={1} width={800} />
                            </Document>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-500">Preview not available</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SignedResult;