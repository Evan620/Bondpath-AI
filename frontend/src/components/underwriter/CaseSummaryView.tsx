import { CheckCircle, XCircle, Clock, Edit, Calendar, User, DollarSign, FileText, Shield, AlertTriangle } from 'lucide-react';

interface CaseSummaryViewProps {
    caseData: any;
    onEdit: () => void;
}

export default function CaseSummaryView({ caseData, onEdit }: CaseSummaryViewProps) {
    const getStatusColor = () => {
        switch (caseData.state) {
            case 'APPROVED': return 'green';
            case 'HOLD': return 'yellow';
            case 'DENIED': return 'red';
            default: return 'blue';
        }
    };

    const color = getStatusColor();
    const statusIcon = caseData.state === 'APPROVED' ? CheckCircle :
        caseData.state === 'HOLD' ? Clock : XCircle;
    const StatusIcon = statusIcon;

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-blue-600" />
                                Case Summary
                            </h1>
                            <p className="text-sm text-slate-500">Case #{caseData.id.slice(0, 8)}</p>
                        </div>
                        <button
                            onClick={onEdit}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium"
                        >
                            <Edit className="w-4 h-4" />
                            Edit Case
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto p-6 space-y-6">
                {/* Status Card */}
                <div className={`bg-white rounded-xl shadow-sm border-2 border-${color}-200 p-6`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-full bg-${color}-100`}>
                                <StatusIcon className={`w-8 h-8 text-${color}-600`} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">{caseData.state}</h2>
                                <p className="text-slate-600">
                                    {caseData.defendant_first_name} {caseData.defendant_last_name} - ${caseData.bond_amount.toLocaleString()}
                                </p>
                            </div>
                        </div>
                        <div className="text-right text-sm text-slate-500">
                            <div className="flex items-center gap-2 justify-end">
                                <Calendar className="w-4 h-4" />
                                <span>Decided: {caseData.uw_review_date || new Date().toLocaleDateString()}</span>
                            </div>
                            {caseData.uw_name && (
                                <div className="flex items-center gap-2 justify-end mt-1">
                                    <User className="w-4 h-4" />
                                    <span>By: {caseData.uw_name}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* CST Intake Section */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        CST Intake Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Caller</h4>
                            <p className="font-medium">{caseData.caller_name}</p>
                            <p className="text-sm text-slate-600">{caseData.caller_relationship}</p>
                            <p className="text-sm text-slate-600">{caseData.caller_phone}</p>
                            {caseData.caller_email && <p className="text-sm text-slate-600">{caseData.caller_email}</p>}
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Defendant</h4>
                            <p className="font-medium">{caseData.defendant_first_name} {caseData.defendant_last_name}</p>
                            <p className="text-sm text-slate-600">DOB: {caseData.defendant_dob || 'N/A'}</p>
                            <p className="text-sm text-slate-600">Gender: {caseData.defendant_gender || 'N/A'}</p>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Bond Details</h4>
                            <p className="font-medium">${caseData.bond_amount.toLocaleString()}</p>
                            <p className="text-sm text-slate-600">Type: {caseData.bond_type}</p>
                            <p className="text-sm text-slate-600">Severity: {caseData.charge_severity}</p>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Facility</h4>
                                <p className="text-sm">{caseData.jail_facility}</p>
                                <p className="text-sm text-slate-600">{caseData.county}, {caseData.state_jurisdiction}</p>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Intent Signal</h4>
                                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                                    {caseData.intent_signal}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Advisor Section */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        Advisor Processing
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Engagement</h4>
                            <p className="font-medium">{caseData.engagement_type || 'N/A'}</p>
                            <p className="text-sm text-slate-600">{caseData.contact_method || 'N/A'}</p>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Premium</h4>
                            <p className="font-medium">{caseData.premium_type || 'N/A'}</p>
                            {caseData.down_payment_amount && (
                                <p className="text-sm text-slate-600">Down: ${caseData.down_payment_amount}</p>
                            )}
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Indemnitor</h4>
                            <p className="font-medium">{caseData.indemnitor_first_name} {caseData.indemnitor_last_name}</p>
                            <p className="text-sm text-slate-600">{caseData.indemnitor_phone || 'N/A'}</p>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Collateral</h4>
                            <p className="text-sm">{caseData.has_collateral || 'N/A'}</p>
                            {caseData.collateral_description && (
                                <p className="text-sm text-slate-600">{caseData.collateral_description}</p>
                            )}
                        </div>
                    </div>

                    {/* Documents */}
                    {(caseData.booking_sheet_url || caseData.defendant_id_url || caseData.indemnitor_id_url) && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Uploaded Documents</h4>
                            <div className="flex flex-wrap gap-2">
                                {caseData.booking_sheet_url && (
                                    <a href={caseData.booking_sheet_url} target="_blank" rel="noreferrer"
                                        className="px-3 py-1 bg-slate-100 text-slate-700 rounded text-sm hover:bg-slate-200">
                                        📄 Booking Sheet
                                    </a>
                                )}
                                {caseData.defendant_id_url && (
                                    <a href={caseData.defendant_id_url} target="_blank" rel="noreferrer"
                                        className="px-3 py-1 bg-slate-100 text-slate-700 rounded text-sm hover:bg-slate-200">
                                        🪪 Defendant ID
                                    </a>
                                )}
                                {caseData.indemnitor_id_url && (
                                    <a href={caseData.indemnitor_id_url} target="_blank" rel="noreferrer"
                                        className="px-3 py-1 bg-slate-100 text-slate-700 rounded text-sm hover:bg-slate-200">
                                        🪪 Indemnitor ID
                                    </a>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Advisor Notes */}
                    {caseData.advisor_notes && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Advisor Notes</h4>
                            <div className="bg-amber-50 text-amber-900 p-3 rounded-lg border border-amber-100 text-sm">
                                {caseData.advisor_notes}
                            </div>
                        </div>
                    )}
                </div>

                {/* Underwriter Decision Section */}
                <div className={`bg-white rounded-xl shadow-sm border-2 border-${color}-200 p-6`}>
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Shield className={`w-5 h-5 text-${color}-600`} />
                        Underwriter Decision
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Decision</h4>
                            <span className={`inline-flex items-center gap-2 px-4 py-2 bg-${color}-100 text-${color}-800 rounded-lg font-bold`}>
                                <StatusIcon className="w-5 h-5" />
                                {caseData.state}
                            </span>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Underwriter</h4>
                            <p className="font-medium">{caseData.uw_name || 'N/A'}</p>
                            <p className="text-sm text-slate-600">{caseData.uw_review_date || 'N/A'}</p>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">AI Risk Score</h4>
                            <p className="text-2xl font-bold">{caseData.derived_facts?.risk?.risk_score || 'N/A'}</p>
                            <p className="text-sm text-slate-600">{caseData.derived_facts?.risk?.risk_tier || 'N/A'}</p>
                        </div>
                    </div>

                    {/* Reason for Hold/Denial */}
                    {(caseData.state === 'HOLD' || caseData.state === 'DENIED') && caseData.uw_reason && (
                        <div className={`bg-${color}-50 border-l-4 border-${color}-500 p-4 mb-6`}>
                            <div className="flex gap-3">
                                <AlertTriangle className={`w-5 h-5 text-${color}-600 shrink-0`} />
                                <div>
                                    <h4 className="font-bold text-slate-900 mb-1">Reason for {caseData.state}</h4>
                                    <p className="text-sm text-slate-700">{caseData.uw_reason}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Post-Execution Details (if Approved) */}
                    {caseData.state === 'APPROVED' && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h4 className="font-bold text-green-900 mb-3">Post-Execution Details</h4>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <span className="text-xs text-green-700 font-bold uppercase">Power Number</span>
                                    <p className="font-mono text-green-900 font-bold">{caseData.power_number || 'N/A'}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-green-700 font-bold uppercase">Court Case #</span>
                                    <p className="font-mono text-green-900 font-bold">{caseData.court_case_number || 'N/A'}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-green-700 font-bold uppercase">Paid in Full</span>
                                    <p className="font-bold text-green-900">{caseData.paid_in_full || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
