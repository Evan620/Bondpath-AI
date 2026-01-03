import { CheckCircle, XCircle, Clock, Printer, Edit2, Phone, User, Shield, Briefcase, Scale, CheckSquare, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface Case {
    id: string;
    state: string;
    defendant_first_name: string;
    defendant_last_name: string;
    defendant_dob?: string;
    defendant_gender?: string;
    bond_amount: number;
    bond_type?: string;
    charge_severity?: string;
    intent_signal?: string;
    jail_facility?: string;
    indemnitor_first_name?: string;
    indemnitor_last_name?: string;
    indemnitor_relationship?: string;
    premium_type?: string;
    down_payment_amount?: number;
    collateral_doc_url?: string;
    charges?: string;
    uw_decision?: string;
    uw_reason?: string;
    uw_name?: string;
    paid_in_full?: string;
    power_number?: string;
    court_case_number?: string;
    caller_name?: string;
    caller_relationship?: string;
    caller_email?: string;
    updated_at?: string;
    derived_facts?: any;
}

interface CaseSummaryViewProps {
    caseData: Case;
    onEdit: () => void;
}

export default function CaseSummaryView({ caseData, onEdit }: CaseSummaryViewProps) {
    // Calculate premium (10% standard)
    const premiumAmount = (caseData.bond_amount * 0.10).toFixed(2);

    // Format decided date (using updated_at as proxy if not specifically available)
    const decisionDate = caseData.updated_at ? format(new Date(caseData.updated_at), 'M/d/yyyy') : format(new Date(), 'M/d/yyyy');

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            {/* Header Section */}
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Breadcrumbs & Title Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>

                        <div className="flex items-center gap-4">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                                Case #{caseData.id.slice(0, 8)}
                            </h1>
                            <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-1.5 
                                ${caseData.state === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                    caseData.state === 'DENIED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                {caseData.state === 'APPROVED' && <CheckCircle className="w-3.5 h-3.5" />}
                                {caseData.state === 'DENIED' && <XCircle className="w-3.5 h-3.5" />}
                                {caseData.state === 'HOLD' && <Clock className="w-3.5 h-3.5" />}
                                {caseData.state}
                            </div>
                        </div>
                        <div className="text-sm text-slate-500 font-medium mt-1 flex items-center gap-3">
                            <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                Decided: {decisionDate}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Edit2 className="w-3.5 h-3.5" />
                                Underwriting
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-lg hover:bg-slate-50 transition-all shadow-sm">
                            <Printer className="w-4 h-4" />
                            Print Summary
                        </button>
                        <button
                            onClick={onEdit}
                            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
                        >
                            <Edit2 className="w-4 h-4" />
                            Edit Case
                        </button>
                    </div>
                </div>

                {/* Top Profile Card */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <User className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900">
                                {caseData.defendant_first_name} {caseData.defendant_last_name}
                            </h2>
                            <p className="text-slate-500 font-medium">Defendant</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-4xl font-black text-slate-900 tracking-tight">
                            ${caseData.bond_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-slate-500 font-medium text-sm">Total Bond Amount</div>
                    </div>
                </div>

                {/* Grid Layout for Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* CST Intake Information */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
                            <Phone className="w-4 h-4 text-slate-400" />
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">CST Intake Information</h3>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Caller Name</label>
                                    <div className="font-bold text-slate-900 text-sm">{caseData.caller_name || 'N/A'}</div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Relation</label>
                                    {caseData.caller_relationship && (
                                        <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold uppercase">
                                            {caseData.caller_relationship}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Email Address</label>
                                <div className="font-medium text-slate-900 text-sm truncate">{caseData.caller_email || 'N/A'}</div>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <Clock className="w-3 h-3" />
                                Last contact: 2 hours ago
                            </div>
                        </div>
                    </div>

                    {/* Defendant Details */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-400" />
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Defendant</h3>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Full Legal Name</label>
                                <div className="font-bold text-slate-900 text-sm">{caseData.defendant_first_name} {caseData.defendant_last_name}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Date of Birth</label>
                                    <div className="font-bold text-slate-900 text-sm">{caseData.defendant_dob || 'N/A'}</div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Gender</label>
                                    <div className="font-bold text-slate-900 text-sm">{caseData.defendant_gender || 'N/A'}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bond Details */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
                            <Scale className="w-4 h-4 text-slate-400" />
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Bond Details</h3>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Amount</label>
                                    <div className="font-black text-slate-900 text-sm">${caseData.bond_amount.toLocaleString()}</div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Type</label>
                                    <div className="font-bold text-slate-900 text-sm">{caseData.bond_type || 'Surety'}</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Severity</label>
                                    <span className="inline-block px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px] font-bold uppercase">
                                        {caseData.charge_severity || 'Misdemeanor'}
                                    </span>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Intent Signal</label>
                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${caseData.intent_signal === 'GET_OUT_TODAY' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                        {caseData.intent_signal === 'GET_OUT_TODAY' ? 'Positive' : caseData.intent_signal || 'Low'}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Facility</label>
                                <div className="font-bold text-slate-900 text-sm">{caseData.jail_facility || 'County Central Detention Center'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Advisor Processing */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-slate-400" />
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Advisor Processing</h3>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Engagement</label>
                                    <div className="font-bold text-slate-900 text-sm">Standard</div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Premium</label>
                                    <div className="font-black text-slate-900 text-sm">${premiumAmount}</div>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Indemnitor</label>
                                <div className="font-bold text-slate-900 text-sm">
                                    {caseData.indemnitor_first_name ? `${caseData.indemnitor_first_name} ${caseData.indemnitor_last_name}` : 'Pending'}
                                    <span className="text-slate-400 font-normal ml-1">
                                        ({caseData.indemnitor_relationship || 'Relation'})
                                    </span>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Collateral</label>
                                <div className="font-medium text-slate-400 text-sm italic">
                                    {caseData.collateral_doc_url ? 'Collateral Documents on File' : 'None Required'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Underwriter Decision */}
                    <div className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden ${caseData.state === 'APPROVED' ? 'border-green-500' :
                        caseData.state === 'DENIED' ? 'border-red-500' : 'border-amber-500'
                        }`}>
                        <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
                            <Shield className={`w-4 h-4 ${caseData.state === 'APPROVED' ? 'text-green-600' :
                                caseData.state === 'DENIED' ? 'text-red-600' : 'text-amber-600'
                                }`} />
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Underwriter Decision</h3>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className={`p-4 rounded-lg flex items-center justify-between ${caseData.state === 'APPROVED' ? 'bg-green-50 text-green-900' :
                                caseData.state === 'DENIED' ? 'bg-red-50 text-red-900' : 'bg-amber-50 text-amber-900'
                                }`}>
                                <div>
                                    <div className={`text-[10px] font-black uppercase tracking-widest opacity-60 ${caseData.state === 'APPROVED' ? 'text-green-700' :
                                        caseData.state === 'DENIED' ? 'text-red-700' : 'text-amber-700'
                                        }`}>Final Decision</div>
                                    <div className="text-2xl font-black tracking-tight">{caseData.state}</div>
                                </div>
                                <div className="text-3xl">
                                    {caseData.state === 'APPROVED' && <CheckCircle className="w-8 h-8 text-green-500" />}
                                    {caseData.state === 'DENIED' && <XCircle className="w-8 h-8 text-red-500" />}
                                    {caseData.state === 'HOLD' && <Clock className="w-8 h-8 text-amber-500" />}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 items-end">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Underwriter</label>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                            {caseData.uw_name ? caseData.uw_name.charAt(0).toUpperCase() : 'U'}
                                        </div>
                                        <div className="font-bold text-slate-900 text-xs">
                                            {caseData.uw_name || 'System'}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">AI Risk Score</label>
                                    <div className="flex items-center gap-2">
                                        <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${(caseData.derived_facts?.risk?.risk_score || 0) > 75 ? 'bg-red-500' :
                                                    (caseData.derived_facts?.risk?.risk_score || 0) > 40 ? 'bg-amber-500' : 'bg-green-500'
                                                    }`}
                                                style={{ width: `${caseData.derived_facts?.risk?.risk_score || 15}%` }}
                                            />
                                        </div>
                                        <span className={`text-xs font-black ${(caseData.derived_facts?.risk?.risk_score || 0) > 75 ? 'text-red-600' :
                                            (caseData.derived_facts?.risk?.risk_score || 0) > 40 ? 'text-amber-600' : 'text-green-600'
                                            }`}>
                                            {(caseData.derived_facts?.risk?.risk_tier || 'Low').split(' ')[0]} ({caseData.derived_facts?.risk?.risk_score || 15})
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Post-Execution Details */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
                            <CheckSquare className="w-4 h-4 text-slate-400" />
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Post-Execution Details</h3>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Power Number</label>
                                    <div className="font-bold text-slate-900 text-sm font-mono">{caseData.power_number ? `#${caseData.power_number}` : 'Pending'}</div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Court Case #</label>
                                    <div className="font-bold text-slate-900 text-sm font-mono">{caseData.court_case_number || 'Pending'}</div>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Payment Status</label>
                                <div className="flex items-center gap-2">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${caseData.paid_in_full === 'YES' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'
                                        }`}>
                                        <CheckCircle className="w-3.5 h-3.5" />
                                    </div>
                                    <div className={`font-bold text-sm ${caseData.paid_in_full === 'YES' ? 'text-slate-900' : 'text-slate-400'
                                        }`}>
                                        {caseData.paid_in_full === 'YES' ? 'Paid in Full' : 'Pending Payment'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
