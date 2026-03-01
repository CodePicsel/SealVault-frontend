// src/components/SignFlowModal.tsx
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { FileDoc } from '../types/file';
import SignatureCanvas from './SignatureCanvas';

type Props = {
    open: boolean;
    file: FileDoc | null;
    onClose: () => void;
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
    const [, setSignerType] = useState<'me' | 'several'>('me');

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

    const goApply = () => {
        if (!file) return;
        if (!selectedDataUrl) return;
        navigate(`/sign/${file._id}`, { state: { signatureDataUrl: selectedDataUrl } });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative z-10 w-[90vw] max-w-3xl bg-white rounded shadow-lg p-6">
                {step === 1 && (
                    <>
                        <h3 className="text-xl font-semibold mb-4">Who will sign this document?</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => openStep2('me')} className="p-6 border rounded text-left">
                                <div className="text-lg font-medium">Only me</div>
                                <div className="text-sm text-gray-500 mt-1">Sign this document yourself</div>
                            </button>
                            <button onClick={() => openStep2('several')} className="p-6 border rounded text-left">
                                <div className="text-lg font-medium">Several people</div>
                                <div className="text-sm text-gray-500 mt-1">Invite others to sign</div>
                            </button>
                        </div>
                        <div className="mt-6 flex justify-end gap-2">
                            <button className="px-3 py-1" onClick={onClose}>Cancel</button>
                        </div>
                    </>
                )}

                {step === 2 && (
                    <>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold">Create or choose a signature</h3>
                            <div>
                                <button className="px-3 py-1 mr-2" onClick={() => { setStep(1); setSelectedDataUrl(null); }}>Back</button>
                                <button className="px-3 py-1 bg-gray-100 rounded" onClick={onClose}>Cancel</button>
                            </div>
                        </div>

                        <div className="mb-3">
                            <div className="flex gap-2">
                                <button className={`px-3 py-1 rounded ${activeTab === 'presets' ? 'bg-emerald-600 text-white' : 'bg-gray-100'}`} onClick={() => onTabChange('presets')}>Presets</button>
                                <button className={`px-3 py-1 rounded ${activeTab === 'draw' ? 'bg-emerald-600 text-white' : 'bg-gray-100'}`} onClick={() => onTabChange('draw')}>Draw</button>
                                <button className={`px-3 py-1 rounded ${activeTab === 'upload' ? 'bg-emerald-600 text-white' : 'bg-gray-100'}`} onClick={() => onTabChange('upload')}>Upload</button>
                            </div>
                        </div>

                        <div>
                            {activeTab === 'presets' && (
                                <div>
                                    <div className="mb-2 text-sm text-gray-600">Click a preset to select it</div>

                                    <div className="flex gap-2 mb-3">
                                        <input
                                            className="border p-2 rounded flex-1"
                                            placeholder="Enter your name to add preset (e.g. Shashank Vijay Bankar)"
                                            value={nameInput}
                                            onChange={(e) => setNameInput(e.target.value)}
                                        />
                                        <button className="px-3 py-1 bg-emerald-600 text-white rounded" onClick={addNamePreset}>Add</button>
                                    </div>

                                    <div className="flex gap-2 overflow-x-auto py-2">
                                        {presets.map((p) => (
                                            <div
                                                key={p.id}
                                                onClick={() => handlePresetClick(p)}
                                                className="p-3 border rounded cursor-pointer min-w-[140px] flex-shrink-0"
                                            >
                                                <div style={{ fontFamily: 'cursive', fontSize: 18, marginBottom: 8 }}>{p.label}</div>
                                                <img src={p.dataUrl} alt={p.label} style={{ maxWidth: 200, maxHeight: 72 }} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'draw' && (
                                <div>
                                    <div className="mb-2 text-sm text-gray-600">Draw your signature below, then click "Use signature"</div>
                                    <SignatureCanvas onSave={onCanvasSave} />
                                </div>
                            )}

                            {activeTab === 'upload' && (
                                <div>
                                    <div className="mb-2 text-sm text-gray-600">Upload an image file (PNG/JPG) — transparent background recommended</div>
                                    <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileInputChange} />
                                </div>
                            )}
                        </div>

                        <div className="mt-4">
                            <div className="mb-2 text-sm text-gray-600">Preview</div>
                            <div className="border p-4 min-h-[104px] flex items-center justify-center bg-white">
                                {selectedDataUrl ? (
                                    <img src={selectedDataUrl} alt="selected signature" style={{ maxWidth: '100%', maxHeight: 120 }} />
                                ) : (
                                    <div className="text-sm text-gray-400">No signature selected</div>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-2">
                            <button className="px-3 py-1" onClick={() => { setStep(1); setSelectedDataUrl(null); }}>Back</button>
                            <button
                                className="px-4 py-2 rounded"
                                onClick={goApply}
                                disabled={!selectedDataUrl}
                                style={{ background: selectedDataUrl ? '#059669' : '#94a3b8', color: 'white' }}
                                title={!selectedDataUrl ? 'Select a signature first' : 'Apply & open editor'}
                            >
                                Apply & open editor
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default SignFlowModal;