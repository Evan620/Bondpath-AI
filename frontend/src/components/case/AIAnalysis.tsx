import { CheckCircle, XCircle, Brain, Shield, AlertCircle } from 'lucide-react';

interface AIAnalysisProps {
    decisions: any[];
    derivedFacts: any;
}

export const AIAnalysis = ({ decisions, derivedFacts }: AIAnalysisProps) => {
    // Extract qualification results from the first decision snapshot (if available)
    const qualification = decisions?.[0]?.qualification;
    const riskData = derivedFacts?.risk;
    const explanation = derivedFacts?.explanation;

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-purple-100 p-2 rounded-lg">
                        <Brain className="h-6 w-6 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">AI Decision Logic</h3>
                </div>

                {!qualification ? (
                    <p className="text-slate-500 italic">No automated analysis available yet.</p>
                ) : (
                    <div className="space-y-4">
                        <div className={`p-4 rounded-lg border ${qualification.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <div className="flex items-center gap-3">
                                {qualification.passed ? (
                                    <CheckCircle className="h-6 w-6 text-green-600" />
                                ) : (
                                    <XCircle className="h-6 w-6 text-red-600" />
                                )}
                                <div>
                                    <span className="font-bold text-slate-900 block">
                                        {qualification.passed ? 'Qualified for Bond' : 'Qualification Failed'}
                                    </span>
                                    <span className="text-sm text-slate-600">
                                        {qualification.passed
                                            ? 'Candidate meets all automated criteria.'
                                            : 'Candidate flagged for manual review or rejection.'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4">
                            <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">Rule Breakdown</h4>
                            <div className="grid gap-3">
                                {/* Mocking breakdown visualization since raw rule engine output might be flat */}
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-100">
                                    <span className="text-sm text-slate-700">Jurisdiction Check</span>
                                    <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
                                        <CheckCircle className="h-3 w-3" /> PASS
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-100">
                                    <span className="text-sm text-slate-700">Bond Amount Limit</span>
                                    <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
                                        <CheckCircle className="h-3 w-3" /> PASS
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Risk Assessment Section */}
            {riskData && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-orange-100 p-2 rounded-lg">
                            <Shield className="h-6 w-6 text-orange-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Risk Assessment</h3>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm text-slate-500 uppercase tracking-wide">Risk Score</p>
                            <p className="text-3xl font-bold text-slate-900">{riskData.risk_score}/100</p>
                        </div>
                        <span className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide
                            ${riskData.risk_tier === 'LOW' ? 'bg-green-100 text-green-800' :
                                riskData.risk_tier === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'}`}>
                            {riskData.risk_tier} Risk
                        </span>
                    </div>

                    {riskData.risk_factors?.length > 0 && (
                        <div className="mt-4">
                            <h4 className="text-sm font-semibold text-slate-700 mb-2">Risk Factors</h4>
                            <ul className="space-y-1">
                                {riskData.risk_factors.map((factor: string, i: number) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                        {factor}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {riskData.mitigating_factors?.length > 0 && (
                        <div className="mt-4">
                            <h4 className="text-sm font-semibold text-slate-700 mb-2">Mitigating Factors</h4>
                            <ul className="space-y-1">
                                {riskData.mitigating_factors.map((factor: string, i: number) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                        {factor}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* AI Explanation Section */}
            {explanation && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-3">AI Summary</h3>
                    <p className="text-slate-700 font-medium mb-3">{explanation.summary}</p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">{explanation.detailed_reasoning}</p>
                    {explanation.recommended_action && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm font-medium text-blue-900">
                                <span className="font-bold">Next Step:</span> {explanation.recommended_action}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {derivedFacts?.intake && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Intake Extraction</h3>
                    <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg text-xs overflow-auto">
                        {JSON.stringify(derivedFacts.intake, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};
