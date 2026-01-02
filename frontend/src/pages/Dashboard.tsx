import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../store/AuthContext';
import { useCases } from '../hooks/useCases';
import { NewCaseModal } from '../components/case/NewCaseModal';
import { Plus, FileText, UserPlus, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient as api } from '../api/client';

interface Advisor {
    id: string;
    email: string;
    active_cases: number;
}

export const Dashboard = () => {
    const { logout } = useAuth();
    const { cases, isLoading, error, createCase, refresh } = useCases();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [advisors, setAdvisors] = useState<Advisor[]>([]);
    const navigate = useNavigate();

    const fetchAdvisors = useCallback(async () => {
        try {
            const response = await api.get('/users/advisors');
            setAdvisors(response.data);
        } catch (error) {
            console.error('Failed to fetch advisors:', error);
        }
    }, []);



    const handleCreateCase = async (data: any) => {
        await createCase(data);
        setIsModalOpen(false);
    };

    const handleAssignAdvisor = async (caseId: string, advisorId: string) => {
        try {
            await api.patch(`/cases/${caseId}`, {
                assigned_to: advisorId,
                advisor_id: advisorId,
                state: 'ADVISOR_ACTIVE'
            });
            refresh();
            fetchAdvisors(); // Refresh advisor counts
        } catch (error) {
            console.error('Failed to assign advisor:', error);
            alert('Failed to assign advisor');
        }
    };

    useEffect(() => {
        fetchAdvisors();
        refresh();
    }, [refresh, fetchAdvisors]);

    // Filter cases to show pipeline (exclude archived if needed in future)
    // Safety check: ensure cases is an array before filtering
    const safeCases = Array.isArray(cases) ? cases : [];
    const activeCases = safeCases.filter(c =>
        ['INTAKE', 'QUALIFIED', 'ADVISOR_ACTIVE', 'UNDERWRITING_REVIEW', 'APPROVED', 'DECLINED'].includes(c.state)
    );

    return (
        <div className="min-h-screen bg-slate-50">
            <nav className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-600 p-1.5 rounded">
                        <FileText className="h-5 w-5 text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-800">Bondpath AI</h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-sm text-slate-500">CST Agent</div>
                    <button
                        onClick={logout}
                        className="text-sm font-medium text-slate-600 hover:text-red-600 transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto p-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Case Pipeline</h2>
                        <p className="text-sm text-slate-600 mt-1">Manage and track cases across the entire lifecycle</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                refresh();
                                fetchAdvisors();
                            }}
                            className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-300 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                            disabled={isLoading}
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                        >
                            <Plus className="h-4 w-4" />
                            New Case
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center text-slate-500">Loading cases...</div>
                    ) : error ? (
                        <div className="p-8 text-center text-red-500">{error}</div>
                    ) : activeCases.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                                <FileText className="h-8 w-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900">No active cases</h3>
                            <p className="mt-1 text-slate-500">Create a new case to get started.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Defendant</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Bond Amount</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Intent</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned To</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {activeCases.map((c) => (
                                    <tr
                                        key={c.id}
                                        onClick={() => navigate(`/cases/${c.id}`)}
                                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">
                                                {c.defendant_first_name} {c.defendant_last_name}
                                            </div>
                                            <div className="text-sm text-slate-500">{c.jail_facility}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {c.state === 'INTAKE' && (
                                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600">Processing...</span>
                                            )}
                                            {c.state === 'QUALIFIED' && (
                                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">New Lead</span>
                                            )}
                                            {c.state === 'ADVISOR_ACTIVE' && (
                                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">Advisor Working</span>
                                            )}
                                            {c.state === 'UNDERWRITING_REVIEW' && (
                                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700">In Underwriting</span>
                                            )}
                                            {c.state === 'APPROVED' && (
                                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Approved</span>
                                            )}
                                            {c.state === 'DECLINED' && (
                                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">Declined</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-900">${c.bond_amount}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${c.intent_signal === 'GET_OUT_TODAY'
                                                ? 'bg-red-100 text-red-700'
                                                : c.intent_signal === 'CHECKING_COST'
                                                    ? 'bg-yellow-100 text-yellow-700'
                                                    : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {c.intent_signal}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                <select
                                                    onChange={(e) => handleAssignAdvisor(c.id, e.target.value)}
                                                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    value={c.assigned_to || ""}
                                                >
                                                    <option value="" disabled>Select advisor...</option>
                                                    {advisors.map((advisor) => (
                                                        <option key={advisor.id} value={advisor.id}>
                                                            {advisor.email.split('@')[0]} ({advisor.active_cases} active)
                                                        </option>
                                                    ))}
                                                </select>
                                                <UserPlus className="w-4 h-4 text-slate-400" />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <NewCaseModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreateCase}
            />
        </div>
    );
};
