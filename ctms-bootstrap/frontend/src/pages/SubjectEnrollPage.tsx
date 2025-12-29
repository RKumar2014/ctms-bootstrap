import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { subjectsApi } from '../lib/api';

const SubjectEnrollPage: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        subjectNumber: '',
        dob: '',
        sex: 'Male' as 'Male' | 'Female' | 'Other',
        consentDate: '',
        siteId: 1,
    });

    const enrollMutation = useMutation({
        mutationFn: (data: typeof formData) => subjectsApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subjects'] });
            navigate('/subjects');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        enrollMutation.mutate(formData);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <h1 className="text-2xl font-bold text-gray-900">Enroll New Subject</h1>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white shadow rounded-lg p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Subject Number *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.subjectNumber}
                                onChange={(e) => setFormData({ ...formData, subjectNumber: e.target.value })}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., 1384-003"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Date of Birth *
                            </label>
                            <input
                                type="date"
                                required
                                value={formData.dob}
                                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Sex *
                            </label>
                            <select
                                required
                                value={formData.sex}
                                onChange={(e) => setFormData({ ...formData, sex: e.target.value as any })}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Consent Date *
                            </label>
                            <input
                                type="date"
                                required
                                value={formData.consentDate}
                                onChange={(e) => setFormData({ ...formData, consentDate: e.target.value })}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Site ID *
                            </label>
                            <input
                                type="number"
                                required
                                value={formData.siteId}
                                onChange={(e) => setFormData({ ...formData, siteId: parseInt(e.target.value) })}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {enrollMutation.isError && (
                            <div className="bg-red-50 text-red-600 p-3 rounded">
                                Failed to enroll subject. Please try again.
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button
                                type="submit"
                                disabled={enrollMutation.isPending}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                {enrollMutation.isPending ? 'Enrolling...' : 'Enroll Subject'}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/subjects')}
                                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SubjectEnrollPage;
