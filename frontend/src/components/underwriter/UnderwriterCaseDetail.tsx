import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient as api } from '../../api/client';
import { CheckCircle, XCircle, Clock, ChevronRight, AlertTriangle, Activity, ShieldCheck, User, Gavel, Stamp, Fingerprint, Phone, RefreshCw } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
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
    const { logout } = useAuth();
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

    const [analyzing, setAnalyzing] = useState(false);

    const handleReassessRisk = async () => {
        setAnalyzing(true);
        try {
            const response = await api.post(`/cases/${id}/assess-risk`);
            // Update local fields with new data
            setCaseData(prev => prev ? {
                ...prev,
                derived_facts: response.data.derived_facts,
                updated_at: response.data.updated_at
            } : null);
        } catch (error) {
            console.error('Failed to reassess risk:', error);
            alert('Failed to update risk assessment.');
        } finally {
            setAnalyzing(false);
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full"></div></div>;
    if (!caseData) return <div className="p-8">Case not found</div>;

    // If case is completed (APPROVED/HOLD/DENIED) and not in edit mode, show Summary View
    const isCompleted = ['APPROVED', 'HOLD', 'DENIED'].includes(caseData.state);
    const showSummary = isCompleted && !editMode;
    const riskData = caseData.derived_facts?.risk;

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Top Navigation Bar */}
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => navigate('/underwriter')}
                                className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 mr-2 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                            </button>
                            <div className="flex items-center gap-2">
                                <div className="bg-blue-600 p-1.5 rounded-lg">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                                </div>
                                <span className="font-bold text-xl text-slate-900">Underwriter Dashboard</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right mr-4 hidden sm:block">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Currently Reviewing</div>
                                <div className="text-sm font-bold text-slate-700">Case #{caseData.id.slice(0, 8)}</div>
                            </div>
                            <button onClick={logout} className="text-sm font-medium text-slate-500 hover:text-slate-900 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {showSummary ? (
                <CaseSummaryView caseData={caseData} onEdit={() => setEditMode(true)} />
            ) : (
                <div className="max-w-4xl mx-auto p-6 mt-4">
                    {/* Step Indicator */}
                    <div className="mb-8 flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                            {STEPS.map((step, idx) => (
                                <div key={step.id} className="flex items-center">
                                    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${currentStep === idx
                                        ? 'bg-blue-50 text-blue-700 border border-blue-100 shadow-sm shadow-blue-50'
                                        : currentStep > idx
                                            ? 'text-green-600'
                                            : 'text-slate-400'
                                        }`}>
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep === idx ? 'bg-blue-600 text-white shadow-sm' :
                                            currentStep > idx ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-400 border border-slate-200'
                                            }`}>
                                            {currentStep > idx ? (
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                            ) : idx + 1}
                                        </div>
                                        <span className="hidden md:inline">{step.title}</span>
                                    </div>
                                    {idx < STEPS.length - 1 && (
                                        <div className="mx-1 text-slate-300 hidden md:block">
                                            <ChevronRight className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Step 1: Overview */}
                    {currentStep === 0 && (
                        <div className="space-y-6 animate-slideUp">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Case Overview</h2>
                                <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
                                    Initial Review
                                </div>
                            </div>

                            {/* Summary Card */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <User className="w-3 h-3" />
                                                Defendant Information
                                            </h3>
                                            <div className="text-2xl font-bold text-slate-900">{caseData.defendant_first_name} {caseData.defendant_last_name}</div>
                                            <div className="text-slate-500 font-medium mt-1 flex items-center gap-2">
                                                <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold uppercase tracking-tighter">Charges</span>
                                                {caseData.charges || 'No charges listed'}
                                            </div>
                                            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-400">
                                                <Fingerprint className="w-3.5 h-3.5" />
                                                SSN: ***-**-{caseData.derived_facts?.ssn_last4 || 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="md:border-l md:border-slate-100 md:pl-8 space-y-6">
                                        <div>
                                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <ShieldCheck className="w-3 h-3" />
                                                Bond Details
                                            </h3>
                                            <div className="text-4xl font-black text-slate-900 tracking-tighter">${caseData.bond_amount.toLocaleString()}</div>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${caseData.premium_type === 'FULL_PREMIUM' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                                                    }`}>
                                                    {caseData.premium_type === 'FULL_PREMIUM' ? 'Full Premium' : 'Payment Plan'}
                                                </span>
                                                {caseData.premium_type === 'PAYMENT_PLAN' && (
                                                    <span className="text-xs font-bold text-slate-400">
                                                        Down: <span className="text-slate-700">${caseData.down_payment_amount}</span>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* AI Risk Analysis */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="bg-slate-50/50 px-8 py-4 border-b border-slate-100 flex items-center justify-between">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-blue-600" />
                                        AI Risk Assessment
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={handleReassessRisk}
                                            disabled={analyzing}
                                            className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-all ${analyzing
                                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                                : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300'
                                                }`}
                                        >
                                            <RefreshCw className={`w-3 h-3 ${analyzing ? 'animate-spin' : ''}`} />
                                            {analyzing ? 'Running Analysis...' : 'Run Audit'}
                                        </button>
                                        {riskData && (
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${riskData.risk_score > 70 ? 'bg-red-100 text-red-700' :
                                                riskData.risk_score > 40 ? 'bg-amber-100 text-amber-700' :
                                                    'bg-green-100 text-green-700'
                                                }`}>
                                                Tier: {riskData.risk_tier}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="p-8">
                                    {riskData ? (
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                                            <div className="md:col-span-3 text-center md:text-left">
                                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Risk Score</div>
                                                <div className={`text-5xl font-black tracking-tighter ${riskData.risk_score > 70 ? 'text-red-600' :
                                                    riskData.risk_score > 40 ? 'text-amber-600' :
                                                        'text-green-600'
                                                    }`}>{riskData.risk_score}</div>
                                                <div className="w-full h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">
                                                    <div className={`h-full ${riskData.risk_score > 70 ? 'bg-red-500' :
                                                        riskData.risk_score > 40 ? 'bg-amber-500' :
                                                            'bg-green-500'
                                                        }`} style={{ width: `${riskData.risk_score}%` }}></div>
                                                </div>
                                            </div>
                                            <div className="md:col-span-9 bg-slate-50 p-6 rounded-xl border border-slate-100">
                                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                                                    AI Recommendation
                                                </div>
                                                <div className="text-slate-900 font-bold text-lg leading-snug">
                                                    "{riskData.recommendation}"
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-6 text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                            <Activity className="w-8 h-8 mb-2 opacity-20" />
                                            No AI risk data available.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Verification */}
                    {currentStep === 1 && (
                        <div className="space-y-6 animate-slideUp">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Compliance Verification</h2>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progress</div>
                                        <div className="text-sm font-black text-slate-900">
                                            {checklist.filter(i => i.verified).length} / {checklist.length} Verified
                                        </div>
                                    </div>
                                    <div className="w-12 h-12 rounded-full border-4 border-slate-100 flex items-center justify-center">
                                        <div className="text-[10px] font-bold text-blue-600">
                                            {Math.round((checklist.filter(i => i.verified).length / checklist.length) * 100)}%
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="bg-slate-50/50 px-8 py-4 border-b border-slate-100">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                        Required Verification Items
                                    </h3>
                                </div>
                                <div className="p-8">
                                    <VerificationChecklist
                                        items={checklist}
                                        onToggleVerify={handleToggleVerify}
                                    />
                                </div>
                            </div>

                            {!canProceedToDecision() && (
                                <div className="bg-amber-50 rounded-xl border border-amber-100 p-5 flex gap-4 shadow-sm">
                                    <div className="bg-amber-500 rounded-full p-1 h-fit shadow-lg shadow-amber-200">
                                        <AlertTriangle className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-sm font-black text-amber-900 uppercase tracking-tight">Attention Required</div>
                                        <div className="text-sm text-amber-800 font-medium">
                                            All compliance items must be verified before the system allows you to proceed to the decision phase.
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Decision */}
                    {currentStep === 2 && (
                        <div className="space-y-6 animate-slideUp">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Underwriting Decision</h2>
                                <div className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100">
                                    Action Required
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="bg-slate-50/50 px-8 py-4 border-b border-slate-100">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Gavel className="w-4 h-4 text-slate-600" />
                                        Final Decision Logic
                                    </h3>
                                </div>
                                <div className="p-8">
                                    <div className="mb-8">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Assigning Underwriter</label>
                                        <div className="relative">
                                            <select
                                                value={uwName}
                                                onChange={(e) => setUwName(e.target.value)}
                                                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all font-bold text-slate-900 appearance-none"
                                            >
                                                <option value="">Select Underwriter...</option>
                                                {underwriters.map(uw => (
                                                    <option key={uw.id} value={uw.email}>{uw.email}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                <ChevronRight className="w-4 h-4 text-slate-400 rotate-90" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                        {[
                                            { id: 'APPROVED', icon: CheckCircle, color: 'green' },
                                            { id: 'HOLD', icon: Clock, color: 'amber' },
                                            { id: 'DENIED', icon: XCircle, color: 'red' }
                                        ].map((opt) => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setDecision(opt.id)}
                                                className={`p-6 rounded-2xl border-2 flex flex-col items-center justify-center gap-4 transition-all duration-200 group ${decision === opt.id
                                                    ? opt.color === 'green' ? 'border-green-500 bg-green-50 text-green-700 shadow-lg shadow-green-100 ring-4 ring-green-50' :
                                                        opt.color === 'amber' ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-lg shadow-amber-100 ring-4 ring-amber-50' :
                                                            'border-red-500 bg-red-50 text-red-700 shadow-lg shadow-red-100 ring-4 ring-red-50'
                                                    : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <div className={`p-3 rounded-full transition-colors ${decision === opt.id
                                                    ? opt.color === 'green' ? 'bg-green-500 text-white' :
                                                        opt.color === 'amber' ? 'bg-amber-500 text-white' :
                                                            'bg-red-500 text-white'
                                                    : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                                                    }`}>
                                                    <opt.icon className="w-6 h-6" />
                                                </div>
                                                <span className="font-black uppercase tracking-widest text-xs">{opt.id}</span>
                                            </button>
                                        ))}
                                    </div>

                                    {(decision === 'HOLD' || decision === 'DENIED') && (
                                        <div className="animate-fadeIn space-y-3">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Reason for {decision}</label>
                                            <textarea
                                                value={reason}
                                                onChange={(e) => setReason(e.target.value)}
                                                rows={4}
                                                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all font-medium text-slate-700"
                                                placeholder={`Please provide a detailed explanation for the ${decision.toLowerCase()} status...`}
                                            />
                                        </div>
                                    )}

                                    {decision === 'APPROVED' && (
                                        <div className="bg-green-50 p-5 rounded-xl border border-green-100 flex items-start gap-4 shadow-sm">
                                            <div className="bg-green-500 rounded-full p-1 mt-0.5">
                                                <CheckCircle className="w-4 h-4 text-white" />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-sm font-black text-green-900 uppercase tracking-tight">Approved for Processing</div>
                                                <div className="text-sm text-green-700 font-medium">
                                                    Case will be marked as Approved. Proceed to the next step to record post-execution details (Power # and Court Case #).
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Execution */}
                    {currentStep === 3 && (
                        <div className="space-y-6 animate-slideUp">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Finalized Details</h2>
                                <div className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100">
                                    Execution Phase
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="bg-slate-50/50 px-8 py-4 border-b border-slate-100">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Stamp className="w-4 h-4 text-slate-600" />
                                        Post-Execution Logging
                                    </h3>
                                </div>
                                <div className="p-8 space-y-8">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Initial Payment Status</label>
                                        <div className="flex gap-4">
                                            {['YES', 'NO'].map(opt => (
                                                <button
                                                    key={opt}
                                                    onClick={() => setPaidInFull(opt)}
                                                    className={`flex-1 py-4 rounded-xl font-black text-sm transition-all border-2 ${paidInFull === opt
                                                        ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200'
                                                        : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                                                        }`}
                                                >
                                                    {opt === 'YES' ? 'FULL PAYMENT RECEIVED' : 'PARTIAL / PENDING'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <Phone className="w-3 h-3" />
                                                Surety Power Number
                                            </label>
                                            <input
                                                type="text"
                                                value={powerNumber}
                                                onChange={(e) => setPowerNumber(e.target.value)}
                                                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all font-mono font-bold text-slate-900 uppercase tracking-widest"
                                                placeholder="PWR-XXXXXX"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <Gavel className="w-3 h-3" />
                                                Court Case Number
                                            </label>
                                            <input
                                                type="text"
                                                value={courtCaseNumber}
                                                onChange={(e) => setCourtCaseNumber(e.target.value)}
                                                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all font-mono font-bold text-slate-900"
                                                placeholder="2026-CR-XXXX"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}


                    {/* Navigation Footer */}
                    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-6 z-30 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
                        <div className="max-w-4xl mx-auto flex justify-between items-center px-4">
                            <button
                                onClick={prevStep}
                                disabled={currentStep === 0}
                                className={`flex items-center gap-2 px-6 py-3 font-bold rounded-xl transition-all ${currentStep === 0
                                    ? 'text-slate-200'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                                    }`}
                            >
                                <ChevronRight className="w-4 h-4 rotate-180" />
                                Back
                            </button>

                            <div className="flex items-center gap-4">
                                {currentStep < STEPS.length - 1 ? (
                                    <button
                                        onClick={nextStep}
                                        disabled={currentStep === 1 && !canProceedToDecision()}
                                        className="px-10 py-4 bg-blue-600 text-white font-black text-sm uppercase tracking-widest rounded-xl hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xl shadow-blue-100 flex items-center gap-3"
                                    >
                                        Continue
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleSubmit}
                                        disabled={saving}
                                        className="px-10 py-4 bg-green-600 text-white font-black text-sm uppercase tracking-widest rounded-xl hover:bg-green-700 disabled:opacity-30 transition-all shadow-xl shadow-green-100 flex items-center gap-3"
                                    >
                                        {saving ? (
                                            <>Submitting...</>
                                        ) : (
                                            <>
                                                Submit Final Decision
                                                <CheckCircle className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
