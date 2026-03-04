// src/components/SignatureOverlay.tsx
import React, { useEffect, useRef, useState } from 'react';

type Props = {
    id: string;
    dataUrl?: string; // image mode
    placeholderLabel?: string; // prepare mode
    type?: 'image' | 'placeholder'; // image for me/sign, placeholder for prepare
    pageBox: { width: number; height: number }; // dimensions of the page element
    initialLeft: number; // px relative to page top-left
    initialTop: number;
    initialWidth: number;
    initialHeight?: number; // optional, mainly for placeholders
    selected: boolean;
    onSelect: (id: string) => void;
    onUpdate: (id: string, left: number, top: number, width: number, height?: number) => void;
    onRemove: (id: string) => void;
    readonly?: boolean;
    onClickPlaceholder?: () => void;
};

const MIN_WIDTH = 48;

const SignatureOverlay: React.FC<Props> = ({
    id,
    dataUrl,
    placeholderLabel,
    type = 'image',
    pageBox,
    initialLeft,
    initialTop,
    initialWidth,
    initialHeight,
    selected,
    onSelect,
    onUpdate,
    onRemove,
    readonly,
    onClickPlaceholder,
}) => {
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);

    // position/size relative to page top-left (px)
    const [pos, setPos] = useState({ left: initialLeft, top: initialTop, width: initialWidth, height: initialHeight || (initialWidth * 0.4) });

    // internal refs for dragging/resizing
    const dragging = useRef(false);
    const resizing = useRef(false);
    const startPointer = useRef({ x: 0, y: 0 });
    const startPos = useRef({ left: 0, top: 0, width: 0, height: 0 });
    const ratioRef = useRef(0);
    const rafRef = useRef<number | null>(null);
    const pendingPos = useRef<{ left?: number; top?: number; width?: number; height?: number } | null>(null);

    // compute initial natural ratio when image loads (only for image type)
    useEffect(() => {
        if (type !== 'image' || !dataUrl) return;
        const img = new Image();
        img.onload = () => {
            const ratio = img.naturalHeight / img.naturalWidth || 0.4;
            ratioRef.current = ratio;
            // clamp initial width: not more than 30% page width, not less than MIN_WIDTH
            const maxSuggested = Math.max(64, Math.floor(pageBox.width * 0.3));
            const w = Math.max(MIN_WIDTH, Math.min(maxSuggested, img.naturalWidth, initialWidth || maxSuggested));
            const h = Math.round(w * ratio);
            setPos(curr => {
                startPos.current = { left: curr.left ?? initialLeft, top: curr.top ?? initialTop, width: w, height: h } as any;
                return { ...curr, width: w, height: h };
            });
        };
        img.src = dataUrl;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dataUrl, pageBox.width, type]);

    // helper: clamp so overlay stays fully inside page
    const clampLeft = (left: number, width: number) => Math.max(0, Math.min(left, Math.max(0, pageBox.width - width)));
    const clampTop = (top: number, height: number) => Math.max(0, Math.min(top, Math.max(0, pageBox.height - height)));
    const clampWidth = (width: number, left: number) => Math.max(MIN_WIDTH, Math.min(width, Math.max(MIN_WIDTH, pageBox.width - left)));

    // Apply pendingPos via rAF to avoid jitter and rapid reflows
    const scheduleCommit = () => {
        if (rafRef.current) return;
        rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null;
            const p = pendingPos.current;
            if (!p) return;
            setPos(curr => {
                const newLeft = p.left ?? curr.left;
                const newTop = p.top ?? curr.top;
                const newWidth = p.width ?? curr.width;
                const newHeight = p.height ?? curr.height;
                pendingPos.current = null;
                return { left: newLeft, top: newTop, width: newWidth, height: newHeight };
            });
        });
    };

    // pointer handlers
    const onPointerDown = (e: React.PointerEvent) => {
        if (readonly) return;
        const target = e.target as HTMLElement;
        if (target.closest('[data-role="remove-btn"]')) {
            return;
        }

        // select this overlay
        onSelect(id);
        const isResize = !!(target.closest('[data-role="resize-handle"]'));
        const clientX = e.clientX;
        const clientY = e.clientY;
        startPointer.current = { x: clientX, y: clientY };
        startPos.current = { left: pos.left, top: pos.top, width: pos.width, height: pos.height };

        const el = wrapperRef.current!;
        el.setPointerCapture(e.pointerId);

        if (isResize) {
            resizing.current = true;
        } else {
            dragging.current = true;
        }
        e.preventDefault();
    };

    const onPointerMove = (e: React.PointerEvent) => {
        if (!dragging.current && !resizing.current) return;
        const dx = e.clientX - startPointer.current.x;
        const dy = e.clientY - startPointer.current.y;

        if (dragging.current) {
            const left = clampLeft(startPos.current.left + dx, pos.width);
            const top = clampTop(startPos.current.top + dy, pos.height);
            pendingPos.current = { left, top };
        } else if (resizing.current) {
            if (type === 'image') {
                // resize while keeping ratioRef
                const startW = startPos.current.width;
                const ratio = ratioRef.current || (startPos.current.height / Math.max(1, startW));
                let newW = clampWidth(Math.round(startW + dx), startPos.current.left);
                let newH = Math.round(newW * ratio);
                // ensure bottom doesn't go off page
                if (startPos.current.top + newH > pageBox.height) {
                    newH = pageBox.height - startPos.current.top;
                    newW = Math.max(MIN_WIDTH, Math.round(newH / ratio));
                }
                pendingPos.current = { width: newW, height: newH };
            } else {
                // free resize for placeholders
                const newW = clampWidth(Math.round(startPos.current.width + dx), startPos.current.left);
                const newH = Math.max(24, Math.min(Math.round(startPos.current.height + dy), pageBox.height - startPos.current.top));
                pendingPos.current = { width: newW, height: newH };
            }
        }

        scheduleCommit();
        e.preventDefault();
    };

    const onPointerUp = (e: React.PointerEvent) => {
        const el = wrapperRef.current!;
        try { el.releasePointerCapture?.(e.pointerId); } catch { console.log("Hello World") }
        const wasDragging = dragging.current || resizing.current;
        dragging.current = false;
        resizing.current = false;
        // flush pending now and notify parent
        if (pendingPos.current) {
            const p = pendingPos.current;
            const finalLeft = p.left ?? pos.left;
            const finalTop = p.top ?? pos.top;
            const finalWidth = p.width ?? pos.width;
            const finalHeight = p.height ?? pos.height;
            // ensure final clamps
            const clampedLeft = clampLeft(finalLeft, finalWidth);
            const clampedTop = clampTop(finalTop, finalHeight);
            const clampedWidth = clampWidth(finalWidth, clampedLeft);
            const clampedHeight = type === 'image' ? Math.round(clampedWidth * (ratioRef.current || 0.4)) : finalHeight;
            setPos({ left: clampedLeft, top: clampedTop, width: clampedWidth, height: clampedHeight });
            pendingPos.current = null;
            onUpdate(id, clampedLeft, clampedTop, clampedWidth, clampedHeight);
        } else if (wasDragging) {
            onUpdate(id, pos.left, pos.top, pos.width, pos.height);
        }
        e.preventDefault();
    };

    // click to select (but don't up-select when pointerup after drag)
    const onClick = (e: React.MouseEvent) => {
        if (!readonly) {
            onSelect(id);
        }
        if (type === 'placeholder' && onClickPlaceholder && !dragging.current && !resizing.current) {
            onClickPlaceholder();
        }
        e.stopPropagation();
    };

    const remove = (e: React.MouseEvent) => {
        e.stopPropagation();
        onRemove(id);
    };

    // render positioned absolutely in page coords
    const styleWrapper: React.CSSProperties = {
        position: 'absolute',
        left: pos.left,
        top: pos.top,
        width: pos.width,
        height: pos.height,
        zIndex: selected ? 100 : 60,
        touchAction: 'none',
        userSelect: 'none',
    };

    return (
        <div
            ref={wrapperRef}
            style={styleWrapper}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onClick={onClick}
        >
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                {type === 'image' && dataUrl ? (
                    <img
                        ref={imgRef}
                        src={dataUrl}
                        alt="signature"
                        className=""
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            display: 'block',
                            border: selected && !readonly ? '2px dashed #0ea5a4' : readonly ? 'none' : '1px solid transparent',
                            borderRadius: 4,
                            background: 'rgba(255,255,255,0.0)'
                        }}
                    />
                ) : (
                    <div
                        className={`w-full h-full flex items-center justify-center p-2 text-center text-xs sm:text-sm font-semibold border-2 rounded-md transition-colors ${selected && !readonly ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
                            : 'border-amber-400 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                            } ${readonly ? 'cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-800/40' : ''}`}
                    >
                        {placeholderLabel || 'Signature'}
                        {readonly && <div className="absolute -top-3 -right-3 bg-amber-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs animate-bounce shadow">↓</div>}
                    </div>
                )}

                {selected && !readonly && (
                    <>
                        {/* delete button (small) */}
                        <button
                            data-role="remove-btn"
                            onClick={remove}
                            onPointerDown={(e) => e.stopPropagation()}
                            className="absolute -top-3 -right-3 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-white/10 rounded-full w-7 h-7 flex items-center justify-center text-sm shadow-md text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 font-bold transition-colors"
                            title="Remove"
                            style={{ zIndex: 120, touchAction: 'none' }}
                        >
                            ×
                        </button>

                        {/* resize handle bottom-right */}
                        <div
                            data-role="resize-handle"
                            className="bg-white dark:bg-neutral-800 border border-slate-300 dark:border-white/20 transition-colors"
                            style={{
                                position: 'absolute',
                                right: -8,
                                bottom: -8,
                                width: 18,
                                height: 18,
                                borderRadius: 3,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'nwse-resize',
                                zIndex: 120
                            }}
                        >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500 dark:text-slate-400">
                                <path d="M3 21 L21 3" />
                            </svg>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default SignatureOverlay;