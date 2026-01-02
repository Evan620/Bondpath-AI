import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient as api } from '../api/client';
import { useAuth } from '../store/AuthContext';
import { Scale, FileCheck } from 'lucide-react';

interface Case {
    id: string;
    state: string;
    defendant_first_name: string;
    defendant_last_name: string;
    bond_amount: number;
    created_at: string;
    indemnitor_first_name?: string;
    indemnitor_last_name?: string;
    premium_type?: string;
}

export default function UnderwriterDashboard() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [cases, setCases] = useState<Case[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCases();

        // Poll for updates every 5 seconds
        const interval = setInterval(() => {
            fetchCases();
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const fetchCases = async () => {
        try {
            const response = await api.get('/cases/');
            // Filter for cases in UNDERWRITING_REVIEW state
            const uwCases = response.data.filter((c: Case) =>
                c.state === 'UNDERWRITING_REVIEW'
            );
            setCases(uwCases);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch cases:', error);
            setLoading(false);
        }
    };

    const handleCaseClick = (caseId: string) => {
        navigate(`/underwriter/cases/${caseId}`);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Underwriter Dashboard</h1>
                        <p className="text-sm text-slate-600 font-medium">Cases awaiting underwriting decision</p>
                    </div>
                    <button
                        onClick={logout}
                        className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                        <p className="mt-4 text-slate-600 font-medium">Loading cases...</p>
                    </div>
                ) : cases.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                        <Scale className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                        <h3 className="text-lg font-bold text-slate-900 mb-2">No Cases Pending Review</h3>
                        <p className="text-slate-600 font-medium">All cases have been reviewed or are in other stages.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                                        Defendant
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                                        Indemnitor
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                                        Bond Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                                        Premium Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                                        Submitted
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {cases.map((caseItem) => (
                                    <tr key={caseItem.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <FileCheck className="w-5 h-5 text-slate-400 mr-2" />
                                                <div className="text-sm font-bold text-slate-900">
                                                    {caseItem.defendant_first_name} {caseItem.defendant_last_name}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-slate-700">
                                                {caseItem.indemnitor_first_name} {caseItem.indemnitor_last_name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-slate-900">${caseItem.bond_amount?.toLocaleString()}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                                {caseItem.premium_type || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                                            {new Date(caseItem.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                                            <button
                                                onClick={() => handleCaseClick(caseItem.id)}
                                                className="text-blue-600 hover:text-blue-700 transition-colors"
                                            >
                                                Review →
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
