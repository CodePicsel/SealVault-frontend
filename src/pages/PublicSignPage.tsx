import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Document, Page } from 'react-pdf';
import api from '../api/axios';
import SignatureOverlay from '../components/SignatureOverlay';
import SignatureCanvas from '../components/SignatureCanvas';
import { Button } from '../ui/Button';

const DEFAULT_PRESETS = ['J. Doe', 'Jane Doe', 'John Smith'];

type PresetItem = {
    id: string;
    label: string;
    dataUrl: string;
};

const createPresetDataUrl = (
    text: string,
    opts?: { fontFamily?: string; fontSize?: number; fontWeight?: string }
) => {
    const fontFamily = opts?.fontFamily ?? '"Dancing Script", "Great Vibes", "Pacifico", cursive';
    const fontSize = opts?.fontSize ?? 48;
    const fontWeight = opts?.fontWeight ?? 'normal';
    const padding = 16;
    const measure = document.createElement('canvas');
    const mctx = measure.getContext('2d')!;
    mctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    const metrics = mctx.measureText(text);
    const textWidth = Math.ceil(metrics.width);
    const w = Math.max(140, textWidth + padding * 2);
    const h = Math.max(64, fontSize + padding * 2);

    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d')!;
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = '#000';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(text, padding, h / 2);
    return c.toDataURL('image/png');
};

const initialsFromName = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 3);
    if (!parts.length) return '';
    return parts.map(p => p[0].toUpperCase()).join('');
};

const createInitialVariants = (name: string) => {
    const initials = initialsFromName(name) || name.slice(0, 3).toUpperCase();
    const variants = [
        { fontFamily: '"Dancing Script", cursive', fontWeight: '500', fontSize: 64 },
        { fontFamily: '"Great Vibes", cursive', fontWeight: '400', fontSize: 72 },
        { fontFamily: '"Pacifico", cursive', fontWeight: '400', fontSize: 60 }
    ];
    return variants.map((v, i) => ({
        id: `init-${Date.now()}-${i}`,
        label: initials,
        dataUrl: createPresetDataUrl(initials, v)
    }));
};

type Field = {
    _id: string;
    signerEmail: string;
    page: number;
    xRel: number;
    yRel: number;
    widthRel: number;
    heightRel: number;
    required: boolean;
};

type SignRequest = {
    requestId: string;
    title: string;
    message: string;
    fields: Field[];
    file: { url: string; id: string; originalName: string };
    signer: { email: string; name: string; status: string };
    status: string;
};

export const PublicSignPage: React.FC = () => {
    const { inviteToken } = useParams<{ inviteToken: string }>();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [requestData, setRequestData] = useState<SignRequest | null>(null);
    const [myEmail, setMyEmail] = useState<string>('');

    const [numPages, setNumPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageBox, setPageBox] = useState<{ width: number; height: number } | null>(null);
    const pageDomRef = useRef<HTMLDivElement | null>(null);

    const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
    const [signFlowOpen, setSignFlowOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'presets' | 'draw' | 'upload'>('presets');
    const [nameInput, setNameInput] = useState('');
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [presets, setPresets] = useState<PresetItem[]>(
        () => DEFAULT_PRESETS.map((t, i) => ({
            id: `preset-default-${i}`,
            label: t,
            dataUrl: createPresetDataUrl(t, { fontFamily: '"Dancing Script", cursive', fontSize: 48 })
        }))
    );

    // Once signature is drawn/uploaded, we fill all our fields with it visually
    const [myFieldsFilled, setMyFieldsFilled] = useState(false);

    // We only allow submission if consent is given
    const [consent, setConsent] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!inviteToken) return;
        const fetchDetails = async () => {
            try {
                // Determine our URL endpoint based on Postman collection.
                // GET /api/signing/:inviteToken
                const res = await api.get(`/api/signing/${inviteToken}`);
                setRequestData(res.data);
                setMyEmail(res.data.signer.email);
            } catch (err: any) {
                console.error(err);
                setError(err.response?.data?.message || 'Invalid or expired invite link.');
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [inviteToken]);

    // Measure page box
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
            ro.disconnect(); mo.disconnect();
            window.removeEventListener('resize', updateBox);
            window.removeEventListener('scroll', updateBox, true);
        };
    }, [requestData, currentPage]);

    const onDocumentLoadSuccess = ({ numPages: n }: { numPages: number }) => {
        setNumPages(n);
        setCurrentPage(1);
    };

    const handleFieldClick = () => {
        // user clicked their field to sign
        if (!signatureDataUrl) {
            // Seed the name input with their email or known name if no presets added
            const nameToSeed = requestData?.signer?.name || myEmail.split('@')[0];
            if (!presets.find(p => p.label === nameToSeed)) {
                setNameInput(nameToSeed);
            }
            setActiveTab('presets');
            setSignFlowOpen(true);
        } else {
            setMyFieldsFilled(true);
        }
    };

    const addNamePreset = () => {
        const name = nameInput.trim();
        if (!name) return;
        const id = `user-${Date.now()}`;
        const fullUrl = createPresetDataUrl(name, { fontFamily: '"Dancing Script", cursive', fontSize: 44, fontWeight: '500' });
        const fullPreset: PresetItem = { id, label: name, dataUrl: fullUrl };
        const initialsPresets = createInitialVariants(name);

        setPresets((s) => [fullPreset, ...initialsPresets, ...s]);
        setSignatureDataUrl(fullUrl);
        setNameInput('');
    };

    // This gets called from SignFlowModal when we intercept the application logic. Let's create a custom modal or just reuse.
    // Actually, reusing SignFlowModal might navigate away since it has `navigate(/sign/...)` inside. 
    // We will build a small inline modal or handle it by passing an override. Let's keep it simple and just use an overlay here or we can intercept state.

    // A simpler inline overlay for grabbing signature data url if they clicked the placeholder

    // Instead of reusing SignFlowModal which is coupled to navigation, let's just create a simpler upload/draw flow or we can copy it here?
    // Given the constraints, let's implement the submit logic first.

    const submitSignature = async () => {
        if (!signatureDataUrl) {
            alert("Please provide a signature first.");
            return;
        }
        if (!consent) {
            alert("You must consent to apply your signature electronically.");
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                signatureImageBase64: signatureDataUrl,
                consent: true
            };
            const resp = await api.post(`/api/signing/${inviteToken}/sign`, payload);
            alert("Document signed successfully!");
            // the response returns finalPdfUrl if everything is finalized, or just a success message.
            if (resp.data.finalPdfUrl) {
                // optionally offer to download or show success message
                setError('Signed successfully! You may now close this page.');
                setRequestData(null); // clear to show success screen
            } else {
                setError('Signed successfully! Waiting for other signers.');
                setRequestData(null);
            }
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to submit signature.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading document...</div>;
    if (error) return <div className="p-8 text-center text-red-500 font-medium">{error}</div>;
    if (!requestData) return <div className="p-8 text-center font-medium">No document to sign.</div>;

    const myFields = requestData.fields; // Already filtered by backend to only my fields
    const pdfUrl = requestData.file.url;

    return (
        <div className="min-h-screen bg-[#f8fbf9] dark:bg-neutral-900 bg-[linear-gradient(to_right,#e5f5eb_1px,transparent_1px),linear-gradient(to_bottom,#e5f5eb_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[24px_24px] p-6 lg:p-8 flex flex-col items-center">

            <div className="max-w-4xl w-full bg-white/20 dark:bg-neutral-800/60 backdrop-blur-md rounded-2xl border border-white/60 dark:border-white/10 p-6 shadow-2xl transition-colors duration-300 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-teal-950 dark:text-teal-50">{requestData.title}</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{requestData.message}</p>
                    <div className="mt-2 text-sm font-medium">Signing as: <span className="text-teal-600 dark:text-teal-400">{myEmail}</span></div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                    <label className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200 cursor-pointer">
                        <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="w-4 h-4 text-teal-600 accent-teal-500 rounded border-gray-300" />
                        I consent to sign electronically
                    </label>
                    <Button variant="primary" onClick={submitSignature} disabled={!myFieldsFilled || !consent || submitting}>
                        {submitting ? 'Submitting...' : 'Complete & Send'}
                    </Button>
                </div>
            </div>

            {/* Document Viewer */}
            <div className="w-full flex-1 max-w-4xl bg-white/40 dark:bg-neutral-800/80 backdrop-blur-md rounded-2xl border border-white/60 dark:border-white/10 p-4 shadow-xl overflow-hidden flex flex-col min-h-0">
                <div className="flex justify-between items-center mb-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Page {currentPage} / {numPages || '—'}</div>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1}>Previous</Button>
                        <Button variant="ghost" size="sm" onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))} disabled={currentPage >= numPages}>Next</Button>
                    </div>
                </div>
                <div className="flex-1 overflow-auto custom-scrollbar relative bg-gray-100/50 dark:bg-black/20 p-4 rounded-xl flex justify-center">
                    <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess}>
                        <div ref={pageDomRef as any} className="relative shadow-xl mx-auto bg-white dark:opacity-90 transition-opacity w-max min-w-[320px]">
                            <Page pageNumber={currentPage} width={pageBox ? Math.max(pageBox.width, 800) : 800} renderAnnotationLayer={false} renderTextLayer={false} />

                            {pageBox && myFields.map(f => {
                                if (f.page !== currentPage) return null;
                                const left = Math.round(f.xRel * pageBox.width);
                                const top = Math.round(f.yRel * pageBox.height);
                                const width = Math.round(f.widthRel * pageBox.width);
                                const height = Math.round(f.heightRel * pageBox.height);

                                return (
                                    <SignatureOverlay
                                        key={f._id}
                                        id={f._id}
                                        type={myFieldsFilled && signatureDataUrl ? 'image' : 'placeholder'}
                                        dataUrl={myFieldsFilled ? signatureDataUrl! : undefined}
                                        placeholderLabel="Click to Sign"
                                        pageBox={pageBox}
                                        initialLeft={left}
                                        initialTop={top}
                                        initialWidth={width}
                                        initialHeight={height}
                                        selected={false}
                                        readonly={true}
                                        onSelect={() => { }}
                                        onUpdate={() => { }}
                                        onRemove={() => { }}
                                        onClickPlaceholder={handleFieldClick}
                                    />
                                );
                            })}
                        </div>
                    </Document>
                </div>
            </div>

            {/* Improved Signature Modal inline */}
            {signFlowOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/80 transition-colors" onClick={() => setSignFlowOpen(false)} />
                    <div className="relative z-10 w-[90vw] max-w-2xl bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl p-6 transition-colors duration-300">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Create or choose a signature</h3>
                            <Button variant="ghost" size="sm" onClick={() => setSignFlowOpen(false)}>Close</Button>
                        </div>

                        <div className="mb-4 flex flex-wrap gap-2">
                            <Button variant={activeTab === 'presets' ? 'primary' : 'ghost'} size="sm" onClick={() => setActiveTab('presets')}>Presets</Button>
                            <Button variant={activeTab === 'draw' ? 'primary' : 'ghost'} size="sm" onClick={() => setActiveTab('draw')}>Draw</Button>
                            <Button variant={activeTab === 'upload' ? 'primary' : 'ghost'} size="sm" onClick={() => setActiveTab('upload')}>Upload</Button>
                        </div>

                        <div>
                            {activeTab === 'presets' && (
                                <div>
                                    <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">Click a preset to select it</div>
                                    <div className="flex flex-col sm:flex-row gap-2 mb-3">
                                        <input
                                            className="border border-white/50 dark:border-white/10 bg-gray-50 dark:bg-neutral-800/60 p-2 rounded-xl flex-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#a3f7b5] dark:focus:ring-teal-500 text-gray-800 dark:text-gray-100"
                                            placeholder="Enter your name to add preset"
                                            value={nameInput}
                                            onChange={(e) => setNameInput(e.target.value)}
                                        />
                                        <Button variant="primary" size="sm" onClick={addNamePreset}>Add</Button>
                                    </div>
                                    <div className="flex gap-2 overflow-x-auto py-2 custom-scrollbar">
                                        {presets.map((p) => (
                                            <div
                                                key={p.id}
                                                onClick={() => setSignatureDataUrl(p.dataUrl)}
                                                className={`p-3 border rounded-xl cursor-pointer min-w-[140px] shrink-0 transition-colors shadow-sm ${signatureDataUrl === p.dataUrl ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/30' : 'border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700/60 bg-white dark:bg-neutral-800'}`}
                                            >
                                                <div style={{ fontFamily: 'cursive', fontSize: 18, marginBottom: 8 }} className="text-gray-800 dark:text-gray-200">{p.label}</div>
                                                <img src={p.dataUrl} alt={p.label} style={{ maxWidth: 200, maxHeight: 72 }} className="dark:invert" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'draw' && (
                                <div className="bg-gray-50 dark:bg-neutral-900/50 rounded-xl p-2 border border-gray-200 dark:border-neutral-700">
                                    <div className="mb-2 text-sm text-gray-600 dark:text-gray-400 px-2">Draw your signature below</div>
                                    <SignatureCanvas onSave={(dataUrl) => setSignatureDataUrl(dataUrl)} />
                                </div>
                            )}

                            {activeTab === 'upload' && (
                                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 mb-4 bg-gray-50 dark:bg-neutral-900/50 text-center">
                                    <input ref={fileInputRef} type="file" accept="image/*" className="w-full text-sm dark:text-gray-200" onChange={e => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onload = () => {
                                                setSignatureDataUrl(reader.result as string);
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }} />
                                    <p className="text-xs text-gray-500 mt-2">Upload a PNG/JPG of your signature.</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 border-t border-gray-200 dark:border-neutral-700 pt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-2 flex-1">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Preview:</span>
                                {signatureDataUrl ? (
                                    <img src={signatureDataUrl} alt="selected signature" style={{ maxHeight: 60 }} className="dark:invert" />
                                ) : (
                                    <span className="text-sm text-gray-400">None selected</span>
                                )}
                            </div>
                            <Button
                                variant="primary"
                                disabled={!signatureDataUrl}
                                onClick={() => {
                                    setMyFieldsFilled(true);
                                    setSignFlowOpen(false);
                                }}
                            >
                                Use Signature
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
