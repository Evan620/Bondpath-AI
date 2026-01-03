import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient as api } from '../api/client';
import { Shield, ArrowLeft, FileText, User, AlertTriangle, CheckCircle } from 'lucide-react';

interface CaseDetail {
    id: string;
    state: string;
    defendant_first_name: string;
    defendant_last_name: string;
    defendant_dob: string;
    defendant_gender: string;
    jail_facility: string;
    county: string;
    state_jurisdiction: string;
    booking_number: string;
    bond_amount: number;
    bond_type: string;
    charge_severity: string;
    caller_name: string;
    caller_relationship: string;
    caller_phone: string;
    caller_email: string;
    created_at: string;
    // ... add other fields as needed
    documents_verified?: Record<string, any>;
    derived_facts?: any;
    indemnitor_first_name?: string;
    indemnitor_last_name?: string;
    indemnitor_email?: string;
    indemnitor_phone?: string;
}

export default function AdminCaseDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [caseData, setCaseData] = useState<CaseDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchCaseDetails(id);
    }, [id]);

    const fetchCaseDetails = async (caseId: string) => {
        try {
            const response = await api.get(`/cases/${caseId}`);
            setCaseData(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch case details:', error);
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mb-4"></div>
            <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Case Data...</span>
        </div>
    );

    if (!caseData) return <div className="p-10 text-center">Case not found</div>;

    const riskScore = caseData.derived_facts?.risk?.risk_score;
    const riskLabel = caseData.derived_facts?.risk?.risk_category || 'Unknown';

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Admin Header */}
            <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/admin')}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <span className="text-white font-medium">Viewing Case: <span className="font-mono text-slate-400">#{caseData.id.slice(0, 8)}</span></span>
                        </div>
                        <div className="flex items-center">
                            <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                <Shield className="w-3 h-3" />
                                Admin Read-Only
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Defendant Card */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <User className="w-4 h-4 text-slate-400" />
                                Defendant Information
                            </h2>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                                    <div className="text-slate-900 font-medium mt-1">{caseData.defendant_first_name} {caseData.defendant_last_name}</div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date of Birth</label>
                                    <div className="text-slate-900 font-medium mt-1">{new Date(caseData.defendant_dob).toLocaleDateString()}</div>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jail & Booking</label>
                                    <div className="text-slate-900 font-medium mt-1">{caseData.jail_facility} — #{caseData.booking_number}</div>
                                </div>
                            </div>
                        </div>

                        {/* Bond & Charges */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-slate-400" />
                                Bond & Charges
                            </h2>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bond Amount</label>
                                    <div className="text-2xl font-black text-slate-900 mt-1">${caseData.bond_amount.toLocaleString()}</div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Detailed Charge Severity</label>
                                    <div className="mt-1 inline-block px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold uppercase">{caseData.charge_severity}</div>
                                </div>
                            </div>
                        </div>

                        {/* Indemnitor Info */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <User className="w-4 h-4 text-slate-400" />
                                Indemnitor / Caller
                            </h2>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Caller Name</label>
                                    <div className="text-slate-900 font-medium mt-1">{caseData.caller_name}</div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Relationship</label>
                                    <div className="text-slate-900 font-medium mt-1">{caseData.caller_relationship}</div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone</label>
                                    <div className="text-slate-900 font-medium mt-1">{caseData.caller_phone}</div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</label>
                                    <div className="text-slate-900 font-medium mt-1">{caseData.caller_email}</div>
                                </div>
                                {caseData.indemnitor_first_name && (
                                    <div className="col-span-2 pt-4 border-t border-slate-100">
                                        <div className="text-xs font-bold text-slate-500 mb-2">Designated Indemnitor</div>
                                        <div className="text-slate-900">{caseData.indemnitor_first_name} {caseData.indemnitor_last_name}</div>
                                        <div className="text-slate-500 text-sm">{caseData.indemnitor_email} • {caseData.indemnitor_phone}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Status & Risk */}
                    <div className="space-y-6">
                        {/* Status Card */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Current Status</h2>
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`w-3 h-3 rounded-full ${caseData.state === 'APPROVED' ? 'bg-green-500' :
                                    caseData.state === 'DECLINED' ? 'bg-red-500' :
                                        'bg-amber-500'
                                    }`}></div>
                                <span className="text-lg font-bold text-slate-900">{caseData.state.replace('_', ' ')}</span>
                            </div>
                            <div className="text-xs text-slate-500">
                                Created: {new Date(caseData.created_at).toLocaleString()}
                            </div>
                        </div>

                        {/* Risk Assessment */}
                        <div className="bg-slate-900 rounded-2xl p-6 shadow-lg text-white">
                            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                AI Risk Assessment
                            </h2>

                            {riskScore !== undefined ? (
                                <div>
                                    <div className="flex items-end gap-2 mb-2">
                                        <span className="text-4xl font-black text-white">{riskScore}</span>
                                        <span className="text-slate-400 text-sm mb-1">/ 100</span>
                                    </div>
                                    <div className={`inline-block px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest mb-4 ${riskLabel === 'LOW' ? 'bg-green-500/20 text-green-400' :
                                        riskLabel === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                                            'bg-amber-500/20 text-amber-400'
                                        }`}>
                                        {riskLabel} Risk
                                    </div>
                                    <p className="text-slate-400 text-sm leading-relaxed">
                                        {caseData.derived_facts?.risk?.reasoning || "Risk assessment reasoning not available."}
                                    </p>
                                </div>
                            ) : (
                                <div className="text-slate-400 text-sm italic">
                                    No risk assessment available yet.
                                </div>
                            )}
                        </div>

                        {/* Verified Documents */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-slate-400" />
                                Verification
                            </h2>
                            {caseData.documents_verified ? (
                                <div className="space-y-3">
                                    {Object.entries(caseData.documents_verified).map(([doc, result]: [string, any]) => (
                                        <div key={doc} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                            <span className="text-xs font-bold text-slate-700 uppercase">{doc.replace('_', ' ')}</span>
                                            {result.valid ? (
                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                            ) : (
                                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-slate-400 text-sm italic">No documents verified.</p>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
