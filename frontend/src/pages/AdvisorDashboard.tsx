import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient as api } from '../api/client';
import { useAuth } from '../store/AuthContext';
import { Clock, User } from 'lucide-react';

interface Case {
    id: string;
    state: string;
    defendant_first_name: string;
    defendant_last_name: string;
    bond_amount: number;
    created_at: string;
    caller_name: string;
    assigned_to: string; // Added assigned_to field
    advisor_id?: string;
}

export default function AdvisorDashboard() {
    const navigate = useNavigate();
    const { logout, userId } = useAuth();
    const [cases, setCases] = useState<Case[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCases();

        // Poll for updates every 5 seconds
        const interval = setInterval(() => {
            fetchCases();
        }, 5000);

        return () => clearInterval(interval);
    }, [userId]);

    const fetchCases = async () => {
        try {
            const response = await api.get('/cases/');
            // Filter for cases assigned to this advisor (either current or historical owner)
            const myCases = response.data.filter((c: Case) =>
                (c.assigned_to === userId || c.advisor_id === userId) &&
                ['ADVISOR_ACTIVE', 'UNDERWRITING_REVIEW', 'APPROVED', 'DECLINED'].includes(c.state)
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

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Advisor Dashboard</h1>
                        <p className="text-sm text-gray-600">Cases awaiting advisor review</p>
                    </div>
                    <button
                        onClick={logout}
                        className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="text-center py-12">Loading cases...</div>
                ) : cases.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <Clock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Cases Pending</h3>
                        <p className="text-gray-600">All cases have been reviewed or are in other stages.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Defendant
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Bond Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Caller
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {cases.map((caseItem) => (
                                    <tr key={caseItem.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <User className="w-5 h-5 text-gray-400 mr-2" />
                                                <div className="text-sm font-medium text-gray-900">
                                                    {caseItem.defendant_first_name} {caseItem.defendant_last_name}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">${caseItem.bond_amount}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{caseItem.caller_name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${caseItem.state === 'QUALIFIED'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {caseItem.state}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(caseItem.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => handleCaseClick(caseItem.id)}
                                                className="text-blue-600 hover:text-blue-900"
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
