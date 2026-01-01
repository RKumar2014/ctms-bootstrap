import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Users, Activity, ClipboardCheck, Download, BarChart3 } from 'lucide-react';
import { reportsApi, sitesApi } from '../lib/api';

interface EnrollmentData {
    sites: Array<{
        site: string;
        site_name: string;
        enrolled: number;
        completed: number;
        terminated: number;
        total: number;
    }>;
    totals: {
        enrolled: number;
        completed: number;
        terminated: number;
        total: number;
    };
}

interface Site {
    site_id: number;
    site_number: string;
    site_name: string;
}

const ReportsPage: React.FC = () => {
    const navigate = useNavigate();
    const [selectedReport, setSelectedReport] = useState<string | null>(null);
    const [enrollmentData, setEnrollmentData] = useState<EnrollmentData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sites, setSites] = useState<Site[]>([]);
    const [selectedSite, setSelectedSite] = useState<string>('all');

    // Load sites on component mount
    useEffect(() => {
        const loadSites = async () => {
            try {
                const response = await sitesApi.list();
                setSites(response.data || []);
            } catch (err) {
                console.error('Failed to load sites:', err);
            }
        };
        loadSites();
    }, []);

    const reports = [
        {
            id: 'enrollment',
            title: 'Enrollment Report',
            description: 'Subject screening and enrollment statistics by site',
            icon: Users,
            color: 'text-teal-600',
            bgColor: 'bg-teal-50',
        },
        {
            id: 'drug-accountability',
            title: 'Drug Accountability Report',
            description: 'Complete drug dispensation and return log',
            icon: Activity,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
        },
        {
            id: 'compliance',
            title: 'Compliance Summary',
            description: 'Subject compliance rates and statistics',
            icon: ClipboardCheck,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
        },
        {
            id: 'inventory',
            title: 'Inventory Status Report',
            description: 'Current drug inventory levels by site',
            icon: BarChart3,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
        },
        {
            id: 'audit-trail',
            title: 'Audit Trail Report',
            description: 'Complete system audit log for compliance',
            icon: FileText,
            color: 'text-red-600',
            bgColor: 'bg-red-50',
        },
    ];

    const handleGenerateReport = async () => {
        if (selectedReport === 'enrollment') {
            setLoading(true);
            setError(null);
            try {
                const response = await reportsApi.siteEnrollment();
                let data: EnrollmentData = response.data;

                // Filter by selected site if not "all"
                if (selectedSite !== 'all') {
                    data = {
                        sites: data.sites.filter(site => site.site === selectedSite),
                        totals: {
                            enrolled: 0,
                            completed: 0,
                            terminated: 0,
                            total: 0
                        }
                    };
                    // Recalculate totals for filtered data
                    data.totals = {
                        enrolled: data.sites.reduce((sum, s) => sum + s.enrolled, 0),
                        completed: data.sites.reduce((sum, s) => sum + s.completed, 0),
                        terminated: data.sites.reduce((sum, s) => sum + s.terminated, 0),
                        total: data.sites.reduce((sum, s) => sum + s.total, 0)
                    };
                }

                setEnrollmentData(data);
            } catch (err: any) {
                console.error('Failed to fetch enrollment data:', err);
                setError(err.response?.data?.error || 'Failed to generate report');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleReportSelect = (reportId: string) => {
        // Redirect to Changes page for Audit Trail Report
        if (reportId === 'audit-trail') {
            navigate('/changes');
            return;
        }

        setSelectedReport(reportId);
        setEnrollmentData(null);
        setError(null);
        setSelectedSite('all');
    };

    return (
        <div className="p-6">
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
                <p className="text-gray-500 mt-1">Generate and download study reports</p>
            </div>

            {/* Report Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {reports.map((report) => {
                    const Icon = report.icon;
                    return (
                        <button
                            key={report.id}
                            onClick={() => handleReportSelect(report.id)}
                            className={`p-5 rounded-lg border-2 text-left transition-all ${selectedReport === report.id
                                ? 'border-teal-500 shadow-md'
                                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                }`}
                        >
                            <div className={`w-12 h-12 ${report.bgColor} rounded-lg flex items-center justify-center mb-3`}>
                                <Icon className={`w-6 h-6 ${report.color}`} />
                            </div>
                            <h3 className="font-semibold text-gray-800">{report.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                        </button>
                    );
                })}
            </div>

            {/* Report Preview / Actions */}
            {selectedReport && (
                <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-800">
                            {reports.find(r => r.id === selectedReport)?.title}
                        </h2>
                        <div className="flex gap-3">
                            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
                                <Download className="w-4 h-4" />
                                Export CSV
                            </button>
                            <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2">
                                <Download className="w-4 h-4" />
                                Export PDF
                            </button>
                        </div>
                    </div>

                    {/* Report Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
                            <select
                                value={selectedSite}
                                onChange={(e) => setSelectedSite(e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                            >
                                <option value="all">All Sites</option>
                                {sites.map(site => (
                                    <option key={site.site_id} value={site.site_number}>
                                        {site.site_number} - {site.site_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={handleGenerateReport}
                                disabled={loading}
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
                            >
                                {loading ? 'Generating...' : 'Generate Report'}
                            </button>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-800 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Loading State */}
                    {loading && (
                        <div className="text-center py-8">
                            <p className="text-gray-500">Loading report data...</p>
                        </div>
                    )}

                    {/* Enrollment Report Data */}
                    {selectedReport === 'enrollment' && enrollmentData && !loading && (
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Site</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Enrolled</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Completed</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {enrollmentData.sites.map((site) => (
                                        <tr key={site.site} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm">{site.site}</td>
                                            <td className="px-4 py-3 text-sm">{site.enrolled}</td>
                                            <td className="px-4 py-3 text-sm">{site.completed}</td>
                                            <td className="px-4 py-3 text-sm font-medium">{site.total}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-100">
                                    <tr>
                                        <td className="px-4 py-3 text-sm font-semibold">Total</td>
                                        <td className="px-4 py-3 text-sm font-semibold">{enrollmentData.totals.enrolled}</td>
                                        <td className="px-4 py-3 text-sm font-semibold">{enrollmentData.totals.completed}</td>
                                        <td className="px-4 py-3 text-sm font-semibold">{enrollmentData.totals.total}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}

                    {/* No Data State */}
                    {selectedReport === 'enrollment' && !enrollmentData && !loading && !error && (
                        <div className="text-center py-8 text-gray-500">
                            <p>Click "Generate Report" to view enrollment data</p>
                        </div>
                    )}

                    {/* Other Reports - Placeholder */}
                    {selectedReport !== 'enrollment' && (
                        <div className="text-center py-8 text-gray-500">
                            <p>This report is not yet implemented. Only Enrollment Report is currently available.</p>
                        </div>
                    )}
                </div>
            )}

            {/* No Report Selected State */}
            {!selectedReport && (
                <div className="bg-white shadow rounded-lg p-6">
                    <div className="text-center py-8 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Select a report type above to generate</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportsPage;
