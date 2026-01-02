import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient as api } from '../../api/client';
import { CheckCircle, XCircle, Clock, FileCheck } from 'lucide-react';

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

    if (loading) return <div className="p-8">Loading...</div>;
    if (!caseData) return <div className="p-8">Case not found</div>;

    const riskData = caseData.derived_facts?.risk;

    return (
        <div className="max-w-5xl mx-auto p-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Underwriter Review</h1>
                <p className="text-gray-600 mt-2">
                    Case for {caseData.defendant_first_name} {caseData.defendant_last_name} -
                    Bond: ${caseData.bond_amount}
                </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 space-y-8">
                {/* Case Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Case Summary</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-600">Defendant:</span>{' '}
                            <span className="font-medium">{caseData.defendant_first_name} {caseData.defendant_last_name}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Indemnitor:</span>{' '}
                            <span className="font-medium">{caseData.indemnitor_first_name} {caseData.indemnitor_last_name}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Bond Amount:</span>{' '}
                            <span className="font-medium">${caseData.bond_amount}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Premium Type:</span>{' '}
                            <span className="font-medium">{caseData.premium_type || 'N/A'}</span>
                        </div>
                        {caseData.down_payment_amount && (
                            <div>
                                <span className="text-gray-600">Down Payment:</span>{' '}
                                <span className="font-medium">${caseData.down_payment_amount}</span>
                            </div>
                        )}
                        <div className="col-span-2">
                            <span className="text-gray-600">Charges:</span>{' '}
                            <span className="font-medium">{caseData.charges || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* AI Risk Assessment */}
                {riskData && (
                    <div className="border-t pt-6">
                        <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
                            <FileCheck className="w-5 h-5" />
                            AI Risk Assessment
                        </h3>
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <span className="text-sm text-gray-600">Risk Score</span>
                                    <p className="text-2xl font-bold">{riskData.risk_score || 'N/A'}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-600">Risk Tier</span>
                                    <p className="text-lg font-semibold capitalize">{riskData.risk_tier || 'N/A'}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-600">Recommendation</span>
                                    <p className="text-lg font-semibold capitalize">{riskData.recommendation || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* UW Decision Form */}
                <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Underwriting Decision</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Underwriter Name</label>
                            <input
                                type="text"
                                value={uwName}
                                onChange={(e) => setUwName(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                placeholder="Your name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Decision</label>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setDecision('APPROVED')}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${decision === 'APPROVED'
                                            ? 'border-green-500 bg-green-50 text-green-700'
                                            : 'border-gray-300 hover:border-green-300'
                                        }`}
                                >
                                    <CheckCircle className="w-5 h-5" />
                                    Approve
                                </button>
                                <button
                                    onClick={() => setDecision('HOLD')}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${decision === 'HOLD'
                                            ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                                            : 'border-gray-300 hover:border-yellow-300'
                                        }`}
                                >
                                    <Clock className="w-5 h-5" />
                                    Hold
                                </button>
                                <button
                                    onClick={() => setDecision('DENIED')}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${decision === 'DENIED'
                                            ? 'border-red-500 bg-red-50 text-red-700'
                                            : 'border-gray-300 hover:border-red-300'
                                        }`}
                                >
                                    <XCircle className="w-5 h-5" />
                                    Deny
                                </button>
                            </div>
                        </div>

                        {(decision === 'HOLD' || decision === 'DENIED') && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Reason for {decision === 'HOLD' ? 'Hold' : 'Denial'}
                                </label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    rows={4}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    placeholder="Specify reason..."
                                    required
                                />
                            </div>
                        )}

                        {decision === 'APPROVED' && (
                            <div className="space-y-4 border-t pt-4">
                                <h4 className="font-semibold">Post-Execution Details</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Paid in Full?</label>
                                        <select
                                            value={paidInFull}
                                            onChange={(e) => setPaidInFull(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                        >
                                            <option value="YES">Yes</option>
                                            <option value="NO">No</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Power Number</label>
                                        <input
                                            type="text"
                                            value={powerNumber}
                                            onChange={(e) => setPowerNumber(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                            placeholder="AS3K-123456"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Court Case Number</label>
                                        <input
                                            type="text"
                                            value={courtCaseNumber}
                                            onChange={(e) => setCourtCaseNumber(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                            placeholder="AS3K-123456"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="border-t pt-6 flex gap-4">
                    <button
                        onClick={handleSubmit}
                        disabled={saving || (decision !== 'APPROVED' && !reason)}
                        className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                    >
                        {saving ? 'Saving...' : `Submit ${decision} Decision`}
                    </button>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
