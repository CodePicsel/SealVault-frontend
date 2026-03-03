import React, { useEffect, useRef, useState } from 'react';

type Props = {
    width?: number;
    height?: number;
    onSave: (dataUrl: string) => void;
};

const SignatureCanvas: React.FC<Props> = ({ width = 600, height = 160, onSave }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        const c = canvasRef.current!;
        c.width = width;
        c.height = height;
        const ctx = c.getContext('2d')!;
        // Transparent background: do NOT fill with white
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#000000';
        ctx.lineCap = 'round';
    }, [width, height]);

    const getCtx = () => canvasRef.current!.getContext('2d')!;

    const posFromEvent = (e: any) => {
        const rect = canvasRef.current!.getBoundingClientRect();
        const client = e.touches ? e.touches[0] : e;
        return { x: client.clientX - rect.left, y: client.clientY - rect.top };
    };

    const start = (e: any) => {
        const p = posFromEvent(e);
        const ctx = getCtx();
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        setIsDrawing(true);
    };

    const move = (e: any) => {
        if (!isDrawing) return;
        const p = posFromEvent(e);
        const ctx = getCtx();
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
    };

    const end = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        getCtx().closePath();
    };

    const clear = () => {
        const ctx = getCtx();
        ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
    };

    const save = () => {
        // get bounding box of non-transparent pixels to trim whitespace (optional)
        const c = canvasRef.current!;
        // For now simply return PNG of canvas (transparent bg)
        const dataUrl = c.toDataURL('image/png');
        onSave(dataUrl);
    };

    return (
        <div>
            <canvas
                ref={canvasRef}
                style={{ border: '1px solid #e5e7eb', background: 'transparent', touchAction: 'none' }}
                onMouseDown={start}
                onMouseMove={move}
                onMouseUp={end}
                onMouseLeave={end}
                onTouchStart={start}
                onTouchMove={move}
                onTouchEnd={end}
            />
            <div className="flex gap-2 mt-2">
                <button className="px-3 py-1 bg-white/40 backdrop-blur-md border border-white/60 text-teal-800 hover:bg-white/70 hover:shadow-lg hover:-translate-y-0.5 rounded-xl font-medium transition-all" onClick={clear}>Clear</button>
                <button className="px-3 py-1 bg-linear-to-r from-[#a3f7b5]/80 to-[#80eb9f]/80 backdrop-blur-md border border-white/60 text-teal-950 hover:from-[#a3f7b5] hover:to-[#80eb9f] hover:shadow-[0_8px_20px_rgba(163,247,181,0.4)] hover:-translate-y-0.5 rounded-xl font-medium transition-all" onClick={save}>Use signature</button>
            </div>
        </div>
    );
};

export default SignatureCanvas;