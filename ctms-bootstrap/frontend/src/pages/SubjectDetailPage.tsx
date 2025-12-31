import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { subjectsApi, accountabilityApi } from '../lib/api';

const SubjectDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: subject, isLoading } = useQuery({
        queryKey: ['subject', id],
        queryFn: async () => {
            const response = await subjectsApi.get(id!);
            return response.data;
        },
    });

    // Fetch accountability records for this subject to show drugs assigned
    const { data: accountabilityRecords = [] } = useQuery({
        queryKey: ['subject-accountability', id],
        queryFn: async () => {
            const response = await accountabilityApi.list({ subject_id: id });
            return response.data;
        },
        enabled: !!id,
    });

    // Helper function to get drugs assigned for a specific subject_visit_id
    const getDrugsForVisit = (subjectVisitId: number): string => {
        const drugsForVisit = accountabilityRecords
            .filter((acc: any) => acc.visit_id === subjectVisitId)
            .map((acc: any) => acc.drug_unit?.drug_unit_id || acc.drug_unit_id);

        return drugsForVisit.length > 0 ? drugsForVisit.join(', ') : '-';
    };

    if (isLoading) {
        return <div className="p-8">Loading...</div>;
    }

    if (!subject) {
        return <div className="p-8">Subject not found</div>;
    }

    return (
        <div className="p-6">
            {/* Page Header */}
            <div className="mb-6 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">
                    {subject.subject_number} | {subject.status === 'Early Terminated' || subject.status === 'Terminated' ? (
                        <span className="text-red-600">Early Terminated</span>
                    ) : subject.status}
                </h1>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate(`/drug/subject-accountability?site=${subject.site_id}&subject=${id}`)}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        📋 Subject Accountability Log
                    </button>
                    <button
                        onClick={() => navigate('/subjects')}
                        className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md"
                    >
                        ← Back to List
                    </button>
                </div>
            </div>

            {/* Content */}
            <div>
                <div className="bg-white shadow rounded-lg p-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Subject Number</label>
                            <p className="mt-1 text-lg font-semibold">{subject.subject_number}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Status</label>
                            <p className="mt-1">
                                <span className={`px-2 py-1 rounded text-sm font-medium ${subject.status === 'Active' ? 'bg-green-100 text-green-800' :
                                    subject.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                                        'bg-red-100 text-red-800'
                                    }`}>
                                    {subject.status}
                                </span>
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Sex</label>
                            <p className="mt-1 text-lg">{subject.sex}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Date of Birth</label>
                            <p className="mt-1 text-lg">{new Date(subject.dob).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Consent Date</label>
                            <p className="mt-1 text-lg">{new Date(subject.consent_date).toLocaleString()}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Enrollment Date</label>
                            <p className="mt-1 text-lg">{new Date(subject.enrollment_date).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 bg-white shadow rounded-lg p-6">
                    <h2 className="text-lg font-semibold mb-4">Visit Schedule</h2>
                    {subject.subject_visits && subject.subject_visits.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Visit Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Expected Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actual Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Drugs Assigned
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {[...subject.subject_visits]
                                        .sort((a: any, b: any) => {
                                            // Early Termination always goes last
                                            const aIsTermination = a.visits?.visit_name?.toLowerCase().includes('termination');
                                            const bIsTermination = b.visits?.visit_name?.toLowerCase().includes('termination');
                                            if (aIsTermination && !bIsTermination) return 1;
                                            if (!aIsTermination && bIsTermination) return -1;
                                            // Otherwise sort by visit_sequence
                                            return (a.visits?.visit_sequence || 0) - (b.visits?.visit_sequence || 0);
                                        })
                                        .map((visit: any) => (
                                            <tr key={visit.subject_visit_id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {visit.visits?.visit_name || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {visit.expected_date
                                                        ? new Date(visit.expected_date).toLocaleDateString()
                                                        : <span className="text-gray-400">-</span>
                                                    }
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {visit.actual_date
                                                        ? new Date(visit.actual_date).toLocaleDateString()
                                                        : <span className="text-gray-400">-</span>
                                                    }
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {getDrugsForVisit(visit.subject_visit_id) !== '-' ? (
                                                        <span className="text-blue-600 font-medium">
                                                            {getDrugsForVisit(visit.subject_visit_id)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {visit.visits?.visit_name?.toLowerCase().includes('termination') ||
                                                        visit.visits?.visit_name?.toLowerCase().includes('early termination') ? (
                                                        <span className="text-gray-400 text-xs">-</span>
                                                    ) : (
                                                        <button
                                                            onClick={() => navigate(`/drug/dispense?subject=${id}&visit=${visit.subject_visit_id}`)}
                                                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                                        >
                                                            Dispense Drug
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-500">No visits scheduled</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SubjectDetailPage;
