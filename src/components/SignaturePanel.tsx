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
        <div className="w-full md:w-64 border-t md:border-l border-white/60 dark:border-white/10 md:border-t-0 p-4 bg-white/20 dark:bg-neutral-800/60 backdrop-blur-md shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:shadow-none z-50 fixed bottom-0 left-0 right-0 md:relative md:bottom-auto md:left-auto md:right-auto md:h-full overflow-y-auto transition-colors duration-300">
            <h3 className="font-semibold mb-3 text-teal-950 dark:text-teal-50">Recent Signatures</h3>
            <div className="flex overflow-x-auto md:flex-col md:space-y-2 gap-3 md:gap-0 pb-4 md:pr-0">
                {signatures.map((s, i) => (
                    <button
                        key={i}
                        className="w-32 md:w-full text-left border border-white/60 dark:border-white/10 bg-white/40 dark:bg-neutral-700/60 backdrop-blur-sm shadow-sm rounded-xl p-2 flex items-center gap-3 hover:bg-white/60 dark:hover:bg-neutral-600/60 transition-colors cursor-grab shrink-0 select-none mb-1 md:mb-0 mr-1 md:mr-0"
                        onPointerDown={(e) => handlePointerDown(e, s)}
                        title="Click to place or drag to document"
                        style={{ touchAction: 'none' }}
                    >
                        <img src={s} alt={`sig-${i}`} style={{ width: 80, height: 40, objectFit: 'contain' }} draggable={false} className="dark:invert dark:opacity-90" />
                        <div className="text-xs text-gray-600 dark:text-gray-400 hidden md:block">Use / Drag</div>
                    </button>
                ))}
                {/* Spacer block to let the last shadow breathe */}
                <div className="w-2 md:h-2 shrink-0"></div>
                {signatures.length === 0 && <div className="text-sm text-gray-400 dark:text-gray-500 mt-2">No recent signatures</div>}
            </div>
        </div>
    );
};