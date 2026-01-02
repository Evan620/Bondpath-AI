import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient as api } from '../../api/client';
import { CheckCircle, XCircle, Clock, FileText, Scale } from 'lucide-react';

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
    // UW fields
    uw_decision?: string;
    uw_reason?: string;
    uw_name?: string;
    documents_verified?: any;
    paid_in_full?: string;
    power_number?: string;
    court_case_number?: string;
}

export default function UnderwriterCaseDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [caseData, setCaseData] = useState<Case | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state
    const [uwName, setUwName] = useState('');
    const [decision, setDecision] = useState('APPROVED');
    const [reason, setReason] = useState('');
    const [paidInFull, setPaidInFull] = useState('YES');
    const [powerNumber, setPowerNumber] = useState('');
    const [courtCaseNumber, setCourtCaseNumber] = useState('');

    useEffect(() => {
        fetchCase();
    }, [id]);

    const fetchCase = async () => {
        try {
            const response = await api.get(`/cases/${id}`);
            const data = response.data;
            setCaseData(data);

            // Pre-fill if exists
            if (data.uw_name) setUwName(data.uw_name);
            if (data.uw_decision) setDecision(data.uw_decision);
            if (data.uw_reason) setReason(data.uw_reason);
            if (data.paid_in_full) setPaidInFull(data.paid_in_full);
            if (data.power_number) setPowerNumber(data.power_number);
            if (data.court_case_number) setCourtCaseNumber(data.court_case_number);

            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch case:', error);
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        setSaving(true);
        try {
            await api.patch(`/cases/${id}`, {
                uw_name: uwName,
                uw_review_date: new Date().toISOString().split('T')[0],
                uw_decision: decision,
                uw_reason: reason,
                paid_in_full: paidInFull,
                power_number: powerNumber,
                court_case_number: courtCaseNumber,
                state: decision === 'APPROVED' ? 'APPROVED' : decision === 'HOLD' ? 'HOLD' : 'DENIED'
            });

            navigate('/dashboard');
        } catch (error) {
            console.error('Failed to save decision:', error);
            alert('Failed to save decision');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="text-center"><div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div><p className="mt-4 text-slate-600 font-medium">Loading case...</p></div></div>;
    if (!caseData) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="text-slate-600 font-medium">Case not found</div></div>;

    const riskData = caseData.derived_facts?.risk;

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Underwriter Review</h1>
                            <p className="text-sm text-slate-600 font-medium mt-1">
                                {caseData.defendant_first_name} {caseData.defendant_last_name} • Bond: ${caseData.bond_amount?.toLocaleString()}
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
                        >
                            ← Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Application Summary - Compact 4-Column Layout */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                        <FileText className="w-5 h-5 text-slate-500" />
                        <h3 className="text-lg font-bold text-slate-800">Application Summary</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Col 1: Defendant */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Defendant</h4>
                            <div className="space-y-1">
                                <div className="font-bold text-slate-900 text-sm">{caseData.defendant_first_name} {caseData.defendant_last_name}</div>
                                <div className="text-xs text-slate-600">Bond: ${caseData.bond_amount?.toLocaleString()}</div>
                            </div>
                        </div>

                        {/* Col 2: Indemnitor */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Indemnitor</h4>
                            <div className="space-y-1">
                                <div className="font-bold text-slate-900 text-sm">{caseData.indemnitor_first_name} {caseData.indemnitor_last_name}</div>
                            </div>
                        </div>

                        {/* Col 3: Financials */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Financials</h4>
                            <div className="text-sm space-y-2">
                                <div>
                                    <div className="text-xs text-slate-500">Premium Type</div>
                                    <div className="font-bold text-slate-900">{caseData.premium_type || 'N/A'}</div>
                                </div>
                                {caseData.down_payment_amount && (
                                    <div>
                                        <div className="text-xs text-slate-500">Down Payment</div>
                                        <div className="font-bold text-slate-900">${caseData.down_payment_amount}</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Col 4: Details */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Details</h4>
                            <div className="space-y-2 text-sm">
                                <div className="text-xs bg-slate-50 p-1.5 rounded border border-slate-100 font-medium line-clamp-2" title={caseData.charges}>
                                    {caseData.charges || 'No charges listed'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-8">


                    {/* AI Risk Assessment */}
                    {riskData && (
                        <div className="border-t border-slate-100 pt-6">
                            <h3 className="flex items-center gap-2 text-lg font-bold mb-4 text-slate-800">
                                <Scale className="w-5 h-5 text-blue-600" />
                                AI Risk Assessment
                            </h3>
                            <div className="bg-gradient-to-br from-blue-50 to-slate-50 p-6 rounded-xl border border-blue-100">
                                <div className="grid grid-cols-3 gap-6">
                                    <div>
                                        <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">Risk Score</span>
                                        <p className="text-3xl font-bold text-slate-900 mt-1">{riskData.risk_score || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">Risk Tier</span>
                                        <p className="text-xl font-bold text-slate-900 capitalize mt-1">{riskData.risk_tier || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">Recommendation</span>
                                        <p className="text-xl font-bold text-blue-700 capitalize mt-1">{riskData.recommendation || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* UW Decision Form */}
                    <div className="border-t border-slate-100 pt-6">
                        <h3 className="text-lg font-bold mb-4 text-slate-800">Underwriting Decision</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Underwriter Name</label>
                                <input
                                    type="text"
                                    value={uwName}
                                    onChange={(e) => setUwName(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all font-medium text-slate-700"
                                    placeholder="Your name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Decision</label>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setDecision('APPROVED')}
                                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all font-bold ${decision === 'APPROVED'
                                            ? 'border-green-600 bg-green-50 text-green-700 ring-2 ring-green-100'
                                            : 'border-slate-200 hover:border-green-300 hover:bg-green-50 text-slate-600'
                                            }`}
                                    >
                                        <CheckCircle className="w-5 h-5" />
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => setDecision('HOLD')}
                                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all font-bold ${decision === 'HOLD'
                                            ? 'border-amber-600 bg-amber-50 text-amber-700 ring-2 ring-amber-100'
                                            : 'border-slate-200 hover:border-amber-300 hover:bg-amber-50 text-slate-600'
                                            }`}
                                    >
                                        <Clock className="w-5 h-5" />
                                        Hold
                                    </button>
                                    <button
                                        onClick={() => setDecision('DENIED')}
                                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all font-bold ${decision === 'DENIED'
                                            ? 'border-red-600 bg-red-50 text-red-700 ring-2 ring-red-100'
                                            : 'border-slate-200 hover:border-red-300 hover:bg-red-50 text-slate-600'
                                            }`}
                                    >
                                        <XCircle className="w-5 h-5" />
                                        Deny
                                    </button>
                                </div>
                            </div>

                            {(decision === 'HOLD' || decision === 'DENIED') && (
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        Reason for {decision === 'HOLD' ? 'Hold' : 'Denial'}
                                    </label>
                                    <textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        rows={4}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none transition-all font-medium text-slate-700"
                                        placeholder="Specify reason..."
                                        required
                                    />
                                </div>
                            )}

                            {decision === 'APPROVED' && (
                                <div className="space-y-4 border-t border-slate-100 pt-6">
                                    <h4 className="font-bold text-slate-800">Post-Execution Details</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Paid in Full?</label>
                                            <select
                                                value={paidInFull}
                                                onChange={(e) => setPaidInFull(e.target.value)}
                                                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none bg-white font-medium text-slate-700"
                                            >
                                                <option value="YES">Yes</option>
                                                <option value="NO">No</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Power Number</label>
                                            <input
                                                type="text"
                                                value={powerNumber}
                                                onChange={(e) => setPowerNumber(e.target.value)}
                                                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none font-medium text-slate-700"
                                                placeholder="AS3K-123456"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Court Case Number</label>
                                            <input
                                                type="text"
                                                value={courtCaseNumber}
                                                onChange={(e) => setCourtCaseNumber(e.target.value)}
                                                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none font-medium text-slate-700"
                                                placeholder="AS3K-123456"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="border-t border-slate-100 pt-6 flex gap-4">
                        <button
                            onClick={handleSubmit}
                            disabled={saving || (decision !== 'APPROVED' && !reason)}
                            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 font-bold transition-all shadow-sm hover:shadow"
                        >
                            {saving ? 'Saving...' : `Submit ${decision} Decision`}
                        </button>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="px-6 py-3 border-2 border-slate-200 rounded-xl hover:bg-slate-50 font-bold text-slate-700 transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
