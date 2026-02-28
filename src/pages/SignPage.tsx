import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { Document, Page } from 'react-pdf';
import api from '../api/axios';
import {SignaturePanel} from "../components/SignaturePanel.tsx";
import SignatureOverlay from "../components/SignatureOverlay.tsx";

type PlacedSignature = {
    id: string; // local id
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
    const state = location.state as { signatureDataUrl?: string | undefined };

    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [numPages, setNumPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);

    const [availableSignatures, setAvailableSignatures] = useState<string[]>([]);
    const [placed, setPlaced] = useState<PlacedSignature[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const[placingDataUrl, setPlacingDataUrl] = useState<string | null>(state?.signatureDataUrl ?? null);

    const pageContainerRef = useRef<HTMLDivElement | null>(null);
    const pageDomRef = useRef<HTMLDivElement | null>(null);
    const pageBoxRef = useRef<{width: number; height: number} | null>(null);

    useEffect(() => {
        // for demo add signature(s) to available list if present in nav state
        if (state?.signatureDataUrl) {
            setAvailableSignatures(prev => [state.signatureDataUrl!, ...prev]);
        }
    }, [state?.signatureDataUrl]);

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

    useEffect(() => {
        const updateBox = () =>{
            const node = pageDomRef.current;
            if(!node) return;
            pageBoxRef.current={
                width:node.offsetWidth,
                height:node.offsetHeight,
            };
        };
        updateBox();
        window.addEventListener('resize', updateBox);
        const observer = new MutationObserver(updateBox);
        if(pageDomRef.current) observer.observe(pageDomRef.current, {childList: true, subtree: true});
        return () => {
            window.removeEventListener('resize', updateBox);
            observer.disconnect();
        };
    }, [pdfUrl, currentPage, numPages]);

    const onDocumentLoadSuccess = ({numPages: n}: { numPages: number }) => {
      setNumPages(n);
    };

    const startPlacing = (dataUrl : string) =>{
        const box = pageBoxRef.current;
        if(!box){
            console.warn('Page not Ready');
            setPlacingDataUrl(dataUrl);
            return;
        }
        const initialWidth = Math.round(box.width *.3);
        const ratio = .3;
        const left  = Math.round((box.width - initialWidth) / 2);
        const top = Math.round((box.height - initialWidth * ratio) / 2)
        const newId = `sig-${Date.now()}-${Math.round(Math.random()* 1e6)}`;
        const newSig: PlacedSignature = {
            id: newId,
            dataUrl,
            page: currentPage,
            left,
            top,
            width: initialWidth,
        };
        setPlaced((p)=>[...p, newSig]);
        setPlacingDataUrl(null);
    };

    useEffect(() => {
        if (placingDataUrl && pageBoxRef.current) {
            startPlacing(placingDataUrl);
        }
    }, [placingDataUrl, pageBoxRef.current]);

    const updatePlacement = (id: string, left: number, top: number, width: number) => {
        setPlaced(p => p.map(s => s.id === id ? { ...s, left, top, width } : s));
    };

    const removePlacement = (id: string) => {
        setPlaced(p => p.filter(s => s.id !== id));
    };

    const pagesWithSigs = new Set(placed.map(s => s.page));

    return (
        <div className="min-h-screen flex bg-gray-50">
            {/* left thumbnails */}
            <aside className="w-24 border-r bg-white p-2 overflow-y-auto">
                <div className="space-y-2">
                    {Array.from({ length: numPages || 1 }, (_, idx) => {
                        const pg = idx + 1;
                        const has = pagesWithSigs.has(pg);
                        return (
                            <div key={pg} className={`cursor-pointer p-1 ${currentPage === pg ? 'ring-2 ring-emerald-300' : ''}`} onClick={() => setCurrentPage(pg)}>
                                <div className="relative">
                                    <div className="w-12 h-16 bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                                        {pg}
                                    </div>
                                    {has && <div className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">•</div>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </aside>

            <main className="flex-1 p-4 overflow-auto" ref={pageContainerRef} onClick={() => setSelectedId(null)}>
                <div className="max-w-4xl mx-auto bg-white p-4 relative">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-semibold">Signing workspace</h2>
                            <div className="text-sm text-gray-500">Page {currentPage} / {numPages || '—'}</div>
                        </div>
                        <div className="flex gap-2">
                            <button className="px-3 py-1 bg-gray-100 rounded" onClick={() => navigate(-1)}>Back</button>
                            <button className="px-3 py-1 bg-emerald-600 text-white rounded" onClick={() => { /* TODO: save placements */ }}>Save</button>
                        </div>
                    </div>

                    <div style={{ position: 'relative' }}>
                        {loading && <div>Loading PDF…</div>}
                        {!loading && pdfUrl && (
                            <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess}>
                                <div style={{ display: 'flex', justifyContent: 'center' }} >
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
                                            setPlaced((p) => [...p, { id: newId, dataUrl, page: currentPage, left, top, width: initialWidth }]);
                                            setSelectedId(newId);
                                        }}
                                    >
                                        {/* render single page (currentPage) */}
                                        <Page pageNumber={currentPage} width={800} renderAnnotationLayer={false} renderTextLayer={false} />

                                         overlays (placed signatures)
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
                    // add to available if not present
                    setAvailableSignatures(prev => prev.includes(dataUrl) ? prev : [dataUrl, ...prev]);
                    startPlacing(dataUrl);
                }}
            />
        </div>
    );
};

export default SignPage;