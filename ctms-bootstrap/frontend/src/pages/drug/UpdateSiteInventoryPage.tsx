import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { drugUnitsApi, sitesApi } from '../../lib/api';

const UpdateSiteInventoryPage: React.FC = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const queryClient = useQueryClient();
    const [selectedSite, setSelectedSite] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // Fetch sites from database
    const { data: sitesResponse } = useQuery({
        queryKey: ['sites'],
        queryFn: async () => {
            const response = await sitesApi.list();
            return response.data;
        },
    });
    const sites = sitesResponse || [];

    // Fetch drug units for selected site
    const { data: drugUnits = [], isLoading } = useQuery({
        queryKey: ['drugUnits', selectedSite],
        queryFn: async () => {
            if (!selectedSite) return [];
            const response = await drugUnitsApi.getSiteDrugUnits(selectedSite);
            return response.data;
        },
        enabled: !!selectedSite,
    });

    // Mutation for bulk update
    const bulkUpdateMutation = useMutation({
        mutationFn: async () => {
            return await drugUnitsApi.bulkUpdateSite(selectedSite, selectedStatus);
        },
        onSuccess: (response) => {
            setSuccessMessage(response.data.message || `Successfully updated ${drugUnits.length} drug units to ${selectedStatus}`);
            setErrorMessage('');
            // Refresh drug units data
            queryClient.invalidateQueries({ queryKey: ['drugUnits', selectedSite] });
        },
        onError: (error: any) => {
            setErrorMessage(error.response?.data?.error || 'Failed to update drug units');
            setSuccessMessage('');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSuccessMessage('');
        setErrorMessage('');
        bulkUpdateMutation.mutate();
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Update Site Inventory</h1>
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
                    <p className="text-gray-600 mb-6">
                        Manually change the status of drug units due to damage, loss, or quality issues.
                    </p>

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

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Site Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Site
                            </label>
                            <select
                                value={selectedSite}
                                onChange={(e) => setSelectedSite(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">Select a site...</option>
                                {sites.map((site: any) => (
                                    <option key={site.site_id} value={site.site_id}>
                                        {site.site_number} - {site.site_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Status Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Update the entire Site inventory to
                            </label>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">Select new status...</option>
                                <option value="Available">Available</option>
                                <option value="Dispensed">Dispensed</option>
                                <option value="Destroyed">Destroyed</option>
                                <option value="Missing">Missing</option>
                            </select>
                        </div>

                        {/* Drug Units Grid */}
                        {selectedSite && selectedStatus && (
                            <div className="mt-6">
                                <h3 className="text-lg font-semibold mb-4">Drug Units to Update</h3>
                                {isLoading ? (
                                    <p className="text-center text-gray-500 py-4">Loading drug units...</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Drug Unit ID
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Drug Code
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Finished Lot
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Expiration Date
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Current Status
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        New Drug Unit Status
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {drugUnits.length > 0 ? (
                                                    drugUnits.map((unit: any) => (
                                                        <tr key={unit.drug_unit_id} className="hover:bg-gray-50">
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                {unit.drug_unit_id}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {unit.drug_code}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {unit.lot_number}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {unit.expiration_date}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className={`px-2 py-1 text-xs rounded ${unit.status === 'Available' ? 'bg-green-100 text-green-800' :
                                                                    unit.status === 'Dispensed' ? 'bg-blue-100 text-blue-800' :
                                                                        'bg-gray-100 text-gray-800'
                                                                    }`}>
                                                                    {unit.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {selectedStatus}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                                            No drug units found for this site
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => navigate('/drug')}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className={`px-6 py-2 rounded ${bulkUpdateMutation.isPending
                                    ? 'bg-blue-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700'
                                    } text-white`}
                                disabled={!selectedSite || !selectedStatus || drugUnits.length === 0 || bulkUpdateMutation.isPending}
                            >
                                {bulkUpdateMutation.isPending ? 'Updating...' : 'Update Inventory'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UpdateSiteInventoryPage;
