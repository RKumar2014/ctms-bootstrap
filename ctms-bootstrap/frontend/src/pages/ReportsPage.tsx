import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const ReportsPage: React.FC = () => {
    const { logout } = useAuth();

    const { data: subjectSummary = [] } = useQuery({
        queryKey: ['reports', 'subject-summary'],
        queryFn: async () => {
            const response = await reportsApi.subjectSummary();
            return response.data;
        },
    });

    const { data: siteEnrollment = [] } = useQuery({
        queryKey: ['reports', 'site-enrollment'],
        queryFn: async () => {
            const response = await reportsApi.siteEnrollment();
            return response.data;
        },
    });

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
                    <button onClick={logout} className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900">
                        Logout
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Subject Summary Report */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-lg font-semibold mb-4">Subject Summary</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Subject ID</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Site</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Enrollment Date</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {subjectSummary.map((subject: any) => (
                                    <tr key={subject.subject_id}>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">{subject.subject_number}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">{subject.sites?.site_number}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">{subject.status}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                                            {new Date(subject.enrollment_date).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Site Enrollment Report */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-lg font-semibold mb-4">Site Enrollment Summary</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {siteEnrollment.map((site: any) => (
                            <div key={site.site_id} className="border rounded-lg p-4">
                                <h3 className="font-medium text-gray-900">{site.site_name}</h3>
                                <p className="text-sm text-gray-500">Site {site.site_number}</p>
                                <p className="mt-2 text-2xl font-bold text-blue-600">{site.subject_count || 0}</p>
                                <p className="text-xs text-gray-500">Subjects Enrolled</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;
