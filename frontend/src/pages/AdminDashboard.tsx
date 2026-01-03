import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient as api } from '../api/client';
import { useAuth } from '../store/AuthContext';
import { Clock, Shield, Search, Filter, Eye } from 'lucide-react';

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

export default function AdminDashboard() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [cases, setCases] = useState<Case[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchCases();
        // Poll for updates
        const interval = setInterval(fetchCases, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchCases = async () => {
        try {
            const response = await api.get('/cases/');
            // Admin sees ALL cases, sorted by newest first
            const allCases = response.data.sort((a: Case, b: Case) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            setCases(allCases);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch cases:', error);
            setLoading(false);
        }
    };

    const handleCaseClick = (caseId: string) => {
        navigate(`/admin/cases/${caseId}`);
    };

    const filteredCases = cases.filter(c =>
        (c.defendant_first_name + ' ' + c.defendant_last_name).toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination
    const totalPages = Math.ceil(filteredCases.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedCases = filteredCases.slice(startIndex, startIndex + itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const getStatusColor = (state: string) => {
        switch (state) {
            case 'INTAKE': return 'bg-slate-100 text-slate-700 border-slate-200';
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
            <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center gap-2">
                            <div className="bg-white/10 p-1.5 rounded-lg">
                                <Shield className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-xl text-white tracking-tight">Admin Console</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-300 hidden sm:block">
                                Full Access Mode
                            </div>
                            <button onClick={logout} className="text-sm font-bold text-slate-400 hover:text-white flex items-center gap-2 transition-colors">
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
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Overview</h1>
                        <p className="text-slate-500 font-medium mt-1">Monitoring all cases across the platform</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search any case..."
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
                        <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading System Data...</span>
                    </div>
                ) : filteredCases.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-20 text-center shadow-sm">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Clock className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">No Cases Found</h3>
                        <p className="text-slate-500 font-medium max-w-xs mx-auto">There are currently no cases in the system matching your criteria.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Case ID & Deft.</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Bond Info</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Caller</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Stage</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Created</th>
                                        <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">View</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 bg-white">
                                    {paginatedCases.map((caseItem) => (
                                        <tr key={caseItem.id} className="group hover:bg-slate-50 transition-all duration-200">
                                            <td className="px-8 py-5">
                                                <div>
                                                    <div className="text-sm font-black text-slate-900 tracking-tight">
                                                        {caseItem.defendant_first_name} {caseItem.defendant_last_name}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">#{caseItem.id.slice(0, 8)}</div>
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
                                                    className="inline-flex items-center gap-2 pl-6 pr-4 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 text-xs font-black uppercase tracking-widest rounded-xl transition-all hover:shadow-sm"
                                                >
                                                    Inspect
                                                    <Eye className="w-4 h-4" />
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
                                    &larr;
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
                                    &rarr;
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
