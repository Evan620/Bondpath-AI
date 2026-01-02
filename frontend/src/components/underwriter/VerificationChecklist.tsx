import { useState } from 'react';
import { CheckCircle, XCircle, Eye, ExternalLink } from 'lucide-react';

interface VerificationItem {
    id: string;
    label: string;
    type: 'DOCUMENT' | 'PAYMENT' | 'DATA';
    url?: string;
    value?: string;
    verified: boolean;
    notes?: string;
}

interface VerificationChecklistProps {
    items: VerificationItem[];
    onToggleVerify: (id: string, verified: boolean) => void;
    onAddNote: (id: string, note: string) => void;
}

export default function VerificationChecklist({ items, onToggleVerify, onAddNote }: VerificationChecklistProps) {
    return (
        <div className="space-y-4">
            {items.map((item) => (
                <div
                    key={item.id}
                    className={`p-4 rounded-lg border transition-all ${item.verified
                            ? 'bg-green-50 border-green-200'
                            : 'bg-white border-slate-200 hover:border-blue-300'
                        }`}
                >
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                            <div className={`mt-1 p-2 rounded-full ${item.verified ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'
                                }`}>
                                {item.verified ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                            </div>

                            <div>
                                <h4 className="font-bold text-slate-900">{item.label}</h4>
                                <div className="text-sm text-slate-600 mt-1">
                                    {item.type === 'DOCUMENT' && item.url ? (
                                        <a
                                            href={item.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center gap-1 text-blue-600 hover:underline font-medium"
                                        >
                                            <Eye className="w-4 h-4" /> View Document <ExternalLink className="w-3 h-3" />
                                        </a>
                                    ) : item.type === 'PAYMENT' || item.type === 'DATA' ? (
                                        <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                                            {item.value || 'N/A'}
                                        </span>
                                    ) : (
                                        <span className="text-amber-600 italic">Not provided</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            <button
                                onClick={() => onToggleVerify(item.id, !item.verified)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${item.verified
                                        ? 'bg-white border border-green-200 text-green-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                                        : 'bg-slate-900 text-white hover:bg-slate-800'
                                    }`}
                            >
                                {item.verified ? 'Verified' : 'Mark Verified'}
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
