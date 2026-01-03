import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient as api } from '../api/client';
import { useAuth } from '../store/AuthContext';
import { Clock, User, Search, Filter, ArrowUpRight } from 'lucide-react';

interface Case {
    id: string;
    state: string;
    defendant_first_name: string;
    defendant_last_name: string;
    bond_amount: number;
    created_at: string;
    caller_name: string;
    assigned_to: string;
    advisor_id?: string;
}

export default function AdvisorDashboard() {
    const navigate = useNavigate();
    const { logout, userId } = useAuth();
    const [cases, setCases] = useState<Case[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchCases();

        // Poll for updates every 10 seconds (slightly reduced for performance)
        const interval = setInterval(() => {
            fetchCases();
        }, 10000);

        return () => clearInterval(interval);
    }, [userId]);

    const fetchCases = async () => {
        try {
            const response = await api.get('/cases/');
            // Filter for cases assigned to this advisor
            const myCases = response.data.filter((c: Case) =>
                (c.assigned_to === userId || c.advisor_id === userId) &&
                ['ADVISOR_ACTIVE', 'UNDERWRITING_REVIEW', 'APPROVED', 'DECLINED'].includes(c.state)
            ).sort((a: Case, b: Case) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            setCases(myCases);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch cases:', error);
            setLoading(false);
        }
    };

    const handleCaseClick = (caseId: string) => {
        navigate(`/advisor/cases/${caseId}`);
    };

    const filteredCases = cases.filter(c =>
        (c.defendant_first_name + ' ' + c.defendant_last_name).toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination Logic
    const totalPages = Math.ceil(filteredCases.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedCases = filteredCases.slice(startIndex, startIndex + itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const getStatusColor = (state: string) => {
        switch (state) {
            case 'ADVISOR_ACTIVE': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'APPROVED': return 'bg-green-50 text-green-700 border-green-100';
            case 'UNDERWRITING_REVIEW': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'DECLINED': return 'bg-red-50 text-red-700 border-red-100';
            default: return 'bg-slate-50 text-slate-700 border-slate-100';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Top Navigation Bar */}
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center gap-2">
                            <div className="bg-slate-900 p-1.5 rounded-lg">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                            </div>
                            <span className="font-bold text-xl text-slate-900 tracking-tight">Advisor Dashboard</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500 hidden sm:block">
                                Active Session
                            </div>
                            <button onClick={logout} className="text-sm font-bold text-slate-500 hover:text-slate-900 flex items-center gap-2 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
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
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Your Assigned Cases</h1>
                        <p className="text-slate-500 font-medium mt-1">Reviewing active bail bond applications</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search defendants..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-slate-50 focus:border-slate-400 transition-all text-sm font-medium w-full md:w-64"
                            />
                        </div>
                        <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all">
                            <Filter className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 animate-pulse">
                        <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mb-4"></div>
                        <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">Fetching Cases...</span>
                    </div>
                ) : filteredCases.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-20 text-center shadow-sm">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Clock className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">Queue is Empty</h3>
                        <p className="text-slate-500 font-medium max-w-xs mx-auto">No bail bond cases are currently assigned to you for review.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Defendant</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Bond Info</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Caller</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Created</th>
                                        <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 bg-white">
                                    {paginatedCases.map((caseItem) => (
                                        <tr key={caseItem.id} className="group hover:bg-slate-50 transition-all duration-200">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-slate-900 transition-colors border border-transparent group-hover:border-slate-100">
                                                        <User className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-black text-slate-900 tracking-tight">
                                                            {caseItem.defendant_first_name} {caseItem.defendant_last_name}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">ID: #{caseItem.id.slice(0, 8)}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="text-sm font-black text-slate-900">${caseItem.bond_amount.toLocaleString()}</div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Total Bond</div>
                                            </td>
                                            <td className="px-8 py-5 text-sm font-medium text-slate-600">
                                                {caseItem.caller_name}
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(caseItem.state)}`}>
                                                    {caseItem.state.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="text-sm font-black text-slate-900">{new Date(caseItem.created_at).toLocaleDateString()}</div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{new Date(caseItem.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <button
                                                    onClick={() => handleCaseClick(caseItem.id)}
                                                    className="inline-flex items-center gap-2 pl-6 pr-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-slate-200 hover:shadow-slate-300 group-hover:translate-x-1"
                                                >
                                                    Review
                                                    <ArrowUpRight className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer */}
                        <div className="bg-slate-50/50 px-8 py-6 border-t border-slate-100 flex items-center justify-between">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Showing <span className="text-slate-900">{startIndex + 1}</span> to <span className="text-slate-900">{Math.min(startIndex + itemsPerPage, filteredCases.length)}</span> of <span className="text-slate-900">{filteredCases.length}</span> results
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${currentPage === page
                                            ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
                                            : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

