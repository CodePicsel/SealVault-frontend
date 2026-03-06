// src/pages/SignPage.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { Document, Page } from 'react-pdf';
import api from '../api/axios';
import { SignaturePanel } from "../components/SignaturePanel";
import { SignerFieldsPanel } from "../components/SignerFieldsPanel";
import type { SignerInput } from "../components/SignFlowModal";
import SignatureOverlay from "../components/SignatureOverlay";
import { Button } from "../ui/Button";

type PlacedSignature = {
    id: string;
    signatureId?: string | null; // DB id after upload
    dataUrl?: string;              // data:... or remote url
    type?: 'image' | 'placeholder'; // image for signing, placeholder for prepare mode
    signerEmail?: string;         // for prepare mode
    placeholderLabel?: string;    // for prepare mode
    page: number;
    left: number;                 // px
    top: number;                  // px
    width: number;                // px
    height?: number;              // px
    uploading?: boolean;
    saved?: boolean;              // persisted to /signatures
};

// helper: convert dataURL -> Blob
function dataURLToBlob(dataURL: string) {
    const [meta, base64] = dataURL.split(',');
    const m = (meta.match(/:(.*?);/) || [])[1] || 'image/png';
    const binary = atob(base64);
    const len = binary.length;
    const u8 = new Uint8Array(len);
    for (let i = 0; i < len; i++) u8[i] = binary.charCodeAt(i);
    return new Blob([u8], { type: m });
}

const uploadCache: Record<string, Promise<{ id: string, url: string }>> = {};
const urlToIdCache: Record<string, string> = {};

async function getOrUploadSignature(dataUrl: string) {
    if (!dataUrl.startsWith('data:')) {
        return { id: urlToIdCache[dataUrl] || '', url: dataUrl };
    }
    if (dataUrl in uploadCache) {
        return uploadCache[dataUrl];
    }
    const uploadPromise = (async () => {
        const blob = dataURLToBlob(dataUrl);
        const fd = new FormData();
        fd.append('file', blob, `sig-${Date.now()}.png`);
        const resp = await api.post('/api/signatures/upload', fd, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        const data = resp.data as { id: string, url: string };
        urlToIdCache[data.url] = data.id;
        return data;
    })();
    uploadCache[dataUrl] = uploadPromise;
    return uploadPromise;
}

const SignPage: React.FC = () => {
    const { id } = useParams<{ id: string }>(); // fileId
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state as {
        signatureDataUrl?: string;
        mode?: 'sign' | 'prepare';
        signers?: SignerInput[];
    } | undefined;

    const isPrepareMode = state?.mode === 'prepare';
    const signers = state?.signers || [];

    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [numPages, setNumPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);

    const [availableSignatures, setAvailableSignatures] = useState<string[]>([]);
    const [placed, setPlaced] = useState<PlacedSignature[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const [pendingSignatureUrl, setPendingSignatureUrl] = useState<string | null>(null); // for queued auto-place image
    const [pendingSignerPlaceholder, setPendingSignerPlaceholder] = useState<{ signerId: string; email: string } | null>(null); // queued auto-place placeholder
    const [pageBox, setPageBox] = useState<{ width: number; height: number } | null>(null);
    const pageDomRef = useRef<HTMLDivElement | null>(null);

    const replaceAvailableSignature = useCallback((oldUrl: string, newUrl: string) => {
        setAvailableSignatures(prev => {
            const next = [...prev];
            const idx = next.indexOf(oldUrl);
            if (idx !== -1) {
                next[idx] = newUrl;
            } else if (!next.includes(newUrl)) {
                next.unshift(newUrl);
            }
            return next;
        });
    }, []);

    // initial available from navigation state (one-off)
    useEffect(() => {
        if (state?.signatureDataUrl) {
            const initialUrl = state.signatureDataUrl;
            setAvailableSignatures(prev => prev.includes(initialUrl) ? prev : [initialUrl, ...prev]);

            // immediately trigger upload and cache
            getOrUploadSignature(initialUrl).then(uploaded => {
                if (uploaded.url !== initialUrl) {
                    replaceAvailableSignature(initialUrl, uploaded.url);
                }
            }).catch(console.error);

            setPendingSignatureUrl(initialUrl);
        }
    }, [state?.signatureDataUrl, replaceAvailableSignature]);

    // load PDF object URL from signed url endpoint
    useEffect(() => {
        if (!id) return;
        let objectUrl: string | null = null;
        const ctrl = new AbortController();
        (async () => {
            try {
                setLoading(true);
                const resp = await api.get<{ url: string }>(`/api/uploads/${id}/download`);
                const signed = resp.data?.url;
                if (!signed) throw new Error('No download URL returned');
                const r = await fetch(signed, { signal: ctrl.signal });
                if (!r.ok) throw new Error(`Failed to fetch PDF ${r.status}`);
                const blob = await r.blob();
                objectUrl = URL.createObjectURL(blob);
                setPdfUrl(objectUrl);
                setCurrentPage(1);
            } catch (err) {
                console.error('Sign page load error', err);
                alert('Could not load PDF for signing');
            } finally {
                setLoading(false);
            }
        })();
        return () => {
            ctrl.abort();
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [id]);

    // load previous user signatures
    useEffect(() => {
        api.get('/api/signatures')
            .then(res => {
                if (Array.isArray(res.data)) {
                    // Extract urls and reverse so newest are first
                    const urls = res.data.map(sig => sig.url).filter(Boolean).reverse();
                    if (urls.length > 0) {
                        setAvailableSignatures(prev => {
                            // Merge without duplicates, keeping existing data URLs (e.g. drawn) at front
                            const existingSet = new Set(prev);
                            const merged = [...prev];
                            for (const url of urls) {
                                if (!existingSet.has(url)) {
                                    merged.push(url);
                                }
                            }
                            return merged;
                        });
                    }
                }
            })
            .catch(err => {
                console.error('Failed to load recent signatures', err);
            });
    }, []);

    // measure page DOM box (px)
    useEffect(() => {
        const updateBox = () => {
            const node = pageDomRef.current;
            if (!node) return;
            const rect = node.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;
            setPageBox(prev => {
                const nw = Math.round(rect.width);
                const nh = Math.round(rect.height);
                if (prev?.width === nw && prev?.height === nh) return prev;
                return { width: nw, height: nh };
            });
        };
        updateBox();
        const ro = new ResizeObserver(updateBox);
        if (pageDomRef.current) ro.observe(pageDomRef.current);
        const mo = new MutationObserver(updateBox);
        if (pageDomRef.current) mo.observe(pageDomRef.current, { childList: true, subtree: true });
        window.addEventListener('resize', updateBox);
        window.addEventListener('scroll', updateBox, true);
        return () => {
            ro.disconnect();
            mo.disconnect();
            window.removeEventListener('resize', updateBox);
            window.removeEventListener('scroll', updateBox, true);
        };
    }, [pdfUrl, currentPage, numPages]);

    const onDocumentLoadSuccess = ({ numPages: n }: { numPages: number }) => {
        setNumPages(n);
        setCurrentPage(1);
    };

    // place a signature visually on the page (px positions)
    const startPlacing = useCallback((dataUrl: string, boxOverride?: { width: number; height: number } | null) => {
        const box = boxOverride || pageBox;
        if (!box || box.height < 100) {
            setPendingSignatureUrl(dataUrl);
            return;
        }

        const initialWidth = Math.round(box.width * 0.40);
        const left = Math.round((box.width - initialWidth) / 2);
        const top = Math.round((box.height - (initialWidth * 0.40)) / 2);

        const newId = `sig-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
        const newSig: PlacedSignature = {
            id: newId,
            signatureId: urlToIdCache[dataUrl] || null,
            dataUrl,
            page: currentPage,
            left,
            top,
            width: initialWidth,
            uploading: false,
            saved: false
        };
        setPlaced(prev => [...prev, newSig]);
        setSelectedId(newId);

        if (dataUrl.startsWith('data:')) {
            setPlaced(prev => prev.map(p => p.id === newId ? { ...p, uploading: true } : p));
            getOrUploadSignature(dataUrl).then(uploaded => {
                setPlaced(prev => prev.map(p => p.id === newId ? { ...p, uploading: false, signatureId: uploaded.id, dataUrl: uploaded.url } : p));
                replaceAvailableSignature(dataUrl, uploaded.url);
            }).catch(err => {
                console.error('Background signature upload failed', err);
                setPlaced(prev => prev.map(p => p.id === newId ? { ...p, uploading: false } : p));
                alert('Failed to upload signature image');
            });
        }
    }, [pageBox, currentPage, replaceAvailableSignature]);

    // place a signer placeholder visually on the page
    const startPlacingPlaceholder = useCallback((signerId: string, email: string, boxOverride?: { width: number; height: number } | null) => {
        const box = boxOverride || pageBox;
        if (!box || box.height < 100) {
            setPendingSignerPlaceholder({ signerId, email });
            return;
        }

        const initialWidth = Math.round(box.width * 0.35);
        const initialHeight = Math.round(box.height * 0.08);
        const left = Math.round((box.width - initialWidth) / 2);
        const top = Math.round((box.height - initialHeight) / 2);

        const newId = `placeholder-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
        const signer = signers.find(s => s.id === signerId || s.email === email);
        const label = signer ? `${signer.name || signer.email}` : email;

        const newSig: PlacedSignature = {
            id: newId,
            type: 'placeholder',
            signerEmail: email,
            placeholderLabel: label,
            page: currentPage,
            left,
            top,
            width: initialWidth,
            height: initialHeight,
            saved: false
        };
        setPlaced(prev => [...prev, newSig]);
        setSelectedId(newId);
    }, [pageBox, currentPage, signers]);

    // auto-place pending queued signature once measurements ready
    useEffect(() => {
        if (pendingSignatureUrl && pageBox && pageBox.height >= 100 && !isPrepareMode) {
            startPlacing(pendingSignatureUrl, pageBox);
            setPendingSignatureUrl(null);
        }
        if (pendingSignerPlaceholder && pageBox && pageBox.height >= 100 && isPrepareMode) {
            startPlacingPlaceholder(pendingSignerPlaceholder.signerId, pendingSignerPlaceholder.email, pageBox);
            setPendingSignerPlaceholder(null);
        }
    }, [pageBox, pendingSignatureUrl, pendingSignerPlaceholder, startPlacing, startPlacingPlaceholder, isPrepareMode]);

    // helpers to update and remove placements (passed to SignatureOverlay)
    const updatePlacement = (placementId: string, left: number, top: number, width: number, height?: number) => {
        setPlaced(prev => prev.map(s => s.id === placementId ? { ...s, left, top, width, height: height ?? s.height } : s));
    };
    const removePlacement = (id: string) => {
        setPlaced(prev => prev.filter(s => s.id !== id));
        setSelectedId(prev => prev === id ? null : prev);
    };

    // main Apply flow (Prepare Mode OR Sign Mode):
    const onApply = async () => {
        if (!id) return;
        if ((placed.length) === 0) {
            alert('Place at least one signature/field');
            return;
        }
        const box = pageBox;
        if (!box) { alert('Page not ready'); return; }

        setLoading(true);
        try {
            if (isPrepareMode) {
                // Sender mode: create sign request and send invites
                // 1) format fields
                const fields = placed.map(p => ({
                    signerEmail: p.signerEmail,
                    page: p.page,
                    xRel: Number((p.left / box.width).toFixed(6)),
                    yRel: Number((p.top / box.height).toFixed(6)),
                    widthRel: Number((p.width / box.width).toFixed(6)),
                    heightRel: p.height ? Number((p.height / box.height).toFixed(6)) : 0.08,
                    required: true
                }));

                const payload = {
                    fileId: id,
                    title: 'Document for signing',
                    message: 'Please review and sign this document.',
                    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
                    signers: signers.map(s => ({ name: s.name, email: s.email, order: s.order })),
                    fields
                };

                const resp = await api.post('/api/sign-requests', payload);
                const reqId = resp.data.id || (resp.data.data && resp.data.data.id) || resp.data._id;

                if (reqId) {
                    await api.post(`/api/sign-requests/${reqId}/send-invites`);
                }

                alert("Sign request created and invites sent!");
                navigate('/dashboard');

            } else {
                // 0) Wait smalles for background uploads to finish (gentle wait)
                const waitUntilUploadsFinish = async (timeoutMs = 10_000) => {
                    const end = Date.now() + timeoutMs;
                    while (Date.now() < end) {
                        const anyUploading = placed.some(p => p.uploading);
                        if (!anyUploading) return;
                        await new Promise(r => setTimeout(r, 200));
                    }
                };
                await waitUntilUploadsFinish(10_000);

                let currentPlaced = [...placed];

                // 1) Sync upload any remaining (in case they didn't finish gracefully)
                for (let i = 0; i < currentPlaced.length; i++) {
                    const p = currentPlaced[i];
                    if (p.type === 'placeholder') continue;

                    if (!p.signatureId && p.dataUrl && p.dataUrl.startsWith('data:')) {
                        setPlaced(prev => prev.map(it => it.id === p.id ? { ...it, uploading: true } : it));
                        try {
                            const uploaded = await getOrUploadSignature(p.dataUrl);
                            const updatedP = { ...p, signatureId: uploaded.id, dataUrl: uploaded.url, uploading: false };
                            currentPlaced[i] = updatedP;
                            setPlaced(prev => prev.map(it => it.id === p.id ? updatedP : it));
                            replaceAvailableSignature(p.dataUrl, uploaded.url);
                        } catch (err) {
                            setPlaced(prev => prev.map(it => it.id === p.id ? { ...it, uploading: false } : it));
                            throw new Error('Failed to upload one or more signatures. Try again.');
                        }
                    }
                }

                // 2) POST each placement to /api/uploads/:id/signatures if not already saved
                for (const p of currentPlaced) {
                    if (p.saved || p.type === 'placeholder') continue; // skip already saved or placeholders

                    const imageId = p.signatureId || (p.dataUrl ? urlToIdCache[p.dataUrl] || (p.dataUrl.split('/').pop()?.split('.')[0]) : null);
                    if (!imageId) {
                        throw new Error('Missing signature image id for a placement');
                    }

                    const payload = {
                        imageId: imageId,
                        page: p.page,
                        xRel: Number((p.left / box.width).toFixed(6)),
                        yRel: Number((p.top / box.height).toFixed(6)),
                        widthRel: Number((p.width / box.width).toFixed(6)),
                        rotation: 0
                    };
                    try {
                        await api.post(`/api/uploads/${id}/signatures`, payload);
                        // mark placement as saved
                        setPlaced(prev => prev.map(it => it.id === p.id ? { ...it, saved: true } : it));
                    } catch (err: any) {
                        console.error('Failed to persist placement', err);
                        throw new Error(err?.response?.data?.message || 'Failed to save signature placement');
                    }
                }

                // 3) Call apply-signatures
                const applyResp = await api.post(`/api/uploads/${id}/apply-signatures`);
                const signedUrl = applyResp.data?.signed?.url || applyResp.data?.signedUrl || applyResp.data?.signed?.storagePath ? applyResp.data?.signed?.url : applyResp.data?.signed?.url || applyResp.data?.url || null;

                if (signedUrl) {
                    navigate(`/signed/${id}`, { state: { url: signedUrl } });
                } else if (applyResp.data?.file) {
                    const fileDoc = applyResp.data.file;
                    const lastSigned = fileDoc.signedVersions && fileDoc.signedVersions.length ? fileDoc.signedVersions[fileDoc.signedVersions.length - 1] : null;
                    const url = lastSigned?.url || lastSigned?.storagePath || null;
                    navigate(`/signed/${id}`, { state: { url } });
                } else {
                    navigate(`/signed/${id}`);
                }
            }
        } catch (err: any) {
            console.error('Apply flow error', err);
            const data = err?.response?.data;
            const fullErr = data ? JSON.stringify(data, null, 2) : err?.message;
            alert(`Error Output:\n${fullErr}`);
        } finally {
            setLoading(false);
        }
    };

    // Custom drop handler for the SignaturePanel/SignerFieldsPanel events
    useEffect(() => {
        const handleCustomDrop = (e: Event) => {
            const ce = e as CustomEvent<{ dataUrl: string, clientX: number, clientY: number }>;
            // We differentiate by event type since the custom event names are different
            if (e.type === 'signatureDrop' && !isPrepareMode) {
                const { dataUrl, clientX, clientY } = ce.detail;

                if (!pageDomRef.current || !pageBox) return;
                const rect = pageDomRef.current.getBoundingClientRect();

                if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
                    const dropX = clientX - rect.left;
                    const dropY = clientY - rect.top;

                    const boxWidth = pageBox.width;
                    const initialWidth = Math.round(boxWidth * 0.40);
                    const left = Math.round(dropX - initialWidth / 2);
                    const top = Math.round(dropY - (initialWidth * 0.40) / 2);
                    const newId = `sig-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
                    const newSigId = urlToIdCache[dataUrl] || null;

                    setPlaced(p => [...p, { id: newId, type: 'image', signatureId: newSigId, dataUrl, page: currentPage, left, top, width: initialWidth, uploading: dataUrl.startsWith('data:') }]);
                    setSelectedId(newId);

                    if (dataUrl.startsWith('data:')) {
                        getOrUploadSignature(dataUrl).then(uploaded => {
                            setPlaced(prev => prev.map(it => it.id === newId ? { ...it, signatureId: uploaded.id, dataUrl: uploaded.url, uploading: false } : it));
                            replaceAvailableSignature(dataUrl, uploaded.url);
                        }).catch(err => {
                            console.error('Upload on custom drop failed', err);
                            setPlaced(prev => prev.map(it => it.id === newId ? { ...it, uploading: false } : it));
                            alert('Failed to upload signature');
                        });
                    }
                }
            } else if (e.type === 'signerFieldDrop' && isPrepareMode) {
                const { signerId, email, clientX, clientY } = (e as CustomEvent).detail;
                if (!pageDomRef.current || !pageBox) return;
                const rect = pageDomRef.current.getBoundingClientRect();
                if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
                    const dropX = clientX - rect.left;
                    const dropY = clientY - rect.top;

                    const boxWidth = pageBox.width;
                    const initialWidth = Math.round(boxWidth * 0.35);
                    const initialHeight = Math.round(pageBox.height * 0.08);
                    const left = Math.round(dropX - initialWidth / 2);
                    const top = Math.round(dropY - initialHeight / 2);
                    const newId = `placeholder-${Date.now()}-${Math.round(Math.random() * 1e6)}`;

                    const signer = signers.find((s: SignerInput) => s.id === signerId || s.email === email);
                    const label = signer ? `${signer.name || signer.email}` : email;

                    setPlaced(p => [...p, { id: newId, type: 'placeholder', signerEmail: email, placeholderLabel: label, page: currentPage, left, top, width: initialWidth, height: initialHeight }]);
                    setSelectedId(newId);
                }
            }
        };

        window.addEventListener('signatureDrop', handleCustomDrop);
        window.addEventListener('signerFieldDrop', handleCustomDrop);
        return () => {
            window.removeEventListener('signatureDrop', handleCustomDrop);
            window.removeEventListener('signerFieldDrop', handleCustomDrop);
        };
    }, [currentPage, pageBox, replaceAvailableSignature, isPrepareMode, signers]);

    // HTML5 drop handler (just in case they drag an image natively)
    const onDropToPage = (e: React.DragEvent) => {
        e.preventDefault();
        const dataUrl = e.dataTransfer.getData('application/signature');
        if (!dataUrl || !pageBox || !pageDomRef.current) return;
        const rect = pageDomRef.current.getBoundingClientRect();
        const dropX = e.clientX - rect.left;
        const dropY = e.clientY - rect.top;
        const initialWidth = Math.round(pageBox.width * 0.40);
        const left = Math.round(dropX - initialWidth / 2);
        const top = Math.round(dropY - (initialWidth * 0.40) / 2);
        const newId = `sig-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
        const newSigId = urlToIdCache[dataUrl] || null;

        setPlaced(p => [...p, { id: newId, signatureId: newSigId, dataUrl, page: currentPage, left, top, width: initialWidth, uploading: dataUrl.startsWith('data:') }]);
        setSelectedId(newId);

        if (dataUrl.startsWith('data:')) {
            getOrUploadSignature(dataUrl).then(uploaded => {
                setPlaced(prev => prev.map(it => it.id === newId ? { ...it, uploading: false, signatureId: uploaded.id, dataUrl: uploaded.url } : it));
                replaceAvailableSignature(dataUrl, uploaded.url);
            }).catch(err => {
                console.error('Upload on drop failed', err);
                setPlaced(prev => prev.map(it => it.id === newId ? { ...it, uploading: false } : it));
                alert('Failed to upload signature');
            });
        }
    };

    return (
        <div className="h-dvh flex flex-col md:flex-row bg-app-pattern">
            <main className="flex-1 p-2 md:p-6 flex flex-col items-center pb-[180px] md:pb-6 min-h-0 overflow-hidden" onClick={() => setSelectedId(null)}>
                <div className="w-full h-full max-w-5xl glass-panel rounded-2xl p-3 sm:p-6 flex flex-col min-h-0">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3 sm:gap-0 shrink-0 border-b border-white/60 dark:border-white/10 pb-3 sm:pb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                            <h2 className="text-lg sm:text-xl font-semibold text-teal-950 dark:text-teal-50">Signing workspace</h2>
                            {pdfUrl && numPages > 0 && (
                                <div className="flex items-center gap-2 bg-white/40 dark:bg-neutral-800/80 backdrop-blur-md rounded-lg px-2 py-1 shadow-sm border border-white/60 dark:border-white/10 w-fit">
                                    <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Page {currentPage} / {numPages}
                                    </span>
                                    <div className="flex items-center gap-1 border-l border-white/60 dark:border-white/10 pl-2">
                                        <Button variant="ghost" className="h-8 w-8 rounded-md p-0 flex items-center justify-center" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1 || loading} title="Previous Page">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19V5M5 12l7-7 7 7" /></svg>
                                        </Button>
                                        <Button variant="ghost" className="h-8 w-8 rounded-md p-0 flex items-center justify-center" onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))} disabled={currentPage >= numPages || loading} title="Next Page">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v14M5 12l7 7 7-7" /></svg>
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2 shrink-0 self-end sm:self-auto">
                            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>Back</Button>
                            <Button variant="primary" size="sm" onClick={onApply} disabled={loading}>
                                {loading ? 'Applying…' : isPrepareMode ? 'Send' : 'Apply'}
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 relative overflow-hidden flex flex-col min-h-0">
                        {loading && <div className="text-gray-500 dark:text-gray-400">Loading…</div>}
                        {!loading && pdfUrl && (
                            <div className="flex-1 overflow-auto custom-scrollbar w-full pb-8">
                                <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess} loading={<div className="text-gray-500 dark:text-gray-400 py-4 text-center">Loading PDF…</div>} className="flex flex-col items-center min-w-min">
                                    <div
                                        ref={pageDomRef as any}
                                        id="pdf-page-wrapper"
                                        style={{ position: 'relative' }}
                                        className="shadow-xl mx-auto bg-white dark:opacity-90 transition-opacity w-fit min-w-[280px]"
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={onDropToPage}
                                    >
                                        <Page devicePixelRatio={Math.min(window.devicePixelRatio || 1, 1.5)} pageNumber={currentPage} width={pageBox ? Math.max(pageBox.width, Math.min(window.innerWidth - 48, 800)) : Math.min(window.innerWidth - 48, 800)} renderAnnotationLayer={false} renderTextLayer={false} />
                                        {pageBox && placed.map((p) => (
                                            p.page === currentPage ? (
                                                <SignatureOverlay
                                                    key={p.id}
                                                    id={p.id}
                                                    dataUrl={p.dataUrl}
                                                    type={p.type}
                                                    placeholderLabel={p.placeholderLabel}
                                                    pageBox={pageBox}
                                                    initialLeft={p.left}
                                                    initialTop={p.top}
                                                    initialWidth={p.width}
                                                    initialHeight={p.height}
                                                    selected={selectedId === p.id}
                                                    onSelect={setSelectedId}
                                                    onUpdate={updatePlacement}
                                                    onRemove={removePlacement}
                                                />
                                            ) : null
                                        ))}
                                    </div>
                                </Document>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {isPrepareMode ? (
                <SignerFieldsPanel
                    signers={signers}
                    onStartPlace={(signerId, email) => {
                        startPlacingPlaceholder(signerId, email);
                    }}
                />
            ) : (
                <SignaturePanel
                    signatures={availableSignatures}
                    onStartPlace={(dataUrl) => {
                        setAvailableSignatures(prev => prev.includes(dataUrl) ? prev : [dataUrl, ...prev]);
                        startPlacing(dataUrl);
                    }}
                />
            )}
        </div>
    );
};

export default SignPage;