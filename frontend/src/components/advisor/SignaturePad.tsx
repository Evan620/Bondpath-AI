import { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Eraser, Pen } from 'lucide-react';

interface SignaturePadProps {
    value?: string;
    onChange: (base64Signature: string) => void;
    label: string;
    date?: string;
    disabled?: boolean;
}

export default function SignaturePad({ value, onChange, label, date, disabled = false }: SignaturePadProps) {
    const padRef = useRef<SignatureCanvas>(null);
    const [isEmpty, setIsEmpty] = useState(!value);

    // Initialize with existing value if present
    useEffect(() => {
        if (value && padRef.current && isEmpty) {
            padRef.current.fromDataURL(value);
            setIsEmpty(false);
        }
    }, [value]);

    const handleClear = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigating if inside a button or link context
        e.stopPropagation();
        if (disabled) return;

        padRef.current?.clear();
        setIsEmpty(true);
        onChange('');
    };

    const handleEnd = () => {
        if (padRef.current) {
            if (padRef.current.isEmpty()) {
                setIsEmpty(true);
                onChange('');
            } else {
                setIsEmpty(false);
                // Save as PNG data URL
                const signatureData = padRef.current.toDataURL('image/png');
                onChange(signatureData);
            }
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-end">
                <label className="block text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Pen className="w-4 h-4 text-blue-600" />
                    {label}
                </label>
                {date && (
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        Date: {date}
                    </span>
                )}
            </div>

            <div className={`
                relative border-2 rounded-xl overflow-hidden bg-white transition-all
                ${disabled ? 'opacity-60 cursor-not-allowed border-slate-200' : 'border-slate-300 hover:border-blue-400 focus-within:border-blue-500 ring-4 ring-transparent focus-within:ring-blue-50'}
            `}>
                <SignatureCanvas
                    ref={padRef}
                    canvasProps={{
                        className: `w-full h-40 ${disabled ? 'pointer-events-none' : 'cursor-crosshair'}`,
                        style: { width: '100%', height: '160px' }
                    }}
                    onEnd={handleEnd}
                    penColor="black"
                    backgroundColor="rgba(0,0,0,0)"
                    clearOnResize={false}
                />

                {isEmpty && !disabled && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-300 text-sm font-medium">
                        Sign here
                    </div>
                )}

                {!isEmpty && !disabled && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-sm text-slate-500 hover:text-red-600 rounded-lg hover:bg-slate-100/80 transition-all shadow-sm border border-slate-200/50"
                        title="Clear Signature"
                    >
                        <Eraser className="w-4 h-4" />
                    </button>
                )}
            </div>

            {!isEmpty && (
                <div className="text-[10px] text-slate-400 font-mono text-center truncate px-4">
                    Digital Signature • {new Date().toISOString()}
                </div>
            )}
        </div>
    );
}
