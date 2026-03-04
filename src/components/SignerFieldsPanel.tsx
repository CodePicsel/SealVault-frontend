import React from 'react';
import type { SignerInput } from './SignFlowModal';

type Props = {
    signers: SignerInput[];
    onStartPlace: (signerId: string, email: string) => void;
};

export const SignerFieldsPanel: React.FC<Props> = ({ signers = [], onStartPlace }) => {

    const handlePointerDown = (e: React.PointerEvent, signer: SignerInput) => {
        if (e.button !== 0 && e.pointerType === 'mouse') return;

        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();

        const clone = target.cloneNode(true) as HTMLElement;
        clone.id = 'signer-field-drag-clone';
        clone.style.position = 'fixed';
        clone.style.top = `${rect.top}px`;
        clone.style.left = `${rect.left}px`;
        clone.style.width = `${rect.width}px`;
        clone.style.height = `${rect.height}px`;
        clone.style.opacity = '0.7';
        clone.style.pointerEvents = 'none';
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
                const ce = new CustomEvent('signerFieldDrop', {
                    detail: { signerId: signer.id, email: signer.email, clientX: upEvent.clientX, clientY: upEvent.clientY }
                });
                window.dispatchEvent(ce);
            } else {
                onStartPlace(signer.id, signer.email);
            }
        };

        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);
    };

    return (
        <div className="w-full md:w-64 border-t md:border-l border-white/60 dark:border-white/10 md:border-t-0 p-4 bg-white/20 dark:bg-neutral-800/60 backdrop-blur-md shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:shadow-none z-50 fixed bottom-0 left-0 right-0 md:relative md:bottom-auto md:left-auto md:right-auto md:h-full overflow-y-auto transition-colors duration-300">
            <h3 className="font-semibold mb-3 text-teal-950 dark:text-teal-50">Signers</h3>
            <div className="flex overflow-x-auto md:flex-col md:space-y-3 gap-3 md:gap-0 pb-4 md:pr-0">
                {signers.map((s, i) => (
                    <div key={s.id} className="flex flex-col gap-1 w-32 md:w-full shrink-0">
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate" title={s.email}>
                            {i + 1}. {s.name || s.email}
                        </div>
                        <button
                            className="w-full text-left border border-white/60 dark:border-white/10 bg-[#e5f5eb] dark:bg-teal-900/40 text-teal-900 dark:text-teal-100 backdrop-blur-sm shadow-sm rounded-lg p-2 flex items-center justify-center h-12 hover:bg-[#d1f0db] dark:hover:bg-teal-900/60 transition-colors cursor-grab select-none"
                            onPointerDown={(e) => handlePointerDown(e, s)}
                            title="Click to place or drag to document"
                            style={{ touchAction: 'none' }}
                        >
                            <span className="text-xs font-semibold">Signature Field</span>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
