import { CheckCircle, XCircle, Brain, Shield, TrendingUp, Zap, Clock } from 'lucide-react';

interface AIAnalysisProps {
    decisions: any[];
    derivedFacts: any;
}

export const AIAnalysis = ({ decisions, derivedFacts }: AIAnalysisProps) => {
    const qualification = decisions?.[0]?.qualification;
    const riskData = derivedFacts?.risk;
    const explanation = derivedFacts?.explanation;

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Qualification Logic Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Brain className="h-24 w-24 text-blue-600" />
                </div>

                <div className="flex items-center gap-4 mb-8">
                    <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-100 flex items-center justify-center">
                        <Zap className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">System Decision</h2>
                    </div>
                </div>

                {!qualification ? (
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center">
                        <Clock className="w-8 h-8 text-slate-300 mb-3" />
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">System analysis in progress...</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className={`p-5 rounded-2xl border-2 shadow-sm ${qualification.passed ? 'bg-green-50/50 border-green-100 text-green-700' : 'bg-red-50/50 border-red-100 text-red-700'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner ${qualification.passed ? 'bg-white text-green-600' : 'bg-white text-red-600'}`}>
                                    {qualification.passed ? <CheckCircle className="h-6 w-6 stroke-[2.5]" /> : <XCircle className="h-6 w-6 stroke-[2.5]" />}
                                </div>
                                <div>
                                    <span className="font-black text-xs uppercase tracking-widest block leading-tight">
                                        {qualification.passed ? 'Qualified' : 'Flagged'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <Shield className="w-3.5 h-3.5" />
                                Rules
                            </h4>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100 group/row hover:bg-white hover:shadow-sm transition-all">
                                    <span className="text-xs font-bold text-slate-600 tracking-tight">Jurisdiction Check</span>
                                    <span className="flex items-center gap-1.5 text-[9px] font-black text-green-600 bg-white px-2 py-1 rounded border border-green-50 shadow-sm uppercase tracking-tighter">
                                        <CheckCircle className="h-3 w-3" /> PASS
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100 group/row hover:bg-white hover:shadow-sm transition-all">
                                    <span className="text-xs font-bold text-slate-600 tracking-tight">Bond Threshold</span>
                                    <span className="flex items-center gap-1.5 text-[9px] font-black text-green-600 bg-white px-2 py-1 rounded border border-green-50 shadow-sm uppercase tracking-tighter">
                                        <CheckCircle className="h-3 w-3" /> PASS
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Risk Assessment Card */}
            {riskData && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 group">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="bg-slate-900 p-2.5 rounded-xl shadow-lg flex items-center justify-center">
                                <Shield className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">Risk Profile</h2>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border-2 shadow-sm
                                ${riskData.risk_tier === 'LOW' ? 'bg-green-50 text-green-700 border-green-100' :
                                    riskData.risk_tier === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                        'bg-red-50 text-red-700 border-red-100'}`}>
                                {riskData.risk_tier}
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-8 relative overflow-hidden">
                        <div className="flex items-baseline justify-between relative z-10">
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Stability Score</h4>
                                <p className="text-4xl font-black text-slate-900 tracking-tighter">{riskData.risk_score}<span className="text-lg text-slate-300 font-bold">/100</span></p>
                            </div>
                        </div>
                        <div className="mt-4 h-2 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                            <div
                                className={`h-full transition-all duration-1000 shadow-lg ${riskData.risk_tier === 'LOW' ? 'bg-green-500' : riskData.risk_tier === 'MEDIUM' ? 'bg-amber-500' : 'bg-red-500'}`}
                                style={{ width: `${riskData.risk_score}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {riskData.risk_factors?.length > 0 && (
                            <div className="p-4 bg-red-50/30 rounded-xl border border-red-50">
                                <h4 className="text-[10px] font-black text-red-700 uppercase tracking-widest mb-3 flex items-center gap-2">Factors</h4>
                                <ul className="space-y-2">
                                    {riskData.risk_factors.map((factor: string, i: number) => (
                                        <li key={i} className="flex items-start gap-2.5 text-xs font-bold text-red-900/70 leading-relaxed">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1 flex-shrink-0 animate-pulse"></div>
                                            {factor}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {riskData.mitigating_factors?.length > 0 && (
                            <div className="p-4 bg-green-50/30 rounded-xl border border-green-50">
                                <h4 className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-3 flex items-center gap-2">Stability</h4>
                                <ul className="space-y-2">
                                    {riskData.mitigating_factors.map((factor: string, i: number) => (
                                        <li key={i} className="flex items-start gap-2.5 text-xs font-bold text-green-900/70 leading-relaxed">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1 flex-shrink-0"></div>
                                            {factor}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* AI Explanation Card */}
            {explanation && (
                <div className="bg-slate-900 rounded-3xl p-8 shadow-2xl text-white relative overflow-hidden group">
                    <div className="absolute -right-10 -top-10 opacity-10 group-hover:opacity-20 transition-all duration-700">
                        <Brain className="w-48 h-48 rotate-12" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <TrendingUp className="w-5 h-5 text-blue-400" />
                            <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">AI Summary</h3>
                        </div>

                        <p className="text-lg font-black leading-tight mb-4 tracking-tight group-hover:translate-x-1 transition-transform cursor-default">
                            {explanation.summary}
                        </p>

                        <p className="text-xs font-medium text-slate-400 leading-relaxed mb-8 opacity-90">
                            {explanation.detailed_reasoning}
                        </p>

                        {explanation.recommended_action && (
                            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:bg-white/20 transition-all">
                                <div className="w-10 h-10 bg-blue-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                    <CheckCircle className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-0.5">Recommended Action</p>
                                    <p className="text-xs font-black text-white tracking-tight">{explanation.recommended_action}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
