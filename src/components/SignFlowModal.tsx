// src/components/SignFlowModal.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { FileDoc } from '../types/file';
import SignatureCanvas from './SignatureCanvas';

type Props = {
    open: boolean;
    file: FileDoc | null;
    onClose: () => void;
};

const PRESET_TEXTS = ['J. Doe', 'Jane Doe', 'John Smith'];

const createPresetDataUrl = (text: string) => {
    const c = document.createElement('canvas');
    const w = 480, h = 120;
    c.width = w; c.height = h;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.font = '48px "Lucida Handwriting", "cursive", serif';
    ctx.fillStyle = '#000';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 14, h / 2);
    return c.toDataURL('image/png');
};

const SignFlowModal: React.FC<Props> = ({ open, file, onClose }) => {
    const [step, setStep] = useState(1);
    const [, setSignerType] = useState<'me' | 'several'>('me');

    // tab state: "presets" | "draw" | "upload"
    const [activeTab, setActiveTab] = useState<'presets' | 'draw' | 'upload'>('presets');

    // selected signature image data url (always a PNG/JPEG data URL)
    const [selectedDataUrl, setSelectedDataUrl] = useState<string | null>(null);

    const navigate = useNavigate();

    if (!open) return null;

    const openStep2 = (t: 'me' | 'several') => {
        setSignerType(t);
        setStep(2);
        // reset tab + selection to avoid confusion
        setActiveTab('presets');
        setSelectedDataUrl(null);
    };

    const onTabChange = (tab: 'presets' | 'draw' | 'upload') => {
        setActiveTab(tab);
        setSelectedDataUrl(null); // clear selection when switching tabs (requested behaviour)
    };

    const handlePresetClick = (t: string) => {
        const url = createPresetDataUrl(t);
        setSelectedDataUrl(url);
    };

    const onCanvasSave = (dataUrl: string) => {
        setSelectedDataUrl(dataUrl);
    };

    const onUpload = (file: File | null) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            setSelectedDataUrl(String(reader.result));
        };
        reader.readAsDataURL(file);
    };

    const goApply = () => {
        if (!file) return;
        // require selectedDataUrl to be set
        if (!selectedDataUrl) return;
        // navigate to sign page with signature data
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
                                    <div className="flex gap-2">
                                        {PRESET_TEXTS.map((t) => (
                                            <div key={t} onClick={() => handlePresetClick(t)} className="p-3 border rounded cursor-pointer">
                                                <div style={{ fontFamily: 'cursive', fontSize: 22 }}>{t}</div>
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
                                    <div className="mb-2 text-sm text-gray-600">Upload an image file (PNG/JPG)</div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => onUpload(e.target.files?.[0] ?? null)}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="mt-4">
                            <div className="mb-2 text-sm text-gray-600">Preview</div>
                            <div className="border p-4 min-h-[104px] flex items-center justify-center">
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