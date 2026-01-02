import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { caseService } from '../api/case';
import type { Case } from '../types';
import { ArrowLeft, User, DollarSign, MapPin } from 'lucide-react';
import { AIAnalysis } from '../components/case/AIAnalysis';

export const CaseDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
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

    if (loading) return <div className="p-10 text-center">Loading case details...</div>;
    if (!caseData) return <div className="p-10 text-center">Case not found</div>;

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-6xl mx-auto">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center text-slate-500 hover:text-slate-800 mb-6 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Case Facts */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900 mb-1">
                                        {caseData.defendant_first_name} {caseData.defendant_last_name}
                                    </h1>
                                    <div className="flex items-center gap-2 text-sm text-slate-500 font-mono">
                                        ID: {caseData.id}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className={`px-3 py-1 rounded-full text-sm font-bold tracking-wide
                                        ${caseData.state === 'QUALIFIED' ? 'bg-green-100 text-green-800' :
                                            caseData.state === 'INTAKE' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'}`}>
                                        {caseData.state}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                        Intent: {caseData.intent_signal}
                                    </span>
                                </div>
                            </div>

                            {/* Key Metrics Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-300 transition-colors">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <DollarSign className="h-16 w-16 text-blue-600" />
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Bond</p>
                                        <div className="flex items-baseline gap-2">
                                            <h2 className="text-3xl font-bold text-slate-900">
                                                ${(Number(caseData.bond_amount) || 0).toLocaleString()}
                                            </h2>
                                            <span className="text-sm font-medium text-slate-500">USD</span>
                                        </div>
                                        <div className="mt-3 flex gap-2">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                {caseData.bond_type}
                                            </span>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border
                                                ${caseData.charge_severity === 'FELONY' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-slate-50 text-slate-700 border-slate-100'}`}>
                                                {caseData.charge_severity}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-colors">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <MapPin className="h-16 w-16 text-indigo-600" />
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Facility Location</p>
                                        <h2 className="text-xl font-bold text-slate-900 mb-1">
                                            {caseData.jail_facility}
                                        </h2>
                                        <p className="text-sm text-slate-600">
                                            {caseData.county} County, {caseData.state_jurisdiction}
                                        </p>
                                        {caseData.booking_number && (
                                            <p className="text-xs text-slate-400 mt-2 font-mono bg-slate-50 inline-block px-2 py-1 rounded">
                                                ID: {caseData.booking_number}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Intent & Flags Section */}
                            <div className="flex flex-col gap-4">
                                {caseData.intent_signal && (
                                    <div className="bg-gradient-to-r from-blue-50 to-white border border-blue-100 rounded-xl p-4 flex items-center gap-4 shadow-sm">
                                        <div className="h-12 w-12 rounded-full bg-white shadow-sm flex items-center justify-center text-2xl border border-blue-50">
                                            {caseData.intent_signal === 'GET_OUT_TODAY' ? '🚨' :
                                                caseData.intent_signal === 'CHECKING_COST' ? '💰' :
                                                    caseData.intent_signal === 'GATHERING_INFO' ? '📝' : '🤷'}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-0.5">Caller Intent</p>
                                            <p className="text-slate-900 font-medium">
                                                {caseData.intent_signal === 'GET_OUT_TODAY' ? 'Trying to get them out today' :
                                                    caseData.intent_signal === 'CHECKING_COST' ? 'Just checking cost' :
                                                        caseData.intent_signal === 'GATHERING_INFO' ? 'Gathering information' : 'Not sure yet'}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {caseData.fast_flags && caseData.fast_flags.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {caseData.fast_flags.map((flag, i) => (
                                            <span key={i} className="px-3 py-1.5 bg-amber-50 text-amber-900 text-xs font-semibold rounded-lg border border-amber-100 shadow-sm flex items-center">
                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-2"></span>
                                                {flag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Smart Tables for Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                                {/* Caller Table */}
                                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                                    <div className="bg-slate-50/50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                                        <User className="h-4 w-4 text-slate-500" />
                                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Caller Profile</h3>
                                    </div>
                                    <div className="divide-y divide-slate-100">
                                        <div className="px-4 py-3 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                                            <span className="text-xs font-medium text-slate-500 uppercase">Name</span>
                                            <span className="text-sm font-semibold text-slate-900">{caseData.caller_name}</span>
                                        </div>
                                        <div className="px-4 py-3 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                                            <span className="text-xs font-medium text-slate-500 uppercase">Relationship</span>
                                            <span className="text-sm text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">{caseData.caller_relationship}</span>
                                        </div>
                                        <div className="px-4 py-3 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                                            <span className="text-xs font-medium text-slate-500 uppercase">Phone</span>
                                            <span className="text-sm text-slate-900 font-mono">{caseData.caller_phone}</span>
                                        </div>
                                        {caseData.caller_phone_secondary && (
                                            <div className="px-4 py-3 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                                                <span className="text-xs font-medium text-slate-500 uppercase">Sec. Phone</span>
                                                <span className="text-sm text-slate-700 font-mono">{caseData.caller_phone_secondary}</span>
                                            </div>
                                        )}
                                        {caseData.caller_email && (
                                            <div className="px-4 py-3 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                                                <span className="text-xs font-medium text-slate-500 uppercase">Email</span>
                                                <span className="text-sm text-slate-700 truncate max-w-[200px]" title={caseData.caller_email}>{caseData.caller_email}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Defendant Table */}
                                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                                    <div className="bg-slate-50/50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                                        <div className="h-4 w-4 rounded-full border-2 border-slate-400 flex items-center justify-center">
                                            <span className="h-2 w-2 bg-slate-400 rounded-full"></span>
                                        </div>
                                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Defendant Profile</h3>
                                    </div>
                                    <div className="divide-y divide-slate-100">
                                        <div className="px-4 py-3 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                                            <span className="text-xs font-medium text-slate-500 uppercase">Full Name</span>
                                            <span className="text-sm font-semibold text-slate-900">{caseData.defendant_first_name} {caseData.defendant_last_name}</span>
                                        </div>
                                        {caseData.defendant_dob && (
                                            <div className="px-4 py-3 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                                                <span className="text-xs font-medium text-slate-500 uppercase">DOB</span>
                                                <span className="text-sm text-slate-700 font-mono">{caseData.defendant_dob}</span>
                                            </div>
                                        )}
                                        {caseData.defendant_gender && (
                                            <div className="px-4 py-3 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                                                <span className="text-xs font-medium text-slate-500 uppercase">Gender</span>
                                                <span className="text-sm text-slate-700">{caseData.defendant_gender}</span>
                                            </div>
                                        )}
                                        {/* Placeholder for future fields */}
                                        <div className="px-4 py-3 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                                            <span className="text-xs font-medium text-slate-500 uppercase">System Status</span>
                                            <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">Active</span>
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
            </div>
        </div>
    );
};
