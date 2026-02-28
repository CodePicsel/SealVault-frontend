import React from 'react';

type Props = {
    signatures: string[];
    onStartPlace: (dataUrl: string) => void;
};

export const SignaturePanel: React.FC<Props> = ({ signatures = [], onStartPlace }) => {

    const handlePointerDown = (e: React.PointerEvent, dataUrl: string) => {
        // We only respond to primary left click or touch events
        if (e.button !== 0 && e.pointerType === 'mouse') return;

        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();

        const clone = target.cloneNode(true) as HTMLElement;
        clone.id = 'signature-drag-clone';
        clone.style.position = 'fixed';
        clone.style.top = `${rect.top}px`;
        clone.style.left = `${rect.left}px`;
        clone.style.width = `${rect.width}px`;
        clone.style.height = `${rect.height}px`;
        clone.style.opacity = '0.7';
        clone.style.pointerEvents = 'none'; // ignore pointer events on clone
        clone.style.zIndex = '9999';
        clone.style.transition = 'none';

        document.body.appendChild(clone);

        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;
        const startX = e.clientX;
        const startY = e.clientY;

        let dragged = false;

        const onPointerMove = (moveEvent: PointerEvent) => {
            if (!dragged && (Math.abs(moveEvent.clientX - startX) > 4 || Math.abs(moveEvent.clientY - startY) > 4)) {
                dragged = true;
            }
            clone.style.left = `${moveEvent.clientX - offsetX}px`;
            clone.style.top = `${moveEvent.clientY - offsetY}px`;
        };

        const onPointerUp = (upEvent: PointerEvent) => {
            clone.remove();
            document.removeEventListener('pointermove', onPointerMove);
            document.removeEventListener('pointerup', onPointerUp);

            if (dragged) {
                // Not a simple click, dispatch custom drag and drop
                const ce = new CustomEvent('signatureDrop', {
                    detail: { dataUrl, clientX: upEvent.clientX, clientY: upEvent.clientY }
                });
                window.dispatchEvent(ce);
            } else {
                // Simple tap or click -> place in center
                onStartPlace(dataUrl);
            }
        };

        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);
    };

    return (
        <div className="w-full md:w-64 border-t md:border-l md:border-t-0 p-4 bg-white shrink-0 z-10">
            <h3 className="font-semibold mb-3">Signatures Options</h3>
            <div className="flex overflow-x-auto md:flex-col md:space-y-2 gap-2 md:gap-0 pb-2 md:pb-0">
                {signatures.map((s, i) => (
                    <button
                        key={i}
                        className="w-32 md:w-full text-left border rounded p-2 flex items-center gap-3 hover:bg-gray-50 cursor-grab shrink-0 select-none"
                        onPointerDown={(e) => handlePointerDown(e, s)}
                        title="Click to place or drag to document"
                        style={{ touchAction: 'none' }}
                    >
                        <img src={s} alt={`sig-${i}`} style={{ width: 80, height: 40, objectFit: 'contain' }} draggable={false} />
                        <div className="text-xs text-gray-600 hidden md:block">Use / Drag</div>
                    </button>
                ))}
                {signatures.length === 0 && <div className="text-sm text-gray-400">No signatures yet</div>}
            </div>
        </div>
    );
};