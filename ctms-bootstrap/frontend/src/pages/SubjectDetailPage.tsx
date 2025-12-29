import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { subjectsApi } from '../lib/api';

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

    if (isLoading) {
        return <div className="p-8">Loading...</div>;
    }

    if (!subject) {
        return <div className="p-8">Subject not found</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Subject Details</h1>
                    <button
                        onClick={() => navigate('/subjects')}
                        className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
                    >
                        ← Back to List
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                            <p className="mt-1 text-lg">{new Date(subject.dob).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Consent Date</label>
                            <p className="mt-1 text-lg">{new Date(subject.consent_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Enrollment Date</label>
                            <p className="mt-1 text-lg">{new Date(subject.enrollment_date).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 bg-white shadow rounded-lg p-6">
                    <h2 className="text-lg font-semibold mb-4">Visit Schedule</h2>
                    <p className="text-gray-500">Visit tracking coming soon...</p>
                </div>
            </div>
        </div>
    );
};

export default SubjectDetailPage;
