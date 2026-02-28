type Props = {
    signatures: string[];
    onStartPlace: (dataUrl: string) => void;
};

export const SignaturePanel: React.FC<Props> = ({ signatures = [], onStartPlace }) => {
    return (
        <div className="w-64 border-l p-4 bg-white">
            <h3 className="font-semibold mb-3">Signatures Options</h3>
            <div className="space-y-2">
                {signatures.map((s, i)=>(
                    <button
                    key={i}
                    draggable
                    onDragStart={(e)=>{
                        e.dataTransfer.setData('application/signature', s);
                        e.dataTransfer.effectAllowed = 'copy';
                    }}
                    className={"w-full text-left border rounded p-2 flex item-center gap-3 hover:bg-gray-50 cursor-grab"}
                    onClick={()=>{onStartPlace(s)}}
                    title={"Click to place or Drag to Document"}
                    >
                        <img src={s} alt={`sig-${i}`} style={{ width: 80, height: 40, objectFit: 'contain' }} draggable={false} />
                        <div className="text-xs text-gray-600">Use / Drag</div>
                    </button>
                ))}
                {signatures.length === 0 && <div className="text-sm text-gray-400">No signatures yet</div>}
            </div>
        </div>
    )
}