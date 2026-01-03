import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { caseService } from '../api/case';
import type { Case } from '../types';
import { ArrowLeft, User, DollarSign, MapPin, ShieldCheck, Clock, Flag, LayoutDashboard, Fingerprint, Phone, LogOut } from 'lucide-react';
import { AIAnalysis } from '../components/case/AIAnalysis';
import { useAuth } from '../store/AuthContext';

export const CaseDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [caseData, setCaseData] = useState<Case | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        const load = async () => {
            try {
                const data = await caseService.getCase(id);
                setCaseData(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Syncing Case File...</span>
            </div>
        );
    }
    if (!caseData) return <div className="p-10 text-center text-slate-500 font-bold">Case not found</div>;

    const getStatusStyle = (state: string) => {
        switch (state) {
            case 'INTAKE': return 'bg-slate-100 text-slate-600 border-slate-200';
            case 'QUALIFIED': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'ADVISOR_ACTIVE': return 'bg-purple-50 text-purple-700 border-purple-100';
            case 'UNDERWRITING_REVIEW': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'APPROVED': return 'bg-green-50 text-green-700 border-green-100';
            case 'DECLINED': return 'bg-red-50 text-red-700 border-red-100';
            default: return 'bg-slate-50 text-slate-700 border-slate-100';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Top Navigation Bar - Consistent with Dashboard */}
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 transition-all shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                            <div className="bg-blue-600 p-1.5 rounded-lg shadow-sm">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                                </svg>
                            </div>
                            <span className="font-bold text-xl text-slate-900 tracking-tight">Bondpath AI</span>
                        </div>
                        <div className="flex items-center gap-6">
                            <button onClick={() => navigate('/')} className="text-sm font-bold text-slate-500 hover:text-blue-600 flex items-center gap-2 transition-colors">
                                <LayoutDashboard className="w-4 h-4" />
                                Pipeline
                            </button>
                            <button onClick={logout} className="text-sm font-bold text-slate-500 hover:text-red-600 flex items-center gap-2 transition-colors border-l pl-6 border-slate-100">
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Hero Card - High Contrast Header */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col md:flex-row justify-between items-center transition-all hover:shadow-md mb-8 gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                            <User className="w-8 h-8" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                                    {caseData.defendant_first_name} {caseData.defendant_last_name}
                                </h1>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(caseData.state)}`}>
                                    {caseData.state.replace('_', ' ')}
                                </span>
                            </div>
                            <div className="flex items-center gap-6 mt-2 text-sm text-slate-500 font-medium">
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4 text-slate-400" />
                                    <span>Created: {new Date(caseData.created_at || Date.now()).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-blue-600">
                                    <Flag className="w-4 h-4" />
                                    <span className="font-black">CASE ID: #{caseData.id.slice(0, 8).toUpperCase()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="text-center md:text-right bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100 shadow-inner">
                        <div className="text-4xl font-black text-slate-900 tracking-tighter">
                            ${(Number(caseData.bond_amount) || 0).toLocaleString()}.00
                        </div>
                        <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] mt-1.5">Bond Exposure Amount</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Case Facts */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Bond Details Card */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-100 transition-all">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                        <DollarSign className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bond Information</h3>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <span className="text-[11px] font-black text-slate-400 uppercase">Bond Type</span>
                                        <span className="text-xs font-black text-slate-900">{caseData.bond_type || 'STANDARD SURETY'}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <span className="text-[11px] font-black text-slate-400 uppercase">Charge Grade</span>
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${caseData.charge_severity === 'FELONY' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                                            {caseData.charge_severity || 'MISDEMEANOR'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Detention Facilty Card */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-100 transition-all">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                        <MapPin className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detention Facility</h3>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-sm font-black text-slate-900">{caseData.jail_facility}</div>
                                    <div className="text-xs font-bold text-slate-400">{caseData.county} County, {caseData.state_jurisdiction}</div>
                                    {caseData.booking_number && (
                                        <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                                            <span className="text-[10px] font-black text-slate-400 uppercase">Booking #</span>
                                            <span className="text-xs font-black text-blue-600 font-mono tracking-tighter">{caseData.booking_number}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Intent & Context - Extra context for CST */}
                        {caseData.intent_signal && (
                            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex items-center gap-6">
                                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-3xl shadow-inner border border-blue-100">
                                    {caseData.intent_signal === 'GET_OUT_TODAY' ? '🚨' :
                                        caseData.intent_signal === 'CHECKING_COST' ? '💰' :
                                            caseData.intent_signal === 'GATHERING_INFO' ? '📝' : '🤷'}
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                        <ShieldCheck className="w-3.5 h-3.5" />
                                        Primary Lead Signal
                                    </h4>
                                    <p className="text-lg font-black text-slate-900 leading-tight">
                                        {caseData.intent_signal === 'GET_OUT_TODAY' ? 'Urgent: Trying to facilitate release today' :
                                            caseData.intent_signal === 'CHECKING_COST' ? 'Standard: Checking competitive rates' :
                                                caseData.intent_signal === 'GATHERING_INFO' ? 'Inquiry: Gathering information for 3rd party' : 'General Inquiry'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Flags Section */}
                        {caseData.fast_flags && caseData.fast_flags.length > 0 && (
                            <div className="bg-amber-50 rounded-2xl border border-amber-100 p-6 flex items-center gap-4">
                                <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-amber-100 flex items-center justify-center text-amber-500">
                                    <Flag className="w-5 h-5" />
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {caseData.fast_flags.map((flag, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-white text-amber-900 text-[10px] font-black uppercase tracking-widest rounded-lg border border-amber-100 shadow-sm">
                                            {flag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Detailed Profiles */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Caller Details Table */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group hover:border-blue-100 transition-all">
                                <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-3.5 h-3.5 text-blue-600" />
                                        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Caller Profile</h3>
                                    </div>
                                    <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded tracking-tighter">PRIMARY CONTACT</span>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</span>
                                        <span className="text-sm font-black text-slate-900 tracking-tight">{caseData.caller_name}</span>
                                    </div>
                                    <div className="flex justify-between items-center group/row">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone</span>
                                        <span className="text-xs font-black text-blue-600 font-mono">{caseData.caller_phone}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Relationship</span>
                                        <span className="text-[10px] font-black text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md tracking-widest">{caseData.caller_relationship.toUpperCase()}</span>
                                    </div>
                                    {caseData.caller_email && (
                                        <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</span>
                                            <span className="text-xs font-bold text-slate-500 truncate max-w-[150px]">{caseData.caller_email}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Defendant Details Table */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group hover:border-blue-100 transition-all">
                                <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Fingerprint className="w-3.5 h-3.5 text-blue-600" />
                                        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Defendant Profile</h3>
                                    </div>
                                    <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded tracking-tighter">BOND SUBJECT</span>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</span>
                                        <span className="text-sm font-black text-slate-900 tracking-tight">{caseData.defendant_first_name} {caseData.defendant_last_name}</span>
                                    </div>
                                    {caseData.defendant_dob && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date of Birth</span>
                                            <span className="text-xs font-black text-slate-900 font-mono tracking-tighter">{caseData.defendant_dob}</span>
                                        </div>
                                    )}
                                    {caseData.defendant_gender && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gender</span>
                                            <span className="text-xs font-black text-slate-900">{caseData.defendant_gender.toUpperCase()}</span>
                                        </div>
                                    )}
                                    <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Record</span>
                                        <div className="flex items-center gap-1.5 text-green-600 font-black text-[9px] tracking-widest">
                                            <div className="w-1 h-1 rounded-full bg-green-600"></div>
                                            ACTIVE INTAKE
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: AI Analysis */}
                    <div className="lg:col-span-1">
                        <AIAnalysis
                            decisions={caseData.decisions}
                            derivedFacts={caseData.derived_facts}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
};
