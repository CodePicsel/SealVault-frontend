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
    const [expiresIn, setExpiresIn] = useState<number | null>(state?.expiresIn ?? null);
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
        const body = encodeURIComponent(`Hi,\n\nPlease find the signed document here:\n\n${url}\n\nLink expires in ${expiresIn ? `${Math.floor(expiresIn/60)} minutes` : '1 hour'}.`);
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
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Signed document</h2>
                <div className="flex gap-2">
                    <button className="px-3 py-1 bg-gray-100 rounded" onClick={onDownload}>Download</button>
                    <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={onEmail}>Email</button>
                    <button className="px-3 py-1 bg-emerald-600 text-white rounded" onClick={onShare}>Share</button>
                </div>
            </div>

            <div className="bg-white p-4 shadow">
                {loading && <div>Loading viewer…</div>}
                {!loading && url ? (
                    <Document file={url}>
                        <Page pageNumber={1} width={800} />
                    </Document>
                ) : (
                    <div>Preview not available</div>
                )}
            </div>
        </div>
    );
};

export default SignedResult;