import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { Document, Page } from 'react-pdf';
import api from '../api/axios';
import { SignaturePanel } from "../components/SignaturePanel";
import SignatureOverlay from "../components/SignatureOverlay";

type PlacedSignature = {
    id: string;
    dataUrl: string;
    page: number; // 1-indexed
    left: number; // px relative to page top-left
    top: number;  // px relative to page top-left
    width: number; // px
};

const SignPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state as { signatureDataUrl?: string | undefined } | undefined;

    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [numPages, setNumPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1); // default to page 1

    const [availableSignatures, setAvailableSignatures] = useState<string[]>([]);
    const [placed, setPlaced] = useState<PlacedSignature[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const [placingDataUrl, setPlacingDataUrl] = useState<string | null>(state?.signatureDataUrl ?? null);
    const handledPlacingRef = useRef<string | null>(null);

    const pageContainerRef = useRef<HTMLDivElement | null>(null);
    const pageDomRef = useRef<HTMLDivElement | null>(null);
    const pageBoxRef = useRef<{ width: number; height: number } | null>(null);

    // If nav state includes a signature, add it to available list
    useEffect(() => {
        if (state?.signatureDataUrl) {
            setAvailableSignatures(prev => prev.includes(state.signatureDataUrl!) ? prev : [state.signatureDataUrl!, ...prev]);
            setPlacingDataUrl(state.signatureDataUrl!); // attempt auto-place
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state?.signatureDataUrl]);

    // Load PDF blob -> objectURL
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
                setCurrentPage(1);
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

    // Measure the page wrapper (use boundingClientRect so CSS transforms are respected)
    useEffect(() => {
        const updateBox = () => {
            const node = pageDomRef.current;
            if (!node) return;
            const rect = node.getBoundingClientRect();
            pageBoxRef.current = {
                width: Math.round(rect.width),
                height: Math.round(rect.height),
            };
        };
        updateBox();

        const ro = new ResizeObserver(updateBox);
        if (pageDomRef.current) ro.observe(pageDomRef.current);

        // Also observe mutations because react-pdf can re-render a canvas inside
        const observer = new MutationObserver(updateBox);
        if (pageDomRef.current) observer.observe(pageDomRef.current, { childList: true, subtree: true });

        window.addEventListener('resize', updateBox);
        window.addEventListener('scroll', updateBox, true);

        return () => {
            ro.disconnect();
            observer.disconnect();
            window.removeEventListener('resize', updateBox);
            window.removeEventListener('scroll', updateBox, true);
        };
    }, [pdfUrl, currentPage, numPages]);

    const onDocumentLoadSuccess = ({ numPages: n }: { numPages: number }) => {
        setNumPages(n);
        setCurrentPage(1);
    };

    const startPlacing = (dataUrl: string) => {
        const box = pageBoxRef.current;
        if (!box) {
            // page not measured yet - queue it
            setPlacingDataUrl(dataUrl);
            return;
        }

        const initialWidth = Math.round(box.width * 0.30);
        const left = Math.round((box.width - initialWidth) / 2);
        const top = Math.round((box.height - (initialWidth * 0.3)) / 2);

        const newId = `sig-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
        const newSig: PlacedSignature = {
            id: newId,
            dataUrl,
            page: currentPage,
            left,
            top,
            width: initialWidth,
        };
        setPlaced(prev => [...prev, newSig]);
        setSelectedId(newId);
        setPlacingDataUrl(null);
    };

    // auto-place if a placingDataUrl existed and pageBox is ready
    useEffect(() => {
        if (placingDataUrl && pageBoxRef.current && handledPlacingRef.current !== placingDataUrl) {
            handledPlacingRef.current = placingDataUrl;
            startPlacing(placingDataUrl);
        } else if (!placingDataUrl) {
            handledPlacingRef.current = null;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [placingDataUrl, pageBoxRef.current]);

    // update placement handler
    const updatePlacement = (id: string, left: number, top: number, width: number) => {
        setPlaced(prev => prev.map(s => s.id === id ? { ...s, left, top, width } : s));
        console.log('placement updated', {
            id,
            page: currentPage,
            leftPx: left,
            topPx: top,
            widthPx: width,
            xRel: (left / pageBoxRef.current!.width),
            yRel: (top / pageBoxRef.current!.height),
            widthRel: (width / pageBoxRef.current!.width)
        });
    };

    const removePlacement = (id: string) => {
        setPlaced(prev => prev.filter(s => s.id !== id));
        setSelectedId(prev => prev === id ? null : prev);
    };

    const pagesWithSigs = new Set(placed.map(s => s.page));

    // Listen to custom drop events for mobile/pointer drag
    useEffect(() => {
        const handleGlobalCustomDrop = (e: Event) => {
            const ce = e as CustomEvent<{ dataUrl: string; clientX: number; clientY: number; }>;
            const { dataUrl, clientX, clientY } = ce.detail;

            const wrapper = pageDomRef.current;
            if (!wrapper) return;

            const rect = wrapper.getBoundingClientRect();
            if (
                clientX >= rect.left && clientX <= rect.right &&
                clientY >= rect.top && clientY <= rect.bottom
            ) {
                const dropX = clientX - rect.left;
                const dropY = clientY - rect.top;

                if (!pageBoxRef.current) return;
                const initialWidth = Math.round(pageBoxRef.current.width * 0.3);
                const left = Math.round(dropX - initialWidth / 2);
                const top = Math.round(dropY - (initialWidth * 0.3) / 2);
                const newId = `sig-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
                setPlaced(p => [...p, { id: newId, dataUrl, page: currentPage, left, top, width: initialWidth }]);
                setSelectedId(newId);
                setPlacingDataUrl(null); // Cancel any pending auto-place if user manually placed
            }
        };

        window.addEventListener('signatureDrop', handleGlobalCustomDrop);
        return () => window.removeEventListener('signatureDrop', handleGlobalCustomDrop);
    }, [currentPage]);

    // drop handler already in pageDomRef (see render) - keeps drag-and-drop UX

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 overflow-hidden">
            {/* left thumbnails */}
            <aside className="hidden md:block w-24 shrink-0 border-r bg-white p-2 overflow-y-auto">
                <div className="space-y-2">
                    {Array.from({ length: numPages || 1 }, (_, idx) => {
                        const pg = idx + 1;
                        const has = pagesWithSigs.has(pg);
                        return (
                            <div
                                key={pg}
                                className={`cursor-pointer p-1 ${currentPage === pg ? 'ring-2 ring-emerald-300' : ''}`}
                                onClick={() => setCurrentPage(pg)}
                            >
                                <div className="relative">
                                    <div className="w-12 h-16 bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                                        {pg}
                                    </div>
                                    {has && (
                                        <div className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">•</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </aside>

            <main
                className="flex-1 p-4 overflow-auto"
                ref={pageContainerRef}
                onClick={() => setSelectedId(null)}
            >
                <div className="max-w-4xl mx-auto bg-white p-4 relative">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-semibold">Signing workspace</h2>
                            <div className="text-sm text-gray-500">Page {currentPage} / {numPages || '—'}</div>
                        </div>
                        <div className="flex gap-2">
                            <button className="px-3 py-1 bg-gray-100 rounded" onClick={() => navigate(-1)}>Back</button>
                            <button className="px-3 py-1 bg-emerald-600 text-white rounded" onClick={() => { /* TODO: save placements -> backend */ }}>
                                Save
                            </button>
                        </div>
                    </div>

                    <div style={{ position: 'relative' }}>
                        {loading && <div>Loading PDF…</div>}
                        {!loading && pdfUrl && (
                            <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess}>
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <div
                                        ref={pageDomRef as any}
                                        id="pdf-page-wrapper"
                                        style={{ position: 'relative', overflow: 'hidden' }}
                                        className="shadow mb-4"
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            const dataUrl = e.dataTransfer.getData('application/signature');
                                            if (!dataUrl || !pageBoxRef.current || !pageDomRef.current) return;
                                            const rect = pageDomRef.current.getBoundingClientRect();
                                            const dropX = e.clientX - rect.left;
                                            const dropY = e.clientY - rect.top;
                                            const initialWidth = Math.round(pageBoxRef.current.width * 0.3);
                                            const left = Math.round(dropX - initialWidth / 2);
                                            const top = Math.round(dropY - (initialWidth * 0.3) / 2);
                                            const newId = `sig-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
                                            setPlaced(p => [...p, { id: newId, dataUrl, page: currentPage, left, top, width: initialWidth }]);
                                            setSelectedId(newId);
                                        }}
                                    >
                                        {/* render single page */}
                                        <Page pageNumber={currentPage} width={800} renderAnnotationLayer={false} renderTextLayer={false} />

                                        {/* overlays (placed signatures) */}
                                        {pageBoxRef.current && placed.map((p) => (
                                            p.page === currentPage ? (
                                                <SignatureOverlay
                                                    key={p.id}
                                                    id={p.id}
                                                    dataUrl={p.dataUrl}
                                                    pageBox={pageBoxRef.current!}
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