import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient as api } from '../../api/client';
import { CheckCircle, XCircle, Clock, FileCheck, ChevronRight, AlertTriangle, ShieldCheck, FileText, Activity } from 'lucide-react';
import VerificationChecklist from './VerificationChecklist';
import CaseSummaryView from './CaseSummaryView';

interface VerificationItem {
    id: string;
    label: string;
    type: 'DOCUMENT' | 'PAYMENT' | 'DATA';
    url?: string;
    value?: string;
    verified: boolean;
    notes?: string;
}

interface Case {
    id: string;
    state: string;
    defendant_first_name: string;
    defendant_last_name: string;
    bond_amount: number;
    indemnitor_first_name?: string;
    indemnitor_last_name?: string;
    premium_type?: string;
    down_payment_amount?: number;
    charges?: string;
    derived_facts?: any;

    // URLs
    booking_sheet_url?: string;
    defendant_id_url?: string;
    indemnitor_id_url?: string;
    gov_id_url?: string;
    collateral_doc_url?: string;

    // Financials
    payment_method?: string;

    // UW fields
    uw_decision?: string;
    uw_reason?: string;
    uw_name?: string;
    paid_in_full?: string;
    power_number?: string;
    court_case_number?: string;

    // Verification state (stored in backend as a JSON field potentially, or just local state for now if unimplemented)
    verification_state?: Record<string, boolean>;
}

const STEPS = [
    { id: 'overview', title: 'Case Overview' },
    { id: 'verification', title: 'Compliance Check' },
    { id: 'decision', title: 'Decision' },
    { id: 'execution', title: 'Post-Execution' }
];

export default function UnderwriterCaseDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [caseData, setCaseData] = useState<Case | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Wizard State
    const [currentStep, setCurrentStep] = useState(0);
    const [checklist, setChecklist] = useState<VerificationItem[]>([]);
    const [editMode, setEditMode] = useState(false);
    const [underwriters, setUnderwriters] = useState<{ id: string, email: string }[]>([]);

    // Form state
    const [uwName, setUwName] = useState('');
    const [decision, setDecision] = useState('APPROVED');
    const [reason, setReason] = useState('');
    const [paidInFull, setPaidInFull] = useState('YES');
    const [powerNumber, setPowerNumber] = useState('');
    const [courtCaseNumber, setCourtCaseNumber] = useState('');

    useEffect(() => {
        fetchCase();
        fetchUnderwriters();
    }, [id]);

    const fetchUnderwriters = async () => {
        try {
            const response = await api.get('/users/underwriters');
            setUnderwriters(response.data);
        } catch (error) {
            console.error('Failed to fetch underwriters:', error);
        }
    };

    const fetchCase = async () => {
        try {
            const response = await api.get(`/cases/${id}`);
            const data = response.data;
            setCaseData(data);

            // Pre-fill fields
            if (data.uw_name) setUwName(data.uw_name);
            if (data.uw_decision) setDecision(data.uw_decision);
            if (data.uw_reason) setReason(data.uw_reason);
            if (data.paid_in_full) setPaidInFull(data.paid_in_full);
            if (data.power_number) setPowerNumber(data.power_number);
            if (data.court_case_number) setCourtCaseNumber(data.court_case_number);

            // Build Checklist
            const savedVerified = data.documents_verified || {};
            const initialChecklist: VerificationItem[] = [
                { id: 'booking_sheet', label: 'Booking Sheet', type: 'DOCUMENT', url: data.booking_sheet_url, verified: !!savedVerified['booking_sheet'] },
                { id: 'defendant_id', label: 'Defendant ID', type: 'DOCUMENT', url: data.defendant_id_url, verified: !!savedVerified['defendant_id'] },
                { id: 'indemnitor_id', label: 'Indemnitor ID', type: 'DOCUMENT', url: data.indemnitor_id_url, verified: !!savedVerified['indemnitor_id'] },
                { id: 'financials', label: 'Financial Terms', type: 'DATA', value: `${data.premium_type} - ${data.payment_method}`, verified: !!savedVerified['financials'] },
            ];

            if (data.premium_type === 'PAYMENT_PLAN') {
                initialChecklist.push({ id: 'down_payment', label: 'Initial Down Payment Receipt', type: 'PAYMENT', value: `$${data.down_payment_amount}`, verified: !!savedVerified['down_payment'] });
            }

            // Allow restoring verification state if backend supported it (future proofing)
            // For now, it resets on reload unless we persist it.

            setChecklist(initialChecklist);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch case:', error);
            setLoading(false);
        }
    };

    const handleToggleVerify = (itemId: string, verified: boolean) => {
        setChecklist(prev => prev.map(item =>
            item.id === itemId ? { ...item, verified } : item
        ));
    };

    const canProceedToDecision = () => {
        // Require verification of all present documents
        const criticalItems = checklist.filter(i => i.url); // Only force verification if URL exists? Or all?
        // Let's enforce all for now as "Compliance"
        return checklist.every(i => i.verified);
    };

    const nextStep = async () => {
        if (currentStep === 1) {
            if (!canProceedToDecision()) {
                alert("Please verify all compliance items before proceeding.");
                return;
            }
            // Save verification state
            try {
                // Map checklist to key-value pairs
                const verificationMap = checklist.reduce((acc, item) => ({
                    ...acc,
                    [item.id]: item.verified
                }), {});

                await api.patch(`/cases/${id}`, {
                    documents_verified: verificationMap
                });
            } catch (error) {
                console.error('Failed to save verification state:', error);
            }
        }
        if (currentStep < STEPS.length - 1) setCurrentStep(c => c + 1);
    };

    const prevStep = () => {
        if (currentStep > 0) setCurrentStep(c => c - 1);
    };

    const handleSubmit = async () => {
        setSaving(true);
        try {
            const payload = {
                uw_name: uwName,
                uw_decision: decision,
                uw_reason: reason,
                paid_in_full: paidInFull,
                power_number: powerNumber,
                court_case_number: courtCaseNumber,
                state: decision === 'APPROVED' ? 'APPROVED' : decision === 'HOLD' ? 'HOLD' : 'DENIED'
                // In future: save checklist state
            };

            await api.patch(`/cases/${id}`, payload);
            alert(`Case ${decision.toLowerCase()} successfully.`);
            navigate('/underwriter');
        } catch (error) {
            console.error('Failed to save decision:', error);
            alert('Failed to save decision');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full"></div></div>;
    if (!caseData) return <div className="p-8">Case not found</div>;

    // If case is completed (APPROVED/HOLD/DENIED) and not in edit mode, show Summary View
    const isCompleted = ['APPROVED', 'HOLD', 'DENIED'].includes(caseData.state);
    if (isCompleted && !editMode) {
        return <CaseSummaryView caseData={caseData} onEdit={() => setEditMode(true)} />;
    }

    const riskData = caseData.derived_facts?.risk;

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30">
                <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold flex items-center gap-2 text-slate-900">
                            <ShieldCheck className="w-5 h-5 text-blue-600" />
                            Underwriter Portal
                        </h1>
                        <p className="text-sm text-slate-500">Case #{caseData.id.slice(0, 8)}</p>
                    </div>
                    <div className="flex gap-2">
                        {STEPS.map((step, idx) => (
                            <div key={step.id} className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-all ${currentStep === idx ? 'bg-slate-100 text-slate-900 ring-1 ring-slate-300' :
                                currentStep > idx ? 'bg-green-50 text-green-700 ring-1 ring-green-200' : 'text-slate-400'
                                }`}>
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${currentStep === idx ? 'bg-slate-900 text-white' :
                                    currentStep > idx ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-500'
                                    }`}>
                                    {idx + 1}
                                </div>
                                <span className="hidden sm:inline">{step.title}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-6 mt-6">

                {/* Step 1: Overview */}
                {currentStep === 0 && (
                    <div className="space-y-6 animate-slideUp">
                        <h2 className="text-2xl font-bold text-slate-800">Case Overview</h2>

                        {/* Summary Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 grid grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Defendant</h3>
                                <div className="text-xl font-bold text-slate-900">{caseData.defendant_first_name} {caseData.defendant_last_name}</div>
                                <div className="text-slate-600 mt-1">{caseData.charges || 'No charges listed'}</div>
                                <div className="mt-4 inline-block px-3 py-1 bg-slate-100 rounded text-sm font-medium">
                                    SSN: ***-**-{caseData.derived_facts?.ssn_last4 || 'N/A'}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Bond Details</h3>
                                <div className="text-3xl font-black text-slate-900">${caseData.bond_amount.toLocaleString()}</div>
                                <div className="text-slate-500 font-medium">{caseData.premium_type === 'FULL_PREMIUM' ? 'Full Premium' : 'Payment Plan'}</div>
                                {caseData.premium_type === 'PAYMENT_PLAN' && (
                                    <div className="mt-2 text-sm bg-green-50 text-green-800 border-green-100 border p-2 rounded">
                                        Down: ${caseData.down_payment_amount}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* AI Risk Analysis */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-blue-600" />
                                AI Risk Assessment
                            </h3>
                            {riskData ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-slate-50 p-4 rounded-lg text-center">
                                        <div className="text-sm text-slate-500 mb-1">Risk Score</div>
                                        <div className={`text-4xl font-black ${riskData.risk_score > 70 ? 'text-red-600' : riskData.risk_score > 40 ? 'text-amber-600' : 'text-green-600'
                                            }`}>{riskData.risk_score}</div>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-lg">
                                        <div className="text-sm text-slate-500 mb-1">Tier</div>
                                        <div className="font-bold text-lg">{riskData.risk_tier}</div>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-lg">
                                        <div className="text-sm text-slate-500 mb-1">Recommendation</div>
                                        <div className="font-bold text-lg">{riskData.recommendation}</div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-slate-500 italic">No AI risk data available.</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 2: Verification */}
                {currentStep === 1 && (
                    <div className="space-y-6 animate-slideUp">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-slate-800">Compliance Verification</h2>
                            <div className="text-sm font-medium text-slate-500">
                                {checklist.filter(i => i.verified).length} / {checklist.length} Verified
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <VerificationChecklist
                                items={checklist}
                                onToggleVerify={handleToggleVerify}
                                onAddNote={() => { }}
                            />
                        </div>

                        {!canProceedToDecision() && (
                            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 flex gap-3">
                                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                                <div className="text-sm text-amber-800">
                                    You must verify all items above before proceeding to the decision phase.
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 3: Decision */}
                {currentStep === 2 && (
                    <div className="space-y-6 animate-slideUp">
                        <h2 className="text-2xl font-bold text-slate-800">Underwriting Decision</h2>

                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-slate-700 mb-2">Underwriter Name</label>
                                <select
                                    value={uwName}
                                    onChange={(e) => setUwName(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                                >
                                    <option value="">Select Underwriter...</option>
                                    <option value="Sarah Jenkins">Sarah Jenkins</option>
                                    <option value="Michael Ross">Michael Ross</option>
                                    <option value="David Chen">David Chen</option>
                                    <option value="System Admin">System Admin</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-6">
                                {['APPROVED', 'HOLD', 'DENIED'].map((opt) => (
                                    <button
                                        key={opt}
                                        onClick={() => setDecision(opt)}
                                        className={`p-6 rounded-xl border-2 flex flex-col items-center justify-center gap-3 transition-all ${decision === opt
                                            ? opt === 'APPROVED' ? 'border-green-500 bg-green-50 text-green-700 ring-1 ring-green-500' :
                                                opt === 'HOLD' ? 'border-amber-500 bg-amber-50 text-amber-700 ring-1 ring-amber-500' :
                                                    'border-red-500 bg-red-50 text-red-700 ring-1 ring-red-500'
                                            : 'border-slate-100 bg-white text-slate-400 hover:border-slate-300'
                                            }`}
                                    >
                                        {opt === 'APPROVED' && <CheckCircle className="w-8 h-8" />}
                                        {opt === 'HOLD' && <Clock className="w-8 h-8" />}
                                        {opt === 'DENIED' && <XCircle className="w-8 h-8" />}
                                        <span className="font-bold">{opt}</span>
                                    </button>
                                ))}
                            </div>

                            {(decision === 'HOLD' || decision === 'DENIED') && (
                                <div className="animate-fadeIn">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Reason for {decision}</label>
                                    <textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        rows={4}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-900"
                                        placeholder="Detailed explanation required..."
                                    />
                                </div>
                            )}

                            {decision === 'APPROVED' && (
                                <div className="bg-green-50 p-4 rounded-lg border border-green-100 text-green-800 text-sm font-medium flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    Case will be marked as Approved. Proceed to Execution to generate Power #.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 4: Execution */}
                {currentStep === 3 && (
                    <div className="space-y-6 animate-slideUp">
                        <h2 className="text-2xl font-bold text-slate-800">Post-Execution Details</h2>

                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Paid in Full?</label>
                                <div className="flex gap-4">
                                    {['YES', 'NO'].map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => setPaidInFull(opt)}
                                            className={`px-6 py-2 rounded-lg border font-bold ${paidInFull === opt ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'
                                                }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Power Number</label>
                                    <input
                                        type="text"
                                        value={powerNumber}
                                        onChange={(e) => setPowerNumber(e.target.value)}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                                        placeholder="AS3K-XXXXXX"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Court Case Number</label>
                                    <input
                                        type="text"
                                        value={courtCaseNumber}
                                        onChange={(e) => setCourtCaseNumber(e.target.value)}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                                        placeholder="Case #..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}


                {/* Navigation Footer */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-30">
                    <div className="max-w-4xl mx-auto flex justify-between items-center">
                        <button
                            onClick={prevStep}
                            disabled={currentStep === 0}
                            className="px-6 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg disabled:opacity-50"
                        >
                            Back
                        </button>

                        {currentStep < STEPS.length - 1 ? (
                            <button
                                onClick={nextStep}
                                disabled={currentStep === 1 && !canProceedToDecision()}
                                className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-slate-200"
                            >
                                Continue
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={saving}
                                className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-all shadow-lg shadow-green-200"
                            >
                                {saving ? 'Submitting...' : 'Submit Final Decision'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
