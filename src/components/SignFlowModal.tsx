// src/components/SignFlowModal.tsx
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { FileDoc } from '../types/file';
import SignatureCanvas from './SignatureCanvas';
import { Button } from '../ui/Button';

type Props = {
    open: boolean;
    file: FileDoc | null;
    onClose: () => void;
};

export type SignerInput = {
    id: string;
    name: string;
    email: string;
    order: number;
};

const DEFAULT_PRESETS = ['J. Doe', 'Jane Doe', 'John Smith'];

type PresetItem = {
    id: string;
    label: string;
    dataUrl: string;
};

/**
 * Create a transparent PNG DataURL with the provided text using a cursive font.
 * opts.fontFamily should be a cursive font (or a font stack that falls back to cursive).
 */
const createPresetDataUrl = (
    text: string,
    opts?: { fontFamily?: string; fontSize?: number; fontWeight?: string }
) => {
    const fontFamily = opts?.fontFamily ?? '"Dancing Script", "Great Vibes", "Pacifico", cursive';
    const fontSize = opts?.fontSize ?? 48;
    const fontWeight = opts?.fontWeight ?? 'normal';
    const padding = 16;

    // measure width
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

    // transparent background (do NOT fill with white)
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = '#000';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    const y = h / 2;
    ctx.fillText(text, padding, y);

    return c.toDataURL('image/png');
};

/**
 * Get initials as first letter of each of the first 3 words, uppercased.
 * E.g. "Shashank Vijay Bankar" => "SVB"
 */
const initialsFromName = (name: string) => {
    const parts = name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 3);
    if (parts.length === 0) return '';
    return parts.map(p => p[0].toUpperCase()).join('');
};

/**
 * Create three initial-style variants (all cursive fonts).
 */
const createInitialVariants = (name: string) => {
    const initials = initialsFromName(name) || name.slice(0, 3).toUpperCase();
    // three cursive font-family options (please add these via Google Fonts for best results)
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

const SignFlowModal: React.FC<Props> = ({ open, file, onClose }) => {
    const [step, setStep] = useState(1);
    const [signerType, setSignerType] = useState<'me' | 'several'>('me');

    const [signers, setSigners] = useState<SignerInput[]>([
        { id: `signer-${Date.now()}-1`, name: '', email: '', order: 1 }
    ]);

    const [activeTab, setActiveTab] = useState<'presets' | 'draw' | 'upload'>('presets');

    // stateful presets so users can add names
    const [presets, setPresets] = useState<PresetItem[]>(
        () =>
            DEFAULT_PRESETS.map((t, i) => ({
                id: `preset-default-${i}`,
                label: t,
                dataUrl: createPresetDataUrl(t, { fontFamily: '"Dancing Script", cursive', fontSize: 48 })
            }))
    );

    const [selectedDataUrl, setSelectedDataUrl] = useState<string | null>(null);
    const [nameInput, setNameInput] = useState('');
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    if (!open) return null;

    const openStep2 = (t: 'me' | 'several') => {
        setSignerType(t);
        setStep(2);
        setActiveTab('presets');
        setSelectedDataUrl(null);
    };

    const onTabChange = (tab: 'presets' | 'draw' | 'upload') => {
        setActiveTab(tab);
        setSelectedDataUrl(null);
    };

    const handlePresetClick = (p: PresetItem) => {
        setSelectedDataUrl(p.dataUrl);
    };

    const onCanvasSave = (dataUrl: string) => {
        setSelectedDataUrl(dataUrl);
    };

    const onUpload = (file?: File | null) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            setSelectedDataUrl(String(reader.result));
        };
        reader.readAsDataURL(file);
    };

    const addNamePreset = () => {
        const name = nameInput.trim();
        if (!name) return;
        const id = `user-${Date.now()}`;
        // full-name preset (cursive)
        const fullUrl = createPresetDataUrl(name, { fontFamily: '"Dancing Script", cursive', fontSize: 44, fontWeight: '500' });
        const fullPreset: PresetItem = { id, label: name, dataUrl: fullUrl };

        // initials variants (SVB style)
        const initialsPresets = createInitialVariants(name);

        setPresets((s) => [fullPreset, ...initialsPresets, ...s]);
        setSelectedDataUrl(fullUrl);
        setNameInput('');
    };

    const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0] ?? null;
        onUpload(f);
    };

    const addSigner = () => {
        setSigners(s => [
            ...s,
            { id: `signer-${Date.now()}-${s.length + 1}`, name: '', email: '', order: s.length + 1 }
        ]);
    };

    const removeSigner = (id: string) => {
        setSigners(s => s.filter(sig => sig.id !== id).map((sig, idx) => ({ ...sig, order: idx + 1 })));
    };

    const updateSigner = (id: string, field: keyof SignerInput, value: string) => {
        setSigners(s => s.map(sig => sig.id === id ? { ...sig, [field]: value } : sig));
    };

    const goApply = () => {
        if (!file) return;
        if (signerType === 'me') {
            if (!selectedDataUrl) return;
            navigate(`/sign/${file._id}`, { state: { signatureDataUrl: selectedDataUrl, mode: 'sign' } });
        } else {
            // Validate signers
            const valid = signers.every(s => s.name.trim() && s.email.trim());
            if (!valid || signers.length === 0) {
                alert("Please fill in name and email for all signers.");
                return;
            }
            navigate(`/sign/${file._id}`, { state: { mode: 'prepare', signers } });
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-slate-900/5 dark:bg-black/60 transition-colors duration-300" onClick={onClose} />
            <div className="relative z-10 w-[90vw] max-w-3xl bg-white/20 dark:bg-neutral-800/80 backdrop-blur-md border border-white/60 dark:border-white/10 shadow-2xl rounded-2xl p-6 transition-colors duration-300">
                {step === 1 && (
                    <>
                        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Who will sign this document?</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button onClick={() => openStep2('me')} className="p-6 bg-white/40 dark:bg-neutral-700/60 border border-white/50 dark:border-white/10 backdrop-blur-sm shadow-sm hover:bg-white/60 dark:hover:bg-neutral-600/60 transition-colors rounded-xl text-left">
                                <div className="text-lg font-medium text-gray-800 dark:text-gray-100">Only me</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sign this document yourself</div>
                            </button>
                            <button onClick={() => openStep2('several')} className="p-6 bg-white/40 dark:bg-neutral-700/60 border border-white/50 dark:border-white/10 backdrop-blur-sm shadow-sm hover:bg-white/60 dark:hover:bg-neutral-600/60 transition-colors rounded-xl text-left">
                                <div className="text-lg font-medium text-gray-800 dark:text-gray-100">Several people</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Invite others to sign</div>
                            </button>
                        </div>
                        <div className="mt-6 flex justify-end gap-2">
                            <Button variant="ghost" onClick={onClose}>Cancel</Button>
                        </div>
                    </>
                )}

                {step === 2 && signerType === 'me' && (
                    <>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2 sm:gap-0">
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Create or choose a signature</h3>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => { setStep(1); setSelectedDataUrl(null); }}>Back</Button>
                                <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
                            </div>
                        </div>

                        <div className="mb-3">
                            <div className="flex flex-wrap gap-2">
                                <Button variant={activeTab === 'presets' ? 'primary' : 'ghost'} size="sm" onClick={() => onTabChange('presets')}>Presets</Button>
                                <Button variant={activeTab === 'draw' ? 'primary' : 'ghost'} size="sm" onClick={() => onTabChange('draw')}>Draw</Button>
                                <Button variant={activeTab === 'upload' ? 'primary' : 'ghost'} size="sm" onClick={() => onTabChange('upload')}>Upload</Button>
                            </div>
                        </div>

                        <div>
                            {activeTab === 'presets' && (
                                <div>
                                    <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">Click a preset to select it</div>

                                    <div className="flex flex-col sm:flex-row gap-2 mb-3">
                                        <input
                                            className="border border-white/50 dark:border-white/10 bg-white/40 dark:bg-neutral-800/60 backdrop-blur-sm p-2 rounded-xl flex-1 focus:outline-none focus:ring-2 focus:ring-[#a3f7b5] dark:focus:ring-teal-500 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                                            placeholder="Enter your name to add preset (e.g. Shashank Vijay Bankar)"
                                            value={nameInput}
                                            onChange={(e) => setNameInput(e.target.value)}
                                        />
                                        <Button variant="primary" className="w-full sm:w-auto" onClick={addNamePreset}>Add</Button>
                                    </div>

                                    <div className="flex gap-2 overflow-x-auto py-2">
                                        {presets.map((p) => (
                                            <div
                                                key={p.id}
                                                onClick={() => handlePresetClick(p)}
                                                className="p-3 bg-white/40 dark:bg-neutral-700/60 border border-white/50 dark:border-white/10 backdrop-blur-sm rounded-xl cursor-pointer min-w-[140px] shrink-0 hover:bg-white/60 dark:hover:bg-neutral-600/60 transition-colors shadow-sm"
                                            >
                                                <div style={{ fontFamily: 'cursive', fontSize: 18, marginBottom: 8 }} className="text-gray-800 dark:text-gray-200">{p.label}</div>
                                                <img src={p.dataUrl} alt={p.label} style={{ maxWidth: 200, maxHeight: 72 }} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'draw' && (
                                <div>
                                    <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">Draw your signature below, then click "Use signature"</div>
                                    <SignatureCanvas onSave={onCanvasSave} />
                                </div>
                            )}

                            {activeTab === 'upload' && (
                                <div>
                                    <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">Upload an image file (PNG/JPG) — transparent background recommended</div>
                                    <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileInputChange} className="dark:text-gray-200" />
                                </div>
                            )}
                        </div>

                        <div className="mt-4">
                            <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">Preview</div>
                            <div className="border border-gray-200 dark:border-neutral-700 p-4 min-h-[104px] flex items-center justify-center bg-white dark:bg-neutral-800 rounded-xl">
                                {selectedDataUrl ? (
                                    <img src={selectedDataUrl} alt="selected signature" style={{ maxWidth: '100%', maxHeight: 120, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} className="dark:invert dark:opacity-90" />
                                ) : (
                                    <div className="text-sm text-gray-400 dark:text-gray-500">No signature selected</div>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap justify-end gap-2">
                            <Button variant="ghost" className="w-full sm:w-auto" onClick={() => { setStep(1); setSelectedDataUrl(null); }}>Back</Button>
                            <Button
                                variant="primary"
                                className="w-full sm:w-auto"
                                onClick={goApply}
                                disabled={!selectedDataUrl}
                                title={!selectedDataUrl ? 'Select a signature first' : 'Apply & open editor'}
                            >
                                Apply & open editor
                            </Button>
                        </div>
                    </>
                )}

                {step === 2 && signerType === 'several' && (
                    <>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2 sm:gap-0">
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Add Signers</h3>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => { setStep(1); }}>Back</Button>
                                <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
                            </div>
                        </div>
                        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                            Specify who needs to sign this document. We'll send them an email invite.
                        </div>

                        <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2 pb-2">
                            {signers.map((num, idx) => (
                                <div key={num.id} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center p-3 sm:p-2 bg-white/40 dark:bg-neutral-800/60 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-neutral-700 shadow-sm relative">
                                    <div className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 flex items-center justify-center text-xs font-bold shrink-0">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1 flex flex-col sm:flex-row gap-2 w-full">
                                        <input
                                            type="text"
                                            placeholder="Name (e.g. John Doe)"
                                            autoFocus={idx > 0}
                                            value={num.name}
                                            onChange={(e) => updateSigner(num.id, 'name', e.target.value)}
                                            className="border border-gray-300 dark:border-neutral-600 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-sm p-2 rounded-lg flex-1 focus:outline-none focus:ring-2 focus:ring-[#a3f7b5] dark:focus:ring-teal-500 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm"
                                        />
                                        <input
                                            type="email"
                                            placeholder="Email address"
                                            value={num.email}
                                            onChange={(e) => updateSigner(num.id, 'email', e.target.value)}
                                            className="border border-gray-300 dark:border-neutral-600 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-sm p-2 rounded-lg flex-1 focus:outline-none focus:ring-2 focus:ring-[#a3f7b5] dark:focus:ring-teal-500 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm"
                                        />
                                    </div>
                                    {signers.length > 1 && (
                                        <button onClick={() => removeSigner(num.id)} className="absolute top-2 right-2 sm:static sm:top-0 sm:right-0 p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Remove signer">
                                            ✕
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="mt-3">
                            <Button variant="ghost" size="sm" onClick={addSigner} className="text-teal-700 dark:text-teal-400 font-medium">
                                + Add another signer
                            </Button>
                        </div>

                        <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-gray-100 dark:border-neutral-800 pt-4">
                            <Button variant="ghost" className="w-full sm:w-auto" onClick={() => { setStep(1); }}>Back</Button>
                            <Button
                                variant="primary"
                                className="w-full sm:w-auto"
                                onClick={goApply}
                            >
                                Continue to document
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default SignFlowModal;