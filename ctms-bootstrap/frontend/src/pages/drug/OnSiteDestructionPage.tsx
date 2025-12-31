import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sitesApi, drugUnitsApi, authApi, api } from '../../lib/api';

interface DrugUnit {
    drug_unit_id: number;
    drug_code: string;
    lot_number: string;
    expiration_date: string;
    status: string;
    quantity_per_unit: number;
    unit_description: string;
    reconciliation_date?: string;
    quantity_remaining?: number;
    site_comment?: string;
    monitor_comment?: string;
}

const OnSiteDestructionPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [selectedSite, setSelectedSite] = useState('');
    const [signatureProcess, setSignatureProcess] = useState('Separate');
    const [destructionDate, setDestructionDate] = useState('');
    const [selectedDrugUnits, setSelectedDrugUnits] = useState<number[]>([]);
    const [siteSignature, setSiteSignature] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [itemsPerPage, setItemsPerPage] = useState(500);

    // Fetch sites
    const { data: sitesResponse } = useQuery({
        queryKey: ['sites'],
        queryFn: async () => {
            const response = await sitesApi.list();
            return response.data;
        },
    });
    const sites = sitesResponse || [];

    // Fetch drug units eligible for destruction (Returned status)
    const { data: drugUnits = [], isLoading: loadingDrugs } = useQuery({
        queryKey: ['destruction-eligible-drugs', selectedSite],
        queryFn: async () => {
            if (!selectedSite) return [];
            const response = await drugUnitsApi.getSiteDrugUnits(selectedSite);
            // Filter to only show Returned drugs eligible for destruction
            return (response.data || []).filter((unit: DrugUnit) =>
                unit.status === 'Returned'
            );
        },
        enabled: !!selectedSite,
    });

    // Destruction mutation
    const destructionMutation = useMutation({
        mutationFn: async (data: {
            drug_unit_ids: number[];
            destruction_date: string;
            username: string;
            password: string;
        }) => {
            // Verify credentials first
            await api.post('/auth/verify', { username: data.username, password: data.password });

            // Update each selected drug unit to 'Destroyed' status
            const updates = data.drug_unit_ids.map(id =>
                drugUnitsApi.update(id.toString(), {
                    status: 'Destroyed',
                    destruction_date: data.destruction_date
                })
            );
            return Promise.all(updates);
        },
        onSuccess: () => {
            setMessage({ type: 'success', text: 'Destruction processed successfully' });
            setSelectedDrugUnits([]);
            setSiteSignature(false);
            setUsername('');
            setPassword('');
            setDestructionDate('');
            queryClient.invalidateQueries({ queryKey: ['destruction-eligible-drugs'] });
        },
        onError: (error: any) => {
            setMessage({
                type: 'error',
                text: error.response?.data?.error || 'Failed to process destruction'
            });
        },
    });

    const handleDrugUnitToggle = (drugUnitId: number) => {
        setSelectedDrugUnits(prev =>
            prev.includes(drugUnitId)
                ? prev.filter(id => id !== drugUnitId)
                : [...prev, drugUnitId]
        );
    };

    const handleSelectAll = () => {
        if (selectedDrugUnits.length === drugUnits.length) {
            setSelectedDrugUnits([]);
        } else {
            setSelectedDrugUnits(drugUnits.map((d: DrugUnit) => d.drug_unit_id));
        }
    };

    const handleProcessDestruction = (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (!siteSignature) {
            setMessage({ type: 'error', text: 'Please check the signature acknowledgment' });
            return;
        }
        if (!username || !password) {
            setMessage({ type: 'error', text: 'Please enter username and password' });
            return;
        }
        if (selectedDrugUnits.length === 0) {
            setMessage({ type: 'error', text: 'Please select at least one drug unit' });
            return;
        }
        if (!destructionDate) {
            setMessage({ type: 'error', text: 'Please enter destruction date' });
            return;
        }

        destructionMutation.mutate({
            drug_unit_ids: selectedDrugUnits,
            destruction_date: destructionDate,
            username,
            password
        });
    };

    return (
        <div className="p-6">
            {/* Page Header */}
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Destruction At Site</h1>

            {/* Message */}
            {message && (
                <div className={`mb-4 p-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            {/* Main Content - Two Column Layout like Suvoda */}
            <div className="flex gap-6">
                {/* Left Column - Site Selection and Drug Table */}
                <div className="flex-1">
                    {/* Filters Row */}
                    <div className="bg-white border border-gray-200 p-4 mb-4 rounded">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-gray-700">Site:</label>
                                <select
                                    value={selectedSite}
                                    onChange={(e) => {
                                        setSelectedSite(e.target.value);
                                        setSelectedDrugUnits([]);
                                    }}
                                    className="px-3 py-1.5 border border-gray-300 rounded text-sm min-w-[150px]"
                                >
                                    <option value="">{"< Select >"}</option>
                                    {sites.map((site: any) => (
                                        <option key={site.site_id} value={site.site_id}>
                                            {site.site_number}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-gray-700">Signature Process:</label>
                                <select
                                    value={signatureProcess}
                                    onChange={(e) => setSignatureProcess(e.target.value)}
                                    className="px-3 py-1.5 border border-gray-300 rounded text-sm"
                                >
                                    <option value="Separate">Separate</option>
                                    <option value="Combined">Combined</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Serialized Drugs Section */}
                    <div className="bg-white border border-gray-200 rounded">
                        <div className="px-4 py-2 bg-gray-700 text-white text-sm font-medium rounded-t">
                            ▾ Serialized Drugs
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left">
                                            <input
                                                type="checkbox"
                                                checked={drugUnits.length > 0 && selectedDrugUnits.length === drugUnits.length}
                                                onChange={handleSelectAll}
                                                className="rounded"
                                            />
                                        </th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            Drug Unit ID
                                            <span className="ml-1 text-gray-400">▼</span>
                                        </th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            Unit Description
                                            <span className="ml-1 text-gray-400">▼</span>
                                        </th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            Reconciled Status
                                            <span className="ml-1 text-gray-400">▼</span>
                                        </th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            Quantity Remaining
                                            <span className="ml-1 text-gray-400">▼</span>
                                        </th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            Monitor Reconciliation Date
                                            <span className="ml-1 text-gray-400">▼</span>
                                        </th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            Site Comment
                                            <span className="ml-1 text-gray-400">▼</span>
                                        </th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            Monitor Comment
                                            <span className="ml-1 text-gray-400">▼</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loadingDrugs ? (
                                        <tr>
                                            <td colSpan={8} className="px-3 py-4 text-center text-gray-500">
                                                Loading...
                                            </td>
                                        </tr>
                                    ) : !selectedSite ? (
                                        <tr>
                                            <td colSpan={8} className="px-3 py-4 text-center text-gray-500">
                                                Please select a site
                                            </td>
                                        </tr>
                                    ) : drugUnits.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-3 py-4 text-center text-gray-500">
                                                No items to display
                                            </td>
                                        </tr>
                                    ) : (
                                        drugUnits.map((drug: DrugUnit) => (
                                            <tr key={drug.drug_unit_id} className="hover:bg-gray-50">
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedDrugUnits.includes(drug.drug_unit_id)}
                                                        onChange={() => handleDrugUnitToggle(drug.drug_unit_id)}
                                                        className="rounded"
                                                    />
                                                </td>
                                                <td className="px-3 py-2 text-sm text-gray-900">
                                                    {drug.drug_unit_id}
                                                </td>
                                                <td className="px-3 py-2 text-sm text-gray-500">
                                                    {drug.unit_description || drug.drug_code}
                                                </td>
                                                <td className="px-3 py-2 text-sm text-gray-500">
                                                    {drug.status}
                                                </td>
                                                <td className="px-3 py-2 text-sm text-gray-500">
                                                    {drug.quantity_remaining ?? drug.quantity_per_unit}
                                                </td>
                                                <td className="px-3 py-2 text-sm text-gray-500">
                                                    {drug.reconciliation_date
                                                        ? new Date(drug.reconciliation_date).toLocaleDateString()
                                                        : '-'}
                                                </td>
                                                <td className="px-3 py-2 text-sm text-gray-500">
                                                    {drug.site_comment || '-'}
                                                </td>
                                                <td className="px-3 py-2 text-sm text-gray-500">
                                                    {drug.monitor_comment || '-'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="px-4 py-2 border-t flex items-center justify-between text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                                <button className="px-2 py-1 border rounded hover:bg-gray-50">⏮</button>
                                <button className="px-2 py-1 border rounded hover:bg-gray-50">◀</button>
                                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded">
                                    {selectedDrugUnits.length}
                                </span>
                                <button className="px-2 py-1 border rounded hover:bg-gray-50">▶</button>
                                <button className="px-2 py-1 border rounded hover:bg-gray-50">⏭</button>
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                    className="ml-2 px-2 py-1 border rounded text-sm"
                                >
                                    <option value={100}>100</option>
                                    <option value={250}>250</option>
                                    <option value={500}>500</option>
                                </select>
                                <span>items per page</span>
                            </div>
                            <div>
                                {drugUnits.length === 0 ? 'No items to display' : `${drugUnits.length} item(s)`}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Destruction Date and Signature */}
                <div className="w-80">
                    {/* Destruction Date */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Destruction Date: <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            value={destructionDate}
                            onChange={(e) => setDestructionDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded"
                            required
                        />
                    </div>

                    {/* Site Signature Section */}
                    <div className="border border-gray-200 rounded p-4 bg-gray-50">
                        <h3 className="text-sm font-semibold text-gray-800 mb-3">Site Signature</h3>

                        <div className="flex items-start gap-2 mb-4">
                            <input
                                type="checkbox"
                                id="siteSignature"
                                checked={siteSignature}
                                onChange={(e) => setSiteSignature(e.target.checked)}
                                className="mt-1 rounded"
                            />
                            <label htmlFor="siteSignature" className="text-sm text-gray-700">
                                By entering my username and password in the below fields I am applying my electronic signature to the destruction of the selected units.
                            </label>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Username: <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded"
                                    disabled={!siteSignature}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Password: <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded"
                                    disabled={!siteSignature}
                                />
                            </div>
                        </div>

                        {/* Process Destruction Button */}
                        <button
                            onClick={handleProcessDestruction}
                            disabled={selectedDrugUnits.length === 0 || destructionMutation.isPending}
                            className="mt-4 w-full px-4 py-2 bg-gray-200 text-gray-700 border border-gray-400 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {destructionMutation.isPending ? 'Processing...' : 'Process Destruction'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OnSiteDestructionPage;
