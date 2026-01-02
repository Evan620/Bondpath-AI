import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File as FileIcon, CheckCircle, AlertCircle } from 'lucide-react';

interface FileUploadProps {
    label: string;
    description?: string;
    accept?: Record<string, string[]>;
    maxSize?: number; // in bytes
    value?: File | string; // File object or URL string
    onFileSelect: (file: File) => void;
    onClear: () => void;
    error?: string;
    required?: boolean;
}

export default function FileUpload({
    label,
    description,
    accept = {
        'image/*': ['.jpeg', '.jpg', '.png'],
        'application/pdf': ['.pdf']
    },
    maxSize = 10 * 1024 * 1024, // 10MB
    value,
    onFileSelect,
    onClear,
    error,
    required = false
}: FileUploadProps) {
    const isUrl = typeof value === 'string';
    const fileName = value instanceof File ? value.name : (isUrl && value ? 'Uploaded Document' : null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            onFileSelect(acceptedFiles[0]);
        }
    }, [onFileSelect]);

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        onDrop,
        accept,
        maxSize,
        multiple: false
    });

    return (
        <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 flex items-center justify-between">
                <span>
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </span>
                {value && <span className="text-green-600 flex items-center gap-1 text-xs"><CheckCircle className="w-3 h-3" /> Attached</span>}
            </label>

            {value ? (
                <div className="relative flex items-center p-4 bg-slate-50 border border-slate-200 rounded-xl group hover:border-blue-200 transition-colors">
                    <div className="p-3 bg-white rounded-lg border border-slate-100 shadow-sm mr-4">
                        <FileIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{fileName}</p>
                        <p className="text-xs text-slate-500">{isUrl ? 'Stored on server' : 'Ready to upload'}</p>
                    </div>
                    <button
                        onClick={(e) => {
                            e.preventDefault(); // Prevent View link nav if nested
                            e.stopPropagation();
                            onClear();
                        }}
                        className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-red-500 transition-colors z-10 relative"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    {isUrl && (
                        <a
                            href={value as string}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute inset-0 z-0"
                            onClick={e => e.stopPropagation()} // Allow clicking the remove button
                        />
                    )}
                </div>
            ) : (
                <div
                    {...getRootProps()}
                    className={`
                        border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'}
                        ${isDragReject || error ? 'border-red-300 bg-red-50' : ''}
                    `}
                >
                    <input {...getInputProps()} />
                    <div className="mx-auto bg-white p-3 rounded-full w-12 h-12 flex items-center justify-center shadow-sm mb-3">
                        <Upload className={`w-6 h-6 ${isDragActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    </div>
                    <p className="text-sm font-bold text-slate-700">
                        {isDragActive ? 'Drop file here' : 'Click to upload or drag & drop'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                        {description || 'PDF, JPG, or PNG (max 10MB)'}
                    </p>
                </div>
            )}

            {error && (
                <div className="flex items-center gap-2 text-red-600 text-xs font-medium">
                    <AlertCircle className="w-3 h-3" />
                    {error}
                </div>
            )}
        </div>
    );
}
