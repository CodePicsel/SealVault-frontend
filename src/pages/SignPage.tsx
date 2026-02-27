// src/pages/SignPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { Document, Page } from 'react-pdf';
import api from '../api/axios';

type NavState = {
    signatureDataUrl?: string | null;
};

const SignPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state as NavState | undefined;
    const signatureDataUrl = state?.signatureDataUrl ?? null;

    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [numPages, setNumPages] = useState(0);

    useEffect(() => {
        if (!id) return;
        let objectUrl: string | null = null;
        const controller = new AbortController();
        (async () => {
            try {
                setLoading(true);
                const resp = await api.get<{ url: string }>(`/api/uploads/${id}/download`);
                const signed = resp.data?.url;
                if (!signed) throw new Error('No download URL returned');
                const r = await fetch(signed, { signal: controller.signal });
                if (!r.ok) throw new Error(`Failed to fetch PDF ${r.status}`);
                const blob = await r.blob();
                objectUrl = URL.createObjectURL(blob);
                setPdfUrl(objectUrl);
            } catch (err) {
                console.error('Sign page load error', err);
            } finally {
                setLoading(false);
            }
        })();
        return () => {
            controller.abort();
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [id]);

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto bg-white rounded shadow p-4">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-semibold">Signing workspace</h1>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 bg-gray-100 rounded" onClick={() => navigate(-1)}>Back</button>
                        <button className="px-3 py-1 bg-amber-500 text-white rounded">Save draft</button>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-8">
                        <div className="border rounded p-4">
                            {loading && <div>Loading PDF…</div>}
                            {!loading && pdfUrl && (
                                <Document file={pdfUrl} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
                                    <div className="flex justify-center">
                                        <Page pageNumber={1} width={800} renderAnnotationLayer={false} renderTextLayer={false} />
                                    </div>
                                </Document>
                            )}
                        </div>
                    </div>

                    <aside className="col-span-4">
                        <div className="border rounded p-4">
                            <h3 className="font-medium mb-2">Selected signature</h3>
                            {signatureDataUrl ? (
                                <div className="border p-2">
                                    <img src={signatureDataUrl} alt="signature" className="max-w-full" />
                                    <div className="mt-3 text-sm text-gray-600">Signature loaded — place it on the page using the placement tools (coming soon).</div>
                                </div>
                            ) : (
                                <div className="text-sm text-gray-500">No signature selected. Go back and pick one.</div>
                            )}
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default SignPage;