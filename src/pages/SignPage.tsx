// src/pages/SignPage.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { Document, Page } from 'react-pdf';
import api from '../api/axios';
import { SignaturePanel } from "../components/SignaturePanel";
import SignatureOverlay from "../components/SignatureOverlay";
import { Button } from "../ui/Button";

type PlacedSignature = {
    id: string;
    signatureId?: string | null; // DB id after upload
    dataUrl: string;              // data:... or remote url
    page: number;
    left: number;                 // px
    top: number;                  // px
    width: number;                // px
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
    if (uploadCache[dataUrl]) {
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
    const state = location.state as { signatureDataUrl?: string | undefined } | undefined;

    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [numPages, setNumPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);

    const [availableSignatures, setAvailableSignatures] = useState<string[]>([]);
    const [placed, setPlaced] = useState<PlacedSignature[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const [pendingSignatureUrl, setPendingSignatureUrl] = useState<string | null>(null); // for queued auto-place
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
        if (!box) {
            setPendingSignatureUrl(dataUrl);
            return;
        }

        const initialWidth = Math.round(box.width * 0.30);
        const left = Math.round((box.width - initialWidth) / 2);
        const top = Math.round((box.height - (initialWidth * 0.3)) / 2);

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

    // auto-place pending queued signature once measurements ready
    useEffect(() => {
        if (pendingSignatureUrl && pageBox) {
            startPlacing(pendingSignatureUrl, pageBox);
            setPendingSignatureUrl(null);
        }
    }, [pageBox, pendingSignatureUrl, startPlacing]);

    // helpers to update and remove placements (passed to SignatureOverlay)
    const updatePlacement = (id: string, left: number, top: number, width: number) => {
        setPlaced(prev => prev.map(s => s.id === id ? { ...s, left, top, width } : s));
    };
    const removePlacement = (id: string) => {
        setPlaced(prev => prev.filter(s => s.id !== id));
        setSelectedId(prev => prev === id ? null : prev);
    };

    // main Apply flow:
    // 1) ensure uploads finished (upload any remaining data: images synchronously),
    // 2) for each placement that is not saved -> POST /api/uploads/:id/signatures
    // 3) then POST /api/uploads/:id/apply-signatures
    const onApply = async () => {
        if (!id) return;
        if ((placed.length) === 0) {
            alert('Place at least one signature');
            return;
        }
        const box = pageBox;
        if (!box) { alert('Page not ready'); return; }

        setLoading(true);
        try {
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
                if (p.saved) continue; // skip already saved ones

                const imageId = p.signatureId || urlToIdCache[p.dataUrl] || (p.dataUrl.split('/').pop()?.split('.')[0]);
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
        } catch (err: any) {
            console.error('Apply flow error', err);
            alert(err?.message || 'Apply failed');
        } finally {
            setLoading(false);
        }
    };

    // Custom drop handler for the SignaturePanel events
    useEffect(() => {
        const handleCustomDrop = (e: Event) => {
            const ce = e as CustomEvent<{ dataUrl: string, clientX: number, clientY: number }>;
            const { dataUrl, clientX, clientY } = ce.detail;

            if (!pageDomRef.current || !pageBox) return;
            const rect = pageDomRef.current.getBoundingClientRect();

            if (
                clientX >= rect.left &&
                clientX <= rect.right &&
                clientY >= rect.top &&
                clientY <= rect.bottom
            ) {
                const dropX = clientX - rect.left;
                const dropY = clientY - rect.top;

                const boxWidth = pageBox.width;
                const initialWidth = Math.round(boxWidth * 0.3);
                const left = Math.round(dropX - initialWidth / 2);
                const top = Math.round(dropY - (initialWidth * 0.3) / 2);
                const newId = `sig-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
                const newSigId = urlToIdCache[dataUrl] || null;

                setPlaced(p => [...p, { id: newId, signatureId: newSigId, dataUrl, page: currentPage, left, top, width: initialWidth, uploading: dataUrl.startsWith('data:') }]);
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
        };

        window.addEventListener('signatureDrop', handleCustomDrop);
        return () => window.removeEventListener('signatureDrop', handleCustomDrop);
    }, [currentPage, pageBox, replaceAvailableSignature]);

    // HTML5 drop handler (just in case they drag an image natively)
    const onDropToPage = (e: React.DragEvent) => {
        e.preventDefault();
        const dataUrl = e.dataTransfer.getData('application/signature');
        if (!dataUrl || !pageBox || !pageDomRef.current) return;
        const rect = pageDomRef.current.getBoundingClientRect();
        const dropX = e.clientX - rect.left;
        const dropY = e.clientY - rect.top;
        const initialWidth = Math.round(pageBox.width * 0.3);
        const left = Math.round(dropX - initialWidth / 2);
        const top = Math.round(dropY - (initialWidth * 0.3) / 2);
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

    const pagesWithSigs = new Set(placed.map(s => s.page));

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fbf9] bg-[linear-gradient(to_right,#e5f5eb_1px,transparent_1px),linear-gradient(to_bottom,#e5f5eb_1px,transparent_1px)] bg-size-[24px_24px] overflow-hidden">
            <aside className="w-full md:w-32 shrink-0 border-b md:border-b-0 md:border-r border-white/60 bg-white/20 backdrop-blur-md p-4 overflow-x-auto md:overflow-y-auto z-10 shadow-sm" style={{ touchAction: 'pan-x pan-y' }}>
                {!pdfUrl && (
                    <div className="flex flex-row md:flex-col gap-5 items-center pb-2 md:pb-0 pr-2 md:pr-0 w-max md:w-full">
                        {Array.from({ length: numPages || 1 }, (_, idx) => {
                            const pg = idx + 1;
                            const has = pagesWithSigs.has(pg);
                            return (
                                <div key={pg} className={`cursor-pointer p-1.5 rounded-xl transition-all shrink-0 relative ${currentPage === pg ? 'ring-2 ring-[#a3f7b5] bg-white/40' : 'hover:bg-white/30'}`} onClick={() => setCurrentPage(pg)}>
                                    <div className="shadow-sm rounded-lg overflow-hidden border border-white/60 w-[60px] h-[80px] bg-white/50 backdrop-blur-sm flex items-center justify-center text-sm font-medium text-teal-900">
                                        {pg}
                                    </div>
                                    {has && <div className="absolute -top-1.5 -right-1.5 bg-teal-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md z-20 border-2 border-[#f8fbf9]">✓</div>}
                                </div>
                            );
                        })}
                    </div>
                )}
                {pdfUrl && (
                    <Document file={pdfUrl} className="flex flex-row md:flex-col gap-5 items-center pb-2 md:pb-0 pr-2 md:pr-0 w-max md:w-full">
                        {Array.from({ length: numPages || 1 }, (_, idx) => {
                            const pg = idx + 1;
                            const has = pagesWithSigs.has(pg);
                            return (
                                <div key={pg} className={`cursor-pointer p-1.5 rounded-xl transition-all shrink-0 relative ${currentPage === pg ? 'ring-2 ring-[#a3f7b5] bg-white/40 shadow-sm' : 'hover:bg-white/30'}`} onClick={() => setCurrentPage(pg)}>
                                    <div className="shadow-sm rounded-lg overflow-hidden border border-white/60 w-[60px] h-[80px] bg-white flex items-center justify-center relative bg-clip-padding">
                                        <Page pageNumber={pg} width={60} renderAnnotationLayer={false} renderTextLayer={false} className="pointer-events-none" />
                                        <div className="absolute bottom-0 right-0 bg-black/40 text-white text-[9px] px-1 rounded-tl font-mono backdrop-blur-md">{pg}</div>
                                    </div>
                                    {has && <div className="absolute -top-1.5 -right-1.5 bg-teal-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md z-20 border-2 border-[#f8fbf9]">✓</div>}
                                </div>
                            );
                        })}
                    </Document>
                )}
            </aside>

            <main className="flex-1 p-4 md:p-8 overflow-auto flex flex-col items-center pb-32 md:pb-8" onClick={() => setSelectedId(null)}>
                <div className="w-full max-w-4xl bg-white/20 backdrop-blur-sm rounded-2xl border border-white/60 p-4 sm:p-6 relative shadow-2xl">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4 sm:gap-0">
                        <div>
                            <h2 className="text-xl font-semibold text-teal-950">Signing workspace</h2>
                            <div className="text-sm text-gray-600">Page {currentPage} / {numPages || '—'}</div>
                        </div>
                        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                            <Button variant="ghost" className="w-full sm:w-auto" onClick={() => navigate(-1)}>Back</Button>
                            <Button variant="primary" className="w-full sm:w-auto" onClick={onApply} disabled={loading}>
                                {loading ? 'Applying…' : 'Apply'}
                            </Button>
                        </div>
                    </div>

                    <div style={{ position: 'relative' }}>
                        {loading && <div>Loading…</div>}
                        {!loading && pdfUrl && (
                            <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess}>
                                <div style={{ display: 'flex', justifyContent: 'center' }} className="w-full overflow-x-auto pb-4 custom-scrollbar">
                                    <div
                                        ref={pageDomRef as any}
                                        id="pdf-page-wrapper"
                                        style={{ position: 'relative' }}
                                        className="shadow-xl mb-4 min-w-[320px] mx-auto bg-white"
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={onDropToPage}
                                    >
                                        <Page pageNumber={currentPage} width={pageBox ? Math.max(pageBox.width, 800) : 800} renderAnnotationLayer={false} renderTextLayer={false} />
                                        {pageBox && placed.map((p) => (
                                            p.page === currentPage ? (
                                                <SignatureOverlay
                                                    key={p.id}
                                                    id={p.id}
                                                    dataUrl={p.dataUrl}
                                                    pageBox={pageBox}
                                                    initialLeft={p.left}
                                                    initialTop={p.top}
                                                    initialWidth={p.width}
                                                    selected={selectedId === p.id}
                                                    onSelect={setSelectedId}
                                                    onUpdate={updatePlacement}
                                                    onRemove={removePlacement}
                                                />
                                            ) : null
                                        ))}
                                    </div>
                                </div>
                            </Document>
                        )}
                    </div>
                </div>
            </main>

            <SignaturePanel
                signatures={availableSignatures}
                onStartPlace={(dataUrl) => {
                    setAvailableSignatures(prev => prev.includes(dataUrl) ? prev : [dataUrl, ...prev]);
                    startPlacing(dataUrl);
                }}
            />
        </div>
    );
};

export default SignPage;