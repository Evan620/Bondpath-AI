import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../store/AuthContext';
import { useCases } from '../hooks/useCases';
import { NewCaseModal } from '../components/case/NewCaseModal';
import { Plus, FileText, UserPlus, RefreshCw, Search, LogOut, LayoutDashboard, User } from 'lucide-react';
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
    const [searchTerm, setSearchTerm] = useState('');
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

    const safeCases = Array.isArray(cases) ? cases : [];
    const activeCases = safeCases.filter(c =>
        ['INTAKE', 'QUALIFIED', 'ADVISOR_ACTIVE', 'UNDERWRITING_REVIEW', 'APPROVED', 'DECLINED'].includes(c.state)
    ).sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

    const filteredCases = activeCases.filter(c =>
        (c.defendant_first_name + ' ' + c.defendant_last_name).toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
            {/* Top Navigation Bar - Premium Style */}
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 transition-all shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-600 p-1.5 rounded-lg shadow-sm">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                                </svg>
                            </div>
                            <span className="font-bold text-xl text-slate-900 tracking-tight">Bondpath AI</span>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="px-3 py-1 bg-blue-50 rounded-full text-[10px] font-black uppercase tracking-widest text-blue-600 hidden sm:block">
                                CST Control Center
                            </div>
                            <button onClick={logout} className="text-sm font-bold text-slate-500 hover:text-red-600 flex items-center gap-2 transition-colors">
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <LayoutDashboard className="w-4 h-4 text-blue-600" />
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Intake Flow</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Case Pipeline</h1>
                        <p className="text-slate-500 font-medium mt-1">Directing fresh leads to the right advisors</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="relative group w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search defendants..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-50/50 focus:border-blue-400 transition-all text-sm font-medium"
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                                onClick={refresh}
                                className="flex-1 sm:flex-none p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all disabled:opacity-50"
                                disabled={isLoading}
                                title="Refresh"
                            >
                                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-100 active:transform active:scale-95 font-bold text-sm"
                            >
                                <Plus className="w-4 h-4" />
                                New Case
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-32 animate-pulse">
                            <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                            <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Syncing Pipeline...</span>
                        </div>
                    ) : error ? (
                        <div className="p-20 text-center">
                            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Plus className="w-8 h-8 rotate-45" />
                            </div>
                            <h3 className="text-lg font-black text-slate-900">{error}</h3>
                            <button onClick={refresh} className="mt-4 text-blue-600 font-bold text-sm hover:underline">Try Again</button>
                        </div>
                    ) : filteredCases.length === 0 ? (
                        <div className="p-32 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <FileText className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2">No Cases Found</h3>
                            <p className="text-slate-400 font-medium max-w-xs mx-auto text-sm">Create a new intake application to see it in the pipeline.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Defendant</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Bond Amount</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Intent Signal</th>
                                        <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Assign Advisor</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 bg-white">
                                    {filteredCases.map((c) => (
                                        <tr
                                            key={c.id}
                                            onClick={() => navigate(`/cases/${c.id}`)}
                                            className="group hover:bg-slate-50/80 transition-all duration-200 cursor-pointer"
                                        >
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                        <User className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-black text-slate-900 tracking-tight">
                                                            {c.defendant_first_name} {c.defendant_last_name}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{c.jail_facility}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(c.state)}`}>
                                                    {c.state.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="text-sm font-black text-slate-900">${c.bond_amount?.toLocaleString() || '0'}</div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Application Total</div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${c.intent_signal === 'GET_OUT_TODAY' ? 'text-red-600' : 'text-slate-500'}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${c.intent_signal === 'GET_OUT_TODAY' ? 'bg-red-600 animate-pulse' : 'bg-slate-300'}`}></div>
                                                    {c.intent_signal?.replace('_', ' ') || 'STANDARD'}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-3">
                                                    <select
                                                        onChange={(e) => handleAssignAdvisor(c.id, e.target.value)}
                                                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all outline-none"
                                                        value={c.assigned_to || ""}
                                                    >
                                                        <option value="" disabled>Select advisor...</option>
                                                        {advisors.map((advisor) => (
                                                            <option key={advisor.id} value={advisor.id}>
                                                                {advisor.email.split('@')[0].toUpperCase()} ({advisor.active_cases})
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                        <UserPlus className="w-4 h-4" />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            <NewCaseModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreateCase}
            />
        </div>
    );
};
