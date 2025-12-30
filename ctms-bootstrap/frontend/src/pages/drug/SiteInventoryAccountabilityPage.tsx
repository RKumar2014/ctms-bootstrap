import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const SiteInventoryAccountabilityPage: React.FC = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [selectedSite, setSelectedSite] = useState('');

    const sites = [
        { id: '1', name: '1384 - Memorial Hospital' },
        { id: '2', name: '1385 - City Medical Center' },
        { id: '3', name: '1386 - University Hospital' }
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Submitting site inventory accountability:', { selectedSite });
    };

    return (
        <div className="p-6">
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Site Inventory Accountability</h1>
            </div>

            {/* Content */}
            <div>
                <div className="bg-white shadow rounded-lg p-6">
                    <p className="text-gray-600 mb-6">
                        Overall reconciliation of the site's complete drug supply (not subject-specific).
                    </p>

                    {/* Filter Form */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Site
                        </label>
                        <select
                            value={selectedSite}
                            onChange={(e) => setSelectedSite(e.target.value)}
                            className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md"
                        >
                            <option value="">Select site...</option>
                            {sites.map(site => (
                                <option key={site.id} value={site.id}>{site.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Accountability Grid */}
                    {selectedSite && (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            <input type="checkbox" className="rounded" />
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Drug Unit ID
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Unit Description
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Current Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Assigned Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Qty Remaining
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Qty Missing
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Reconciliation Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Comment
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    <tr>
                                        <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                                            No inventory records found for this site
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex justify-end mt-6">
                        <button
                            type="submit"
                            onClick={handleSubmit}
                            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            disabled={!selectedSite}
                        >
                            Submit
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SiteInventoryAccountabilityPage;
