import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Users, Activity, ClipboardCheck, Download, BarChart3 } from 'lucide-react';

const ReportsPage: React.FC = () => {
    const navigate = useNavigate();
    const [selectedReport, setSelectedReport] = useState<string | null>(null);

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
                            onClick={() => setSelectedReport(report.id)}
                            className={`p-5 rounded-lg border-2 text-left transition-all ${
                                selectedReport === report.id
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
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
                            <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                                <option>All Sites</option>
                                <option>1384</option>
                                <option>1385</option>
                                <option>1386</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
                            <input type="date" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
                            <input type="date" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                        </div>
                        <div className="flex items-end">
                            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm">
                                Generate Report
                            </button>
                        </div>
                    </div>

                    {/* Sample Report Preview */}
                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Site</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                        {selectedReport === 'enrollment' ? 'Enrolled' : 
                                         selectedReport === 'drug-accountability' ? 'Dispensed' :
                                         selectedReport === 'compliance' ? 'Avg Compliance' :
                                         selectedReport === 'inventory' ? 'Available' : 'Records'}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                        {selectedReport === 'enrollment' ? 'Completed' : 
                                         selectedReport === 'drug-accountability' ? 'Returned' :
                                         selectedReport === 'compliance' ? 'On Target' :
                                         selectedReport === 'inventory' ? 'Dispensed' : 'Changes'}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                <tr className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm">1384</td>
                                    <td className="px-4 py-3 text-sm">3</td>
                                    <td className="px-4 py-3 text-sm">1</td>
                                    <td className="px-4 py-3 text-sm font-medium">4</td>
                                </tr>
                                <tr className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm">1385</td>
                                    <td className="px-4 py-3 text-sm">2</td>
                                    <td className="px-4 py-3 text-sm">0</td>
                                    <td className="px-4 py-3 text-sm font-medium">2</td>
                                </tr>
                                <tr className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm">1386</td>
                                    <td className="px-4 py-3 text-sm">0</td>
                                    <td className="px-4 py-3 text-sm">0</td>
                                    <td className="px-4 py-3 text-sm font-medium">0</td>
                                </tr>
                            </tbody>
                            <tfoot className="bg-gray-100">
                                <tr>
                                    <td className="px-4 py-3 text-sm font-semibold">Total</td>
                                    <td className="px-4 py-3 text-sm font-semibold">5</td>
                                    <td className="px-4 py-3 text-sm font-semibold">1</td>
                                    <td className="px-4 py-3 text-sm font-semibold">6</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
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
