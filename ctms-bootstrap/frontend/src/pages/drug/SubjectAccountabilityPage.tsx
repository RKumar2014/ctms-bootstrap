import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sitesApi, subjectsApi, accountabilityApi, api } from '../../lib/api';

const SubjectAccountabilityPage: React.FC = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const queryClient = useQueryClient();
    const [selectedSite, setSelectedSite] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedVisit, setSelectedVisit] = useState('all');
    const [selectedRecords, setSelectedRecords] = useState<Set<number>>(new Set());
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // Fetch sites
    const { data: sitesResponse } = useQuery({
        queryKey: ['sites'],
        queryFn: async () => {
            const response = await sitesApi.list();
            return response.data;
        },
    });
    const sites = sitesResponse || [];

    // Fetch subjects for selected site
    const { data: subjectsResponse } = useQuery({
        queryKey: ['subjects', selectedSite],
        queryFn: async () => {
            if (!selectedSite) return [];
            const response = await subjectsApi.list({ site: selectedSite });
            return response.data;
        },
        enabled: !!selectedSite,
    });
    const subjects = subjectsResponse || [];

    // Fetch subject visits for selected subject
    const { data: subjectVisitsResponse } = useQuery({
        queryKey: ['subject-visits', selectedSubject],
        queryFn: async () => {
            if (!selectedSubject) return [];
            const response = await api.get(`/subjects/${selectedSubject}/visits`);
            return response.data;
        },
        enabled: !!selectedSubject,
    });
    const subjectVisits = subjectVisitsResponse || [];

    // Fetch accountability records
    const { data: accountabilityRecords = [], isLoading } = useQuery({
        queryKey: ['accountability', selectedSite, selectedSubject, selectedVisit],
        queryFn: async () => {
            if (!selectedSubject) return [];
            const response = await accountabilityApi.list({
                site_id: selectedSite,
                subject_id: selectedSubject,
                visit_id: selectedVisit === 'all' ? undefined : selectedVisit
            });
            return response.data;
        },
        enabled: !!selectedSubject,
    });

    // Bulk submit mutation
    const submitMutation = useMutation({
        mutationFn: async (records: any[]) => {
            return await accountabilityApi.bulkSubmit(records);
        },
        onSuccess: (response) => {
            setSuccessMessage(response.data.message || 'Successfully submitted accountability records');
            setErrorMessage('');
            setSelectedRecords(new Set());
            queryClient.invalidateQueries({ queryKey: ['accountability'] });
        },
        onError: (error: any) => {
            setErrorMessage(error.response?.data?.error || 'Failed to submit accountability records');
            setSuccessMessage('');
        },
    });

    const handleSubmit = () => {
        const recordsToSubmit = accountabilityRecords.filter((record: any) =>
            selectedRecords.has(record.accountability_id)
        );

        if (recordsToSubmit.length === 0) {
            setErrorMessage('Please select at least one record to submit');
            return;
        }

        submitMutation.mutate(recordsToSubmit);
    };

    const toggleRecordSelection = (id: number) => {
        const newSelection = new Set(selectedRecords);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        setSelectedRecords(newSelection);
    };

    const toggleSelectAll = () => {
        if (selectedRecords.size === accountabilityRecords.length) {
            setSelectedRecords(new Set());
        } else {
            setSelectedRecords(new Set(accountabilityRecords.map((r: any) => r.accountability_id)));
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Subject Accountability</h1>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => navigate('/drug')}
                            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
                        >
                            ← Back to Drug Management
                        </button>
                        <button
                            onClick={logout}
                            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-lg font-semibold mb-6">Serialized</h2>

                    {/* Success Message */}
                    {successMessage && (
                        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded">
                            {successMessage}
                        </div>
                    )}

                    {/* Error Message */}
                    {errorMessage && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
                            {errorMessage}
                        </div>
                    )}

                    {/* Filter Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {/* Site Dropdown */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Site:
                            </label>
                            <select
                                value={selectedSite}
                                onChange={(e) => {
                                    setSelectedSite(e.target.value);
                                    setSelectedSubject('');
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            >
                                <option value="">Select site...</option>
                                {sites.map((site: any) => (
                                    <option key={site.site_id} value={site.site_id}>
                                        {site.site_number}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Subject Dropdown */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Subject:
                            </label>
                            <select
                                value={selectedSubject}
                                onChange={(e) => {
                                    setSelectedSubject(e.target.value);
                                    setSelectedVisit('all');
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                disabled={!selectedSite}
                            >
                                <option value="">Select subject...</option>
                                {subjects.map((subject: any) => (
                                    <option key={subject.subject_id} value={subject.subject_id}>
                                        {subject.subject_number}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Visit Dropdown */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Visit:
                            </label>
                            <select
                                value={selectedVisit}
                                onChange={(e) => setSelectedVisit(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                disabled={!selectedSubject}
                            >
                                <option value="all">&lt; All &gt;</option>
                                {subjectVisits.map((sv: any) => (
                                    <option key={sv.subject_visit_id} value={sv.subject_visit_id}>
                                        {sv.visit?.visit_name || sv.visits?.visit_name || `Visit ${sv.visit_id}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Data Grid */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 border">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        <input
                                            type="checkbox"
                                            className="rounded"
                                            title="Select all"
                                            checked={accountabilityRecords.length > 0 && selectedRecords.size === accountabilityRecords.length}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Drug Unit ID
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Unit Description
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Subject Number
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Visit Name
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Current Status
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Assigned Status
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Quantity Dosed
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Quantity Remaining
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Quantity Missing
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Reconciliation Date
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Comment
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {accountabilityRecords.length > 0 ? (
                                    accountabilityRecords.map((record: any) => (
                                        <tr key={record.accountability_id} className="hover:bg-gray-50">
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <input
                                                    type="checkbox"
                                                    className="rounded"
                                                    checked={selectedRecords.has(record.accountability_id)}
                                                    onChange={() => toggleRecordSelection(record.accountability_id)}
                                                />
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {record.drug_unit?.drug_unit_id || record.drug_unit_id}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {record.drug_unit?.drug_code || '-'}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {record.subject?.subject_number || '-'}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {record.subject_visit?.visit_details?.visit_name || '-'}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <span className={`px-2 py-1 rounded-full text-xs ${record.drug_unit?.status === 'Available' ? 'bg-green-100 text-green-800' :
                                                    record.drug_unit?.status === 'Dispensed' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {record.drug_unit?.status || '-'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {record.drug_unit?.status || '-'}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <span className="font-medium">{record.qty_dispensed || 0}</span>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {(() => {
                                                    const initialQty = record.drug_unit?.quantity_per_unit || 30;
                                                    const remaining = initialQty - (record.qty_dispensed || 0) + (record.qty_returned || 0);
                                                    return (
                                                        <span className={`font-medium ${remaining > 0 ? 'text-blue-600' : remaining < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                                            {remaining}
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <input
                                                    type="number"
                                                    className="w-20 px-2 py-1 border rounded"
                                                    defaultValue={record.qty_missing || 0}
                                                    placeholder="0"
                                                />
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <input
                                                    type="date"
                                                    className="px-2 py-1 border rounded"
                                                    defaultValue={record.reconciliation_date ? record.reconciliation_date.split('T')[0] : ''}
                                                />
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-500">
                                                <input
                                                    type="text"
                                                    className="w-full px-2 py-1 border rounded"
                                                    placeholder="Add comment..."
                                                    defaultValue={record.comments || ''}
                                                />
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={12} className="px-4 py-8 text-center text-gray-500">
                                            No items to display
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end mt-6">
                        <button
                            onClick={handleSubmit}
                            className={`px-6 py-2 rounded text-white ${submitMutation.isPending
                                ? 'bg-blue-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700'
                                } disabled:bg-gray-400 disabled:cursor-not-allowed`}
                            disabled={accountabilityRecords.length === 0 || submitMutation.isPending}
                        >
                            {submitMutation.isPending ? 'Submitting...' : 'Submit'}
                        </button>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center space-x-2">
                            <button className="px-2 py-1 border rounded hover:bg-gray-50" disabled>
                                «
                            </button>
                            <button className="px-2 py-1 border rounded hover:bg-gray-50" disabled>
                                ‹
                            </button>
                            <span className="px-3 py-1 bg-blue-600 text-white rounded">0</span>
                            <button className="px-2 py-1 border rounded hover:bg-gray-50" disabled>
                                ›
                            </button>
                            <button className="px-2 py-1 border rounded hover:bg-gray-50" disabled>
                                »
                            </button>
                        </div>
                        <div className="text-sm text-gray-500">
                            No items to display
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubjectAccountabilityPage;
